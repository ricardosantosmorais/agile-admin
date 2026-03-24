'use client'

import { Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { CrudModal } from '@/src/components/ui/crud-modal'
import { FormField } from '@/src/components/ui/form-field'
import { LookupSelect, type LookupOption } from '@/src/components/ui/lookup-select'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { TooltipIconButton } from '@/src/components/ui/tooltip-icon-button'
import { loadCrudLookupOptions } from '@/src/components/crud-base/crud-client'
import { inputClasses } from '@/src/components/ui/input-styles'
import { ClienteRelationSection } from '@/src/features/clientes/components/cliente-relation-section'
import { campanhasClient, type CampanhaProdutoRecord } from '@/src/features/campanhas-promocionais/services/campanhas-client'
import { createCampanhaProdutoPayloads, splitCampanhaProdutoTokens } from '@/src/features/campanhas-promocionais/services/campanhas-mappers'
import { useI18n } from '@/src/i18n/use-i18n'

function availableBadge(value: boolean | number | string, t: ReturnType<typeof useI18n>['t']) {
  const active = value === true || value === 1 || value === '1'
  return <StatusBadge tone={active ? 'success' : 'warning'}>{active ? t('common.yes', 'Sim') : t('common.no', 'Nao')}</StatusBadge>
}

export function CampanhaProdutosIdsTab({
  campaignId,
  readOnly,
  onError,
}: {
  campaignId: string
  readOnly: boolean
  onError: (message: string | null) => void
}) {
  const { t } = useI18n()
  const [items, setItems] = useState<CampanhaProdutoRecord[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [productIds, setProductIds] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<LookupOption | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const hasLookupSelection = Boolean(selectedProduct?.id)
  const hasTypedTokens = Boolean(splitCampanhaProdutoTokens(productIds).length)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      setItems(await campanhasClient.listProdutos(campaignId))
      onError(null)
    } catch (error) {
      onError(error instanceof Error ? error.message : t('marketing.campaigns.products.loadError', 'Nao foi possivel carregar os produtos da campanha.'))
    } finally {
      setIsLoading(false)
    }
  }, [campaignId, onError, t])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function handleSave() {
    try {
      const rawTokens = splitCampanhaProdutoTokens(productIds)
      const selectedIdsFromLookup = selectedProduct?.id ? [selectedProduct.id] : []
      const unresolvedTokens = rawTokens.filter((token) => !selectedIdsFromLookup.includes(token))
      const resolved = unresolvedTokens.length > 0
        ? await campanhasClient.resolveProdutos(unresolvedTokens)
        : { resolved: [], missing: [] }

      if (resolved.missing.length > 0) {
        throw new Error(
          t('marketing.campaigns.products.validation.notFound', 'Nao foi possivel localizar os produtos informados: {{tokens}}.')
            .replace('{{tokens}}', resolved.missing.join(', ')),
        )
      }

      const mergedIds = Array.from(new Set([
        ...resolved.resolved.map((item) => item.id),
        ...selectedIdsFromLookup,
      ]))

      if (!mergedIds.length) {
        throw new Error(t('marketing.campaigns.products.validation.required', 'Informe pelo menos um produto por ID, codigo ou autocomplete.'))
      }

      const payload = createCampanhaProdutoPayloads(campaignId, mergedIds.join(', '))
      await campanhasClient.createProdutos(payload)
      setProductIds('')
      setSelectedProduct(null)
      setFeedback(null)
      setModalOpen(false)
      await refresh()
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : t('marketing.campaigns.products.saveError', 'Nao foi possivel salvar os produtos da campanha.'))
    }
  }

  async function handleDelete() {
    try {
      await campanhasClient.deleteProdutos(selectedIds.map((id) => ({ id_campanha: campaignId, id_produto: id })))
      setSelectedIds([])
      setConfirmOpen(false)
      await refresh()
    } catch (error) {
      onError(error instanceof Error ? error.message : t('marketing.campaigns.products.deleteError', 'Nao foi possivel excluir os produtos da campanha.'))
    }
  }

  return (
    <>
      <ClienteRelationSection<CampanhaProdutoRecord>
        title={t('marketing.campaigns.tabs.products', 'Produtos')}
        readOnly={readOnly}
        hasSelection={selectedIds.length > 0}
        onDelete={() => setConfirmOpen(true)}
        onCreate={() => setModalOpen(true)}
        items={items}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        getRowId={(item) => item.id_produto}
        emptyMessage={isLoading ? t('common.loading', 'Loading...') : t('marketing.campaigns.products.empty', 'Nenhum produto foi vinculado a campanha.')}
        columns={[
          { header: t('simpleCrud.fields.id', 'ID'), render: (item) => item.produto?.id || item.id_produto },
          { header: t('simpleCrud.fields.code', 'Codigo'), render: (item) => item.produto?.codigo || '-' },
          { header: t('simpleCrud.fields.name', 'Nome'), cellClassName: 'font-semibold text-slate-950', render: (item) => item.produto?.nome || '-' },
          { header: t('simpleCrud.fields.available', 'Disponivel'), render: (item) => availableBadge(item.produto?.disponivel ?? false, t) },
          {
            header: t('common.actions', 'Acoes'),
            headerClassName: 'w-[72px]',
            render: (item) => !readOnly ? (
              <TooltipIconButton label={t('simpleCrud.actions.delete', 'Excluir')}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedIds([item.id_produto])
                    setConfirmOpen(true)
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </TooltipIconButton>
            ) : null,
          },
        ]}
      />

      <CrudModal
        open={modalOpen}
        title={t('marketing.campaigns.products.createTitle', 'Vincular produtos')}
        onClose={() => {
          setFeedback(null)
          setProductIds('')
          setSelectedProduct(null)
          setModalOpen(false)
        }}
        onConfirm={() => void handleSave()}
      >
        {feedback ? <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{feedback}</div> : null}
        <div className="grid gap-4">
          <div className="rounded-[1.2rem] border border-[#e6dfd3] bg-[#fcfaf5] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">{t('marketing.campaigns.products.methods.searchTitle', 'Método 1: buscar e selecionar')}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{t('marketing.campaigns.products.methods.searchDescription', 'Use a busca quando quiser localizar um produto pelo nome, código ou referência visual.')}</p>
              </div>
              {hasLookupSelection ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{t('marketing.campaigns.products.methods.selected', 'Selecionado')}</span> : null}
            </div>
            <div className="mt-4">
              <FormField label={t('marketing.campaigns.products.fields.productLookup', 'Produto por busca')}>
                <LookupSelect
                  label={t('marketing.campaigns.products.fields.productLookup', 'Produto por busca')}
                  value={selectedProduct}
                  onChange={setSelectedProduct}
                  loadOptions={(query, page, perPage) => loadCrudLookupOptions('produtos', query, page, perPage).then((options) => options.map((option) => ({ id: option.value, label: option.label })))}
                />
              </FormField>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            <span className="h-px flex-1 bg-[#e6dfd3]" />
            {t('marketing.campaigns.products.methods.or', 'ou')}
            <span className="h-px flex-1 bg-[#e6dfd3]" />
          </div>

          <div className="rounded-[1.2rem] border border-[#e6dfd3] bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">{t('marketing.campaigns.products.methods.manualTitle', 'Método 2: informar IDs ou códigos')}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{t('marketing.campaigns.products.methods.manualDescription', 'Cole um ou vários IDs ou códigos separados por vírgula. O sistema resolve cada item antes de salvar.')}</p>
              </div>
              {hasTypedTokens ? <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">{t('marketing.campaigns.products.methods.filled', 'Preenchido')}</span> : null}
            </div>
            <div className="mt-4">
              <FormField label={t('marketing.campaigns.products.fields.productIds', 'IDs ou códigos dos produtos')}>
                <textarea
                  rows={5}
                  value={productIds}
                  onChange={(event) => setProductIds(event.target.value)}
                  className={inputClasses()}
                  placeholder={t('marketing.campaigns.products.fields.productIdsPlaceholder', 'Separe IDs ou códigos por vírgula')}
                />
              </FormField>
            </div>
          </div>
        </div>
      </CrudModal>

      <ConfirmDialog
        open={confirmOpen}
        title={t('marketing.campaigns.products.deleteTitle', 'Excluir produtos')}
        description={t('marketing.campaigns.products.deleteDescription', 'Os produtos selecionados serao removidos da campanha.')}
        confirmLabel={t('common.delete', 'Excluir')}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </>
  )
}
