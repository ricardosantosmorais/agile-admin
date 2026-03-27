'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { CrudModal } from '@/src/components/ui/crud-modal'
import { FormField } from '@/src/components/ui/form-field'
import { LookupSelect, type LookupOption } from '@/src/components/ui/lookup-select'
import { TooltipIconButton } from '@/src/components/ui/tooltip-icon-button'
import { inputClasses } from '@/src/components/ui/input-styles'
import { loadCrudLookupOptions } from '@/src/components/crud-base/crud-client'
import type { CrudResource } from '@/src/components/crud-base/types'
import { ClienteRelationSection } from '@/src/features/clientes/components/cliente-relation-section'
import { formatFormaEntregaOccurrenceLabel, type FormaEntregaOcorrencia, type FormaEntregaOcorrenciaRecord } from '@/src/features/formas-entrega/services/formas-entrega-mappers'
import { formasEntregaClient } from '@/src/features/formas-entrega/services/formas-entrega-client'
import { useI18n } from '@/src/i18n/use-i18n'
import { BRAZILIAN_STATES } from '@/src/lib/brazil'

type Mode = 'restricoes' | 'excecoes'

type Draft = {
  ocorrencia: FormaEntregaOcorrencia
  objeto: LookupOption | null
  tipoCliente: string
  uf: string
}

const OCCURRENCIAS: FormaEntregaOcorrencia[] = [
  'canal_distribuicao',
  'cliente',
  'departamento',
  'filial',
  'fornecedor',
  'grupo',
  'marca',
  'produto',
  'produto_pai',
  'rede',
  'segmento',
  'tipo_cliente',
  'uf',
  'todos',
]

function initialDraft(): Draft {
  return {
    ocorrencia: 'canal_distribuicao',
    objeto: null,
    tipoCliente: '',
    uf: '',
  }
}

function occurrenceLabel(value: FormaEntregaOcorrencia, t: ReturnType<typeof useI18n>['t']) {
  switch (value) {
    case 'canal_distribuicao': return t('logistics.deliveryMethods.occurrences.channel', 'Canal de distribuicao')
    case 'cliente': return t('logistics.deliveryMethods.occurrences.customer', 'Cliente')
    case 'departamento': return t('logistics.deliveryMethods.occurrences.department', 'Departamento')
    case 'filial': return t('logistics.deliveryMethods.occurrences.branch', 'Filial')
    case 'fornecedor': return t('logistics.deliveryMethods.occurrences.supplier', 'Fornecedor')
    case 'grupo': return t('logistics.deliveryMethods.occurrences.group', 'Grupo de clientes')
    case 'marca': return t('logistics.deliveryMethods.occurrences.brand', 'Marca')
    case 'produto': return t('logistics.deliveryMethods.occurrences.product', 'Produto')
    case 'produto_pai': return t('logistics.deliveryMethods.occurrences.parentProduct', 'Produto pai')
    case 'rede': return t('logistics.deliveryMethods.occurrences.network', 'Rede de clientes')
    case 'segmento': return t('logistics.deliveryMethods.occurrences.segment', 'Segmento de clientes')
    case 'tipo_cliente': return t('logistics.deliveryMethods.occurrences.customerType', 'Tipo de cliente')
    case 'uf': return t('logistics.deliveryMethods.occurrences.state', 'UF')
    case 'todos': return t('logistics.deliveryMethods.occurrences.all', 'Todos')
  }
}

function occurrenceLookupResource(value: FormaEntregaOcorrencia): CrudResource | null {
  switch (value) {
    case 'canal_distribuicao': return 'canais_distribuicao'
    case 'cliente': return 'clientes'
    case 'departamento': return 'departamentos'
    case 'filial': return 'filiais'
    case 'fornecedor': return 'fornecedores'
    case 'grupo': return 'grupos'
    case 'marca': return 'marcas'
    case 'produto':
    case 'produto_pai':
      return 'produtos'
    case 'rede': return 'redes'
    case 'segmento': return 'segmentos'
    default:
      return null
  }
}

function occurrenceLookupValue(item: FormaEntregaOcorrenciaRecord): LookupOption | null {
  switch (item.ocorrencia) {
    case 'canal_distribuicao':
      return item.canal_distribuicao?.id ? { id: item.canal_distribuicao.id, label: item.canal_distribuicao.nome || item.canal_distribuicao.id } : null
    case 'cliente':
      return item.cliente?.id ? { id: item.cliente.id, label: item.cliente.nome_fantasia || item.cliente.razao_social || item.cliente.id } : null
    case 'departamento':
      return item.departamento?.id ? { id: item.departamento.id, label: item.departamento.nome || item.departamento.id } : null
    case 'filial':
      return item.filial?.id ? { id: item.filial.id, label: item.filial.nome_fantasia || item.filial.nome || item.filial.id } : null
    case 'fornecedor':
      return item.fornecedor?.id ? { id: item.fornecedor.id, label: item.fornecedor.nome_fantasia || item.fornecedor.nome || item.fornecedor.id } : null
    case 'grupo':
      return item.grupo?.id ? { id: item.grupo.id, label: item.grupo.nome || item.grupo.id } : null
    case 'marca':
      return item.marca?.id ? { id: item.marca.id, label: item.marca.nome || item.marca.id } : null
    case 'produto':
    case 'produto_pai':
      return item.produto?.id ? { id: item.produto.id, label: item.produto.nome || item.produto.id } : null
    case 'rede':
      return item.rede?.id ? { id: item.rede.id, label: item.rede.nome || item.rede.id } : null
    case 'segmento':
      return item.segmento?.id ? { id: item.segmento.id, label: item.segmento.nome || item.segmento.id } : null
    default:
      return null
  }
}

export function FormaEntregaOcorrenciasTab({
  mode,
  formaEntregaId,
  readOnly,
  onError,
}: {
  mode: Mode
  formaEntregaId: string
  readOnly: boolean
  onError: (message: string | null) => void
}) {
  const { t } = useI18n()
  const [items, setItems] = useState<FormaEntregaOcorrenciaRecord[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<FormaEntregaOcorrenciaRecord | null>(null)
  const [draft, setDraft] = useState<Draft>(initialDraft())

  const lookupResource = useMemo(() => occurrenceLookupResource(draft.ocorrencia), [draft.ocorrencia])
  const modeLabel = mode === 'restricoes'
    ? t('logistics.deliveryMethods.tabs.restrictions', 'Restricoes')
    : t('logistics.deliveryMethods.tabs.exceptions', 'Excecoes')

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = mode === 'restricoes'
        ? await formasEntregaClient.listRestricoes(formaEntregaId)
        : await formasEntregaClient.listExcecoes(formaEntregaId)
      setItems(response)
      onError(null)
    } catch (error) {
      onError(error instanceof Error ? error.message : t('logistics.deliveryMethods.messages.loadOccurrencesError', 'Nao foi possivel carregar os registros da aba.'))
    } finally {
      setIsLoading(false)
    }
  }, [formaEntregaId, mode, onError, t])

  useEffect(() => {
    void refresh()
  }, [refresh])

  function closeModal() {
    setModalOpen(false)
    setEditingItem(null)
    setFeedback(null)
    setDraft(initialDraft())
  }

  function openCreateModal() {
    setEditingItem(null)
    setFeedback(null)
    setDraft(initialDraft())
    setModalOpen(true)
  }

  function openEditModal(item: FormaEntregaOcorrenciaRecord) {
    setEditingItem(item)
    setFeedback(null)
    setDraft({
      ocorrencia: item.ocorrencia,
      objeto: occurrenceLookupValue(item),
      tipoCliente: item.ocorrencia === 'tipo_cliente' ? String(item.id_objeto || '') : '',
      uf: item.ocorrencia === 'uf' ? String(item.id_objeto || '') : '',
    })
    setModalOpen(true)
  }

  async function handleSave() {
    let payload: Record<string, unknown> = {}

    if (draft.ocorrencia === 'tipo_cliente') {
      if (!draft.tipoCliente) {
        setFeedback(t('logistics.deliveryMethods.messages.selectRequiredValue', 'Selecione um valor obrigatorio.'))
        return
      }
      payload = { ocorrencia: draft.ocorrencia, id_objeto: draft.tipoCliente }
    } else if (draft.ocorrencia === 'uf') {
      if (!draft.uf) {
        setFeedback(t('logistics.deliveryMethods.messages.selectRequiredValue', 'Selecione um valor obrigatorio.'))
        return
      }
      payload = { ocorrencia: draft.ocorrencia, id_objeto: draft.uf }
    } else if (draft.ocorrencia === 'todos') {
      payload = { ocorrencia: draft.ocorrencia, id_objeto: '1' }
    } else {
      if (!draft.objeto) {
        setFeedback(t('logistics.deliveryMethods.messages.selectRequiredValue', 'Selecione um valor obrigatorio.'))
        return
      }
      payload = { ocorrencia: draft.ocorrencia, id_objeto: draft.objeto.id }
    }

    try {
      if (editingItem) {
        if (mode === 'restricoes') {
          await formasEntregaClient.deleteRestricoes(formaEntregaId, [editingItem.id])
        } else {
          await formasEntregaClient.deleteExcecoes(formaEntregaId, [editingItem.id])
        }
      }

      if (mode === 'restricoes') {
        await formasEntregaClient.createRestricao(formaEntregaId, payload)
      } else {
        await formasEntregaClient.createExcecao(formaEntregaId, payload)
      }

      await refresh()
      closeModal()
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : t('logistics.deliveryMethods.messages.saveOccurrenceError', 'Nao foi possivel salvar o registro.'))
    }
  }

  async function handleDelete() {
    try {
      if (mode === 'restricoes') {
        await formasEntregaClient.deleteRestricoes(formaEntregaId, selectedIds)
      } else {
        await formasEntregaClient.deleteExcecoes(formaEntregaId, selectedIds)
      }
      setSelectedIds([])
      setConfirmOpen(false)
      await refresh()
    } catch (error) {
      onError(error instanceof Error ? error.message : t('logistics.deliveryMethods.messages.deleteOccurrenceError', 'Nao foi possivel excluir o registro.'))
    }
  }

  return (
    <>
      <ClienteRelationSection<FormaEntregaOcorrenciaRecord>
        title={modeLabel}
        readOnly={readOnly}
        hasSelection={selectedIds.length > 0}
        onDelete={() => setConfirmOpen(true)}
        onCreate={openCreateModal}
        items={items}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        getRowId={(item) => item.id}
        emptyMessage={isLoading ? t('common.loading', 'Loading...') : t('logistics.deliveryMethods.messages.emptyOccurrences', 'Nenhum registro foi encontrado para esta aba.')}
        columns={[
          { header: t('logistics.deliveryMethods.fields.type', 'Tipo'), render: (item) => occurrenceLabel(item.ocorrencia, t) },
          { header: modeLabel.slice(0, -1), cellClassName: 'font-semibold text-slate-950', render: (item) => formatFormaEntregaOccurrenceLabel(item) },
          {
            header: t('common.actions', 'Acoes'),
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

      <CrudModal
        open={modalOpen}
        title={editingItem
          ? t('logistics.deliveryMethods.messages.editOccurrenceTitle', 'Editar registro')
          : t('logistics.deliveryMethods.messages.createOccurrenceTitle', 'Novo registro')}
        onClose={closeModal}
        onConfirm={() => void handleSave()}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {feedback ? <div className="md:col-span-2 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{feedback}</div> : null}
          <FormField label={t('logistics.deliveryMethods.fields.type', 'Tipo')}>
            <select
              value={draft.ocorrencia}
              onChange={(event) => setDraft({ ...initialDraft(), ocorrencia: event.target.value as FormaEntregaOcorrencia })}
              className={inputClasses()}
              disabled={readOnly}
            >
              {OCCURRENCIAS.map((item) => <option key={item} value={item}>{occurrenceLabel(item, t)}</option>)}
            </select>
          </FormField>

          {draft.ocorrencia === 'tipo_cliente' ? (
            <FormField label={mode === 'restricoes' ? t('logistics.deliveryMethods.tabs.restrictions', 'Restricoes') : t('logistics.deliveryMethods.tabs.exceptions', 'Excecoes')}>
              <select value={draft.tipoCliente} onChange={(event) => setDraft((current) => ({ ...current, tipoCliente: event.target.value }))} className={inputClasses()} disabled={readOnly}>
                <option value="">{t('common.select', 'Selecione')}</option>
                <option value="C">{t('logistics.deliveryMethods.customerTypes.consumption', 'Consumo')}</option>
                <option value="R">{t('logistics.deliveryMethods.customerTypes.resale', 'Revenda')}</option>
                <option value="F">{t('logistics.deliveryMethods.customerTypes.employee', 'Funcionario')}</option>
              </select>
            </FormField>
          ) : null}

          {draft.ocorrencia === 'uf' ? (
            <FormField label={mode === 'restricoes' ? t('logistics.deliveryMethods.tabs.restrictions', 'Restricoes') : t('logistics.deliveryMethods.tabs.exceptions', 'Excecoes')}>
              <select value={draft.uf} onChange={(event) => setDraft((current) => ({ ...current, uf: event.target.value }))} className={inputClasses()} disabled={readOnly}>
                <option value="">{t('common.select', 'Selecione')}</option>
                {BRAZILIAN_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
              </select>
            </FormField>
          ) : null}

          {draft.ocorrencia === 'todos' ? (
            <FormField label={mode === 'restricoes' ? t('logistics.deliveryMethods.tabs.restrictions', 'Restricoes') : t('logistics.deliveryMethods.tabs.exceptions', 'Excecoes')}>
              <input value={t('logistics.deliveryMethods.occurrences.all', 'Todos')} className={inputClasses()} disabled />
            </FormField>
          ) : null}

          {lookupResource ? (
            <FormField label={mode === 'restricoes' ? t('logistics.deliveryMethods.tabs.restrictions', 'Restricoes') : t('logistics.deliveryMethods.tabs.exceptions', 'Excecoes')} className="md:col-span-2">
              <LookupSelect<LookupOption>
                key={draft.ocorrencia}
                label={modeLabel}
                value={draft.objeto}
                onChange={(value) => setDraft((current) => ({ ...current, objeto: value }))}
                disabled={readOnly}
                loadOptions={(query, page, perPage) => loadCrudLookupOptions(lookupResource, query, page, perPage).then((options) => options.map((option) => ({ id: option.value, label: option.label })))}
              />
            </FormField>
          ) : null}
        </div>
      </CrudModal>

      <ConfirmDialog
        open={confirmOpen}
        title={t('logistics.deliveryMethods.messages.deleteOccurrenceTitle', 'Excluir registros')}
        description={t('logistics.deliveryMethods.messages.deleteOccurrenceDescription', 'Os registros selecionados serao removidos.')}
        confirmLabel={t('common.delete', 'Excluir')}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </>
  )
}
