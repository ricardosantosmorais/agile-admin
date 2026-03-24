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
import type { CupomDescontoOcorrenciaRecord } from '@/src/features/cupons-desconto/services/cupons-desconto-client'
import { cuponsDescontoClient } from '@/src/features/cupons-desconto/services/cupons-desconto-client'
import { useI18n } from '@/src/i18n/use-i18n'

type OcorrenciaType = 'canal_distribuicao' | 'colecao' | 'departamento' | 'fornecedor' | 'marca' | 'produto' | 'produto_pai'

type OcorrenciaDraft = {
  tipo: OcorrenciaType
  restricao: boolean
  objeto: LookupOption | null
}

const OCORRENCIA_TYPES: Array<{ value: OcorrenciaType; labelKey: string; fallback: string }> = [
  { value: 'canal_distribuicao', labelKey: 'marketing.coupons.tabs.application.types.channel', fallback: 'Canal de distribuição' },
  { value: 'colecao', labelKey: 'marketing.coupons.tabs.application.types.collection', fallback: 'Coleção' },
  { value: 'departamento', labelKey: 'marketing.coupons.tabs.application.types.department', fallback: 'Departamento' },
  { value: 'fornecedor', labelKey: 'marketing.coupons.tabs.application.types.supplier', fallback: 'Fornecedor' },
  { value: 'marca', labelKey: 'marketing.coupons.tabs.application.types.brand', fallback: 'Marca' },
  { value: 'produto', labelKey: 'marketing.coupons.tabs.application.types.product', fallback: 'Produto' },
  { value: 'produto_pai', labelKey: 'marketing.coupons.tabs.application.types.parentProduct', fallback: 'Produto pai' },
]

function ocorrenciaTypeLabel(type: string, t: ReturnType<typeof useI18n>['t']) {
  const match = OCORRENCIA_TYPES.find((item) => item.value === type)
  return match ? t(match.labelKey, match.fallback) : type
}

function ocorrenciaLookupResource(type: OcorrenciaType): CrudResource {
  switch (type) {
    case 'canal_distribuicao':
      return 'canais_distribuicao'
    case 'colecao':
      return 'colecoes'
    case 'departamento':
      return 'departamentos'
    case 'fornecedor':
      return 'fornecedores'
    case 'marca':
      return 'marcas'
    case 'produto':
    case 'produto_pai':
      return 'produtos'
  }
}

function ocorrenciaLookupValue(item: CupomDescontoOcorrenciaRecord): LookupOption | null {
  switch (item.tipo) {
    case 'canal_distribuicao':
      return item.canal_distribuicao?.id ? { id: item.canal_distribuicao.id, label: item.canal_distribuicao.nome || item.canal_distribuicao.id } : null
    case 'colecao':
      return item.colecao?.id ? { id: item.colecao.id, label: item.colecao.nome || item.colecao.id } : null
    case 'departamento':
      return item.departamento?.id ? { id: item.departamento.id, label: item.departamento.nome || item.departamento.id } : null
    case 'fornecedor':
      return item.fornecedor?.id ? { id: item.fornecedor.id, label: item.fornecedor.nome_fantasia || item.fornecedor.nome || item.fornecedor.id } : null
    case 'marca':
      return item.marca?.id ? { id: item.marca.id, label: item.marca.nome || item.marca.id } : null
    case 'produto':
      return item.produto?.id ? { id: item.produto.id, label: item.produto.nome || item.produto.id } : null
    case 'produto_pai':
      return item.produto_pai?.id ? { id: item.produto_pai.id, label: item.produto_pai.nome || item.produto_pai.id } : null
    default:
      return null
  }
}

function ocorrenciaValueLabel(item: CupomDescontoOcorrenciaRecord) {
  switch (item.tipo) {
    case 'canal_distribuicao':
      return item.canal_distribuicao?.nome || item.id_canal_distribuicao || '-'
    case 'colecao':
      return item.colecao?.nome || item.id_colecao || '-'
    case 'departamento':
      return item.departamento?.nome || item.id_departamento || '-'
    case 'fornecedor':
      return item.fornecedor?.nome_fantasia || item.fornecedor?.nome || item.id_fornecedor || '-'
    case 'marca':
      return item.marca?.nome || item.id_marca || '-'
    case 'produto':
      return item.produto?.nome || item.id_produto || '-'
    case 'produto_pai':
      return item.produto_pai?.nome || item.id_produto_pai || '-'
    default:
      return '-'
  }
}

function RestrictionBadge({ value, yesLabel, noLabel }: { value: boolean | number | string; yesLabel: string; noLabel: string }) {
  const checked = value === true || value === 1 || value === '1'
  return <StatusBadge tone={checked ? 'warning' : 'success'}>{checked ? yesLabel : noLabel}</StatusBadge>
}

export function CupomDescontoOcorrenciasTab({
  cupomId,
  readOnly,
  onError,
}: {
  cupomId: string
  readOnly: boolean
  onError: (message: string | null) => void
}) {
  const { t } = useI18n()
  const [items, setItems] = useState<CupomDescontoOcorrenciaRecord[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [modalFeedback, setModalFeedback] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<CupomDescontoOcorrenciaRecord | null>(null)
  const [draft, setDraft] = useState<OcorrenciaDraft>({
    tipo: 'canal_distribuicao',
    restricao: false,
    objeto: null,
  })

  const lookupResource = useMemo(() => ocorrenciaLookupResource(draft.tipo), [draft.tipo])

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      setItems(await cuponsDescontoClient.listOcorrencias(cupomId))
      onError(null)
    } catch (error) {
      onError(error instanceof Error ? error.message : t('marketing.coupons.tabs.application.loadError', 'Não foi possível carregar as regras de aplicação.'))
    } finally {
      setIsLoading(false)
    }
  }, [cupomId, onError, t])

  useEffect(() => {
    void refresh()
  }, [refresh])

  function closeModal() {
    setModalOpen(false)
    setEditingItem(null)
    setModalFeedback(null)
    setDraft({ tipo: 'canal_distribuicao', restricao: false, objeto: null })
  }

  function openEditModal(item: CupomDescontoOcorrenciaRecord) {
    setEditingItem(item)
    setModalFeedback(null)
    setDraft({
      tipo: item.tipo as OcorrenciaType,
      restricao: item.restricao === true || item.restricao === 1 || item.restricao === '1',
      objeto: ocorrenciaLookupValue(item),
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!draft.objeto) {
      setModalFeedback(t('marketing.coupons.tabs.application.validation.selectValue', 'Selecione um valor para a regra.'))
      return
    }

    const payload: Record<string, unknown> = {
      id_cupom_desconto: cupomId,
      tipo: draft.tipo,
      restricao: draft.restricao,
    }

    if (draft.tipo === 'canal_distribuicao') payload.id_canal_distribuicao = draft.objeto.id
    if (draft.tipo === 'colecao') payload.id_colecao = draft.objeto.id
    if (draft.tipo === 'departamento') payload.id_departamento = draft.objeto.id
    if (draft.tipo === 'fornecedor') payload.id_fornecedor = draft.objeto.id
    if (draft.tipo === 'marca') payload.id_marca = draft.objeto.id
    if (draft.tipo === 'produto') payload.id_produto = draft.objeto.id
    if (draft.tipo === 'produto_pai') payload.id_produto_pai = draft.objeto.id

    try {
      if (editingItem) {
        await cuponsDescontoClient.deleteOcorrencias(cupomId, [editingItem.id])
      }

      await cuponsDescontoClient.createOcorrencia(cupomId, payload)
      await refresh()
      closeModal()
    } catch (error) {
      setModalFeedback(error instanceof Error ? error.message : t('marketing.coupons.tabs.application.saveError', 'Não foi possível salvar a regra de aplicação.'))
    }
  }

  async function handleDelete() {
    try {
      await cuponsDescontoClient.deleteOcorrencias(cupomId, selectedIds)
      setSelectedIds([])
      setConfirmOpen(false)
      await refresh()
    } catch (error) {
      onError(error instanceof Error ? error.message : t('marketing.coupons.tabs.application.deleteError', 'Não foi possível excluir as regras de aplicação.'))
    }
  }

  return (
    <>
      <ClienteRelationSection<CupomDescontoOcorrenciaRecord>
        title={t('marketing.coupons.tabs.application.title', 'Aplicação do cupom')}
        readOnly={readOnly}
        hasSelection={selectedIds.length > 0}
        onDelete={() => setConfirmOpen(true)}
        onCreate={() => {
          setEditingItem(null)
          setModalFeedback(null)
          setDraft({ tipo: 'canal_distribuicao', restricao: false, objeto: null })
          setModalOpen(true)
        }}
        items={items}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        getRowId={(item) => item.id}
        emptyMessage={isLoading
          ? t('common.loading', 'Loading...')
          : t('marketing.coupons.tabs.application.empty', 'Nenhuma regra de aplicação foi cadastrada.')}
        columns={[
          { header: t('marketing.coupons.tabs.common.type', 'Tipo'), render: (item) => ocorrenciaTypeLabel(item.tipo, t) },
          { header: t('marketing.coupons.tabs.common.rule', 'Regra'), cellClassName: 'font-semibold text-slate-950', render: (item) => ocorrenciaValueLabel(item) },
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
          ? t('marketing.coupons.tabs.application.editTitle', 'Editar regra de aplicação')
          : t('marketing.coupons.tabs.application.createTitle', 'Nova regra de aplicação')}
        onClose={closeModal}
        onConfirm={() => void handleSave()}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {modalFeedback ? <div className="md:col-span-2 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{modalFeedback}</div> : null}

          <FormField label={t('marketing.coupons.tabs.common.type', 'Tipo')}>
            <select
              value={draft.tipo}
              onChange={(event) => setDraft((current) => ({ ...current, tipo: event.target.value as OcorrenciaType, objeto: null }))}
              className="h-[46px] w-full rounded-[1rem] border border-[#e6dfd3] bg-white px-3.5 text-sm text-slate-900"
              disabled={readOnly}
            >
              {OCORRENCIA_TYPES.map((item) => <option key={item.value} value={item.value}>{ocorrenciaTypeLabel(item.value, t)}</option>)}
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
        </div>
      </CrudModal>

      <ConfirmDialog
        open={confirmOpen}
        title={t('marketing.coupons.tabs.application.deleteTitle', 'Excluir regras de aplicação')}
        description={t('marketing.coupons.tabs.application.deleteDescription', 'As regras de aplicação selecionadas serão removidas.')}
        confirmLabel={t('common.delete', 'Excluir')}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </>
  )
}
