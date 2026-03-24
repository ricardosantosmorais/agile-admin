'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { CrudModal } from '@/src/components/ui/crud-modal'
import { DateInput } from '@/src/components/ui/date-input'
import { FormField } from '@/src/components/ui/form-field'
import { LookupSelect, type LookupOption } from '@/src/components/ui/lookup-select'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { TooltipIconButton } from '@/src/components/ui/tooltip-icon-button'
import { inputClasses } from '@/src/components/ui/input-styles'
import { loadCrudLookupOptions } from '@/src/components/crud-base/crud-client'
import type { CrudResource } from '@/src/components/crud-base/types'
import { ClienteRelationSection } from '@/src/features/clientes/components/cliente-relation-section'
import { combosClient, type ComboExcecaoRecord } from '@/src/features/combos/services/combos-client'
import { formatApiDateToInput, formatExceptionDateRangeLabel, toComboExcecaoPayload } from '@/src/features/combos/services/combos-mappers'
import { useI18n } from '@/src/i18n/use-i18n'
import { BRAZILIAN_STATES } from '@/src/lib/brazil'

type ExcecaoTipo =
  | 'condicao_pagamento'
  | 'contribuinte'
  | 'cliente'
  | 'forma_pagamento'
  | 'grupo'
  | 'rede'
  | 'segmento'
  | 'supervisor'
  | 'tabela_preco'
  | 'tipo_cliente'
  | 'uf'
  | 'vendedor'
  | 'todos'

type ExcecaoDraft = {
  universo: ExcecaoTipo
  objeto: LookupOption | null
  contribuinte: string
  tipoCliente: string
  uf: string
  id_filial: LookupOption | null
  id_praca: LookupOption | null
  data_inicio: string
  data_fim: string
}

const EXCEPTION_TYPES: ExcecaoTipo[] = [
  'condicao_pagamento',
  'contribuinte',
  'cliente',
  'forma_pagamento',
  'grupo',
  'rede',
  'segmento',
  'supervisor',
  'tabela_preco',
  'tipo_cliente',
  'uf',
  'vendedor',
  'todos',
]

function exceptionTypeLabel(type: ExcecaoTipo | string, t: ReturnType<typeof useI18n>['t']) {
  switch (type) {
    case 'condicao_pagamento':
      return t('marketing.combos.tabs.exceptions.types.paymentCondition', 'Condição de pagamento')
    case 'contribuinte':
      return t('marketing.combos.tabs.exceptions.types.taxpayer', 'Contribuinte')
    case 'cliente':
      return t('marketing.combos.tabs.exceptions.types.customer', 'Cliente')
    case 'forma_pagamento':
      return t('marketing.combos.tabs.exceptions.types.paymentMethod', 'Forma de pagamento')
    case 'grupo':
      return t('marketing.combos.tabs.exceptions.types.group', 'Grupo de clientes')
    case 'rede':
      return t('marketing.combos.tabs.exceptions.types.network', 'Rede de clientes')
    case 'segmento':
      return t('marketing.combos.tabs.exceptions.types.segment', 'Segmento de clientes')
    case 'supervisor':
      return t('marketing.combos.tabs.exceptions.types.supervisor', 'Supervisor')
    case 'tabela_preco':
      return t('marketing.combos.tabs.exceptions.types.priceTable', 'Tabela de preço')
    case 'tipo_cliente':
      return t('marketing.combos.tabs.exceptions.types.customerType', 'Tipo de cliente')
    case 'uf':
      return t('marketing.combos.tabs.exceptions.types.state', 'UF do cliente')
    case 'vendedor':
      return t('marketing.combos.tabs.exceptions.types.seller', 'Vendedor')
    case 'todos':
      return t('marketing.combos.tabs.exceptions.types.all', 'Todos')
    default:
      return type
  }
}

function exceptionLookupResource(type: ExcecaoTipo): CrudResource | null {
  switch (type) {
    case 'condicao_pagamento':
      return 'condicoes_pagamento'
    case 'cliente':
      return 'clientes'
    case 'forma_pagamento':
      return 'formas_pagamento'
    case 'grupo':
      return 'grupos'
    case 'rede':
      return 'redes'
    case 'segmento':
      return 'segmentos'
    case 'supervisor':
      return 'supervisores'
    case 'tabela_preco':
      return 'tabelas_preco'
    case 'vendedor':
      return 'vendedores'
    default:
      return null
  }
}

function exceptionValueLabel(item: ComboExcecaoRecord, t: ReturnType<typeof useI18n>['t']) {
  switch (item.universo) {
    case 'condicao_pagamento':
      return item.condicao_pagamento?.nome || item.id_objeto_universo || '-'
    case 'contribuinte':
      return item.id_objeto_universo === '1' ? t('common.yes', 'Sim') : item.id_objeto_universo === '0' ? t('common.no', 'Não') : '-'
    case 'cliente':
      return item.cliente?.nome_fantasia || item.cliente?.razao_social || item.id_objeto_universo || '-'
    case 'forma_pagamento':
      return item.forma_pagamento?.nome || item.id_objeto_universo || '-'
    case 'grupo':
      return item.grupo?.nome || item.id_objeto_universo || '-'
    case 'rede':
      return item.rede?.nome || item.id_objeto_universo || '-'
    case 'segmento':
      return item.segmento?.nome || item.id_objeto_universo || '-'
    case 'supervisor':
      return item.supervisor?.nome || item.id_objeto_universo || '-'
    case 'tabela_preco':
      return item.tabela_preco?.nome || item.id_objeto_universo || '-'
    case 'tipo_cliente':
      return item.id_objeto_universo === 'PF'
        ? t('marketing.combos.tabs.exceptions.customerType.individual', 'Pessoa física')
        : item.id_objeto_universo === 'PJ'
          ? t('marketing.combos.tabs.exceptions.customerType.company', 'Pessoa jurídica')
          : (item.id_objeto_universo || '-')
    case 'uf':
      return item.id_objeto_universo || '-'
    case 'todos':
      return t('marketing.combos.tabs.exceptions.types.all', 'Todos')
    case 'vendedor':
      return item.vendedor?.nome || item.id_objeto_universo || '-'
    default:
      return item.id_objeto_universo || '-'
  }
}

function exceptionLookupValue(item: ComboExcecaoRecord): LookupOption | null {
  switch (item.universo) {
    case 'condicao_pagamento':
      return item.condicao_pagamento?.id ? { id: item.condicao_pagamento.id, label: item.condicao_pagamento.nome || item.condicao_pagamento.id } : null
    case 'cliente':
      return item.cliente?.id ? { id: item.cliente.id, label: item.cliente.nome_fantasia || item.cliente.razao_social || item.cliente.id } : null
    case 'forma_pagamento':
      return item.forma_pagamento?.id ? { id: item.forma_pagamento.id, label: item.forma_pagamento.nome || item.forma_pagamento.id } : null
    case 'grupo':
      return item.grupo?.id ? { id: item.grupo.id, label: item.grupo.nome || item.grupo.id } : null
    case 'rede':
      return item.rede?.id ? { id: item.rede.id, label: item.rede.nome || item.rede.id } : null
    case 'segmento':
      return item.segmento?.id ? { id: item.segmento.id, label: item.segmento.nome || item.segmento.id } : null
    case 'supervisor':
      return item.supervisor?.id ? { id: item.supervisor.id, label: item.supervisor.nome || item.supervisor.id } : null
    case 'tabela_preco':
      return item.tabela_preco?.id ? { id: item.tabela_preco.id, label: item.tabela_preco.nome || item.tabela_preco.id } : null
    case 'vendedor':
      return item.vendedor?.id ? { id: item.vendedor.id, label: item.vendedor.nome || item.vendedor.id } : null
    default:
      return null
  }
}

function auxiliaryLookupValue(item: { id?: string | null; nome?: string | null; nome_fantasia?: string | null } | null | undefined): LookupOption | null {
  return item?.id ? { id: item.id, label: item.nome_fantasia || item.nome || item.id } : null
}

function RestrictionBadge({ yesLabel }: { yesLabel: string }) {
  return <StatusBadge tone="warning">{yesLabel}</StatusBadge>
}

function initialDraft(): ExcecaoDraft {
  return {
    universo: 'condicao_pagamento',
    objeto: null,
    contribuinte: '',
    tipoCliente: '',
    uf: '',
    id_filial: null,
    id_praca: null,
    data_inicio: '',
    data_fim: '',
  }
}

export function ComboExcecoesTab({
  comboId,
  readOnly,
  onError,
}: {
  comboId: string
  readOnly: boolean
  onError: (message: string | null) => void
}) {
  const { t } = useI18n()
  const [items, setItems] = useState<ComboExcecaoRecord[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [modalFeedback, setModalFeedback] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<ComboExcecaoRecord | null>(null)
  const [draft, setDraft] = useState<ExcecaoDraft>(initialDraft())

  const lookupResource = useMemo(() => exceptionLookupResource(draft.universo), [draft.universo])

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      setItems(await combosClient.listExcecoes(comboId))
      onError(null)
    } catch (error) {
      onError(error instanceof Error ? error.message : t('marketing.combos.tabs.exceptions.loadError', 'Não foi possível carregar as exceções do combo.'))
    } finally {
      setIsLoading(false)
    }
  }, [comboId, onError, t])

  useEffect(() => {
    void refresh()
  }, [refresh])

  function closeModal() {
    setModalOpen(false)
    setEditingItem(null)
    setModalFeedback(null)
    setDraft(initialDraft())
  }

  function openCreateModal() {
    setEditingItem(null)
    setModalFeedback(null)
    setDraft(initialDraft())
    setModalOpen(true)
  }

  function openEditModal(item: ComboExcecaoRecord) {
    setEditingItem(item)
    setModalFeedback(null)
    setDraft({
      universo: item.universo as ExcecaoTipo,
      objeto: exceptionLookupValue(item),
      contribuinte: item.universo === 'contribuinte' ? String(item.id_objeto_universo || '') : '',
      tipoCliente: item.universo === 'tipo_cliente' ? String(item.id_objeto_universo || '') : '',
      uf: item.universo === 'uf' ? String(item.id_objeto_universo || '') : '',
      id_filial: auxiliaryLookupValue(item.filial),
      id_praca: auxiliaryLookupValue(item.praca),
      data_inicio: formatApiDateToInput(item.data_inicio),
      data_fim: formatApiDateToInput(item.data_fim),
    })
    setModalOpen(true)
  }

  async function handleSave() {
    try {
      if (editingItem) {
        await combosClient.deleteExcecoes(comboId, [editingItem.id])
      }

      await combosClient.createExcecao(comboId, toComboExcecaoPayload(comboId, {
        universo: draft.universo,
        id_objeto_universo: draft.objeto?.id || '',
        contribuinte: draft.contribuinte,
        tipo_cliente: draft.tipoCliente,
        uf: draft.uf,
        id_filial: draft.id_filial?.id || '',
        id_praca: draft.id_praca?.id || '',
        data_inicio: draft.data_inicio,
        data_fim: draft.data_fim,
      }))
      await refresh()
      closeModal()
    } catch (error) {
      setModalFeedback(error instanceof Error ? error.message : t('marketing.combos.tabs.exceptions.saveError', 'Não foi possível salvar a exceção do combo.'))
    }
  }

  async function handleDelete() {
    try {
      await combosClient.deleteExcecoes(comboId, selectedIds)
      setSelectedIds([])
      setConfirmOpen(false)
      await refresh()
    } catch (error) {
      onError(error instanceof Error ? error.message : t('marketing.combos.tabs.exceptions.deleteError', 'Não foi possível excluir as exceções do combo.'))
    }
  }

  return (
    <>
      <ClienteRelationSection<ComboExcecaoRecord>
        title={t('marketing.combos.tabs.exceptions.title', 'Exceções')}
        readOnly={readOnly}
        hasSelection={selectedIds.length > 0}
        onDelete={() => setConfirmOpen(true)}
        onCreate={openCreateModal}
        items={items}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        getRowId={(item) => item.id}
        emptyMessage={isLoading ? t('common.loading', 'Loading...') : t('marketing.combos.tabs.exceptions.empty', 'Nenhuma exceção foi cadastrada para o combo.')}
        columns={[
          { header: t('marketing.combos.tabs.common.type', 'Tipo'), render: (item) => exceptionTypeLabel(item.universo, t) },
          { header: t('marketing.combos.tabs.common.rule', 'Exceção'), cellClassName: 'font-semibold text-slate-950', render: (item) => exceptionValueLabel(item, t) },
          { header: t('marketing.combos.tabs.exceptions.fields.branch', 'Filial'), render: (item) => item.filial?.nome_fantasia || item.filial?.nome || '-' },
          { header: t('marketing.combos.tabs.exceptions.fields.square', 'Praça'), render: (item) => item.praca?.nome || '-' },
          { header: t('marketing.combos.tabs.exceptions.fields.period', 'Período'), render: (item) => formatExceptionDateRangeLabel(item.data_inicio, item.data_fim) },
          {
            header: t('marketing.combos.tabs.common.restriction', 'Restrição'),
            headerClassName: 'w-[120px]',
            render: () => <RestrictionBadge yesLabel={t('common.yes', 'Sim')} />,
          },
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
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedIds([item.id])
                      setConfirmOpen(true)
                    }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-700"
                  >
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
          ? t('marketing.combos.tabs.exceptions.editTitle', 'Editar exceção')
          : t('marketing.combos.tabs.exceptions.createTitle', 'Nova exceção')}
        onClose={closeModal}
        onConfirm={() => void handleSave()}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {modalFeedback ? <div className="md:col-span-2 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{modalFeedback}</div> : null}

          <FormField label={t('marketing.combos.tabs.common.type', 'Tipo')}>
            <select
              value={draft.universo}
              onChange={(event) => setDraft((current) => ({ ...initialDraft(), universo: event.target.value as ExcecaoTipo, id_filial: current.id_filial, id_praca: current.id_praca, data_inicio: current.data_inicio, data_fim: current.data_fim }))}
              className={inputClasses()}
              disabled={readOnly}
            >
              {EXCEPTION_TYPES.map((item) => <option key={item} value={item}>{exceptionTypeLabel(item, t)}</option>)}
            </select>
          </FormField>

          {draft.universo === 'contribuinte' ? (
            <FormField label={t('marketing.combos.tabs.common.rule', 'Exceção')}>
              <select
                value={draft.contribuinte}
                onChange={(event) => setDraft((current) => ({ ...current, contribuinte: event.target.value }))}
                className={inputClasses()}
                disabled={readOnly}
              >
                <option value="">{t('common.select', 'Selecione')}</option>
                <option value="1">{t('common.yes', 'Sim')}</option>
                <option value="0">{t('common.no', 'Não')}</option>
              </select>
            </FormField>
          ) : null}

          {draft.universo === 'tipo_cliente' ? (
            <FormField label={t('marketing.combos.tabs.common.rule', 'Exceção')}>
              <select
                value={draft.tipoCliente}
                onChange={(event) => setDraft((current) => ({ ...current, tipoCliente: event.target.value }))}
                className={inputClasses()}
                disabled={readOnly}
              >
                <option value="">{t('common.select', 'Selecione')}</option>
                <option value="PF">{t('marketing.combos.tabs.exceptions.customerType.individual', 'Pessoa física')}</option>
                <option value="PJ">{t('marketing.combos.tabs.exceptions.customerType.company', 'Pessoa jurídica')}</option>
              </select>
            </FormField>
          ) : null}

          {draft.universo === 'uf' ? (
            <FormField label={t('marketing.combos.tabs.common.rule', 'Exceção')}>
              <select
                value={draft.uf}
                onChange={(event) => setDraft((current) => ({ ...current, uf: event.target.value }))}
                className={inputClasses()}
                disabled={readOnly}
              >
                <option value="">{t('common.select', 'Selecione')}</option>
                {BRAZILIAN_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
              </select>
            </FormField>
          ) : null}

          {draft.universo === 'todos' ? (
            <FormField label={t('marketing.combos.tabs.common.rule', 'Exceção')}>
              <input value={t('marketing.combos.tabs.exceptions.types.all', 'Todos')} className={inputClasses()} disabled />
            </FormField>
          ) : null}

          {lookupResource ? (
            <FormField label={t('marketing.combos.tabs.common.rule', 'Exceção')} className="md:col-span-2">
              <LookupSelect<LookupOption>
                key={draft.universo}
                label={t('marketing.combos.tabs.common.rule', 'Exceção')}
                value={draft.objeto}
                onChange={(value) => setDraft((current) => ({ ...current, objeto: value }))}
                disabled={readOnly}
                loadOptions={(query, page, perPage) => loadCrudLookupOptions(lookupResource, query, page, perPage).then((options) => options.map((option) => ({ id: option.value, label: option.label })))}
              />
            </FormField>
          ) : null}

          <FormField label={t('marketing.combos.tabs.exceptions.fields.branch', 'Filial')}>
            <LookupSelect<LookupOption>
              label={t('marketing.combos.tabs.exceptions.fields.branch', 'Filial')}
              value={draft.id_filial}
              onChange={(value) => setDraft((current) => ({ ...current, id_filial: value }))}
              disabled={readOnly}
              loadOptions={(query, page, perPage) => loadCrudLookupOptions('filiais', query, page, perPage).then((options) => options.map((option) => ({ id: option.value, label: option.label })))}
            />
          </FormField>

          <FormField label={t('marketing.combos.tabs.exceptions.fields.square', 'Praça')}>
            <LookupSelect<LookupOption>
              label={t('marketing.combos.tabs.exceptions.fields.square', 'Praça')}
              value={draft.id_praca}
              onChange={(value) => setDraft((current) => ({ ...current, id_praca: value }))}
              disabled={readOnly}
              loadOptions={(query, page, perPage) => loadCrudLookupOptions('pracas', query, page, perPage).then((options) => options.map((option) => ({ id: option.value, label: option.label })))}
            />
          </FormField>

          <FormField label={t('marketing.combos.tabs.exceptions.fields.startDate', 'Data início')}>
            <DateInput
              value={draft.data_inicio}
              onChange={(event) => setDraft((current) => ({ ...current, data_inicio: event.target.value }))}
              disabled={readOnly}
            />
          </FormField>

          <FormField label={t('marketing.combos.tabs.exceptions.fields.endDate', 'Data fim')}>
            <DateInput
              value={draft.data_fim}
              onChange={(event) => setDraft((current) => ({ ...current, data_fim: event.target.value }))}
              disabled={readOnly}
            />
          </FormField>
        </div>
      </CrudModal>

      <ConfirmDialog
        open={confirmOpen}
        title={t('marketing.combos.tabs.exceptions.deleteTitle', 'Excluir exceções')}
        description={t('marketing.combos.tabs.exceptions.deleteDescription', 'As exceções selecionadas serão removidas.')}
        confirmLabel={t('common.delete', 'Excluir')}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </>
  )
}
