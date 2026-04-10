'use client'

import { Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { CrudModal } from '@/src/components/ui/crud-modal'
import { FormField } from '@/src/components/ui/form-field'
import { LookupSelect, type LookupOption } from '@/src/components/ui/lookup-select'
import { TooltipIconButton } from '@/src/components/ui/tooltip-icon-button'
import { loadCrudLookupOptions } from '@/src/components/crud-base/crud-client'
import { inputClasses } from '@/src/components/ui/input-styles'
import { ClienteRelationSection } from '@/src/features/clientes/components/cliente-relation-section'
import { compreEGanheClient, type BrindeProdutoRecord } from '@/src/features/compre-e-ganhe/services/compre-e-ganhe-client'
import { loadProdutoEmbalagemOptions, type OptionItem } from '@/src/features/compre-e-ganhe/services/compre-e-ganhe-helpers'
import { toBrindeProdutoPayload } from '@/src/features/compre-e-ganhe/services/compre-e-ganhe-mappers'
import { useI18n } from '@/src/i18n/use-i18n'

type ProductDraft = {
  id?: string
  id_regra: string
  id_produto: LookupOption | null
  id_embalagem: LookupOption | null
  quantidade: string
  quantidade_maxima: string
}

function initialDraft(): ProductDraft {
  return { id_regra: '', id_produto: null, id_embalagem: null, quantidade: '', quantidade_maxima: '' }
}

export function CompreEGanheProdutosTab({ brindeId, readOnly, onError }: { brindeId: string; readOnly: boolean; onError: (message: string | null) => void }) {
  const { t } = useI18n()
  const [items, setItems] = useState<BrindeProdutoRecord[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [draft, setDraft] = useState<ProductDraft>(initialDraft())
  const [packageOptions, setPackageOptions] = useState<OptionItem[]>([])

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      setItems(await compreEGanheClient.listProdutos(brindeId))
      onError(null)
    } catch (error) {
      onError(error instanceof Error ? error.message : t('marketing.buyAndGet.products.loadError', 'Nao foi possivel carregar os produtos.'))
    } finally {
      setIsLoading(false)
    }
  }, [brindeId, onError, t])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const productId = draft.id_produto?.id || ''
    if (!productId) {
      setPackageOptions([])
      setDraft((current) => current.id_embalagem ? { ...current, id_embalagem: null } : current)
      return
    }

    let active = true
    void loadProdutoEmbalagemOptions(productId)
      .then((options) => {
        if (!active) {
          return
        }

        setPackageOptions(options)
        setDraft((current) => {
          if (!current.id_embalagem) {
            return current
          }

          const matched = options.find((option) => option.id === current.id_embalagem?.id)
          return matched ? { ...current, id_embalagem: matched } : { ...current, id_embalagem: null }
        })
      })
      .catch(() => {
        if (active) {
          setPackageOptions([])
        }
      })

    return () => {
      active = false
    }
  }, [draft.id_produto?.id])

  async function handleSave() {
    try {
      await compreEGanheClient.createProduto(toBrindeProdutoPayload(brindeId, {
        ...draft,
        id_produto: draft.id_produto?.id || '',
        id_embalagem: draft.id_embalagem?.id || '',
      }))
      setDraft(initialDraft())
      setPackageOptions([])
      setFeedback(null)
      setModalOpen(false)
      await refresh()
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : t('marketing.buyAndGet.products.saveError', 'Nao foi possivel salvar o produto.'))
    }
  }

  async function handleDelete() {
    try {
      await compreEGanheClient.deleteProdutos(selectedIds)
      setSelectedIds([])
      setConfirmOpen(false)
      await refresh()
    } catch (error) {
      onError(error instanceof Error ? error.message : t('marketing.buyAndGet.products.deleteError', 'Nao foi possivel excluir os produtos.'))
    }
  }

  return (
    <>
      <ClienteRelationSection<BrindeProdutoRecord>
        title={t('marketing.buyAndGet.tabs.products', 'Produtos')}
        readOnly={readOnly}
        hasSelection={selectedIds.length > 0}
        onDelete={() => setConfirmOpen(true)}
        onCreate={() => setModalOpen(true)}
        items={items}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        getRowId={(item) => item.id}
        emptyMessage={isLoading ? t('common.loading', 'Loading...') : t('marketing.buyAndGet.products.empty', 'Nenhum produto cadastrado.')}
        columns={[
          { header: t('marketing.buyAndGet.products.fields.ruleCode', 'Codigo da regra'), render: (item) => item.id_regra || '-' },
          { header: t('marketing.buyAndGet.products.fields.product', 'Produto'), cellClassName: 'font-semibold text-slate-950', render: (item) => item.produto?.nome || item.id_produto || '-' },
          { header: t('marketing.buyAndGet.products.fields.package', 'Embalagem'), render: (item) => item.embalagem?.nome || item.id_embalagem || '-' },
          { header: t('marketing.buyAndGet.products.fields.quantity', 'Quantidade'), render: (item) => String(item.quantidade ?? '-') },
          { header: t('marketing.buyAndGet.products.fields.maxQuantity', 'Quantidade maxima'), render: (item) => String(item.quantidade_maxima ?? '-') },
          {
            header: t('common.actions', 'Acoes'),
            headerClassName: 'w-[72px]',
            render: (item) => !readOnly ? (
              <TooltipIconButton label={t('simpleCrud.actions.delete', 'Excluir')}>
                <button type="button" onClick={() => { setSelectedIds([item.id]); setConfirmOpen(true) }} className="app-button-danger inline-flex h-9 w-9 items-center justify-center rounded-full p-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </TooltipIconButton>
            ) : null,
          },
        ]}
      />

      <CrudModal open={modalOpen} title={t('marketing.buyAndGet.products.createTitle', 'Novo produto')} onClose={() => { setDraft(initialDraft()); setPackageOptions([]); setFeedback(null); setModalOpen(false) }} onConfirm={() => void handleSave()}>
        <div className="grid gap-4 md:grid-cols-2">
          {feedback ? <div className="md:col-span-2 rounded-[1rem] border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{feedback}</div> : null}
          <FormField label={t('marketing.buyAndGet.products.fields.ruleCode', 'Codigo da regra')}>
            <input value={draft.id_regra} onChange={(event) => setDraft((current) => ({ ...current, id_regra: event.target.value }))} className={inputClasses()} />
          </FormField>
          <FormField label={t('marketing.buyAndGet.products.fields.product', 'Produto')} className="md:col-span-2">
            <LookupSelect label={t('marketing.buyAndGet.products.fields.product', 'Produto')} value={draft.id_produto} onChange={(value) => setDraft((current) => ({ ...current, id_produto: value, id_embalagem: null }))} loadOptions={(q, p, pp) => loadCrudLookupOptions('produtos', q, p, pp).then((options) => options.map((option) => ({ id: option.value, label: option.label })))} />
          </FormField>
          <FormField label={t('marketing.buyAndGet.products.fields.package', 'Embalagem')}>
            <select value={draft.id_embalagem?.id || ''} onChange={(event) => setDraft((current) => ({ ...current, id_embalagem: packageOptions.find((option) => option.id === event.target.value) ?? null }))} className={inputClasses()}>
              <option value="">{t('common.select', 'Selecione')}</option>
              {packageOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
            </select>
          </FormField>
          <FormField label={t('marketing.buyAndGet.products.fields.quantity', 'Quantidade')}>
            <input type="number" min={0} value={draft.quantidade} onChange={(event) => setDraft((current) => ({ ...current, quantidade: event.target.value }))} className={inputClasses()} />
          </FormField>
          <FormField label={t('marketing.buyAndGet.products.fields.maxQuantity', 'Quantidade maxima')}>
            <input type="number" min={0} value={draft.quantidade_maxima} onChange={(event) => setDraft((current) => ({ ...current, quantidade_maxima: event.target.value }))} className={inputClasses()} />
          </FormField>
        </div>
      </CrudModal>

      <ConfirmDialog open={confirmOpen} title={t('marketing.buyAndGet.products.deleteTitle', 'Excluir produtos')} description={t('marketing.buyAndGet.products.deleteDescription', 'Os produtos selecionados serao removidos.')} confirmLabel={t('common.delete', 'Excluir')} onClose={() => setConfirmOpen(false)} onConfirm={() => void handleDelete()} />
    </>
  )
}
