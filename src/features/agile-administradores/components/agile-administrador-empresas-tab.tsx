'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { CrudRecord } from '@/src/components/crud-base/types'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { LookupSelect, type LookupOption } from '@/src/components/ui/lookup-select'
import { OverlayModal } from '@/src/components/ui/overlay-modal'
import { SectionCard } from '@/src/components/ui/section-card'
import { SelectableDataTable, type SelectableDataTableColumn } from '@/src/components/ui/selectable-data-table'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { agileAdministradoresClient } from '@/src/features/agile-administradores/services/agile-administradores-client'
import type { AgileAdministradorEmpresaLink } from '@/src/features/agile-administradores/services/agile-administradores-mappers'
import { useI18n } from '@/src/i18n/use-i18n'

function normalizeLinks(form: CrudRecord): AgileAdministradorEmpresaLink[] {
  return Array.isArray(form.empresasVinculadas)
    ? form.empresasVinculadas as AgileAdministradorEmpresaLink[]
    : []
}

export function AgileAdministradorEmpresasTab({
  id,
  form,
  readOnly,
  refreshRecord,
  onFeedback,
}: {
  id?: string
  form: CrudRecord
  readOnly: boolean
  refreshRecord: () => Promise<void>
  onFeedback: (message: string | null, tone?: 'success' | 'error') => void
}) {
  const { t } = useI18n()
  const [selectedEmpresa, setSelectedEmpresa] = useState<LookupOption | null>(null)
  const [selectedPerfil, setSelectedPerfil] = useState<LookupOption | null>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [removingIds, setRemovingIds] = useState<string[] | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const links = useMemo(() => normalizeLinks(form), [form])
  const linkedCompanyIds = useMemo(() => new Set(links.map((link) => link.idEmpresa)), [links])

  const columns = useMemo<Array<SelectableDataTableColumn<AgileAdministradorEmpresaLink>>>(() => [
    {
      header: t('administradores.columns.company', 'Empresa'),
      cellClassName: 'min-w-[280px]',
      render: (link) => (
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="break-words text-sm font-semibold text-[color:var(--app-text)]">{link.empresaNome || '-'}</span>
            {link.atual ? <StatusBadge tone="info">{t('administradores.companies.current', 'Atual')}</StatusBadge> : null}
          </div>
          <div className="break-words text-xs text-[color:var(--app-muted)]">{link.idEmpresa}</div>
        </div>
      ),
    },
    {
      header: t('administradores.columns.profile', 'Perfil'),
      cellClassName: 'min-w-[220px] break-words',
      render: (link) => link.perfilNome || '-',
    },
    {
      header: t('administradores.columns.companyActive', 'Empresa ativa'),
      headerClassName: 'w-[150px] text-center',
      cellClassName: 'w-[150px] text-center',
      render: (link) => (
        <StatusBadge tone={link.empresaAtiva ? 'success' : 'warning'}>
          {link.empresaAtiva ? t('common.yes', 'Sim') : t('common.no', 'Não')}
        </StatusBadge>
      ),
    },
  ], [t])

  async function loadAvailableCompanies(query: string, page: number, perPage: number) {
    const options = await agileAdministradoresClient.loadEmpresaOptions(query, page, perPage)
    return options.filter((option) => !linkedCompanyIds.has(option.id))
  }

  async function loadProfileOptions(query: string, page: number, perPage: number) {
    if (!selectedEmpresa?.id) return []
    return agileAdministradoresClient.loadPerfilOptions(query, page, perPage, selectedEmpresa.id)
  }

  function closeAddModal() {
    if (isSaving) return
    setAddModalOpen(false)
    setSelectedEmpresa(null)
    setSelectedPerfil(null)
  }

  async function handleAdd() {
    if (!id) return
    if (!selectedEmpresa) {
      onFeedback(t('administradores.companies.validation.company', 'Selecione uma empresa.'), 'error')
      return
    }
    if (!selectedPerfil) {
      onFeedback(t('administradores.companies.validation.profile', 'Selecione um perfil.'), 'error')
      return
    }

    setIsSaving(true)
    onFeedback(null)
    try {
      await agileAdministradoresClient.addEmpresa(id, selectedEmpresa.id, selectedPerfil.id)
      setAddModalOpen(false)
      setSelectedEmpresa(null)
      setSelectedPerfil(null)
      await refreshRecord()
    } catch (error) {
      onFeedback(error instanceof Error ? error.message : t('administradores.companies.linkError', 'Não foi possível vincular a empresa.'), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleRemove(ids: string[]) {
    if (!id || !ids.length) return
    const selectedLinks = links.filter((link) => ids.includes(link.id))
    setIsSaving(true)
    onFeedback(null)
    try {
      await agileAdministradoresClient.removeEmpresas(id, selectedLinks)
      setSelectedIds((current) => current.filter((item) => !ids.includes(item)))
      setRemovingIds(null)
      await refreshRecord()
    } catch (error) {
      onFeedback(error instanceof Error ? error.message : t('administradores.companies.unlinkError', 'Não foi possível remover a empresa.'), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <SectionCard
        title={t('administradores.companies.title', 'Empresas x Perfis')}
        description={t('administradores.companies.description', 'Defina em quais empresas o administrador pode operar e qual perfil será aplicado em cada uma.')}
        action={!readOnly ? (
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="app-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" />
            {t('administradores.companies.add', 'Adicionar empresa')}
          </button>
        ) : null}
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-[color:var(--app-muted)]">
            {t('administradores.companies.total', '{{count}} empresa(s) vinculada(s).', { count: links.length })}
          </div>
          {!readOnly && selectedIds.length ? (
            <button type="button" onClick={() => setRemovingIds(selectedIds)} className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-rose-600">
              <Trash2 className="h-4 w-4" />
              {t('simpleCrud.deleteSelected', 'Excluir ({{count}})', { count: selectedIds.length })}
            </button>
          ) : null}
        </div>

        <SelectableDataTable
          items={links}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          getRowId={(link) => link.id}
          columns={columns}
          emptyMessage={t('administradores.companies.empty', 'Nenhuma empresa vinculada. Selecione uma empresa e um perfil para incluir.')}
          actionsLabel={t('simpleCrud.actions.title', 'Ações')}
          rowActions={!readOnly ? (link) => [
            {
              label: t('common.remove', 'Remover'),
              icon: Trash2,
              tone: 'danger',
              onClick: () => setRemovingIds([link.id]),
            },
          ] : undefined}
        />
      </SectionCard>

      <ConfirmDialog
        open={Boolean(removingIds?.length)}
        title={t('administradores.companies.confirmUnlinkTitle', 'Remover vínculo?')}
        description={t('administradores.companies.confirmUnlinkDescription', 'Os vínculos selecionados serão removidos deste administrador.')}
        confirmLabel={t('simpleCrud.actions.delete', 'Excluir')}
        cancelLabel={t('common.cancel', 'Cancelar')}
        isLoading={isSaving}
        onClose={() => setRemovingIds(null)}
        onConfirm={() => void handleRemove(removingIds ?? [])}
      />

      <OverlayModal
        open={addModalOpen}
        title={t('administradores.companies.addModalTitle', 'Adicionar empresa')}
        onClose={closeAddModal}
        maxWidthClassName="max-w-2xl"
        headerActions={(
          <button
            type="button"
            disabled={!selectedEmpresa || !selectedPerfil || isSaving}
            onClick={() => void handleAdd()}
            className="app-button-primary inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            {isSaving ? t('common.loading', 'Carregando...') : t('common.include', 'Incluir')}
          </button>
        )}
      >
        <div className="space-y-5">
          <div className="rounded-[1.15rem] border border-line bg-[color:var(--app-muted-surface)] px-4 py-3 text-sm leading-6 text-[color:var(--app-muted)]">
            {t('administradores.companies.addModalDescription', 'Selecione a empresa e o perfil que serão vinculados a este administrador.')}
          </div>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-[color:var(--app-muted)]">{t('administradores.columns.company', 'Empresa')}</p>
              <LookupSelect
                label={t('administradores.columns.company', 'Empresa')}
                value={selectedEmpresa}
                onChange={(option) => {
                  setSelectedEmpresa(option)
                  setSelectedPerfil(null)
                }}
                loadOptions={loadAvailableCompanies}
                pageSize={20}
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-[color:var(--app-muted)]">{t('administradores.columns.profile', 'Perfil')}</p>
              <LookupSelect
                label={t('administradores.columns.profile', 'Perfil')}
                value={selectedPerfil}
                onChange={setSelectedPerfil}
                loadOptions={loadProfileOptions}
                disabled={!selectedEmpresa}
                pageSize={20}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-line pt-4">
            <button
              type="button"
              onClick={closeAddModal}
              disabled={isSaving}
              className="app-button-secondary inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              {t('common.cancel', 'Cancelar')}
            </button>
            <button
              type="button"
              disabled={!selectedEmpresa || !selectedPerfil || isSaving}
              onClick={() => void handleAdd()}
              className="app-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              {isSaving ? t('common.loading', 'Carregando...') : t('common.include', 'Incluir')}
            </button>
          </div>
        </div>
      </OverlayModal>
    </>
  )
}
