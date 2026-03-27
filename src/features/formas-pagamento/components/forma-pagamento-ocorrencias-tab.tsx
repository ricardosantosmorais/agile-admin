'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { CrudModal } from '@/src/components/ui/crud-modal'
import { FormField } from '@/src/components/ui/form-field'
import { LookupSelect, type LookupOption } from '@/src/components/ui/lookup-select'
import { TooltipIconButton } from '@/src/components/ui/tooltip-icon-button'
import { inputClasses } from '@/src/components/ui/input-styles'
import { ClienteRelationSection } from '@/src/features/clientes/components/cliente-relation-section'
import { loadCrudLookupOptions } from '@/src/components/crud-base/crud-client'
import type { CrudResource } from '@/src/components/crud-base/types'
import { formasPagamentoClient } from '@/src/features/formas-pagamento/services/formas-pagamento-client'
import {
  formatFormaPagamentoOccurrenceLabel,
  occurrenceLookupValue,
  type FormaPagamentoOcorrencia,
  type FormaPagamentoOcorrenciaRecord,
} from '@/src/features/formas-pagamento/services/formas-pagamento-mappers'
import { formatDate } from '@/src/lib/formatters'
import { BRAZILIAN_STATES } from '@/src/lib/brazil'
import { useI18n } from '@/src/i18n/use-i18n'

type Mode = 'restricoes' | 'excecoes'

type Draft = {
  ocorrencia: FormaPagamentoOcorrencia
  objeto: LookupOption | null
  tipoPessoa: string
  tipoCliente: string
  uf: string
  dataInicio: string
  dataFim: string
}

const OCCURRENCIAS: FormaPagamentoOcorrencia[] = [
  'canal_distribuicao',
  'cliente',
  'departamento',
  'filial',
  'forma_entrega',
  'fornecedor',
  'grupo',
  'marca',
  'produto',
  'produto_pai',
  'segmento',
  'tipo',
  'tipo_cliente',
  'uf',
  'todos',
]

function initialDraft(): Draft {
  return {
    ocorrencia: 'canal_distribuicao',
    objeto: null,
    tipoPessoa: '',
    tipoCliente: '',
    uf: '',
    dataInicio: '',
    dataFim: '',
  }
}

function occurrenceLabel(value: FormaPagamentoOcorrencia, t: ReturnType<typeof useI18n>['t']) {
  switch (value) {
    case 'canal_distribuicao': return t('financial.paymentMethods.occurrences.channel', 'Canal de distribuição')
    case 'cliente': return t('financial.paymentMethods.occurrences.customer', 'Cliente')
    case 'departamento': return t('financial.paymentMethods.occurrences.department', 'Departamento')
    case 'filial': return t('financial.paymentMethods.occurrences.branch', 'Filial')
    case 'forma_entrega': return t('financial.paymentMethods.occurrences.deliveryMethod', 'Forma de entrega')
    case 'fornecedor': return t('financial.paymentMethods.occurrences.supplier', 'Fornecedor')
    case 'grupo': return t('financial.paymentMethods.occurrences.group', 'Grupo de clientes')
    case 'marca': return t('financial.paymentMethods.occurrences.brand', 'Marca')
    case 'produto': return t('financial.paymentMethods.occurrences.product', 'Produto')
    case 'produto_pai': return t('financial.paymentMethods.occurrences.parentProduct', 'Produto pai')
    case 'segmento': return t('financial.paymentMethods.occurrences.segment', 'Segmento de clientes')
    case 'tipo': return t('financial.paymentMethods.occurrences.personType', 'Tipo')
    case 'tipo_cliente': return t('financial.paymentMethods.occurrences.customerType', 'Tipo do cliente')
    case 'uf': return t('financial.paymentMethods.occurrences.state', 'UF')
    case 'todos': return t('financial.paymentMethods.occurrences.all', 'Todos')
  }
}

function occurrenceLookupResource(value: FormaPagamentoOcorrencia): CrudResource | null {
  switch (value) {
    case 'canal_distribuicao': return 'canais_distribuicao'
    case 'cliente': return 'clientes'
    case 'departamento': return 'departamentos'
    case 'filial': return 'filiais'
    case 'forma_entrega': return 'formas_entrega'
    case 'fornecedor': return 'fornecedores'
    case 'grupo': return 'grupos'
    case 'marca': return 'marcas'
    case 'produto':
    case 'produto_pai':
      return 'produtos'
    case 'segmento':
      return 'segmentos'
    default:
      return null
  }
}

function buildOccurrencePayload(draft: Draft) {
  if (!draft.dataInicio || !draft.dataFim) {
    return { error: 'date' as const }
  }

  if (draft.ocorrencia === 'tipo') {
    return draft.tipoPessoa
      ? { payload: { ocorrencia: draft.ocorrencia, id_objeto: draft.tipoPessoa, data_inicio: draft.dataInicio, data_fim: draft.dataFim } }
      : { error: 'value' as const }
  }

  if (draft.ocorrencia === 'tipo_cliente') {
    return draft.tipoCliente
      ? { payload: { ocorrencia: draft.ocorrencia, id_objeto: draft.tipoCliente, data_inicio: draft.dataInicio, data_fim: draft.dataFim } }
      : { error: 'value' as const }
  }

  if (draft.ocorrencia === 'uf') {
    return draft.uf
      ? { payload: { ocorrencia: draft.ocorrencia, id_objeto: draft.uf, data_inicio: draft.dataInicio, data_fim: draft.dataFim } }
      : { error: 'value' as const }
  }

  if (draft.ocorrencia === 'todos') {
    return { payload: { ocorrencia: draft.ocorrencia, id_objeto: '1', data_inicio: draft.dataInicio, data_fim: draft.dataFim } }
  }

  return draft.objeto
    ? { payload: { ocorrencia: draft.ocorrencia, id_objeto: draft.objeto.id, data_inicio: draft.dataInicio, data_fim: draft.dataFim } }
    : { error: 'value' as const }
}

export function FormaPagamentoOcorrenciasTab({
  mode,
  formaPagamentoId,
  readOnly,
  onError,
}: {
  mode: Mode
  formaPagamentoId: string
  readOnly: boolean
  onError: (message: string | null) => void
}) {
  const { t } = useI18n()
  const [items, setItems] = useState<FormaPagamentoOcorrenciaRecord[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [editingItem, setEditingItem] = useState<FormaPagamentoOcorrenciaRecord | null>(null)
  const [draft, setDraft] = useState<Draft>(initialDraft())

  const lookupResource = useMemo(() => occurrenceLookupResource(draft.ocorrencia), [draft.ocorrencia])
  const modeLabel = mode === 'restricoes'
    ? t('financial.paymentMethods.tabs.restrictions', 'Restrições')
    : t('financial.paymentMethods.tabs.exceptions', 'Exceções')

  const refresh = useCallback(async () => {
    try {
      const response = mode === 'restricoes'
        ? await formasPagamentoClient.listRestricoes(formaPagamentoId)
        : await formasPagamentoClient.listExcecoes(formaPagamentoId)
      setItems(response)
      onError(null)
    } catch (error) {
      onError(error instanceof Error ? error.message : t('financial.paymentMethods.messages.loadOccurrencesError', 'Não foi possível carregar os registros da aba.'))
    }
  }, [formaPagamentoId, mode, onError, t])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refresh()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [refresh])

  function closeModal() {
    setModalOpen(false)
    setFeedback(null)
    setEditingItem(null)
    setDraft(initialDraft())
    setIsSaving(false)
  }

  function openCreateModal() {
    setEditingItem(null)
    setFeedback(null)
    setDraft(initialDraft())
    setModalOpen(true)
  }

  function openEditModal(item: FormaPagamentoOcorrenciaRecord) {
    setEditingItem(item)
    setFeedback(null)
    setDraft({
      ocorrencia: item.ocorrencia,
      objeto: occurrenceLookupValue(item),
      tipoPessoa: item.ocorrencia === 'tipo' ? String(item.id_objeto || '') : '',
      tipoCliente: item.ocorrencia === 'tipo_cliente' ? String(item.id_objeto || '') : '',
      uf: item.ocorrencia === 'uf' ? String(item.id_objeto || '') : '',
      dataInicio: String(item.data_inicio || '').slice(0, 10),
      dataFim: String(item.data_fim || '').slice(0, 10),
    })
    setModalOpen(true)
  }

  async function handleSave() {
    const payloadResult = buildOccurrencePayload(draft)
    if ('error' in payloadResult) {
      setFeedback(
        payloadResult.error === 'date'
          ? t('financial.paymentMethods.messages.selectDateRange', 'Informe data de início e data final.')
          : t('financial.paymentMethods.messages.selectOccurrenceValue', 'Selecione um valor para a ocorrência.'),
      )
      return
    }

    setIsSaving(true)
    try {
      const payload = editingItem ? { ...payloadResult.payload, id: editingItem.id } : payloadResult.payload
      if (mode === 'restricoes') {
        await formasPagamentoClient.saveRestricao(formaPagamentoId, payload)
      } else {
        await formasPagamentoClient.saveExcecao(formaPagamentoId, payload)
      }
      await refresh()
      closeModal()
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : t('financial.paymentMethods.messages.saveOccurrenceError', 'Não foi possível salvar o registro.'))
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    try {
      if (mode === 'restricoes') {
        await formasPagamentoClient.deleteRestricoes(formaPagamentoId, selectedIds)
      } else {
        await formasPagamentoClient.deleteExcecoes(formaPagamentoId, selectedIds)
      }
      setSelectedIds([])
      setConfirmOpen(false)
      await refresh()
      onError(null)
    } catch (error) {
      onError(error instanceof Error ? error.message : t('financial.paymentMethods.messages.deleteOccurrenceError', 'Não foi possível excluir o registro.'))
    }
  }

  return (
    <>
      <ClienteRelationSection<FormaPagamentoOcorrenciaRecord>
        title={modeLabel}
        readOnly={readOnly}
        hasSelection={selectedIds.length > 0}
        onDelete={() => setConfirmOpen(true)}
        onCreate={openCreateModal}
        items={items}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        getRowId={(item) => item.id}
        emptyMessage={t('financial.paymentMethods.messages.emptyOccurrences', 'Nenhum registro foi encontrado para esta aba.')}
        columns={[
          { header: t('financial.paymentMethods.fields.type', 'Tipo'), render: (item) => occurrenceLabel(item.ocorrencia, t) },
          { header: t('financial.paymentMethods.fields.value', 'Valor'), render: (item) => formatFormaPagamentoOccurrenceLabel(item) },
          { header: t('financial.paymentMethods.fields.startDate', 'Data início'), render: (item) => item.data_inicio ? formatDate(item.data_inicio) : '-' },
          { header: t('financial.paymentMethods.fields.endDate', 'Data fim'), render: (item) => item.data_fim ? formatDate(item.data_fim) : '-' },
          {
            header: t('common.actions', 'Ações'),
            headerClassName: 'w-[104px]',
            cellClassName: 'whitespace-nowrap',
            render: (item) => !readOnly ? (
              <div className="flex items-center gap-2">
                <TooltipIconButton label={t('simpleCrud.actions.edit', 'Editar')}>
                  <button type="button" onClick={() => openEditModal(item)} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#e6dfd3] bg-white text-slate-700">
                    <Pencil className="h-4 w-4" />
                  </button>
                </TooltipIconButton>
                <TooltipIconButton label={t('simpleCrud.actions.delete', 'Excluir')}>
                  <button type="button" onClick={() => { setSelectedIds([item.id]); setConfirmOpen(true) }} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </TooltipIconButton>
              </div>
            ) : null,
          },
        ]}
      />

      <CrudModal open={modalOpen} title={editingItem ? t('financial.paymentMethods.messages.editOccurrenceTitle', 'Editar registro') : t('financial.paymentMethods.messages.createOccurrenceTitle', 'Novo registro')} onClose={closeModal} onConfirm={() => void handleSave()} isSaving={isSaving}>
        <div className="grid gap-4 md:grid-cols-2">
          {feedback ? <div className="md:col-span-2 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{feedback}</div> : null}
          <FormField label={t('financial.paymentMethods.fields.type', 'Tipo')}>
            <select value={draft.ocorrencia} onChange={(event) => setDraft({ ...initialDraft(), ocorrencia: event.target.value as FormaPagamentoOcorrencia })} className={inputClasses()} disabled={readOnly}>
              {OCCURRENCIAS.map((item) => <option key={item} value={item}>{occurrenceLabel(item, t)}</option>)}
            </select>
          </FormField>

          {draft.ocorrencia === 'tipo' ? (
            <FormField label={t('financial.paymentMethods.fields.value', 'Valor')}>
              <select value={draft.tipoPessoa} onChange={(event) => setDraft((current) => ({ ...current, tipoPessoa: event.target.value }))} className={inputClasses()} disabled={readOnly}>
                <option value="">{t('common.select', 'Selecione')}</option>
                <option value="PF">{t('financial.paymentMethods.personTypes.pf', 'Pessoa física')}</option>
                <option value="PJ">{t('financial.paymentMethods.personTypes.pj', 'Pessoa jurídica')}</option>
              </select>
            </FormField>
          ) : null}

          {draft.ocorrencia === 'tipo_cliente' ? (
            <FormField label={t('financial.paymentMethods.fields.value', 'Valor')}>
              <select value={draft.tipoCliente} onChange={(event) => setDraft((current) => ({ ...current, tipoCliente: event.target.value }))} className={inputClasses()} disabled={readOnly}>
                <option value="">{t('common.select', 'Selecione')}</option>
                <option value="C">{t('financial.paymentMethods.customerTypes.consumption', 'Consumo')}</option>
                <option value="R">{t('financial.paymentMethods.customerTypes.resale', 'Revenda')}</option>
                <option value="F">{t('financial.paymentMethods.customerTypes.employee', 'Funcionário')}</option>
              </select>
            </FormField>
          ) : null}

          {draft.ocorrencia === 'uf' ? (
            <FormField label={t('financial.paymentMethods.fields.value', 'Valor')}>
              <select value={draft.uf} onChange={(event) => setDraft((current) => ({ ...current, uf: event.target.value }))} className={inputClasses()} disabled={readOnly}>
                <option value="">{t('common.select', 'Selecione')}</option>
                {BRAZILIAN_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
              </select>
            </FormField>
          ) : null}

          {draft.ocorrencia === 'todos' ? (
            <FormField label={t('financial.paymentMethods.fields.value', 'Valor')}>
              <input value={t('financial.paymentMethods.occurrences.all', 'Todos')} className={inputClasses()} disabled />
            </FormField>
          ) : null}

          {lookupResource ? (
            <FormField label={t('financial.paymentMethods.fields.value', 'Valor')} className="md:col-span-2">
              <LookupSelect
                label={modeLabel}
                value={draft.objeto}
                onChange={(value) => setDraft((current) => ({ ...current, objeto: value }))}
                disabled={readOnly}
                loadOptions={(query, page, perPage) => loadCrudLookupOptions(lookupResource, query, page, perPage).then((options) => options.map((option) => ({ id: option.value, label: option.label })))}
              />
            </FormField>
          ) : null}

          <FormField label={t('financial.paymentMethods.fields.startDate', 'Data início')}>
            <input type="date" value={draft.dataInicio} onChange={(event) => setDraft((current) => ({ ...current, dataInicio: event.target.value }))} className={inputClasses()} disabled={readOnly} />
          </FormField>
          <FormField label={t('financial.paymentMethods.fields.endDate', 'Data fim')}>
            <input type="date" value={draft.dataFim} onChange={(event) => setDraft((current) => ({ ...current, dataFim: event.target.value }))} className={inputClasses()} disabled={readOnly} />
          </FormField>
        </div>
      </CrudModal>

      <ConfirmDialog
        open={confirmOpen}
        title={t('financial.paymentMethods.messages.deleteOccurrenceTitle', 'Excluir registros')}
        description={t('financial.paymentMethods.messages.deleteOccurrenceDescription', 'Os registros selecionados serão removidos.')}
        confirmLabel={t('common.delete', 'Excluir')}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </>
  )
}
