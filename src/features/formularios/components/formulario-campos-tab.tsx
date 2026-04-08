'use client'

import { ArrowDown, ArrowUp, FileSearch, Lock, Pencil, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { CrudFormSections } from '@/src/components/crud-base/crud-form-sections'
import type { CrudListFilters, CrudListRecord, CrudModuleConfig, CrudOption, CrudRecord } from '@/src/components/crud-base/types'
import { AppDataTable } from '@/src/components/data-table/app-data-table'
import type { AppDataTableColumn } from '@/src/components/data-table/types'
import { DataTablePageActions } from '@/src/components/data-table/data-table-toolbar'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { CrudModal } from '@/src/components/ui/crud-modal'
import { PageToast } from '@/src/components/ui/page-toast'
import { SectionCard } from '@/src/components/ui/section-card'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { inputClasses } from '@/src/components/ui/input-styles'
import { useFormState } from '@/src/hooks/use-form-state'
import { useI18n } from '@/src/i18n/use-i18n'
import { formulariosCamposClient } from '@/src/features/formularios/services/formularios-campos-client'
import { FORMULARIOS_CAMPOS_CONFIG } from '@/src/features/formularios/services/formularios-campos-config'
import {
  parseFormularioCampoSelectorOptions,
  stringifyFormularioCampoSelectorOptions,
  type FormularioCampoSelectorOption,
} from '@/src/features/formularios/services/formularios-campos-options'

function toBoolean(value: unknown) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === '1' || normalized === 'true' || normalized === 'sim'
  }
  return false
}

type FormularioCampoModalMode = 'field' | 'session'

function isProtectedField(record: CrudRecord | CrudListRecord) {
  return toBoolean(record.protegido)
}

function buildInitialRecord(
  config: CrudModuleConfig,
  formularioId: string,
  mode: FormularioCampoModalMode,
): CrudRecord {
  const record: CrudRecord = { ativo: true, id_formulario: formularioId }

  for (const section of config.sections) {
    for (const field of section.fields) {
      if (field.defaultValue !== undefined) {
        record[field.key] = field.defaultValue
        continue
      }

      record[field.key] = field.type === 'toggle' ? field.key === 'ativo' : ''
    }
  }

  record.id_formulario = formularioId

  if (mode === 'session') {
    record.tipo = 'sessao'
    record.obrigatorio = false
    record.quebra_linha = false
    record.tipo_seletor = null
    record.json_seletor = null
  }

  return record
}

function buildFilters(formularioId: string): CrudListFilters {
  return {
    page: 1,
    perPage: 200,
    orderBy: 'posicao',
    sort: 'asc',
    id_formulario: formularioId,
  }
}

function normalizePosition(value: unknown) {
  const numeric = Number(String(value ?? '').trim())
  if (!Number.isFinite(numeric) || numeric < 1) {
    return Number.MAX_SAFE_INTEGER
  }

  return numeric
}

function sortRowsByPosition(rows: CrudListRecord[]) {
  return [...rows].sort((a, b) => normalizePosition(a.posicao) - normalizePosition(b.posicao))
}

function resequenceRows(rows: CrudListRecord[]) {
  return rows.map((row, index) => ({
    ...row,
    posicao: index + 1,
  }))
}

function moveRow(rows: CrudListRecord[], id: string, direction: 'up' | 'down') {
  const sorted = sortRowsByPosition(rows)
  const currentIndex = sorted.findIndex((row) => row.id === id)

  if (currentIndex < 0) {
    return sorted
  }

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
  if (targetIndex < 0 || targetIndex >= sorted.length) {
    return sorted
  }

  const next = [...sorted]
  const [item] = next.splice(currentIndex, 1)
  next.splice(targetIndex, 0, item)
  return resequenceRows(next)
}

export function FormularioCamposTab({
  formularioId,
  readOnly,
  onError,
}: {
  formularioId: string
  readOnly: boolean
  onError: (message: string | null) => void
}) {
  const { t } = useI18n()
  const [rows, setRows] = useState<CrudListRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [optionsMap, setOptionsMap] = useState<Record<string, CrudOption[]>>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [modalMode, setModalMode] = useState<FormularioCampoModalMode>('field')
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [confirmDeleteIds, setConfirmDeleteIds] = useState<string[] | null>(null)
  const [selectorOptions, setSelectorOptions] = useState<FormularioCampoSelectorOption[]>([])

  const availableValidationFields = useMemo(
    () => rows
      .filter((row) => row.id !== editingId && String(row.tipo || '') !== 'sessao')
      .map((row) => ({
        value: String(row.nome || ''),
        label: String(row.titulo || row.nome || '-'),
      }))
      .filter((option) => option.value),
    [editingId, rows],
  )

  const availableLinkedFields = useMemo(
    () => rows
      .filter((row) => row.id !== editingId && String(row.tipo || '') === 'checar')
      .map((row) => ({
        value: String(row.nome || ''),
        label: String(row.titulo || row.nome || '-'),
      }))
      .filter((option) => option.value),
    [editingId, rows],
  )

  const formConfig = useMemo<CrudModuleConfig>(() => {
    const sessionFieldKeys = new Set(['ativo', 'codigo', 'nome', 'titulo', 'posicao'])

    return {
      ...FORMULARIOS_CAMPOS_CONFIG,
      routeBase: '/formularios',
      sections: FORMULARIOS_CAMPOS_CONFIG.sections.map((section) => ({
        ...section,
        fields: section.fields.map((field) => {
          if (field.key === 'id_formulario') {
            return {
              ...field,
              hidden: () => true,
            }
          }

          if (modalMode === 'session' && !sessionFieldKeys.has(field.key)) {
            return {
              ...field,
              hidden: () => true,
            }
          }

          if (field.key === 'json_seletor') {
            return {
              ...field,
              hidden: () => true,
            }
          }

          if (field.key === 'campo_igual') {
            return {
              ...field,
              type: 'select',
              options: availableValidationFields.map((option) => ({ value: option.value, label: option.label })),
              hidden: () => availableValidationFields.length === 0,
            }
          }

          if (field.key === 'campo_vinculado') {
            return {
              ...field,
              type: 'select',
              options: availableLinkedFields.map((option) => ({ value: option.value, label: option.label })),
              hidden: () => availableLinkedFields.length === 0,
            }
          }

          return field
        }),
      })),
    }
  }, [availableLinkedFields, availableValidationFields, modalMode])

  const { state: form, setState: setForm, patch } = useFormState<CrudRecord>(buildInitialRecord(formConfig, formularioId, modalMode))

  const isSelectorCustomMode = modalMode === 'field' && String(form.tipo || '') === 'seletor' && String(form.tipo_seletor || '') === 'personalizado'

  const refreshList = useCallback(async () => {
    setIsLoading(true)

    try {
      const response = await formulariosCamposClient.list(buildFilters(formularioId))
      setRows(sortRowsByPosition(response.data))
      onError(null)
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : t('maintenance.forms.fieldsTab.loadError', 'Não foi possível carregar os campos do formulário.')
      onError(message)
    } finally {
      setIsLoading(false)
    }
  }, [formularioId, onError, t])

  useEffect(() => {
    void refreshList()
  }, [refreshList])

  useEffect(() => {
    let alive = true

    async function loadOptions() {
      const optionFields = formConfig.sections
        .flatMap((section) => section.fields)
        .filter((field) => {
          if (field.type !== 'select' || !field.optionsResource) {
            return false
          }

          if (field.key === 'id_formulario') {
            return false
          }

          const hidden = field.hidden?.({ form, isEditing: Boolean(editingId) }) ?? false
          return !hidden
        })

      if (!optionFields.length) {
        return
      }

      try {
        const entries = await Promise.all(
          optionFields.map(async (field) => [field.key, await formulariosCamposClient.listOptions(field.optionsResource!)] as const),
        )

        if (alive) {
          setOptionsMap(Object.fromEntries(entries))
        }
      } catch {
        if (alive) {
          setOptionsMap({})
        }
      }
    }

    void loadOptions()

    return () => {
      alive = false
    }
  }, [editingId, form, formConfig.sections])

  function closeModal() {
    setModalOpen(false)
    setEditingId(null)
    setFeedback(null)
    setIsSaving(false)
    setSelectorOptions([])
    setForm(buildInitialRecord(formConfig, formularioId, modalMode))
  }

  function openCreateModal(mode: FormularioCampoModalMode) {
    setModalMode(mode)
    setEditingId(null)
    setFeedback(null)
    setSelectorOptions([])
    setForm(buildInitialRecord(formConfig, formularioId, mode))
    setModalOpen(true)
  }

  async function openEditModal(id: string) {
    try {
      const loaded = await formulariosCamposClient.getById(id)
      const normalized = formConfig.normalizeRecord ? formConfig.normalizeRecord(loaded) : loaded
      const nextMode: FormularioCampoModalMode = String(normalized.tipo || '') === 'sessao' ? 'session' : 'field'

      setModalMode(nextMode)
      setEditingId(id)
      setFeedback(null)
      setSelectorOptions(parseFormularioCampoSelectorOptions(
        typeof normalized.json_seletor === 'string' ? normalized.json_seletor : null,
      ))
      setForm({ ...normalized, id_formulario: formularioId })
      setModalOpen(true)
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : t('maintenance.forms.fieldsTab.loadError', 'Não foi possível carregar os campos do formulário.'))
    }
  }

  async function moveField(id: string, direction: 'up' | 'down') {
    const reordered = moveRow(rows, id, direction)
    if (reordered.map((row) => row.id).join(',') === rows.map((row) => row.id).join(',')) {
      return
    }

    try {
      await formulariosCamposClient.updatePositions(
        reordered.map((row, index) => ({
          id: row.id,
          posicao: index + 1,
        })),
      )
      setRows(reordered)
      onError(null)
    } catch (error) {
      onError(error instanceof Error ? error.message : t('maintenance.forms.fieldsTab.reorderError', 'Não foi possível atualizar a posição dos campos.'))
    }
  }

  async function handleSave() {
    for (const section of formConfig.sections) {
      for (const field of section.fields) {
        if (field.hidden?.({ form, isEditing: Boolean(editingId) })) {
          continue
        }

        const disabled = typeof field.disabled === 'function'
          ? field.disabled({ form, isEditing: Boolean(editingId) })
          : Boolean(field.disabled)

        const value = form[field.key]
        if (!disabled && field.required && (value === '' || value === null || value === undefined)) {
          setFeedback(t('simpleCrud.requiredField', '{{field}} is required.', { field: t(field.labelKey, field.label) }))
          return
        }
      }
    }

    if (modalMode === 'field' && String(form.tipo || '') === 'seletor' && !String(form.tipo_seletor || '').trim()) {
      setFeedback(t('simpleCrud.requiredField', '{{field}} is required.', { field: t('maintenance.formFields.fields.selectorSource', 'Fonte de dados') }))
      return
    }

    setIsSaving(true)

    try {
      const payloadBase = {
        ...form,
        id_formulario: formularioId,
        tipo: modalMode === 'session' ? 'sessao' : form.tipo,
        json_seletor: isSelectorCustomMode
          ? stringifyFormularioCampoSelectorOptions(selectorOptions)
          : null,
      }

      const payload = formConfig.beforeSave
        ? formConfig.beforeSave(payloadBase)
        : payloadBase

      await formulariosCamposClient.save(payload)
      await refreshList()
      closeModal()
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : t('maintenance.forms.fieldsTab.saveError', 'Não foi possível salvar o campo.'))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(ids: string[]) {
    const allowedIds = ids.filter((id) => {
      const row = rows.find((item) => item.id === id)
      return row ? !isProtectedField(row) : true
    })

    if (!allowedIds.length) {
      setConfirmDeleteIds(null)
      return
    }

    try {
      await formulariosCamposClient.delete(allowedIds)
      setSelectedIds((current) => current.filter((id) => !allowedIds.includes(id)))
      setConfirmDeleteIds(null)
      await refreshList()
    } catch (error) {
      onError(error instanceof Error ? error.message : t('maintenance.forms.fieldsTab.deleteError', 'Não foi possível excluir os campos selecionados.'))
    }
  }

  const columns = useMemo<AppDataTableColumn<CrudListRecord>[]>(() => [
    {
      id: 'nome',
      label: t('maintenance.formFields.fields.name', 'Nome'),
      cell: (item) => (
        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-950">
          {isProtectedField(item) ? <Lock className="h-3.5 w-3.5 text-slate-500" /> : null}
          {String(item.nome || '-')}
        </span>
      ),
    },
    {
      id: 'titulo',
      label: t('maintenance.formFields.fields.title', 'Título'),
      cell: (item) => String(item.titulo || '-'),
    },
    {
      id: 'tipo',
      label: t('maintenance.formFields.fields.type', 'Tipo'),
      cell: (item) => String(item.tipo || '-'),
      thClassName: 'w-[170px]',
    },
    {
      id: 'posicao',
      label: t('maintenance.formFields.fields.position', 'Posição'),
      cell: (item) => String(item.posicao || '-'),
      thClassName: 'w-[120px]',
    },
    {
      id: 'ativo',
      label: t('simpleCrud.fields.active', 'Ativo'),
      cell: (item) => {
        const active = toBoolean(item.ativo)
        return (
          <StatusBadge tone={active ? 'success' : 'warning'}>
            {active ? t('common.yes', 'Sim') : t('common.no', 'Não')}
          </StatusBadge>
        )
      },
      thClassName: 'w-[110px]',
    },
  ], [t])

  const selectableIds = useMemo(
    () => rows.filter((row) => !isProtectedField(row)).map((row) => row.id),
    [rows],
  )

  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.includes(id))

  return (
    <>
      <SectionCard
        title={t('maintenance.forms.tabs.fields', 'Campos')}
        className="min-w-0 overflow-hidden"
        action={!readOnly ? (
          <DataTablePageActions
            actions={[
              selectedIds.length > 0
                ? {
                    label: t('simpleCrud.deleteSelected', 'Excluir ({{count}})', { count: selectedIds.length }),
                    icon: Trash2,
                    onClick: () => setConfirmDeleteIds(selectedIds),
                    tone: 'danger',
                  }
                : null,
              {
                label: t('maintenance.forms.fieldsTab.newSession', 'Nova sessão'),
                icon: Plus,
                onClick: () => openCreateModal('session'),
                tone: 'secondary',
              },
              {
                label: t('maintenance.forms.fieldsTab.newField', 'Novo campo'),
                icon: Plus,
                onClick: () => openCreateModal('field'),
                tone: 'primary',
              },
            ]}
          />
        ) : null}
      >
        <PageToast message={feedback} onClose={() => setFeedback(null)} />

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-14 animate-pulse rounded-[1rem] bg-[#f2eee5]" />
            <div className="h-14 animate-pulse rounded-[1rem] bg-[#f7f3eb]" />
            <div className="h-14 animate-pulse rounded-[1rem] bg-[#f2eee5]" />
          </div>
        ) : (
          <AppDataTable
            rows={rows}
            getRowId={(row) => row.id}
            emptyMessage={t('maintenance.forms.fieldsTab.empty', 'Nenhum campo foi cadastrado para este formulário.')}
            columns={columns}
            selectable={!readOnly}
            isRowSelectable={(row) => !isProtectedField(row)}
            selectedIds={selectedIds}
            allSelected={allSelected}
            onToggleSelect={(id) => {
              const row = rows.find((item) => item.id === id)
              if (!row || isProtectedField(row)) {
                return
              }

              setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
            }}
            onToggleSelectAll={() => setSelectedIds((current) => (current.length === selectableIds.length ? [] : selectableIds))}
            rowActions={(row) => readOnly ? [] : [
              {
                id: 'edit',
                label: t('simpleCrud.actions.edit', 'Editar'),
                icon: Pencil,
                onClick: () => void openEditModal(row.id),
              },
              {
                id: 'move-up',
                label: t('maintenance.forms.fieldsTab.moveUp', 'Subir'),
                icon: ArrowUp,
                onClick: () => void moveField(row.id, 'up'),
              },
              {
                id: 'move-down',
                label: t('maintenance.forms.fieldsTab.moveDown', 'Descer'),
                icon: ArrowDown,
                onClick: () => void moveField(row.id, 'down'),
              },
              {
                id: 'delete',
                label: t('simpleCrud.actions.delete', 'Excluir'),
                icon: Trash2,
                tone: 'danger',
                visible: !isProtectedField(row),
                onClick: () => setConfirmDeleteIds([row.id]),
              },
              {
                id: 'logs',
                label: t('maintenance.logs.title', 'Logs'),
                icon: FileSearch,
                href: `/logs?modulo=${String(row.tipo || '') === 'sessao' ? 'FRC' : 'FOC'}&id_registro=${row.id}`,
              },
            ]}
            mobileCard={{
              title: (row) => String(row.titulo || row.nome || '-'),
              subtitle: (row) => String(row.tipo || '-'),
              meta: (row) => `${t('maintenance.formFields.fields.position', 'Posição')}: ${String(row.posicao || '-')}`,
            }}
          />
        )}
      </SectionCard>

      <CrudModal
        open={modalOpen}
        title={editingId
          ? (modalMode === 'session'
              ? t('maintenance.forms.fieldsTab.editSessionTitle', 'Editar sessão')
              : t('maintenance.forms.fieldsTab.editTitle', 'Editar campo'))
          : (modalMode === 'session'
              ? t('maintenance.forms.fieldsTab.createSessionTitle', 'Nova sessão')
              : t('maintenance.forms.fieldsTab.createTitle', 'Novo campo'))}
        onClose={closeModal}
        onConfirm={() => void handleSave()}
        isSaving={isSaving}
      >
        <PageToast message={feedback} onClose={() => setFeedback(null)} />
        <CrudFormSections
          config={formConfig}
          form={form}
          readOnly={readOnly}
          patch={patch}
          optionsMap={optionsMap}
        />

        {isSelectorCustomMode ? (
          <SectionCard title={t('maintenance.forms.fieldsTab.selectorOptionsTitle', 'Opções personalizadas')}>
            <div className="space-y-3">
              {selectorOptions.map((option, index) => (
                <div key={`selector-option-${index}`} className="grid gap-2 rounded-[1rem] border border-[#ece4d8] bg-[#fcfaf5] p-3 md:grid-cols-[1fr_1fr_auto]">
                  <input
                    type="text"
                    className={inputClasses()}
                    placeholder={t('maintenance.forms.fieldsTab.selectorOptionTitle', 'Título')}
                    value={option.titulo}
                    onChange={(event) => setSelectorOptions((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, titulo: event.target.value } : item))}
                  />
                  <input
                    type="text"
                    className={inputClasses()}
                    placeholder={t('maintenance.forms.fieldsTab.selectorOptionValue', 'Valor')}
                    value={option.valor}
                    onChange={(event) => setSelectorOptions((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, valor: event.target.value } : item))}
                  />
                  <button
                    type="button"
                    className="rounded-full border border-[#e6dfd3] bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[#f8f4ec]"
                    onClick={() => setSelectorOptions((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                  >
                    {t('maintenance.forms.fieldsTab.removeOption', 'Excluir')}
                  </button>
                </div>
              ))}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  className="rounded-full border border-[#e6dfd3] bg-[#fcfaf5] px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-[#f5efe5]"
                  onClick={() => setSelectorOptions((current) => [...current, { titulo: '', valor: '' }])}
                >
                  {t('maintenance.forms.fieldsTab.addOption', 'Nova opção')}
                </button>
                <p className="text-xs text-slate-500">
                  {t('maintenance.forms.fieldsTab.selectorOptionsHint', 'Essas opções serão salvas no campo seletor personalizado.')}
                </p>
              </div>
            </div>
          </SectionCard>
        ) : null}
      </CrudModal>

      <ConfirmDialog
        open={Boolean(confirmDeleteIds?.length)}
        title={t('maintenance.forms.fieldsTab.deleteTitle', 'Excluir campo(s)')}
        description={t('maintenance.forms.fieldsTab.deleteDescription', 'Os campos selecionados serão removidos deste formulário.')}
        confirmLabel={t('common.delete', 'Excluir')}
        cancelLabel={t('common.cancel', 'Cancelar')}
        onClose={() => setConfirmDeleteIds(null)}
        onConfirm={() => void handleDelete(confirmDeleteIds ?? [])}
      />
    </>
  )
}
