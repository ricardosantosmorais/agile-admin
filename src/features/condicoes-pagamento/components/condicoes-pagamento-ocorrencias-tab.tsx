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
import { condicoesPagamentoClient } from '@/src/features/condicoes-pagamento/services/condicoes-pagamento-client'
import {
  CONDICAO_PAGAMENTO_EXCECAO_OCCURRENCES,
  CONDICAO_PAGAMENTO_RESTRICAO_OCCURRENCES,
  formatCondicaoPagamentoOccurrenceLabel,
  isCondicaoPagamentoOccurrenceActive,
  isCondicaoPagamentoOccurrenceSynced,
  occurrenceLookupValue,
  type CondicaoPagamentoOcorrencia,
  type CondicaoPagamentoOcorrenciaRecord,
} from '@/src/features/condicoes-pagamento/services/condicoes-pagamento-mappers'
import { formatDate } from '@/src/lib/formatters'
import { BRAZILIAN_STATES } from '@/src/lib/brazil'
import { useI18n } from '@/src/i18n/use-i18n'

type Mode = 'restricoes' | 'excecoes'

type Draft = {
  ocorrencia: CondicaoPagamentoOcorrencia
  objeto: LookupOption | null
  contribuinte: string
  tipoCliente: string
  uf: string
  dataInicio: string
  dataFim: string
  ativo: boolean
}

const editActionButtonClasses = 'app-button-secondary inline-flex h-9 w-9 items-center justify-center rounded-full'
const deleteActionButtonClasses = 'app-button-danger inline-flex h-9 w-9 items-center justify-center rounded-full'
const feedbackClasses = 'app-error-panel md:col-span-2 rounded-[1rem] px-4 py-3 text-sm'

function initialDraft(occurrences: CondicaoPagamentoOcorrencia[]): Draft {
  return {
    ocorrencia: occurrences[0] || 'cliente',
    objeto: null,
    contribuinte: '',
    tipoCliente: '',
    uf: '',
    dataInicio: '',
    dataFim: '',
    ativo: true,
  }
}

function occurrenceLabel(value: CondicaoPagamentoOcorrencia, t: ReturnType<typeof useI18n>['t']) {
  switch (value) {
    case 'canal_distribuicao': return t('financial.paymentTerms.occurrences.channel', 'Canal de distribuicao')
    case 'contribuinte': return t('financial.paymentTerms.occurrences.taxpayer', 'Contribuinte')
    case 'cliente': return t('financial.paymentTerms.occurrences.customer', 'Cliente')
    case 'departamento': return t('financial.paymentTerms.occurrences.department', 'Departamento')
    case 'filial': return t('financial.paymentTerms.occurrences.branch', 'Filial')
    case 'forma_entrega': return t('financial.paymentTerms.occurrences.deliveryMethod', 'Forma de entrega')
    case 'fornecedor': return t('financial.paymentTerms.occurrences.supplier', 'Fornecedor')
    case 'grupo': return t('financial.paymentTerms.occurrences.group', 'Grupo de clientes')
    case 'marca': return t('financial.paymentTerms.occurrences.brand', 'Marca')
    case 'praca': return t('financial.paymentTerms.occurrences.square', 'Praca')
    case 'produto': return t('financial.paymentTerms.occurrences.product', 'Produto')
    case 'produto_pai': return t('financial.paymentTerms.occurrences.parentProduct', 'Produto pai')
    case 'rede': return t('financial.paymentTerms.occurrences.network', 'Rede')
    case 'segmento': return t('financial.paymentTerms.occurrences.segment', 'Segmento de clientes')
    case 'supervisor': return t('financial.paymentTerms.occurrences.supervisor', 'Supervisor')
    case 'tabela_preco': return t('financial.paymentTerms.occurrences.priceTable', 'Tabela de preco')
    case 'tipo_cliente': return t('financial.paymentTerms.occurrences.customerType', 'Tipo do cliente')
    case 'uf': return t('financial.paymentTerms.occurrences.state', 'UF')
    case 'vendedor': return t('financial.paymentTerms.occurrences.seller', 'Vendedor')
    case 'todos': return t('financial.paymentTerms.occurrences.all', 'Todos')
  }
}

function occurrenceLookupResource(value: CondicaoPagamentoOcorrencia): CrudResource | null {
  switch (value) {
    case 'canal_distribuicao': return 'canais_distribuicao'
    case 'cliente': return 'clientes'
    case 'departamento': return 'departamentos'
    case 'filial': return 'filiais'
    case 'forma_entrega': return 'formas_entrega'
    case 'fornecedor': return 'fornecedores'
    case 'grupo': return 'grupos'
    case 'marca': return 'marcas'
    case 'praca': return 'pracas'
    case 'produto':
    case 'produto_pai':
      return 'produtos'
    case 'rede': return 'redes'
    case 'segmento': return 'segmentos'
    case 'supervisor': return 'supervisores'
    case 'tabela_preco': return 'tabelas_preco'
    case 'vendedor': return 'vendedores'
    default:
      return null
  }
}

function buildOccurrencePayload(draft: Draft) {
  if (draft.ocorrencia === 'contribuinte') {
    return draft.contribuinte
      ? { payload: { ocorrencia: draft.ocorrencia, id_objeto: draft.contribuinte, data_inicio: draft.dataInicio || null, data_fim: draft.dataFim || null, ativo: draft.ativo } }
      : { error: 'value' as const }
  }

  if (draft.ocorrencia === 'tipo_cliente') {
    return draft.tipoCliente
      ? { payload: { ocorrencia: draft.ocorrencia, id_objeto: draft.tipoCliente, data_inicio: draft.dataInicio || null, data_fim: draft.dataFim || null, ativo: draft.ativo } }
      : { error: 'value' as const }
  }

  if (draft.ocorrencia === 'uf') {
    return draft.uf
      ? { payload: { ocorrencia: draft.ocorrencia, id_objeto: draft.uf, data_inicio: draft.dataInicio || null, data_fim: draft.dataFim || null, ativo: draft.ativo } }
      : { error: 'value' as const }
  }

  if (draft.ocorrencia === 'todos') {
    return { payload: { ocorrencia: draft.ocorrencia, id_objeto: '', data_inicio: draft.dataInicio || null, data_fim: draft.dataFim || null, ativo: draft.ativo } }
  }

  return draft.objeto
    ? { payload: { ocorrencia: draft.ocorrencia, id_objeto: draft.objeto.id, data_inicio: draft.dataInicio || null, data_fim: draft.dataFim || null, ativo: draft.ativo } }
    : { error: 'value' as const }
}

export function CondicoesPagamentoOcorrenciasTab({
  mode,
  condicaoPagamentoId,
  readOnly,
  onError,
}: {
  mode: Mode
  condicaoPagamentoId: string
  readOnly: boolean
  onError: (message: string | null) => void
}) {
  const { t } = useI18n()
  const occurrences = mode === 'restricoes' ? CONDICAO_PAGAMENTO_RESTRICAO_OCCURRENCES : CONDICAO_PAGAMENTO_EXCECAO_OCCURRENCES
  const [items, setItems] = useState<CondicaoPagamentoOcorrenciaRecord[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [editingItem, setEditingItem] = useState<CondicaoPagamentoOcorrenciaRecord | null>(null)
  const [draft, setDraft] = useState<Draft>(() => initialDraft(occurrences))

  const lookupResource = useMemo(() => occurrenceLookupResource(draft.ocorrencia), [draft.ocorrencia])
  const modeLabel = mode === 'restricoes'
    ? t('financial.paymentTerms.tabs.restrictions', 'Restricoes')
    : t('financial.paymentTerms.tabs.exceptions', 'Excecoes')

  const selectedEditableIds = selectedIds.filter((itemId) => {
    const item = items.find((current) => current.id === itemId)
    return item ? !isCondicaoPagamentoOccurrenceSynced(item) : true
  })

  const refresh = useCallback(async () => {
    try {
      const response = mode === 'restricoes'
        ? await condicoesPagamentoClient.listRestricoes(condicaoPagamentoId)
        : await condicoesPagamentoClient.listExcecoes(condicaoPagamentoId)
      setItems(response)
      onError(null)
    } catch (error) {
      onError(error instanceof Error ? error.message : t('financial.paymentTerms.messages.loadOccurrencesError', 'Nao foi possivel carregar os registros da aba.'))
    }
  }, [condicaoPagamentoId, mode, onError, t])

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
    setDraft(initialDraft(occurrences))
    setIsSaving(false)
  }

  function openCreateModal() {
    setEditingItem(null)
    setFeedback(null)
    setDraft(initialDraft(occurrences))
    setModalOpen(true)
  }

  function openEditModal(item: CondicaoPagamentoOcorrenciaRecord) {
    if (isCondicaoPagamentoOccurrenceSynced(item)) {
      setFeedback(t('financial.paymentTerms.messages.syncedOccurrence', 'Registro sincronizado nao pode ser editado.'))
      return
    }

    setEditingItem(item)
    setFeedback(null)
    setDraft({
      ocorrencia: item.ocorrencia,
      objeto: occurrenceLookupValue(item),
      contribuinte: item.ocorrencia === 'contribuinte' ? String(item.id_objeto || '') : '',
      tipoCliente: item.ocorrencia === 'tipo_cliente' ? String(item.id_objeto || '') : '',
      uf: item.ocorrencia === 'uf' ? String(item.id_objeto || '') : '',
      dataInicio: String(item.data_inicio || '').slice(0, 10),
      dataFim: String(item.data_fim || '').slice(0, 10),
      ativo: isCondicaoPagamentoOccurrenceActive(item),
    })
    setModalOpen(true)
  }

  async function handleSave() {
    const payloadResult = buildOccurrencePayload(draft)
    if ('error' in payloadResult) {
      setFeedback(t('financial.paymentTerms.messages.selectOccurrenceValue', 'Selecione um valor para a ocorrencia.'))
      return
    }

    setIsSaving(true)
    try {
      const payload = editingItem ? { ...payloadResult.payload, id: editingItem.id } : payloadResult.payload
      if (mode === 'restricoes') {
        await condicoesPagamentoClient.saveRestricao(condicaoPagamentoId, payload)
      } else {
        await condicoesPagamentoClient.saveExcecao(condicaoPagamentoId, payload)
      }
      await refresh()
      closeModal()
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : t('financial.paymentTerms.messages.saveOccurrenceError', 'Nao foi possivel salvar o registro.'))
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (selectedEditableIds.length === 0) {
      onError(t('financial.paymentTerms.messages.selectEditableOccurrence', 'Selecione pelo menos um registro editavel.'))
      setConfirmOpen(false)
      return
    }

    try {
      if (mode === 'restricoes') {
        await condicoesPagamentoClient.deleteRestricoes(condicaoPagamentoId, selectedEditableIds)
      } else {
        await condicoesPagamentoClient.deleteExcecoes(condicaoPagamentoId, selectedEditableIds)
      }
      setSelectedIds([])
      setConfirmOpen(false)
      await refresh()
      onError(null)
    } catch (error) {
      onError(error instanceof Error ? error.message : t('financial.paymentTerms.messages.deleteOccurrenceError', 'Nao foi possivel excluir o registro.'))
    }
  }

  return (
    <>
      <ClienteRelationSection<CondicaoPagamentoOcorrenciaRecord>
        title={modeLabel}
        readOnly={readOnly}
        hasSelection={selectedEditableIds.length > 0}
        onDelete={() => setConfirmOpen(true)}
        onCreate={openCreateModal}
        items={items}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        getRowId={(item) => item.id}
        emptyMessage={t('financial.paymentTerms.messages.emptyOccurrences', 'Nenhum registro foi encontrado para esta aba.')}
        columns={[
          { header: t('financial.paymentTerms.fields.type', 'Tipo'), render: (item) => occurrenceLabel(item.ocorrencia, t) },
          { header: t('financial.paymentTerms.fields.value', 'Valor'), render: (item) => formatCondicaoPagamentoOccurrenceLabel(item) },
          { header: t('financial.paymentTerms.fields.startDate', 'Data inicio'), render: (item) => item.data_inicio ? formatDate(item.data_inicio) : '-' },
          { header: t('financial.paymentTerms.fields.endDate', 'Data fim'), render: (item) => item.data_fim ? formatDate(item.data_fim) : '-' },
          { header: t('simpleCrud.fields.active', 'Ativo'), render: (item) => isCondicaoPagamentoOccurrenceActive(item) ? 'Sim' : 'Nao' },
          {
            header: t('common.actions', 'Acoes'),
            headerClassName: 'w-[104px]',
            cellClassName: 'whitespace-nowrap',
            render: (item) => !readOnly ? (
              <div className="flex items-center gap-2">
                <TooltipIconButton label={isCondicaoPagamentoOccurrenceSynced(item) ? t('financial.paymentTerms.messages.syncedOccurrence', 'Registro sincronizado') : t('simpleCrud.actions.edit', 'Editar')}>
                  <button type="button" disabled={isCondicaoPagamentoOccurrenceSynced(item)} onClick={() => openEditModal(item)} className={editActionButtonClasses}>
                    <Pencil className="h-4 w-4" />
                  </button>
                </TooltipIconButton>
                <TooltipIconButton label={isCondicaoPagamentoOccurrenceSynced(item) ? t('financial.paymentTerms.messages.syncedOccurrence', 'Registro sincronizado') : t('simpleCrud.actions.delete', 'Excluir')}>
                  <button type="button" disabled={isCondicaoPagamentoOccurrenceSynced(item)} onClick={() => { setSelectedIds([item.id]); setConfirmOpen(true) }} className={deleteActionButtonClasses}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </TooltipIconButton>
              </div>
            ) : null,
          },
        ]}
      />

      <CrudModal open={modalOpen} title={editingItem ? t('financial.paymentTerms.messages.editOccurrenceTitle', 'Editar registro') : t('financial.paymentTerms.messages.createOccurrenceTitle', 'Novo registro')} onClose={closeModal} onConfirm={() => void handleSave()} isSaving={isSaving}>
        <div className="grid gap-4 md:grid-cols-2">
          {feedback ? <div className={feedbackClasses}>{feedback}</div> : null}
          <FormField label={t('simpleCrud.fields.active', 'Ativo')}>
            <select value={draft.ativo ? '1' : '0'} onChange={(event) => setDraft((current) => ({ ...current, ativo: event.target.value === '1' }))} className={inputClasses()} disabled={readOnly}>
              <option value="1">{t('common.yes', 'Sim')}</option>
              <option value="0">{t('common.no', 'Nao')}</option>
            </select>
          </FormField>

          <FormField label={t('financial.paymentTerms.fields.type', 'Tipo')}>
            <select value={draft.ocorrencia} onChange={(event) => setDraft({ ...initialDraft(occurrences), ocorrencia: event.target.value as CondicaoPagamentoOcorrencia })} className={inputClasses()} disabled={readOnly}>
              {occurrences.map((item) => <option key={item} value={item}>{occurrenceLabel(item, t)}</option>)}
            </select>
          </FormField>

          {draft.ocorrencia === 'contribuinte' ? (
            <FormField label={t('financial.paymentTerms.fields.value', 'Valor')}>
              <select value={draft.contribuinte} onChange={(event) => setDraft((current) => ({ ...current, contribuinte: event.target.value }))} className={inputClasses()} disabled={readOnly}>
                <option value="">{t('common.select', 'Selecione')}</option>
                <option value="1">{t('common.yes', 'Sim')}</option>
                <option value="0">{t('common.no', 'Nao')}</option>
              </select>
            </FormField>
          ) : null}

          {draft.ocorrencia === 'tipo_cliente' ? (
            <FormField label={t('financial.paymentTerms.fields.value', 'Valor')}>
              <select value={draft.tipoCliente} onChange={(event) => setDraft((current) => ({ ...current, tipoCliente: event.target.value }))} className={inputClasses()} disabled={readOnly}>
                <option value="">{t('common.select', 'Selecione')}</option>
                <option value="PF">{t('financial.paymentTerms.customerTypes.individual', 'Pessoa fisica')}</option>
                <option value="PJ">{t('financial.paymentTerms.customerTypes.company', 'Pessoa juridica')}</option>
              </select>
            </FormField>
          ) : null}

          {draft.ocorrencia === 'uf' ? (
            <FormField label={t('financial.paymentTerms.fields.value', 'Valor')}>
              <select value={draft.uf} onChange={(event) => setDraft((current) => ({ ...current, uf: event.target.value }))} className={inputClasses()} disabled={readOnly}>
                <option value="">{t('common.select', 'Selecione')}</option>
                {BRAZILIAN_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
              </select>
            </FormField>
          ) : null}

          {draft.ocorrencia === 'todos' ? (
            <FormField label={t('financial.paymentTerms.fields.value', 'Valor')}>
              <input value={t('financial.paymentTerms.occurrences.all', 'Todos')} className={inputClasses()} disabled />
            </FormField>
          ) : null}

          {lookupResource ? (
            <FormField label={t('financial.paymentTerms.fields.value', 'Valor')} className="md:col-span-2">
              <LookupSelect
                label={modeLabel}
                value={draft.objeto}
                onChange={(value) => setDraft((current) => ({ ...current, objeto: value }))}
                disabled={readOnly}
                loadOptions={(query, page, perPage) => loadCrudLookupOptions(lookupResource, query, page, perPage).then((options) => options.map((option) => ({ id: option.value, label: option.label })))}
              />
            </FormField>
          ) : null}

          <FormField label={t('financial.paymentTerms.fields.startDate', 'Data inicio')}>
            <input type="date" value={draft.dataInicio} onChange={(event) => setDraft((current) => ({ ...current, dataInicio: event.target.value }))} className={inputClasses()} disabled={readOnly} />
          </FormField>
          <FormField label={t('financial.paymentTerms.fields.endDate', 'Data fim')}>
            <input type="date" value={draft.dataFim} onChange={(event) => setDraft((current) => ({ ...current, dataFim: event.target.value }))} className={inputClasses()} disabled={readOnly} />
          </FormField>
        </div>
      </CrudModal>

      <ConfirmDialog
        open={confirmOpen}
        title={t('financial.paymentTerms.messages.deleteOccurrenceTitle', 'Excluir registros')}
        description={t('financial.paymentTerms.messages.deleteOccurrenceDescription', 'Os registros selecionados serao removidos.')}
        confirmLabel={t('common.delete', 'Excluir')}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </>
  )
}
