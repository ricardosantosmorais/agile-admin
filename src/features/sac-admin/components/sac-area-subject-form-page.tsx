'use client'

import { Headphones, PencilLine, UsersRound } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { CrudModal } from '@/src/components/ui/crud-modal'
import { FormField } from '@/src/components/ui/form-field'
import { inputClasses } from '@/src/components/ui/input-styles'
import { BooleanChoice } from '@/src/components/ui/boolean-choice'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
import { ClienteRelationSection } from '@/src/features/clientes/components/cliente-relation-section'
import { TabbedCatalogFormPage } from '@/src/features/catalog/components/tabbed-catalog-form-page'
import { sacAdminClient } from '@/src/features/sac-admin/services/sac-admin-client'
import { getSacAdminPermissions } from '@/src/features/sac-admin/services/sac-admin-mappers'
import { SAC_AREAS_SUBJECTS_CONFIG, sacAreasSubjectsCrudClient } from '@/src/features/sac-admin/services/sac-areas-subjects-crud'
import type { SacAreaResponsible, SacLookupOption, SacSubject } from '@/src/features/sac-admin/types/sac-admin'
import { useI18n } from '@/src/i18n/use-i18n'

const EMPTY_SUBJECT_FORM = {
  name: '',
  allowOrderLink: true,
  requireOrder: false,
  active: true,
}

function SacSubjectsTab({
  areaId,
  onError,
  readOnly,
}: {
  areaId: string
  onError: (message: string | null, tone?: 'success' | 'error') => void
  readOnly: boolean
}) {
  const { t } = useI18n()
  const [items, setItems] = useState<SacSubject[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalFeedback, setModalFeedback] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_SUBJECT_FORM)

  const refresh = useCallback(async () => {
    setItems(await sacAdminClient.subjects(areaId))
  }, [areaId])

  useEffect(() => {
    void refresh().catch((error) => onError(error instanceof Error ? error.message : t('sacAdmin.errors.settings', 'Não foi possível carregar as configurações do SAC.'), 'error'))
  }, [onError, refresh, t])

  async function handleCreate() {
    const name = form.name.trim()
    if (!name) {
      setModalFeedback(t('sacAdmin.areasCrud.subjects.nameRequired', 'Informe o nome do assunto.'))
      return
    }

    setIsSaving(true)
    try {
      await sacAdminClient.saveSubject({
        id: '',
        id_sac_area: areaId,
        nome: name,
        permite_vinculo_pedido: form.allowOrderLink ? 1 : 0,
        obriga_pedido: form.requireOrder ? 1 : 0,
        ativo: form.active ? 1 : 0,
      })
      setModalOpen(false)
      setModalFeedback(null)
      setForm(EMPTY_SUBJECT_FORM)
      onError(null)
      await refresh()
    } catch (error) {
      setModalFeedback(error instanceof Error ? error.message : t('simpleCrud.saveError', 'Não foi possível salvar o registro.'))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    try {
      await Promise.all(selectedIds.map((id) => sacAdminClient.deleteSubject(id)))
      setSelectedIds([])
      setConfirmOpen(false)
      onError(null)
      await refresh()
    } catch (error) {
      onError(error instanceof Error ? error.message : t('simpleCrud.deleteError', 'Não foi possível excluir os registros.'), 'error')
    }
  }

  return (
    <>
      <ClienteRelationSection<SacSubject>
        title={t('sacAdmin.areasCrud.subjects.title', 'Assuntos da área')}
        readOnly={readOnly}
        hasSelection={selectedIds.length > 0}
        onDelete={() => setConfirmOpen(true)}
        onCreate={() => {
          setForm(EMPTY_SUBJECT_FORM)
          setModalFeedback(null)
          setModalOpen(true)
        }}
        items={items}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        getRowId={(item) => item.id}
        emptyMessage={t('sacAdmin.areasCrud.subjects.empty', 'Nenhum assunto foi configurado para esta área.')}
        columns={[
          { header: t('simpleCrud.fields.name', 'Nome'), render: (item) => item.name, cellClassName: 'font-semibold text-[color:var(--app-text)]' },
          { header: t('sacAdmin.areasCrud.fields.allowOrderLinkShort', 'Permite pedido'), headerClassName: 'w-[160px]', render: (item) => item.allowOrderLink ? t('common.yes', 'Sim') : t('common.no', 'Não') },
          { header: t('sacAdmin.areasCrud.fields.requireOrderShort', 'Obriga pedido'), headerClassName: 'w-[150px]', render: (item) => item.requireOrder ? t('common.yes', 'Sim') : t('common.no', 'Não') },
          { header: t('simpleCrud.fields.active', 'Ativo'), headerClassName: 'w-[110px]', render: (item) => item.active ? t('common.yes', 'Sim') : t('common.no', 'Não') },
        ]}
      />

      <CrudModal open={modalOpen} title={t('sacAdmin.areasCrud.subjects.add', 'Adicionar assunto')} onClose={() => setModalOpen(false)} onConfirm={() => void handleCreate()} isSaving={isSaving}>
        <div className="grid gap-4">
          {modalFeedback ? <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{modalFeedback}</div> : null}
          <FormField label={t('sacAdmin.areasCrud.fields.subjectName', 'Nome do assunto')} required>
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className={inputClasses()} />
          </FormField>
          <div className="grid gap-3 md:grid-cols-3">
            <FormField label={t('sacAdmin.areasCrud.fields.allowOrderLink', 'Permite vínculo com pedido')} asLabel={false}>
              <BooleanChoice value={form.allowOrderLink} onChange={(value) => setForm((current) => ({ ...current, allowOrderLink: value }))} trueLabel={t('common.yes', 'Sim')} falseLabel={t('common.no', 'Não')} />
            </FormField>
            <FormField label={t('sacAdmin.areasCrud.fields.requireOrder', 'Obriga pedido')} asLabel={false}>
              <BooleanChoice value={form.requireOrder} onChange={(value) => setForm((current) => ({ ...current, requireOrder: value }))} trueLabel={t('common.yes', 'Sim')} falseLabel={t('common.no', 'Não')} />
            </FormField>
            <FormField label={t('simpleCrud.fields.active', 'Ativo')} asLabel={false}>
              <BooleanChoice value={form.active} onChange={(value) => setForm((current) => ({ ...current, active: value }))} trueLabel={t('common.yes', 'Sim')} falseLabel={t('common.no', 'Não')} />
            </FormField>
          </div>
        </div>
      </CrudModal>

      <ConfirmDialog open={confirmOpen} title={t('simpleCrud.actions.delete', 'Excluir')} description={t('sacAdmin.areasCrud.subjects.deleteDescription', 'Os assuntos selecionados serão removidos desta área.')} confirmLabel={t('common.delete', 'Excluir')} onClose={() => setConfirmOpen(false)} onConfirm={() => void handleDelete()} />
    </>
  )
}

function SacAreaResponsiblesTab({
  areaId,
  onError,
  readOnly,
}: {
  areaId: string
  onError: (message: string | null, tone?: 'success' | 'error') => void
  readOnly: boolean
}) {
  const { t } = useI18n()
  const [items, setItems] = useState<SacAreaResponsible[]>([])
  const [users, setUsers] = useState<SacLookupOption[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [active, setActive] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalFeedback, setModalFeedback] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const refresh = useCallback(async () => {
    const [responsibles, userOptions] = await Promise.all([
      sacAdminClient.areaResponsibles(areaId),
      sacAdminClient.users(),
    ])
    setItems(responsibles)
    setUsers(userOptions)
  }, [areaId])

  useEffect(() => {
    void refresh().catch((error) => onError(error instanceof Error ? error.message : t('sacAdmin.errors.settings', 'Não foi possível carregar as configurações do SAC.'), 'error'))
  }, [onError, refresh, t])

  const userOptions = useMemo(() => users.filter((user) => user.active), [users])

  async function handleCreate() {
    if (!selectedUserId) {
      setModalFeedback(t('sacAdmin.areasCrud.responsibles.userRequired', 'Selecione o usuário responsável.'))
      return
    }

    setIsSaving(true)
    try {
      await sacAdminClient.saveAreaResponsible(areaId, {
        id: '',
        id_usuario: selectedUserId,
        ativo: active ? 1 : 0,
      })
      setModalOpen(false)
      setModalFeedback(null)
      setSelectedUserId('')
      setActive(true)
      onError(null)
      await refresh()
    } catch (error) {
      setModalFeedback(error instanceof Error ? error.message : t('simpleCrud.saveError', 'Não foi possível salvar o registro.'))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    try {
      await Promise.all(selectedIds.map((id) => sacAdminClient.deleteAreaResponsible(id)))
      setSelectedIds([])
      setConfirmOpen(false)
      onError(null)
      await refresh()
    } catch (error) {
      onError(error instanceof Error ? error.message : t('simpleCrud.deleteError', 'Não foi possível excluir os registros.'), 'error')
    }
  }

  return (
    <>
      <ClienteRelationSection<SacAreaResponsible>
        title={t('sacAdmin.areasCrud.responsibles.title', 'Responsáveis da área')}
        readOnly={readOnly}
        hasSelection={selectedIds.length > 0}
        onDelete={() => setConfirmOpen(true)}
        onCreate={() => {
          setSelectedUserId('')
          setActive(true)
          setModalFeedback(null)
          setModalOpen(true)
        }}
        items={items}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        getRowId={(item) => item.id}
        emptyMessage={t('sacAdmin.areasCrud.responsibles.empty', 'Nenhum responsável foi configurado para esta área.')}
        columns={[
          { header: t('sacAdmin.areasCrud.fields.responsibleUser', 'Usuário'), render: (item) => item.userName, cellClassName: 'font-semibold text-[color:var(--app-text)]' },
          { header: t('sacAdmin.areasCrud.fields.email', 'E-mail'), render: (item) => item.userEmail || '-' },
          { header: t('simpleCrud.fields.active', 'Ativo'), headerClassName: 'w-[110px]', render: (item) => item.active ? t('common.yes', 'Sim') : t('common.no', 'Não') },
        ]}
      />

      <CrudModal open={modalOpen} title={t('sacAdmin.areasCrud.responsibles.add', 'Adicionar responsável')} onClose={() => setModalOpen(false)} onConfirm={() => void handleCreate()} isSaving={isSaving}>
        <div className="grid gap-4">
          {modalFeedback ? <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{modalFeedback}</div> : null}
          <FormField label={t('sacAdmin.areasCrud.fields.responsibleUser', 'Usuário responsável')} required>
            <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} className={inputClasses()}>
              <option value="">{t('common.select', 'Selecione')}</option>
              {userOptions.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
            </select>
          </FormField>
          <FormField label={t('simpleCrud.fields.active', 'Ativo')} asLabel={false}>
            <BooleanChoice value={active} onChange={setActive} trueLabel={t('common.yes', 'Sim')} falseLabel={t('common.no', 'Não')} />
          </FormField>
        </div>
      </CrudModal>

      <ConfirmDialog open={confirmOpen} title={t('simpleCrud.actions.delete', 'Excluir')} description={t('sacAdmin.areasCrud.responsibles.deleteDescription', 'Os responsáveis selecionados serão removidos desta área.')} confirmLabel={t('common.delete', 'Excluir')} onClose={() => setConfirmOpen(false)} onConfirm={() => void handleDelete()} />
    </>
  )
}

export function SacAreaSubjectFormPage({ id }: { id?: string }) {
  const { t } = useI18n()
  const { session } = useAuth()
  const accessOverride = useMemo(() => {
    const permissions = getSacAdminPermissions(session)
    return {
      canCreate: permissions.canConfigureAreas,
      canDelete: permissions.canConfigureAreas,
      canEdit: permissions.canConfigureAreas,
      canList: permissions.canConfigureAreas,
      canOpen: permissions.canConfigureAreas,
      canView: permissions.canConfigureAreas,
    }
  }, [session])

  return (
    <TabbedCatalogFormPage
      config={SAC_AREAS_SUBJECTS_CONFIG}
      client={sacAreasSubjectsCrudClient}
      id={id}
      accessOverride={accessOverride}
      tabs={[
        {
          key: 'general',
          label: t('sacAdmin.areasCrud.tabs.general', 'Dados da área'),
          icon: <PencilLine className="h-4 w-4" />,
          sectionIds: ['general'],
        },
        {
          key: 'subjects',
          label: t('sacAdmin.areasCrud.tabs.subjects', 'Assuntos'),
          icon: <Headphones className="h-4 w-4" />,
          hidden: ({ isEditing }) => !isEditing,
          render: ({ id: areaId, readOnly, onFeedback }) => areaId ? <SacSubjectsTab areaId={areaId} readOnly={readOnly} onError={onFeedback} /> : null,
        },
        {
          key: 'responsibles',
          label: t('sacAdmin.areasCrud.tabs.responsibles', 'Responsáveis'),
          icon: <UsersRound className="h-4 w-4" />,
          hidden: ({ isEditing }) => !isEditing,
          render: ({ id: areaId, readOnly, onFeedback }) => areaId ? <SacAreaResponsiblesTab areaId={areaId} readOnly={readOnly} onError={onFeedback} /> : null,
        },
      ]}
    />
  )
}
