'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { BooleanChoice } from '@/src/components/ui/boolean-choice'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { CrudModal } from '@/src/components/ui/crud-modal'
import { FormField } from '@/src/components/ui/form-field'
import { inputClasses } from '@/src/components/ui/input-styles'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { TooltipIconButton } from '@/src/components/ui/tooltip-icon-button'
import { ClienteRelationSection } from '@/src/features/clientes/components/cliente-relation-section'
import { CatalogLookupSelect } from '@/src/features/catalog/components/catalog-lookup-select'
import type { CatalogLookupOption, CatalogUniverseRecord, CatalogUniverseType } from '@/src/features/catalog/types/catalog-relations'
import { useI18n } from '@/src/i18n/use-i18n'
import { BRAZILIAN_STATES } from '@/src/lib/brazil'

const UNIVERSE_TYPES: Array<{ value: CatalogUniverseType; label: string }> = [
  { value: 'canal_distribuicao', label: 'Canal de distribuição' },
  { value: 'filial', label: 'Filial' },
  { value: 'grupo', label: 'Grupo de clientes' },
  { value: 'rede', label: 'Rede de clientes' },
  { value: 'segmento', label: 'Segmento de clientes' },
  { value: 'tabela_preco', label: 'Tabela de preço' },
  { value: 'uf', label: 'UF' },
]

type UniverseDraft = {
  tipo: CatalogUniverseType
  restricao: boolean
  objeto: CatalogLookupOption | null
  uf: string
}

type CatalogUniversosTabProps = {
  entityId: string
  entityType: 'marcas' | 'departamentos' | 'banners' | 'notificacoes'
  readOnly: boolean
  items: CatalogUniverseRecord[]
  onRefresh: () => Promise<void>
  onError: (message: string | null) => void
  createUniverse: (id: string, payload: Record<string, unknown>) => Promise<unknown>
  deleteUniverses: (id: string, ids: string[]) => Promise<unknown>
}

function universeTypeLabel(type: CatalogUniverseType, t: ReturnType<typeof useI18n>['t']) {
  const entry = UNIVERSE_TYPES.find((item) => item.value === type)
  return entry ? t(`catalog.universos.types.${type}`, entry.label) : type
}

function universeValueLabel(item: CatalogUniverseRecord) {
  switch (item.tipo) {
    case 'canal_distribuicao':
      return item.canal_distribuicao?.nome || '-'
    case 'filial':
      return item.filial?.nome_fantasia || item.filial?.nome || '-'
    case 'grupo':
      return item.grupo?.nome || '-'
    case 'rede':
      return item.rede?.nome || '-'
    case 'segmento':
      return item.segmento?.nome || '-'
    case 'tabela_preco':
      return item.tabela_preco?.nome || '-'
    case 'uf':
      return item.uf || '-'
    default:
      return '-'
  }
}

function universeLookupResource(type: CatalogUniverseType) {
  switch (type) {
    case 'canal_distribuicao':
      return 'canais_distribuicao'
    case 'filial':
      return 'filiais'
    case 'grupo':
      return 'grupos'
    case 'rede':
      return 'redes'
    case 'segmento':
      return 'segmentos'
    case 'tabela_preco':
      return 'tabelas_preco'
    default:
      return null
  }
}

function universeLookupOption(item: CatalogUniverseRecord): CatalogLookupOption | null {
  switch (item.tipo) {
    case 'canal_distribuicao':
      return item.canal_distribuicao?.id
        ? { id: item.canal_distribuicao.id, label: item.canal_distribuicao.nome || item.canal_distribuicao.id }
        : null
    case 'filial':
      return item.filial?.id
        ? { id: item.filial.id, label: item.filial.nome_fantasia || item.filial.nome || item.filial.id }
        : null
    case 'grupo':
      return item.grupo?.id ? { id: item.grupo.id, label: item.grupo.nome || item.grupo.id } : null
    case 'rede':
      return item.rede?.id ? { id: item.rede.id, label: item.rede.nome || item.rede.id } : null
    case 'segmento':
      return item.segmento?.id ? { id: item.segmento.id, label: item.segmento.nome || item.segmento.id } : null
    case 'tabela_preco':
      return item.tabela_preco?.id ? { id: item.tabela_preco.id, label: item.tabela_preco.nome || item.tabela_preco.id } : null
    default:
      return null
  }
}

export function CatalogUniversosTab({
  entityId,
  entityType,
  readOnly,
  items,
  onRefresh,
  onError,
  createUniverse,
  deleteUniverses,
}: CatalogUniversosTabProps) {
  const { t } = useI18n()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalFeedback, setModalFeedback] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [editingUniverseId, setEditingUniverseId] = useState<string | null>(null)
  const [draft, setDraft] = useState<UniverseDraft>({
    tipo: 'canal_distribuicao',
    restricao: false,
    objeto: null,
    uf: '',
  })

  const lookupResource = useMemo(() => universeLookupResource(draft.tipo), [draft.tipo])

  function resetDraft() {
    setEditingUniverseId(null)
    setModalFeedback(null)
    setDraft({
      tipo: 'canal_distribuicao',
      restricao: false,
      objeto: null,
      uf: '',
    })
  }

  function closeModal() {
    setModalOpen(false)
    resetDraft()
  }

  function openCreateModal() {
    resetDraft()
    setModalOpen(true)
  }

  function openEditModal(item: CatalogUniverseRecord) {
    setEditingUniverseId(item.id)
    setModalFeedback(null)
    setDraft({
      tipo: item.tipo,
      restricao: Boolean(item.restricao),
      objeto: universeLookupOption(item),
      uf: item.uf || '',
    })
    setModalOpen(true)
  }

  async function handleCreateOrUpdate() {
    const payload: Record<string, unknown> = {
      tipo: draft.tipo,
      restricao: draft.restricao,
    }

    if (draft.tipo === 'uf') {
      if (!draft.uf) {
        setModalFeedback(t('catalog.universos.selectUf', 'Selecione uma UF.'))
        return
      }
      payload.uf = draft.uf
    } else {
      if (!draft.objeto) {
        setModalFeedback(t('catalog.universos.selectValue', 'Selecione um valor para a regra.'))
        return
      }

      if (draft.tipo === 'canal_distribuicao') payload.id_canal_distribuicao = draft.objeto.id
      if (draft.tipo === 'filial') payload.id_filial = draft.objeto.id
      if (draft.tipo === 'grupo') payload.id_grupo = draft.objeto.id
      if (draft.tipo === 'rede') payload.id_rede = draft.objeto.id
      if (draft.tipo === 'segmento') payload.id_segmento = draft.objeto.id
      if (draft.tipo === 'tabela_preco') payload.id_tabela_preco = draft.objeto.id
    }

    try {
      if (editingUniverseId) {
        await deleteUniverses(entityId, [editingUniverseId])
      }

      await createUniverse(entityId, payload)
      await onRefresh()
      onError(null)
      closeModal()
    } catch (error) {
      setModalFeedback(error instanceof Error ? error.message : t('catalog.universos.saveError', 'Não foi possível salvar a regra de exibição.'))
    }
  }

  async function handleDelete() {
    try {
      await deleteUniverses(entityId, selectedIds)
      setSelectedIds([])
      setConfirmOpen(false)
      await onRefresh()
      onError(null)
    } catch (error) {
      onError(error instanceof Error ? error.message : t('catalog.universos.deleteError', 'Não foi possível excluir as regras selecionadas.'))
    }
  }

  return (
    <>
      <ClienteRelationSection<CatalogUniverseRecord>
        title={t(`catalog.${entityType}.display.title`, 'Regras de exibição')}
        readOnly={readOnly}
        hasSelection={selectedIds.length > 0}
        onDelete={() => setConfirmOpen(true)}
        onCreate={openCreateModal}
        items={items}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        getRowId={(item) => item.id}
        emptyMessage={t('catalog.universos.empty', 'Nenhuma regra de exibição foi configurada.')}
        columns={[
          { header: t('catalog.universos.type', 'Tipo'), render: (item) => universeTypeLabel(item.tipo, t) },
          { header: t('catalog.universos.value', 'Valor'), cellClassName: 'font-semibold text-slate-950', render: (item) => universeValueLabel(item) },
          {
            header: t('catalog.universos.restriction', 'Restrição'),
            headerClassName: 'w-[120px]',
            render: (item) => (
              <StatusBadge tone={item.restricao ? 'warning' : 'success'}>
                {item.restricao ? t('common.yes', 'Sim') : t('common.no', 'Não')}
              </StatusBadge>
            ),
          },
          {
            header: t('common.actions', 'Ações'),
            headerClassName: 'w-[104px]',
            cellClassName: 'whitespace-nowrap',
            render: (item) => !readOnly ? (
              <div className="flex items-center gap-2">
                <TooltipIconButton label={t('simpleCrud.actions.edit', 'Editar')}>
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    className="app-button-secondary inline-flex h-9 w-9 items-center justify-center rounded-full p-0"
                  >
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
                    className="app-button-danger inline-flex h-9 w-9 items-center justify-center rounded-full p-0"
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
        title={editingUniverseId ? t('simpleCrud.actions.edit', 'Editar') : t(`catalog.${entityType}.display.add`, 'Adicionar regra de exibição')}
        onClose={closeModal}
        onConfirm={() => void handleCreateOrUpdate()}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {modalFeedback ? (
            <div className="md:col-span-2 rounded-[1rem] border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{modalFeedback}</div>
          ) : null}

          <FormField label={t('catalog.universos.type', 'Tipo')}>
            <select
              value={draft.tipo}
              onChange={(event) => setDraft((current) => ({ ...current, tipo: event.target.value as CatalogUniverseType, objeto: null, uf: '' }))}
              className={inputClasses()}
              disabled={readOnly}
            >
              {UNIVERSE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{universeTypeLabel(type.value, t)}</option>
              ))}
            </select>
          </FormField>

          <FormField label={t('catalog.universos.restriction', 'Restrição')}>
            <BooleanChoice
              value={draft.restricao}
              onChange={(value) => setDraft((current) => ({ ...current, restricao: value }))}
              disabled={readOnly}
              trueLabel={t('catalog.universos.restrict', 'Restringir')}
              falseLabel={t('catalog.universos.allow', 'Permitir')}
            />
          </FormField>

          {draft.tipo === 'uf' ? (
            <FormField label={t('catalog.universos.uf', 'UF')} className="md:col-span-2">
              <select
                value={draft.uf}
                onChange={(event) => setDraft((current) => ({ ...current, uf: event.target.value }))}
                className={inputClasses()}
                disabled={readOnly}
              >
                <option value="">{t('common.select', 'Selecione')}</option>
                {BRAZILIAN_STATES.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </FormField>
          ) : lookupResource ? (
            <FormField label={t('catalog.universos.value', 'Valor')} className="md:col-span-2">
              <CatalogLookupSelect
                key={lookupResource}
                resource={lookupResource}
                label={t('catalog.universos.value', 'Valor')}
                value={draft.objeto}
                onChange={(value) => setDraft((current) => ({ ...current, objeto: value }))}
                disabled={readOnly}
              />
            </FormField>
          ) : null}
        </div>
      </CrudModal>

      <ConfirmDialog
        open={confirmOpen}
        title={t('catalog.universos.deleteTitle', 'Excluir regras de exibição')}
        description={t('catalog.universos.deleteDescription', 'As regras de exibição selecionadas serão removidas.')}
        confirmLabel={t('common.delete', 'Excluir')}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </>
  )
}
