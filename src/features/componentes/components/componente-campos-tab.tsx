'use client'

import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { AppDataTable } from '@/src/components/data-table/app-data-table'
import type { AppDataTableColumn } from '@/src/components/data-table/types'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { BooleanSegmentedField } from '@/src/components/ui/boolean-segmented-field'
import { FormRow } from '@/src/components/ui/form-row'
import { inputClasses } from '@/src/components/ui/input-styles'
import { OverlayModal } from '@/src/components/ui/overlay-modal'
import { SectionCard } from '@/src/components/ui/section-card'
import { StatusBadge } from '@/src/components/ui/status-badge'
import type { CrudRecord } from '@/src/components/crud-base/types'
import { componentesClient } from '@/src/features/componentes/services/componentes-client'
import {
  asBoolean,
  buildCampoPayload,
  normalizeCampo,
  normalizeCampos,
  parseCampoOptions,
} from '@/src/features/componentes/services/componentes-mappers'
import type { ComponenteCampoOption, ComponenteCampoRecord } from '@/src/features/componentes/services/componentes-types'
import { useI18n } from '@/src/i18n/use-i18n'

type ComponenteCamposTabProps = {
  form: CrudRecord
  readOnly: boolean
  refreshRecord: () => Promise<void>
  onFeedback: (message: string | null, tone?: 'success' | 'error') => void
}

type CampoFormState = ComponenteCampoRecord & {
  opcoes: ComponenteCampoOption[]
}

function normalizePosition(rows: ComponenteCampoRecord[]) {
  return rows.map((row, index) => ({ id: row.id, posicao: index + 1 }))
}

function createEmptyCampo(idComponente: string, position: number): CampoFormState {
  return {
    id: '',
    id_componente: idComponente,
    ativo: true,
    obrigatorio: true,
    codigo: '',
    nome: '',
    titulo: '',
    instrucoes: '',
    tipo: '',
    tipo_seletor: '',
    json_seletor: null,
    posicao: String(position),
    opcoes: [{ titulo: '', valor: '' }],
  }
}

function createCampoForm(row: ComponenteCampoRecord | null, idComponente: string, position: number): CampoFormState {
  const normalized = row ? normalizeCampo(row) : createEmptyCampo(idComponente, position)
  const opcoes = parseCampoOptions(normalized.json_seletor)

  return {
    ...normalized,
    id_componente: normalized.id_componente || idComponente,
    ativo: asBoolean(normalized.ativo, true),
    obrigatorio: asBoolean(normalized.obrigatorio, true),
    posicao: String(normalized.posicao || position),
    opcoes: opcoes.length ? opcoes : [{ titulo: '', valor: '' }],
  }
}

export function ComponenteCamposTab({ form, readOnly, refreshRecord, onFeedback }: ComponenteCamposTabProps) {
  const { t } = useI18n()
  const idComponente = String(form.id ?? '')
  const campos = useMemo(() => normalizeCampos(form.campos), [form.campos])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [editing, setEditing] = useState<CampoFormState | null>(null)
  const [confirmIds, setConfirmIds] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const availableIds = new Set(campos.map((campo) => campo.id))
    setSelectedIds((current) => current.filter((id) => availableIds.has(id)))
  }, [campos])

  const allSelected = campos.length > 0 && campos.every((campo) => selectedIds.includes(campo.id))

  function toggleSelection(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  function toggleSelectAll() {
    setSelectedIds(allSelected ? [] : campos.map((campo) => campo.id))
  }

  function openNew() {
    setEditing(createEmptyCampo(idComponente, campos.length + 1))
  }

  function openEdit(row: ComponenteCampoRecord) {
    setEditing(createCampoForm(row, idComponente, campos.length + 1))
  }

  async function persistOrder(rows: ComponenteCampoRecord[]) {
    if (!rows.length) {
      return
    }
    await componentesClient.reorderCampos(normalizePosition(rows))
  }

  async function moveCampo(row: ComponenteCampoRecord, direction: -1 | 1) {
    const index = campos.findIndex((campo) => campo.id === row.id)
    const nextIndex = index + direction
    if (index < 0 || nextIndex < 0 || nextIndex >= campos.length) {
      return
    }

    const nextRows = [...campos]
    const [item] = nextRows.splice(index, 1)
    nextRows.splice(nextIndex, 0, item)

    try {
      setIsSaving(true)
      await persistOrder(nextRows)
      await refreshRecord()
    } catch (error) {
      onFeedback(error instanceof Error ? error.message : t('registrations.components.fields.orderError', 'Nao foi possivel reordenar os campos.'), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  async function deleteCampos(ids: string[]) {
    if (!ids.length) {
      return
    }

    try {
      setIsSaving(true)
      await componentesClient.deleteCampos(ids)
      const remaining = campos.filter((campo) => !ids.includes(campo.id))
      await persistOrder(remaining)
      setConfirmIds([])
      setSelectedIds([])
      await refreshRecord()
    } catch (error) {
      onFeedback(error instanceof Error ? error.message : t('registrations.components.fields.deleteError', 'Nao foi possivel excluir os campos.'), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  async function saveCampo() {
    if (!editing) {
      return
    }

    if (!String(editing.nome || '').trim()) {
      onFeedback(t('registrations.components.fields.validation.name', 'Informe o nome do campo.'), 'error')
      return
    }
    if (!String(editing.titulo || '').trim()) {
      onFeedback(t('registrations.components.fields.validation.title', 'Informe o titulo do campo.'), 'error')
      return
    }
    if (!String(editing.tipo || '').trim()) {
      onFeedback(t('registrations.components.fields.validation.type', 'Informe o tipo do campo.'), 'error')
      return
    }
    if (!Number(editing.posicao || 0)) {
      onFeedback(t('registrations.components.fields.validation.position', 'Informe a posicao do campo.'), 'error')
      return
    }

    try {
      setIsSaving(true)
      const payload = buildCampoPayload(editing, editing.opcoes)
      const result = await componentesClient.saveCampo(payload)
      const saved = normalizeCampo((Array.isArray(result) ? result[0] : result) ?? payload)
      const requestedIndex = Math.max(0, Math.min(Number(editing.posicao || campos.length + 1) - 1, campos.length))
      const withoutSaved = campos.filter((campo) => campo.id !== saved.id)
      withoutSaved.splice(requestedIndex, 0, saved)
      await persistOrder(withoutSaved)
      setEditing(null)
      await refreshRecord()
    } catch (error) {
      onFeedback(error instanceof Error ? error.message : t('registrations.components.fields.saveError', 'Nao foi possivel salvar o campo.'), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const columns = useMemo(() => ([
    {
      id: 'nome',
      label: t('registrations.components.fields.fieldName', 'Nome'),
      cell: (row: ComponenteCampoRecord) => <span className="font-semibold text-[color:var(--app-text)]">{row.nome || '-'}</span>,
    },
    {
      id: 'titulo',
      label: t('registrations.components.fields.title', 'Titulo'),
      cell: (row: ComponenteCampoRecord) => row.titulo || '-',
    },
    {
      id: 'tipo',
      label: t('registrations.components.fields.fieldType', 'Tipo'),
      visibility: 'lg',
      thClassName: 'w-[150px]',
      cell: (row: ComponenteCampoRecord) => row.tipo || '-',
    },
    {
      id: 'posicao',
      label: t('simpleCrud.fields.position', 'Posicao'),
      visibility: 'lg',
      thClassName: 'w-[110px]',
      cell: (row: ComponenteCampoRecord) => row.posicao || '-',
    },
    {
      id: 'ativo',
      label: t('simpleCrud.fields.active', 'Ativo'),
      visibility: 'xl',
      thClassName: 'w-[110px]',
      cell: (row: ComponenteCampoRecord) => (
        <StatusBadge tone={asBoolean(row.ativo) ? 'success' : 'warning'}>
          {asBoolean(row.ativo) ? t('common.yes', 'Sim') : t('common.no', 'Nao')}
        </StatusBadge>
      ),
    },
  ]) satisfies AppDataTableColumn<ComponenteCampoRecord, never>[], [t])

  return (
    <>
      <SectionCard
        title={t('registrations.components.fields.titleList', 'Campos do componente')}
        description={t('registrations.components.fields.description', 'Configure os campos exibidos para preencher este componente no site.')}
        action={!readOnly ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {selectedIds.length ? (
              <button type="button" onClick={() => setConfirmIds(selectedIds)} className="app-button-danger inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold">
                <Trash2 className="h-4 w-4" />
                {t('common.delete', 'Excluir')}
              </button>
            ) : null}
            <button type="button" onClick={openNew} className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold">
              <Plus className="h-4 w-4" />
              {t('common.new', 'Novo')}
            </button>
          </div>
        ) : null}
      >
        <AppDataTable<ComponenteCampoRecord, string, never>
          rows={campos}
          getRowId={(row) => row.id}
          emptyMessage={t('registrations.components.fields.empty', 'Nao existem campos no componente.')}
          columns={columns}
          selectable={!readOnly}
          selectedIds={selectedIds}
          allSelected={allSelected}
          onToggleSelect={toggleSelection}
          onToggleSelectAll={toggleSelectAll}
          mobileCard={{
            title: (row) => row.nome || '-',
            subtitle: (row) => row.titulo || '-',
            meta: (row) => `${t('simpleCrud.fields.position', 'Posicao')}: ${row.posicao || '-'}`,
          }}
          rowActions={(row) => [
            { id: 'edit', label: t('simpleCrud.actions.edit', 'Editar'), icon: Pencil, onClick: () => openEdit(row), visible: !readOnly },
            { id: 'up', label: t('registrations.components.fields.moveUp', 'Subir'), icon: ArrowUp, onClick: () => void moveCampo(row, -1), visible: !readOnly && campos.findIndex((campo) => campo.id === row.id) > 0 },
            { id: 'down', label: t('registrations.components.fields.moveDown', 'Descer'), icon: ArrowDown, onClick: () => void moveCampo(row, 1), visible: !readOnly && campos.findIndex((campo) => campo.id === row.id) < campos.length - 1 },
            { id: 'delete', label: t('simpleCrud.actions.delete', 'Excluir'), icon: Trash2, tone: 'danger', onClick: () => setConfirmIds([row.id]), visible: !readOnly },
          ]}
          actionsColumnClassName="w-[176px] min-w-[176px] whitespace-nowrap"
        />
      </SectionCard>

      <CampoModal
        open={Boolean(editing)}
        value={editing}
        maxPosition={Math.max(campos.length + (editing?.id ? 0 : 1), 1)}
        readOnly={readOnly}
        isSaving={isSaving}
        onChange={setEditing}
        onClose={() => setEditing(null)}
        onSave={() => void saveCampo()}
      />

      <ConfirmDialog
        open={confirmIds.length > 0}
        title={t('registrations.components.fields.confirmDeleteTitle', 'Excluir campo?')}
        description={confirmIds.length > 1
          ? t('registrations.components.fields.confirmDeleteMany', 'Os campos selecionados serao excluidos. Esta acao nao pode ser desfeita.')
          : t('registrations.components.fields.confirmDeleteSingle', 'O campo selecionado sera excluido. Esta acao nao pode ser desfeita.')}
        confirmLabel={t('common.delete', 'Excluir')}
        cancelLabel={t('common.cancel', 'Cancelar')}
        isLoading={isSaving}
        onClose={() => setConfirmIds([])}
        onConfirm={() => void deleteCampos(confirmIds)}
      />
    </>
  )
}

type CampoModalProps = {
  open: boolean
  value: CampoFormState | null
  maxPosition: number
  readOnly: boolean
  isSaving: boolean
  onChange: (value: CampoFormState | null) => void
  onClose: () => void
  onSave: () => void
}

function CampoModal({ open, value, maxPosition, readOnly, isSaving, onChange, onClose, onSave }: CampoModalProps) {
  const { t } = useI18n()

  function patch<K extends keyof CampoFormState>(key: K, nextValue: CampoFormState[K]) {
    if (!value) {
      return
    }
    onChange({ ...value, [key]: nextValue })
  }

  function patchOption(index: number, key: keyof ComponenteCampoOption, nextValue: string) {
    if (!value) {
      return
    }
    const opcoes = value.opcoes.map((option, optionIndex) => optionIndex === index ? { ...option, [key]: nextValue } : option)
    onChange({ ...value, opcoes })
  }

  function addOption() {
    if (!value) {
      return
    }
    onChange({ ...value, opcoes: [...value.opcoes, { titulo: '', valor: '' }] })
  }

  function removeOption(index: number) {
    if (!value) {
      return
    }
    const opcoes = value.opcoes.filter((_, optionIndex) => optionIndex !== index)
    onChange({ ...value, opcoes: opcoes.length ? opcoes : [{ titulo: '', valor: '' }] })
  }

  return (
    <OverlayModal
      open={open}
      title={value?.id ? t('registrations.components.fields.editTitle', 'Editar campo do componente') : t('registrations.components.fields.newTitle', 'Novo campo do componente')}
      onClose={onClose}
      maxWidthClassName="max-w-[min(980px,calc(100vw-2rem))]"
      headerActions={!readOnly ? (
        <button type="button" disabled={isSaving} onClick={onSave} className="app-button-primary inline-flex rounded-full px-4 py-2.5 text-sm font-semibold disabled:opacity-60">
          {t('common.save', 'Salvar')}
        </button>
      ) : null}
    >
      {value ? (
        <div className="space-y-5">
          <div className="app-pane-muted rounded-[1.25rem] border border-[color:var(--app-card-border)] p-4">
            <div className="space-y-5">
              <FormRow label={t('simpleCrud.fields.active', 'Ativo')} required>
                <BooleanSegmentedField value={asBoolean(value.ativo, true)} onChange={(nextValue) => patch('ativo', nextValue)} disabled={readOnly} />
              </FormRow>
              <FormRow label={t('registrations.components.fields.required', 'Obrigatorio')} required>
                <BooleanSegmentedField value={asBoolean(value.obrigatorio, true)} onChange={(nextValue) => patch('obrigatorio', nextValue)} disabled={readOnly} />
              </FormRow>
              <FormRow label={t('simpleCrud.fields.code', 'Codigo')}>
                <input value={String(value.codigo ?? '')} onChange={(event) => patch('codigo', event.target.value)} className={inputClasses()} disabled={readOnly} maxLength={32} />
              </FormRow>
              <FormRow label={t('registrations.components.fields.fieldName', 'Nome')} required>
                <input value={String(value.nome ?? '')} onChange={(event) => patch('nome', event.target.value)} className={inputClasses()} disabled={readOnly} maxLength={255} />
              </FormRow>
              <FormRow label={t('registrations.components.fields.title', 'Titulo')} required>
                <input value={String(value.titulo ?? '')} onChange={(event) => patch('titulo', event.target.value)} className={inputClasses()} disabled={readOnly} />
              </FormRow>
              <FormRow label={t('registrations.components.fields.instructions', 'Instrucoes')}>
                <textarea rows={4} value={String(value.instrucoes ?? '')} onChange={(event) => patch('instrucoes', event.target.value)} className={`${inputClasses()} min-h-28 resize-y`} disabled={readOnly} />
              </FormRow>
              <FormRow label={t('registrations.components.fields.fieldType', 'Tipo')} required>
                <select value={String(value.tipo ?? '')} onChange={(event) => patch('tipo', event.target.value)} className={inputClasses()} disabled={readOnly}>
                  <option value="">{t('common.select', 'Selecione')}</option>
                  <option value="data">{t('registrations.components.fieldTypes.date', 'Data')}</option>
                  <option value="numero">{t('registrations.components.fieldTypes.number', 'Numero')}</option>
                  <option value="seletor">{t('registrations.components.fieldTypes.selector', 'Seletor')}</option>
                  <option value="sim_nao">{t('registrations.components.fieldTypes.yesNo', 'Sim/Nao')}</option>
                  <option value="texto">{t('registrations.components.fieldTypes.text', 'Texto')}</option>
                  <option value="valor">{t('registrations.components.fieldTypes.value', 'Valor')}</option>
                </select>
              </FormRow>
              {value.tipo === 'seletor' ? (
                <FormRow label={t('registrations.components.fields.dataSource', 'Fonte de dados')}>
                  <select value={String(value.tipo_seletor ?? '')} onChange={(event) => patch('tipo_seletor', event.target.value)} className={inputClasses()} disabled={readOnly}>
                    <option value="">{t('common.select', 'Selecione')}</option>
                    <option value="area_banner">{t('registrations.components.selectorSources.bannerArea', 'Area de Banner')}</option>
                    <option value="colecao">{t('registrations.components.selectorSources.collection', 'Colecao')}</option>
                    <option value="personalizado">{t('registrations.components.selectorSources.custom', 'Personalizado')}</option>
                  </select>
                </FormRow>
              ) : null}
              {value.tipo === 'seletor' && value.tipo_seletor === 'personalizado' ? (
                <FormRow label={t('registrations.components.fields.options', 'Opcoes')}>
                  <div className="space-y-3">
                    {value.opcoes.map((option, index) => (
                      <div key={index} className="grid gap-3 rounded-[1rem] border border-[color:var(--app-card-border)] p-3 md:grid-cols-[1fr_1fr_auto]">
                        <input value={option.titulo} onChange={(event) => patchOption(index, 'titulo', event.target.value)} placeholder={t('registrations.components.fields.optionTitle', 'Titulo')} className={inputClasses()} disabled={readOnly} />
                        <input value={option.valor} onChange={(event) => patchOption(index, 'valor', event.target.value)} placeholder={t('registrations.components.fields.optionValue', 'Valor')} className={inputClasses()} disabled={readOnly} />
                        <button type="button" onClick={() => removeOption(index)} disabled={readOnly} className="app-button-danger inline-flex h-12 items-center justify-center rounded-full px-4 text-sm font-semibold disabled:opacity-60">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={addOption} disabled={readOnly} className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold disabled:opacity-60">
                      <Plus className="h-4 w-4" />
                      {t('registrations.components.fields.newOption', 'Nova opcao')}
                    </button>
                  </div>
                </FormRow>
              ) : null}
              <FormRow label={t('simpleCrud.fields.position', 'Posicao')} required>
                <input type="number" min={1} max={maxPosition} value={String(value.posicao ?? '')} onChange={(event) => patch('posicao', event.target.value)} className={inputClasses()} disabled={readOnly} />
              </FormRow>
            </div>
          </div>
        </div>
      ) : null}
    </OverlayModal>
  )
}
