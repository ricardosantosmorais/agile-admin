'use client'

import { Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { BooleanChoice } from '@/src/components/ui/boolean-choice'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { CrudModal } from '@/src/components/ui/crud-modal'
import { FormField } from '@/src/components/ui/form-field'
import { InputWithAffix } from '@/src/components/ui/input-with-affix'
import { LookupSelect, type LookupOption } from '@/src/components/ui/lookup-select'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { TooltipIconButton } from '@/src/components/ui/tooltip-icon-button'
import { loadCrudLookupOptions } from '@/src/components/crud-base/crud-client'
import { inputClasses } from '@/src/components/ui/input-styles'
import { ClienteRelationSection } from '@/src/features/clientes/components/cliente-relation-section'
import { campanhasClient, type CampanhaProdutoRecord } from '@/src/features/campanhas-promocionais/services/campanhas-client'
import { createCompreJuntoProdutoPayload } from '@/src/features/campanhas-promocionais/services/campanhas-mappers'
import { currencyMask, decimalMask } from '@/src/lib/input-masks'
import { useI18n } from '@/src/i18n/use-i18n'

type ProductDraft = {
  id_produto: LookupOption | null
  principal: boolean
  aplica_tributos: boolean
  tipo: 'percentual' | 'valor_fixo' | ''
  valor: string
}

function initialDraft(): ProductDraft {
  return {
    id_produto: null,
    principal: false,
    aplica_tributos: false,
    tipo: '',
    valor: '',
  }
}

function boolBadge(value: boolean | number | string, t: ReturnType<typeof useI18n>['t']) {
  const active = value === true || value === 1 || value === '1'
  return <StatusBadge tone={active ? 'success' : 'warning'}>{active ? t('common.yes', 'Sim') : t('common.no', 'Não')}</StatusBadge>
}

export function CompreJuntoProdutosTab({
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
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [draft, setDraft] = useState<ProductDraft>(initialDraft())

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      setItems(await campanhasClient.listProdutos(campaignId))
      onError(null)
    } catch (error) {
      onError(error instanceof Error ? error.message : t('marketing.buyTogether.products.loadError', 'Não foi possível carregar os produtos da campanha.'))
    } finally {
      setIsLoading(false)
    }
  }, [campaignId, onError, t])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const hasPrincipal = useMemo(
    () => items.some((item) => item.principal === true || item.principal === 1 || item.principal === '1'),
    [items],
  )

  async function handleSave() {
    try {
      if (draft.principal && hasPrincipal) {
        throw new Error('Já existe um produto principal ativo.')
      }

      const payload = createCompreJuntoProdutoPayload(campaignId, {
        id_produto: draft.id_produto?.id || '',
        principal: draft.principal,
        aplica_tributos: draft.aplica_tributos,
        tipo: draft.tipo,
        valor: draft.valor,
      })
      await campanhasClient.createProdutos(payload)
      setDraft(initialDraft())
      setFeedback(null)
      setModalOpen(false)
      await refresh()
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : t('marketing.buyTogether.products.saveError', 'Não foi possível salvar o produto da campanha.'))
    }
  }

  async function handleDelete() {
    try {
      await campanhasClient.deleteProdutos(selectedIds.map((id) => ({ id_campanha: campaignId, id_produto: id })))
      setSelectedIds([])
      setConfirmOpen(false)
      await refresh()
    } catch (error) {
      onError(error instanceof Error ? error.message : t('marketing.buyTogether.products.deleteError', 'Não foi possível excluir os produtos da campanha.'))
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
        emptyMessage={isLoading ? t('common.loading', 'Loading...') : t('marketing.buyTogether.products.empty', 'Nenhum produto foi vinculado à campanha.')}
        columns={[
          { header: t('simpleCrud.fields.id', 'ID'), render: (item) => item.produto?.id || item.id_produto },
          { header: t('simpleCrud.fields.code', 'Código'), render: (item) => item.produto?.codigo || '-' },
          { header: t('simpleCrud.fields.name', 'Nome'), cellClassName: 'font-semibold text-slate-950', render: (item) => item.produto?.nome || '-' },
          { header: t('marketing.buyTogether.products.fields.main', 'Principal'), render: (item) => boolBadge(item.principal ?? false, t) },
          { header: t('marketing.buyTogether.products.fields.taxes', 'Aplica tributos'), render: (item) => boolBadge(item.aplica_tributos ?? false, t) },
          { header: t('marketing.buyTogether.products.fields.type', 'Tipo'), render: (item) => item.tipo === 'percentual' ? t('marketing.buyTogether.products.options.percent', 'Percentual') : t('marketing.buyTogether.products.options.fixed', 'Valor fixo') },
          { header: t('marketing.buyTogether.products.fields.value', 'Valor'), render: (item) => item.tipo === 'percentual' ? `${String(item.valor ?? '-') }%` : item.valor === null || item.valor === undefined ? '-' : `R$ ${currencyMask(String(item.valor))}` },
          {
            header: t('common.actions', 'Ações'),
            headerClassName: 'w-[72px]',
            render: (item) => !readOnly ? (
              <TooltipIconButton label={t('simpleCrud.actions.delete', 'Excluir')}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedIds([item.id_produto])
                    setConfirmOpen(true)
                  }}
                  className="app-button-danger inline-flex h-9 w-9 items-center justify-center rounded-full p-0"
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
        title={t('marketing.buyTogether.products.createTitle', 'Novo produto da campanha')}
        onClose={() => {
          setFeedback(null)
          setDraft(initialDraft())
          setModalOpen(false)
        }}
        onConfirm={() => void handleSave()}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {feedback ? <div className="md:col-span-2 rounded-[1rem] border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{feedback}</div> : null}

          <FormField label={t('marketing.buyTogether.products.fields.main', 'Principal')}>
            <BooleanChoice value={draft.principal} onChange={(value) => setDraft((current) => ({ ...current, principal: value }))} trueLabel={t('common.yes', 'Sim')} falseLabel={t('common.no', 'Não')} />
          </FormField>

          <FormField label={t('marketing.buyTogether.products.fields.taxes', 'Aplica tributos')}>
            <BooleanChoice value={draft.aplica_tributos} onChange={(value) => setDraft((current) => ({ ...current, aplica_tributos: value }))} trueLabel={t('common.yes', 'Sim')} falseLabel={t('common.no', 'Não')} />
          </FormField>

          <FormField label={t('marketing.buyTogether.products.fields.product', 'Produto')} className="md:col-span-2">
            <LookupSelect<LookupOption>
              label={t('marketing.buyTogether.products.fields.product', 'Produto')}
              value={draft.id_produto}
              onChange={(value) => setDraft((current) => ({ ...current, id_produto: value }))}
              loadOptions={(query, page, perPage) => loadCrudLookupOptions('produtos', query, page, perPage).then((options) => options.map((option) => ({ id: option.value, label: option.label })))}
            />
          </FormField>

          <FormField label={t('marketing.buyTogether.products.fields.type', 'Tipo')}>
            <select value={draft.tipo} onChange={(event) => setDraft((current) => ({ ...current, tipo: event.target.value as ProductDraft['tipo'] }))} className={inputClasses()}>
              <option value="">{t('common.select', 'Selecione')}</option>
              <option value="percentual">{t('marketing.buyTogether.products.options.percent', 'Percentual')}</option>
              <option value="valor_fixo">{t('marketing.buyTogether.products.options.fixed', 'Valor fixo')}</option>
            </select>
          </FormField>

          <FormField label={t('marketing.buyTogether.products.fields.value', 'Valor')}>
            {draft.tipo === 'percentual' ? (
              <InputWithAffix
                value={draft.valor}
                onChange={(event) => setDraft((current) => ({ ...current, valor: decimalMask(event.target.value) }))}
                suffix="%"
                inputMode="decimal"
                placeholder="0,00"
              />
            ) : draft.tipo === 'valor_fixo' ? (
              <InputWithAffix
                value={draft.valor}
                onChange={(event) => setDraft((current) => ({ ...current, valor: currencyMask(event.target.value) }))}
                prefix="R$"
                inputMode="decimal"
                placeholder="0,00"
              />
            ) : (
              <input
                value={draft.valor}
                onChange={(event) => setDraft((current) => ({ ...current, valor: event.target.value }))}
                className={inputClasses()}
                inputMode="decimal"
                placeholder={t('marketing.buyTogether.products.fields.valueHint', 'Selecione o tipo para informar o valor')}
              />
            )}
          </FormField>
        </div>
      </CrudModal>

      <ConfirmDialog
        open={confirmOpen}
        title={t('marketing.buyTogether.products.deleteTitle', 'Excluir produtos')}
        description={t('marketing.buyTogether.products.deleteDescription', 'Os produtos selecionados serão removidos da campanha.')}
        confirmLabel={t('common.delete', 'Excluir')}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </>
  )
}
