'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { BooleanChoice } from '@/src/components/ui/boolean-choice'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { CrudModal } from '@/src/components/ui/crud-modal'
import { FormField } from '@/src/components/ui/form-field'
import { LookupSelect, type LookupOption } from '@/src/components/ui/lookup-select'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { TooltipIconButton } from '@/src/components/ui/tooltip-icon-button'
import { loadCrudLookupOptions } from '@/src/components/crud-base/crud-client'
import type { CrudResource } from '@/src/components/crud-base/types'
import { ClienteRelationSection } from '@/src/features/clientes/components/cliente-relation-section'
import type { CupomDescontoUniversoRecord } from '@/src/features/cupons-desconto/services/cupons-desconto-client'
import { cuponsDescontoClient } from '@/src/features/cupons-desconto/services/cupons-desconto-client'
import { useI18n } from '@/src/i18n/use-i18n'
import { BRAZILIAN_STATES } from '@/src/lib/brazil'
import { cpfCnpjMask } from '@/src/lib/input-masks'

type UniversoType = 'canal_distribuicao' | 'cliente' | 'filial' | 'grupo' | 'rede' | 'segmento' | 'uf'

type UniversoDraft = {
  tipo: UniversoType
  restricao: boolean
  objeto: LookupOption | null
  cnpjCpf: string
  uf: string
}

const UNIVERSO_TYPES: Array<{ value: UniversoType; labelKey: string; fallback: string }> = [
  { value: 'canal_distribuicao', labelKey: 'marketing.coupons.tabs.usageConditions.types.channel', fallback: 'Canal de distribuição' },
  { value: 'cliente', labelKey: 'marketing.coupons.tabs.usageConditions.types.customer', fallback: 'Cliente' },
  { value: 'filial', labelKey: 'marketing.coupons.tabs.usageConditions.types.branch', fallback: 'Filial' },
  { value: 'grupo', labelKey: 'marketing.coupons.tabs.usageConditions.types.group', fallback: 'Grupo de clientes' },
  { value: 'rede', labelKey: 'marketing.coupons.tabs.usageConditions.types.network', fallback: 'Rede de clientes' },
  { value: 'segmento', labelKey: 'marketing.coupons.tabs.usageConditions.types.segment', fallback: 'Segmento de clientes' },
  { value: 'uf', labelKey: 'marketing.coupons.tabs.usageConditions.types.state', fallback: 'UF do cliente' },
]

function universoTypeLabel(type: UniversoType | string, t: ReturnType<typeof useI18n>['t']) {
  const match = UNIVERSO_TYPES.find((item) => item.value === type)
  return match ? t(match.labelKey, match.fallback) : type
}

function universoLookupResource(type: UniversoType): CrudResource | null {
  switch (type) {
    case 'canal_distribuicao':
      return 'canais_distribuicao'
    case 'cliente':
      return 'clientes'
    case 'filial':
      return 'filiais'
    case 'grupo':
      return 'grupos'
    case 'rede':
      return 'redes'
    case 'segmento':
      return 'segmentos'
    default:
      return null
  }
}

function universoValueLabel(item: CupomDescontoUniversoRecord) {
  switch (item.tipo) {
    case 'canal_distribuicao':
      return item.canal_distribuicao?.nome || '-'
    case 'cliente':
      return item.cliente?.nome_fantasia || item.cliente?.razao_social || item.cnpj_cpf || '-'
    case 'filial':
      return item.filial?.nome_fantasia || item.filial?.nome || '-'
    case 'grupo':
      return item.grupo?.nome || '-'
    case 'rede':
      return item.rede?.nome || '-'
    case 'segmento':
      return item.segmento?.nome || '-'
    case 'uf':
      return item.uf || '-'
    default:
      return '-'
  }
}

function universoLookupValue(item: CupomDescontoUniversoRecord): LookupOption | null {
  switch (item.tipo) {
    case 'canal_distribuicao':
      return item.canal_distribuicao?.id ? { id: item.canal_distribuicao.id, label: item.canal_distribuicao.nome || item.canal_distribuicao.id } : null
    case 'cliente':
      return item.cliente?.id ? { id: item.cliente.id, label: item.cliente.nome_fantasia || item.cliente.razao_social || item.cnpj_cpf || item.cliente.id } : null
    case 'filial':
      return item.filial?.id ? { id: item.filial.id, label: item.filial.nome_fantasia || item.filial.nome || item.filial.id } : null
    case 'grupo':
      return item.grupo?.id ? { id: item.grupo.id, label: item.grupo.nome || item.grupo.id } : null
    case 'rede':
      return item.rede?.id ? { id: item.rede.id, label: item.rede.nome || item.rede.id } : null
    case 'segmento':
      return item.segmento?.id ? { id: item.segmento.id, label: item.segmento.nome || item.segmento.id } : null
    default:
      return null
  }
}

function RestrictionBadge({ value, yesLabel, noLabel }: { value: boolean | number | string; yesLabel: string; noLabel: string }) {
  const checked = value === true || value === 1 || value === '1'
  return <StatusBadge tone={checked ? 'warning' : 'success'}>{checked ? yesLabel : noLabel}</StatusBadge>
}

export function CupomDescontoUniversosTab({
  cupomId,
  readOnly,
  onError,
}: {
  cupomId: string
  readOnly: boolean
  onError: (message: string | null) => void
}) {
  const { t } = useI18n()
  const [items, setItems] = useState<CupomDescontoUniversoRecord[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [modalFeedback, setModalFeedback] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<CupomDescontoUniversoRecord | null>(null)
  const [draft, setDraft] = useState<UniversoDraft>({
    tipo: 'canal_distribuicao',
    restricao: false,
    objeto: null,
    cnpjCpf: '',
    uf: '',
  })

  const lookupResource = useMemo(() => universoLookupResource(draft.tipo), [draft.tipo])

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      setItems(await cuponsDescontoClient.listUniversos(cupomId))
      onError(null)
    } catch (error) {
      onError(error instanceof Error ? error.message : t('marketing.coupons.tabs.usageConditions.loadError', 'Não foi possível carregar as condições de uso.'))
    } finally {
      setIsLoading(false)
    }
  }, [cupomId, onError, t])

  useEffect(() => {
    void refresh()
  }, [refresh])

  function resetDraft() {
    setEditingItem(null)
    setModalFeedback(null)
    setDraft({
      tipo: 'canal_distribuicao',
      restricao: false,
      objeto: null,
      cnpjCpf: '',
      uf: '',
    })
  }

  function closeModal() {
    setModalOpen(false)
    resetDraft()
  }

  function openEditModal(item: CupomDescontoUniversoRecord) {
    setEditingItem(item)
    setModalFeedback(null)
    setDraft({
      tipo: item.tipo as UniversoType,
      restricao: item.restricao === true || item.restricao === 1 || item.restricao === '1',
      objeto: universoLookupValue(item),
      cnpjCpf: item.cnpj_cpf || '',
      uf: item.uf || '',
    })
    setModalOpen(true)
  }

  async function handleSave() {
    const payload: Record<string, unknown> = {
      id_cupom_desconto: cupomId,
      tipo: draft.tipo,
      restricao: draft.restricao,
    }

    if (draft.tipo === 'uf') {
      if (!draft.uf) {
        setModalFeedback(t('marketing.coupons.tabs.usageConditions.validation.selectState', 'Selecione uma UF.'))
        return
      }

      payload.uf = draft.uf
    } else if (draft.tipo === 'cliente') {
      const digits = draft.cnpjCpf.replace(/\D/g, '')
      if (!digits) {
        setModalFeedback(t('marketing.coupons.tabs.usageConditions.validation.selectValue', 'Selecione um valor para a regra.'))
        return
      }
      payload.cnpj_cpf = digits
    } else {
      if (!draft.objeto) {
        setModalFeedback(t('marketing.coupons.tabs.usageConditions.validation.selectValue', 'Selecione um valor para a regra.'))
        return
      }

      if (draft.tipo === 'canal_distribuicao') payload.id_canal_distribuicao = draft.objeto.id
      if (draft.tipo === 'filial') payload.id_filial = draft.objeto.id
      if (draft.tipo === 'grupo') payload.id_grupo = draft.objeto.id
      if (draft.tipo === 'rede') payload.id_rede = draft.objeto.id
      if (draft.tipo === 'segmento') payload.id_segmento = draft.objeto.id
    }

    try {
      if (editingItem) {
        await cuponsDescontoClient.deleteUniversos(cupomId, [editingItem.id])
      }

      await cuponsDescontoClient.createUniverso(cupomId, payload)
      await refresh()
      closeModal()
    } catch (error) {
      setModalFeedback(error instanceof Error ? error.message : t('marketing.coupons.tabs.usageConditions.saveError', 'Não foi possível salvar a condição de uso.'))
    }
  }

  async function handleDelete() {
    try {
      await cuponsDescontoClient.deleteUniversos(cupomId, selectedIds)
      setSelectedIds([])
      setConfirmOpen(false)
      await refresh()
    } catch (error) {
      onError(error instanceof Error ? error.message : t('marketing.coupons.tabs.usageConditions.deleteError', 'Não foi possível excluir as condições de uso.'))
    }
  }

  return (
    <>
      <ClienteRelationSection<CupomDescontoUniversoRecord>
        title={t('marketing.coupons.tabs.usageConditions.title', 'Condições de uso')}
        readOnly={readOnly}
        hasSelection={selectedIds.length > 0}
        onDelete={() => setConfirmOpen(true)}
        onCreate={() => {
          resetDraft()
          setModalOpen(true)
        }}
        items={items}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        getRowId={(item) => item.id}
        emptyMessage={isLoading
          ? t('common.loading', 'Loading...')
          : t('marketing.coupons.tabs.usageConditions.empty', 'Nenhuma condição de uso foi cadastrada.')}
        columns={[
          { header: t('marketing.coupons.tabs.common.type', 'Tipo'), render: (item) => universoTypeLabel(item.tipo, t) },
          { header: t('marketing.coupons.tabs.common.rule', 'Regra'), cellClassName: 'font-semibold text-slate-950', render: (item) => universoValueLabel(item) },
          {
            header: t('marketing.coupons.tabs.common.restriction', 'Restrição'),
            headerClassName: 'w-[120px]',
            render: (item) => <RestrictionBadge value={item.restricao} yesLabel={t('common.yes', 'Sim')} noLabel={t('common.no', 'Não')} />,
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
          ? t('marketing.coupons.tabs.usageConditions.editTitle', 'Editar condição de uso')
          : t('marketing.coupons.tabs.usageConditions.createTitle', 'Nova condição de uso')}
        onClose={closeModal}
        onConfirm={() => void handleSave()}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {modalFeedback ? <div className="md:col-span-2 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{modalFeedback}</div> : null}

          <FormField label={t('marketing.coupons.tabs.common.type', 'Tipo')}>
            <select
              value={draft.tipo}
              onChange={(event) => setDraft((current) => ({ ...current, tipo: event.target.value as UniversoType, objeto: null, cnpjCpf: '', uf: '' }))}
              className="h-[46px] w-full rounded-[1rem] border border-[#e6dfd3] bg-white px-3.5 text-sm text-slate-900"
              disabled={readOnly}
            >
              {UNIVERSO_TYPES.map((item) => <option key={item.value} value={item.value}>{universoTypeLabel(item.value, t)}</option>)}
            </select>
          </FormField>

          <FormField label={t('marketing.coupons.tabs.common.restriction', 'Restrição')}>
            <BooleanChoice
              value={draft.restricao}
              onChange={(value) => setDraft((current) => ({ ...current, restricao: value }))}
              disabled={readOnly}
              trueLabel={t('common.yes', 'Sim')}
              falseLabel={t('common.no', 'Não')}
            />
          </FormField>

          {draft.tipo === 'uf' ? (
            <FormField label={t('marketing.coupons.tabs.usageConditions.state', 'UF')} className="md:col-span-2">
              <select
                value={draft.uf}
                onChange={(event) => setDraft((current) => ({ ...current, uf: event.target.value }))}
                className="h-[46px] w-full rounded-[1rem] border border-[#e6dfd3] bg-white px-3.5 text-sm text-slate-900"
                disabled={readOnly}
              >
                <option value="">{t('common.select', 'Selecione')}</option>
                {BRAZILIAN_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
              </select>
            </FormField>
          ) : draft.tipo === 'cliente' ? (
            <FormField label={t('marketing.coupons.tabs.common.rule', 'Regra')} className="md:col-span-2">
              <input
                value={draft.cnpjCpf}
                onChange={(event) => setDraft((current) => ({ ...current, cnpjCpf: cpfCnpjMask(event.target.value) }))}
                className="h-[46px] w-full rounded-[1rem] border border-[#e6dfd3] bg-white px-3.5 text-sm text-slate-900"
                disabled={readOnly}
                placeholder="000.000.000-00"
                inputMode="numeric"
              />
            </FormField>
          ) : lookupResource ? (
            <FormField label={t('marketing.coupons.tabs.common.rule', 'Regra')} className="md:col-span-2">
              <LookupSelect<LookupOption>
                key={lookupResource}
                label={t('marketing.coupons.tabs.common.rule', 'Regra')}
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
        title={t('marketing.coupons.tabs.usageConditions.deleteTitle', 'Excluir condições de uso')}
        description={t('marketing.coupons.tabs.usageConditions.deleteDescription', 'As condições de uso selecionadas serão removidas.')}
        confirmLabel={t('common.delete', 'Excluir')}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </>
  )
}
