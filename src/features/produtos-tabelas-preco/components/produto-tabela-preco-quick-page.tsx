'use client'

import Link from 'next/link'
import { ArrowLeft, LoaderCircle, Save } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { AsyncState } from '@/src/components/ui/async-state'
import { InputWithAffix } from '@/src/components/ui/input-with-affix'
import { LookupSelect } from '@/src/components/ui/lookup-select'
import { PageHeader } from '@/src/components/ui/page-header'
import { PageToast } from '@/src/components/ui/page-toast'
import { SectionCard } from '@/src/components/ui/section-card'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { produtosTabelasPrecoClient, type ProdutoTabelaPrecoQuickItem } from '@/src/features/produtos-tabelas-preco/services/produtos-tabelas-preco-client'
import { useFooterActionsVisibility } from '@/src/hooks/use-footer-actions-visibility'
import { useI18n } from '@/src/i18n/use-i18n'
import { currencyMask } from '@/src/lib/input-masks'

const primaryButtonClasses = 'app-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-60'
const footerPrimaryButtonClasses = 'app-button-primary inline-flex items-center gap-2 rounded-full px-4.5 py-2.5 text-sm font-semibold disabled:opacity-60'
const secondaryButtonClasses = 'app-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold'
const footerSecondaryButtonClasses = 'app-button-secondary inline-flex items-center rounded-full px-4.5 py-2.5 text-sm font-semibold'

export function ProdutoTabelaPrecoQuickPage({ id }: { id?: string }) {
  const { t } = useI18n()
  const access = useFeatureAccess('produtosTabelasPreco')
  const [product, setProduct] = useState<{ id: string; label: string } | null>(null)
  const [items, setItems] = useState<ProdutoTabelaPrecoQuickItem[]>([])
  const [isLoading, setIsLoading] = useState(Boolean(id))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [feedback, setFeedback] = useState('')
  const { footerRef, isFooterVisible } = useFooterActionsVisibility<HTMLDivElement>()

  useEffect(() => {
    let alive = true

    async function bootstrap(productId: string) {
      setIsLoading(true)
      setError(undefined)
      try {
        const payload = await produtosTabelasPrecoClient.loadQuickPricing(productId)
        if (!alive) return
        setProduct(payload.produto_lookup)
        setItems(payload.items)
      } catch (loadError) {
        if (!alive) return
        setError(loadError instanceof Error ? loadError.message : t('simpleCrud.loadError', 'Could not load the record.'))
      } finally {
        if (alive) setIsLoading(false)
      }
    }

    if (id) {
      void bootstrap(id)
    }

    return () => {
      alive = false
    }
  }, [id, t])

  const breadcrumbs = useMemo(() => ([
    { label: t('routes.dashboard', 'Home'), href: '/dashboard' },
    { label: t('routes.precosEstoques', 'Preços e Estoques') },
    { label: t('routes.produtosTabelasPreco', 'Produtos x Tabelas de Preço'), href: '/produtos-x-tabelas-de-preco' },
    { label: t('priceStock.productPriceTables.quickPricingTitle', 'Precificação rápida') },
  ]), [t])

  async function handleLoadProduct(next: { id: string; label: string } | null) {
    setProduct(next)
    setItems([])
    setFeedback('')
    setError(undefined)

    if (!next) {
      return
    }

    setIsLoading(true)
    try {
      const payload = await produtosTabelasPrecoClient.loadQuickPricing(next.id)
      setItems(payload.items)
      setProduct(payload.produto_lookup)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('simpleCrud.loadError', 'Could not load the record.'))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSave() {
    if (!product?.id) {
      setFeedback(t('priceStock.productPriceTables.feedback.selectProduct', 'Selecione um produto para continuar.'))
      return
    }

    setIsSaving(true)
    setFeedback('')
    try {
      await produtosTabelasPrecoClient.saveQuickPricing({ id_produto: product.id, items })
      setFeedback(t('simpleCrud.saved', 'Dados salvos com sucesso.'))
    } catch (saveError) {
      setFeedback(saveError instanceof Error ? saveError.message : t('simpleCrud.saveError', 'Could not save the record.'))
    } finally {
      setIsSaving(false)
    }
  }

  function patchPrice(index: number, key: keyof ProdutoTabelaPrecoQuickItem, value: string) {
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: currencyMask(value) } : item))
  }

  if (!access.canCreate && !access.canEdit && !access.canView) {
    return null
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex flex-wrap gap-2">
            {(access.canCreate || access.canEdit) ? (
              !isFooterVisible ? (
              <button type="button" disabled={isSaving} onClick={() => void handleSave()} className={primaryButtonClasses}>
                {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSaving ? t('common.loading', 'Loading...') : t('common.save', 'Save')}
              </button>
              ) : null
            ) : null}
            {!isFooterVisible ? (
              <Link href="/produtos-x-tabelas-de-preco" className={secondaryButtonClasses}><ArrowLeft className="h-4 w-4" />{t('common.back', 'Back')}</Link>
            ) : null}
          </div>
        }
      />

      <PageToast message={feedback || null} onClose={() => setFeedback('')} />

      <SectionCard>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,520px)_1fr]">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[color:var(--app-text)]">{t('priceStock.productPriceTables.fields.product', 'Produto')}</label>
            <LookupSelect
              label={t('priceStock.productPriceTables.fields.product', 'Produto')}
              value={product}
              onChange={(value) => void handleLoadProduct(value)}
              loadOptions={produtosTabelasPrecoClient.loadProductOptions}
              disabled={Boolean(id)}
            />
          </div>
          <div className="flex items-end text-sm text-[color:var(--app-muted)]">
            {product?.id
              ? t('priceStock.productPriceTables.help.bulkEdit', 'Os preços abaixo cruzam o produto selecionado com todas as tabelas de preço ativas.')
              : t('priceStock.productPriceTables.help.selectProduct', 'Selecione um produto para carregar a grade de precificação rápida.')}
          </div>
        </div>
      </SectionCard>

      <AsyncState isLoading={isLoading} error={error}>
        <SectionCard>
          {product?.id ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--app-muted)]">
                    <th className="px-3 py-2">{t('priceStock.productPriceTables.fields.priceTable', 'Tabela de preço')}</th>
                    <th className="px-3 py-2">Preço 1</th>
                    <th className="px-3 py-2">Preço 2</th>
                    <th className="px-3 py-2">Preço 3</th>
                    <th className="px-3 py-2">Preço 4</th>
                    <th className="px-3 py-2">Preço 5</th>
                    <th className="px-3 py-2">Preço 6</th>
                    <th className="px-3 py-2">Preço 7</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id_tabela_preco} className="app-pane-muted rounded-[1rem] shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                      <td className="px-3 py-2 font-semibold text-[color:var(--app-text)]">{item.nome_tabela}</td>
                      {(['preco1', 'preco2', 'preco3', 'preco4', 'preco5', 'preco6', 'preco7'] as const).map((priceKey) => (
                        <td key={priceKey} className="min-w-[140px] px-3 py-2">
                          <InputWithAffix
                            prefix="R$"
                            value={item[priceKey]}
                            disabled={Boolean(item.id_sync) || !(access.canCreate || access.canEdit)}
                            onChange={(event) => patchPrice(index, priceKey, event.target.value)}
                            placeholder="0,00"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="app-pane-muted rounded-[1.25rem] border-dashed px-6 py-10 text-center text-sm text-[color:var(--app-muted)]">
              {t('priceStock.productPriceTables.help.selectProduct', 'Selecione um produto para carregar a grade de precificação rápida.')}
            </div>
          )}
        </SectionCard>

        <div ref={footerRef} className="flex flex-wrap justify-center gap-2.5 pt-1">
          {(access.canCreate || access.canEdit) ? (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void handleSave()}
              className={footerPrimaryButtonClasses}
            >
              {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? t('common.loading', 'Loading...') : t('common.save', 'Save')}
            </button>
          ) : null}
          <Link href="/produtos-x-tabelas-de-preco" className={footerSecondaryButtonClasses}>
            {t('common.back', 'Back')}
          </Link>
        </div>
      </AsyncState>
    </div>
  )
}
