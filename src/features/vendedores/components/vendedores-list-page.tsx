'use client'

import { Pencil, Plus, RefreshCcw, Search as SearchIcon, Trash2, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AppDataTable } from '@/src/components/data-table/app-data-table'
import { DataTableFiltersCard } from '@/src/components/data-table/data-table-filters'
import { DataTableFilterToggleAction, DataTablePageActions, DataTableSectionAction } from '@/src/components/data-table/data-table-toolbar'
import type { AppDataTableColumn } from '@/src/components/data-table/types'
import { AsyncState } from '@/src/components/ui/async-state'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { PageHeader } from '@/src/components/ui/page-header'
import { SectionCard } from '@/src/components/ui/section-card'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
import { useCrudListController } from '@/src/components/crud-base/use-crud-list-controller'
import type { CrudListFilters, CrudListRecord } from '@/src/components/crud-base/types'
import { useI18n } from '@/src/i18n/use-i18n'
import { VendedorLinkedUsersModal } from '@/src/features/vendedores/components/vendedor-linked-users-modal'
import { VENDEDORES_CONFIG } from '@/src/features/vendedores/services/vendedores-config'
import { getVendedorLinkedUsers, unlinkVendedorLinkedUser, vendedoresClient } from '@/src/features/vendedores/services/vendedores-client'
import type { VendedorLinkedUser } from '@/src/features/vendedores/types/vendedores'

function resolveFilterConfig(column: typeof VENDEDORES_CONFIG.columns[number], t: ReturnType<typeof useI18n>['t']) {
  if (!column.filter) return undefined
  const label = t(column.filter.labelKey ?? column.labelKey, column.filter.label ?? column.label)
  if (column.filter.kind === 'select') {
    return {
      ...column.filter,
      id: column.id,
      label,
      options: column.filter.options.map((option) => ({ ...option })),
    }
  }
  return { ...column.filter, id: column.id, label }
}

export function VendedoresListPage() {
  const { t } = useI18n()
  const access = useFeatureAccess('vendedores')
  const { session } = useAuth()
  const tenantUrl = session?.currentTenant.url ?? null
  const controller = useCrudListController(VENDEDORES_CONFIG, vendedoresClient, access.canDelete)
  const [linkedUsersVendor, setLinkedUsersVendor] = useState<CrudListRecord | null>(null)
  const [linkedUsers, setLinkedUsers] = useState<VendedorLinkedUser[]>([])
  const [linkedUsersLoading, setLinkedUsersLoading] = useState(false)
  const [linkedUsersError, setLinkedUsersError] = useState<string>()
  const [confirmUnlinkUserId, setConfirmUnlinkUserId] = useState<string | null>(null)

  const columns = useMemo(() => {
    const mapped: AppDataTableColumn<CrudListRecord, CrudListFilters>[] = VENDEDORES_CONFIG.columns.map((column) => ({
      id: column.id,
      label: t(column.labelKey, column.label),
      sortKey: column.sortKey,
      visibility: column.visibility,
      thClassName: column.thClassName,
      tdClassName: column.tdClassName,
      filter: resolveFilterConfig(column, t),
      cell: (record: CrudListRecord) => {
        if (column.render) {
          return column.render(record, { tenantUrl })
        }
        if (column.id === 'ativo' || column.id === 'bloqueado') {
          const checked = record[column.id] === true || record[column.id] === 1 || record[column.id] === '1'
          return <StatusBadge tone={checked ? 'success' : 'warning'}>{checked ? t('common.yes', 'Sim') : t('common.no', 'N?o')}</StatusBadge>
        }
        const value = column.valueKey ? record[column.valueKey] : record[column.id]
        return <span className="truncate">{String(value ?? '-')}</span>
      },
    }))
    return mapped
  }, [t, tenantUrl])

  async function openLinkedUsers(record: CrudListRecord) {
    setLinkedUsersVendor(record)
    setLinkedUsers([])
    setLinkedUsersError(undefined)
    setLinkedUsersLoading(true)
    try {
      const users = await getVendedorLinkedUsers(record.id)
      setLinkedUsers(users)
    } catch (error) {
      setLinkedUsersError(error instanceof Error ? error.message : t('people.sellers.modals.loadLinkedUsersError', 'N?o foi poss?vel carregar os usu?rios vinculados.'))
    } finally {
      setLinkedUsersLoading(false)
    }
  }

  async function handleRemoveLinkedUser(userId: string) {
    if (!linkedUsersVendor) return
    try {
      await unlinkVendedorLinkedUser(linkedUsersVendor.id, userId)
      const users = await getVendedorLinkedUsers(linkedUsersVendor.id)
      setLinkedUsers(users)
      controller.refreshList()
    } catch (error) {
      setLinkedUsersError(error instanceof Error ? error.message : t('people.sellers.modals.unlinkError', 'N?o foi poss?vel desvincular o usu?rio.'))
    }
  }

  if (!access.canList) {
    return <AccessDeniedState title={t('people.sellers.title', 'Vendedores')} backHref="/dashboard" />
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={[
          { label: t('routes.dashboard', 'In?cio'), href: '/dashboard' },
          { label: t('routes.people', 'Pessoas') },
          { label: t('people.sellers.title', 'Vendedores'), href: '/vendedores' },
        ]}
        actions={<DataTableSectionAction label={t('common.refresh', 'Atualizar')} icon={RefreshCcw} onClick={controller.refreshList} />}
      />

      <AsyncState isLoading={controller.isLoading} error={controller.error?.message}>
        <SectionCard
          action={
            <div className="flex w-full items-center justify-between gap-3">
              <DataTableFilterToggleAction
                expanded={controller.filtersExpanded}
                onClick={() => controller.setFiltersExpanded((current) => !current)}
                collapsedLabel={t('filters.button', 'Filtros')}
                expandedLabel={t('filters.hide', 'Ocultar filtros')}
              />
              <DataTablePageActions
                actions={[
                  access.canCreate ? { label: t('common.new', 'Novo'), icon: Plus, href: '/vendedores/novo', tone: 'primary' } : null,
                ]}
              />
            </div>
          }
        >
          <DataTableFiltersCard<CrudListFilters>
            variant="embedded"
            columns={columns as AppDataTableColumn<unknown, CrudListFilters>[]}
            draft={controller.filtersDraft}
            applied={controller.filters}
            expanded={controller.filtersExpanded}
            onToggleExpanded={() => controller.setFiltersExpanded((current) => !current)}
            onApply={controller.applyFilters}
            onClear={controller.clearFilters}
            patchDraft={controller.patchDraft}
          />
          <AppDataTable<CrudListRecord, string, CrudListFilters>
            rows={controller.rows}
            getRowId={(record) => record.id}
            emptyMessage={t('simpleCrud.empty', 'Nenhum registro encontrado com os filtros atuais.')}
            columns={columns}
            sort={{ activeColumn: controller.filters.orderBy, direction: controller.filters.sort, onToggle: controller.tableState.toggleSort }}
            rowActions={(record) => [
              { id: 'edit', label: access.canEdit ? t('simpleCrud.actions.edit', 'Editar') : t('simpleCrud.actions.view', 'Visualizar'), icon: access.canEdit ? Pencil : SearchIcon, href: `/vendedores/${record.id}/editar`, visible: access.canEdit || access.canView },
              { id: 'users', label: t('people.sellers.actions.linkedUsers', 'Usu?rios vinculados'), icon: Users, onClick: () => void openLinkedUsers(record), visible: access.canEdit || access.canView },
              { id: 'delete', label: t('simpleCrud.actions.delete', 'Excluir'), icon: Trash2, onClick: () => controller.setConfirmDeleteIds([record.id]), tone: 'danger', visible: access.canDelete },
            ]}
            selectable
            selectedIds={controller.tableState.selectedIds}
            allSelected={controller.tableState.allSelected}
            onToggleSelect={controller.tableState.toggleSelection}
            onToggleSelectAll={controller.tableState.toggleSelectAll}
            mobileCard={{ title: VENDEDORES_CONFIG.mobileTitle, subtitle: VENDEDORES_CONFIG.mobileSubtitle, meta: VENDEDORES_CONFIG.mobileMeta }}
            renderExpandedRow={VENDEDORES_CONFIG.details?.length ? (record) => (
              <div className="app-pane grid gap-3 rounded-[1.1rem] border p-4 md:grid-cols-2 xl:grid-cols-3">
                {VENDEDORES_CONFIG.details?.map((detail) => (
                  <div key={detail.key} className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-900">{t(detail.labelKey, detail.label)}:</span> {detail.render(record)}
                  </div>
                ))}
              </div>
            ) : undefined}
            expandedRowIds={controller.tableState.expandedRowIds}
            onToggleExpandedRow={VENDEDORES_CONFIG.details?.length ? controller.tableState.toggleExpandedRow : undefined}
            pagination={controller.meta ? {
              from: controller.meta.from,
              to: controller.meta.to,
              total: controller.meta.total,
              page: controller.meta.page,
              pages: controller.meta.pages,
              perPage: controller.meta.perPage,
            } : undefined}
            onPageChange={controller.tableState.setPage}
            pageSize={{ value: controller.filters.perPage, options: [15, 30, 45, 60], onChange: controller.setPerPage }}
          />
        </SectionCard>
      </AsyncState>

      <VendedorLinkedUsersModal
        open={Boolean(linkedUsersVendor)}
        vendedorNome={linkedUsersVendor ? String(linkedUsersVendor.nome || '-') : null}
        users={linkedUsers}
        isLoading={linkedUsersLoading}
        error={linkedUsersError}
        canDelete={access.canEdit}
        onClose={() => {
          setLinkedUsersVendor(null)
          setConfirmUnlinkUserId(null)
        }}
        onRemove={(userId) => setConfirmUnlinkUserId(userId)}
      />

      <ConfirmDialog
        open={Boolean(confirmUnlinkUserId)}
        title={t('people.sellers.modals.unlinkConfirmTitle', 'Remover usu?rio vinculado?')}
        description={t('people.sellers.modals.unlinkConfirmDescription', 'Essa a??o remove o v?nculo entre o usu?rio e o vendedor.')}
        confirmLabel={t('common.remove', 'Remover')}
        cancelLabel={t('common.cancel', 'Cancelar')}
        onClose={() => setConfirmUnlinkUserId(null)}
        onConfirm={() => {
          if (!confirmUnlinkUserId) return
          void handleRemoveLinkedUser(confirmUnlinkUserId)
          setConfirmUnlinkUserId(null)
        }}
      />

      <ConfirmDialog
        open={Boolean(controller.confirmDeleteIds?.length)}
        title={t('simpleCrud.confirmDeleteTitle', 'Delete record?')}
        description={controller.confirmDeleteIds && controller.confirmDeleteIds.length > 1
          ? t('simpleCrud.confirmDeleteMany', 'Os registros selecionados ser?o exclu?dos. Esta a??o n?o pode ser desfeita.')
          : t('simpleCrud.confirmDeleteSingle', 'O registro selecionado ser? exclu?do. Esta a??o n?o pode ser desfeita.')}
        confirmLabel={t('simpleCrud.actions.delete', 'Excluir')}
        cancelLabel={t('common.cancel', 'Cancelar')}
        onClose={() => controller.setConfirmDeleteIds(null)}
        onConfirm={() => void controller.handleDelete(controller.confirmDeleteIds ?? [])}
      />
    </div>
  )
}
