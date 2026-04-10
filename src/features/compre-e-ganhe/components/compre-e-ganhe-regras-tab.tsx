'use client'

import { Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { CrudModal } from '@/src/components/ui/crud-modal'
import { FormField } from '@/src/components/ui/form-field'
import { InputWithAffix } from '@/src/components/ui/input-with-affix'
import { LookupSelect, type LookupOption } from '@/src/components/ui/lookup-select'
import { TooltipIconButton } from '@/src/components/ui/tooltip-icon-button'
import { loadCrudLookupOptions } from '@/src/components/crud-base/crud-client'
import { inputClasses } from '@/src/components/ui/input-styles'
import { ClienteRelationSection } from '@/src/features/clientes/components/cliente-relation-section'
import { compreEGanheClient, type BrindeRegraRecord } from '@/src/features/compre-e-ganhe/services/compre-e-ganhe-client'
import { getBrindeRuleTypeLabel, getBrindeScopeLabel, loadProdutoEmbalagemOptions, type OptionItem } from '@/src/features/compre-e-ganhe/services/compre-e-ganhe-helpers'
import { toBrindeRegraPayload } from '@/src/features/compre-e-ganhe/services/compre-e-ganhe-mappers'
import { useI18n } from '@/src/i18n/use-i18n'
import { currencyMask } from '@/src/lib/input-masks'

type RuleDraft = {
  id?: string
  id_regra: string
  tipo_regra: string
  tipo: string
  pedido_minimo: string
  pedido_maximo: string
  id_produto_pai: LookupOption | null
  id_produto: LookupOption | null
  id_departamento: LookupOption | null
  id_fornecedor: LookupOption | null
  id_colecao: LookupOption | null
  id_embalagem: LookupOption | null
}

function initialDraft(): RuleDraft {
  return {
    id_regra: '',
    tipo_regra: '',
    tipo: '',
    pedido_minimo: '',
    pedido_maximo: '',
    id_produto_pai: null,
    id_produto: null,
    id_departamento: null,
    id_fornecedor: null,
    id_colecao: null,
    id_embalagem: null,
  }
}

function getRuleLabel(item: BrindeRegraRecord) {
  if (item.tipo_regra === 'produto_pai') return item.produto_pai?.nome || item.id_produto_pai || '-'
  if (item.tipo_regra === 'produto') return item.produtos?.nome || item.id_produto || '-'
  if (item.tipo_regra === 'departamento') return item.departamento?.nome || item.id_departamento || '-'
  if (item.tipo_regra === 'fornecedor') return item.fornecedor?.nome_fantasia || item.fornecedor?.nome || item.id_fornecedor || '-'
  if (item.tipo_regra === 'colecao') return item.colecoes?.nome || item.id_colecao || '-'
  return '-'
}

function formatCurrencyValue(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  const numeric = typeof value === 'number' ? value : Number(String(value).replace(',', '.'))
  if (!Number.isFinite(numeric)) {
    return '-'
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric)
}

export function CompreEGanheRegrasTab({ brindeId, readOnly, onError }: { brindeId: string; readOnly: boolean; onError: (message: string | null) => void }) {
  const { t } = useI18n()
  const [items, setItems] = useState<BrindeRegraRecord[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [draft, setDraft] = useState<RuleDraft>(initialDraft())
  const [packageOptions, setPackageOptions] = useState<OptionItem[]>([])

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      setItems(await compreEGanheClient.listRegras(brindeId))
      onError(null)
    } catch (error) {
      onError(error instanceof Error ? error.message : t('marketing.buyAndGet.rules.loadError', 'Nao foi possivel carregar as regras.'))
    } finally {
      setIsLoading(false)
    }
  }, [brindeId, onError, t])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const productId = draft.tipo_regra === 'produto' ? draft.id_produto?.id || '' : ''
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
  }, [draft.tipo_regra, draft.id_produto?.id])

  async function handleSave() {
    try {
      await compreEGanheClient.createRegra(toBrindeRegraPayload(brindeId, {
        id: draft.id,
        id_regra: draft.id_regra,
        tipo_regra: draft.tipo_regra,
        tipo: draft.tipo,
        pedido_minimo: draft.pedido_minimo,
        pedido_maximo: draft.pedido_maximo,
        id_produto_pai: draft.id_produto_pai?.id || '',
        id_produto: draft.id_produto?.id || '',
        id_departamento: draft.id_departamento?.id || '',
        id_fornecedor: draft.id_fornecedor?.id || '',
        id_colecao: draft.id_colecao?.id || '',
        id_embalagem: draft.id_embalagem?.id || '',
      }))
      setDraft(initialDraft())
      setPackageOptions([])
      setFeedback(null)
      setModalOpen(false)
      await refresh()
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : t('marketing.buyAndGet.rules.saveError', 'Nao foi possivel salvar a regra.'))
    }
  }

  async function handleDelete() {
    try {
      await compreEGanheClient.deleteRegras(selectedIds)
      setSelectedIds([])
      setConfirmOpen(false)
      await refresh()
    } catch (error) {
      onError(error instanceof Error ? error.message : t('marketing.buyAndGet.rules.deleteError', 'Nao foi possivel excluir as regras.'))
    }
  }

  return (
    <>
      <ClienteRelationSection<BrindeRegraRecord>
        title={t('marketing.buyAndGet.tabs.rules', 'Regras')}
        readOnly={readOnly}
        hasSelection={selectedIds.length > 0}
        onDelete={() => setConfirmOpen(true)}
        onCreate={() => setModalOpen(true)}
        items={items}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        getRowId={(item) => item.id}
        emptyMessage={isLoading ? t('common.loading', 'Loading...') : t('marketing.buyAndGet.rules.empty', 'Nenhuma regra cadastrada.')}
        columns={[
          { header: t('marketing.buyAndGet.rules.fields.code', 'Codigo da regra'), render: (item) => item.id_regra || '-' },
          { header: t('marketing.buyAndGet.rules.fields.scope', 'Escopo'), render: (item) => getBrindeScopeLabel(String(item.tipo_regra || ''), t) },
          { header: t('marketing.buyAndGet.rules.fields.target', 'Alvo'), cellClassName: 'font-semibold text-slate-950', render: (item) => getRuleLabel(item) },
          { header: t('marketing.buyAndGet.rules.fields.type', 'Tipo'), render: (item) => getBrindeRuleTypeLabel(String(item.tipo || ''), t) },
          { header: t('marketing.buyAndGet.rules.fields.minOrder', 'Pedido minimo'), render: (item) => formatCurrencyValue(item.pedido_minimo) },
          { header: t('marketing.buyAndGet.rules.fields.maxOrder', 'Pedido maximo'), render: (item) => formatCurrencyValue(item.pedido_maximo) },
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

      <CrudModal open={modalOpen} title={t('marketing.buyAndGet.rules.createTitle', 'Nova regra')} onClose={() => { setDraft(initialDraft()); setPackageOptions([]); setFeedback(null); setModalOpen(false) }} onConfirm={() => void handleSave()}>
        <div className="grid gap-4 md:grid-cols-2">
          {feedback ? <div className="md:col-span-2 rounded-[1rem] border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{feedback}</div> : null}
          <FormField label={t('marketing.buyAndGet.rules.fields.code', 'Codigo da regra')}>
            <input value={draft.id_regra} onChange={(event) => setDraft((current) => ({ ...current, id_regra: event.target.value }))} className={inputClasses()} />
          </FormField>
          <FormField label={t('marketing.buyAndGet.rules.fields.scope', 'Escopo')}>
            <select value={draft.tipo_regra} onChange={(event) => setDraft((current) => ({ ...current, tipo_regra: event.target.value, id_produto_pai: null, id_produto: null, id_departamento: null, id_fornecedor: null, id_colecao: null, id_embalagem: null }))} className={inputClasses()}>
              <option value="">{t('common.select', 'Selecione')}</option>
              <option value="produto_pai">{t('marketing.buyAndGet.rules.options.parentProduct', 'Produto pai')}</option>
              <option value="produto">{t('marketing.buyAndGet.rules.options.product', 'Produto')}</option>
              <option value="departamento">{t('marketing.buyAndGet.rules.options.department', 'Departamento')}</option>
              <option value="fornecedor">{t('marketing.buyAndGet.rules.options.supplier', 'Fornecedor')}</option>
              <option value="colecao">{t('marketing.buyAndGet.rules.options.collection', 'Colecao')}</option>
            </select>
          </FormField>
          {draft.tipo_regra === 'produto_pai' ? <FormField label={t('marketing.buyAndGet.rules.fields.target', 'Alvo')} className="md:col-span-2"><LookupSelect label={t('marketing.buyAndGet.rules.fields.target', 'Alvo')} value={draft.id_produto_pai} onChange={(value) => setDraft((current) => ({ ...current, id_produto_pai: value }))} loadOptions={(q, p, pp) => loadCrudLookupOptions('produtos', q, p, pp).then((options) => options.map((option) => ({ id: option.value, label: option.label })))} /></FormField> : null}
          {draft.tipo_regra === 'produto' ? <FormField label={t('marketing.buyAndGet.rules.fields.target', 'Alvo')} className="md:col-span-2"><LookupSelect label={t('marketing.buyAndGet.rules.fields.target', 'Alvo')} value={draft.id_produto} onChange={(value) => setDraft((current) => ({ ...current, id_produto: value, id_embalagem: null }))} loadOptions={(q, p, pp) => loadCrudLookupOptions('produtos', q, p, pp).then((options) => options.map((option) => ({ id: option.value, label: option.label })))} /></FormField> : null}
          {draft.tipo_regra === 'departamento' ? <FormField label={t('marketing.buyAndGet.rules.fields.target', 'Alvo')} className="md:col-span-2"><LookupSelect label={t('marketing.buyAndGet.rules.fields.target', 'Alvo')} value={draft.id_departamento} onChange={(value) => setDraft((current) => ({ ...current, id_departamento: value }))} loadOptions={(q, p, pp) => loadCrudLookupOptions('departamentos', q, p, pp).then((options) => options.map((option) => ({ id: option.value, label: option.label })))} /></FormField> : null}
          {draft.tipo_regra === 'fornecedor' ? <FormField label={t('marketing.buyAndGet.rules.fields.target', 'Alvo')} className="md:col-span-2"><LookupSelect label={t('marketing.buyAndGet.rules.fields.target', 'Alvo')} value={draft.id_fornecedor} onChange={(value) => setDraft((current) => ({ ...current, id_fornecedor: value }))} loadOptions={(q, p, pp) => loadCrudLookupOptions('fornecedores', q, p, pp).then((options) => options.map((option) => ({ id: option.value, label: option.label })))} /></FormField> : null}
          {draft.tipo_regra === 'colecao' ? <FormField label={t('marketing.buyAndGet.rules.fields.target', 'Alvo')} className="md:col-span-2"><LookupSelect label={t('marketing.buyAndGet.rules.fields.target', 'Alvo')} value={draft.id_colecao} onChange={(value) => setDraft((current) => ({ ...current, id_colecao: value }))} loadOptions={(q, p, pp) => loadCrudLookupOptions('colecoes', q, p, pp).then((options) => options.map((option) => ({ id: option.value, label: option.label })))} /></FormField> : null}
          <FormField label={t('marketing.buyAndGet.rules.fields.type', 'Tipo')}>
            <select value={draft.tipo} onChange={(event) => setDraft((current) => ({ ...current, tipo: event.target.value }))} className={inputClasses()}>
              <option value="">{t('common.select', 'Selecione')}</option>
              <option value="quantidade">{t('marketing.buyAndGet.rules.options.quantity', 'Quantidade')}</option>
              <option value="valor">{t('marketing.buyAndGet.rules.options.value', 'Valor')}</option>
              <option value="peso">{t('marketing.buyAndGet.rules.options.weight', 'Peso')}</option>
              <option value="mix">{t('marketing.buyAndGet.rules.options.mix', 'Mix')}</option>
            </select>
          </FormField>
          {draft.tipo_regra === 'produto' ? (
            <FormField label={t('marketing.buyAndGet.rules.fields.package', 'Embalagem')}>
              <select value={draft.id_embalagem?.id || ''} onChange={(event) => setDraft((current) => ({ ...current, id_embalagem: packageOptions.find((option) => option.id === event.target.value) ?? null }))} className={inputClasses()}>
                <option value="">{t('common.select', 'Selecione')}</option>
                {packageOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
              </select>
            </FormField>
          ) : null}
          <FormField label={t('marketing.buyAndGet.rules.fields.minOrder', 'Pedido minimo')}>
            <InputWithAffix value={draft.pedido_minimo} onChange={(event) => setDraft((current) => ({ ...current, pedido_minimo: currencyMask(event.target.value) }))} prefix="R$" inputMode="decimal" />
          </FormField>
          <FormField label={t('marketing.buyAndGet.rules.fields.maxOrder', 'Pedido maximo')}>
            <InputWithAffix value={draft.pedido_maximo} onChange={(event) => setDraft((current) => ({ ...current, pedido_maximo: currencyMask(event.target.value) }))} prefix="R$" inputMode="decimal" />
          </FormField>
        </div>
      </CrudModal>

      <ConfirmDialog open={confirmOpen} title={t('marketing.buyAndGet.rules.deleteTitle', 'Excluir regras')} description={t('marketing.buyAndGet.rules.deleteDescription', 'As regras selecionadas serao removidas.')} confirmLabel={t('common.delete', 'Excluir')} onClose={() => setConfirmOpen(false)} onConfirm={() => void handleDelete()} />
    </>
  )
}
