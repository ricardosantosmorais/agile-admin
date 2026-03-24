'use client'

import { Eye, KeyRound, Pencil, Plus, RefreshCcw, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { useCrudListController } from '@/src/components/crud-base/use-crud-list-controller'
import { AppDataTable } from '@/src/components/data-table/app-data-table'
import { DataTableFiltersCard } from '@/src/components/data-table/data-table-filters'
import { DataTableFilterToggleAction, DataTablePageActions, DataTableSectionAction } from '@/src/components/data-table/data-table-toolbar'
import type { AppDataTableColumn } from '@/src/components/data-table/types'
import type { CrudDataClient, CrudListFilters, CrudListRecord, CrudRecord } from '@/src/components/crud-base/types'
import { AsyncState } from '@/src/components/ui/async-state'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { PageHeader } from '@/src/components/ui/page-header'
import { SectionCard } from '@/src/components/ui/section-card'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { administradoresClient } from '@/src/features/administradores/services/administradores-client'
import { ADMINISTRADORES_CONFIG } from '@/src/features/administradores/services/administradores-config'
import type { AdminListFilters } from '@/src/features/administradores/services/administradores-mappers'
import { useI18n } from '@/src/i18n/use-i18n'
import { isTruthyFlag } from '@/src/lib/boolean-utils'

const administradoresListClient: CrudDataClient = {
  async list(filters) {
    return administradoresClient.list(filters as AdminListFilters)
  },
  async getById(id) {
    const record = await administradoresClient.getById(id)
    return (record ?? {}) as CrudRecord
  },
  async save(payload) {
    const result = await administradoresClient.save(payload as never)
    return [{ id: result.id }]
  },
  delete: async (ids) => {
    await administradoresClient.delete(ids)
    return { success: true }
  },
  async listOptions() {
    return []
  },
}

export function AdministradoresListPage() {
  const { t } = useI18n()
  const access = useFeatureAccess('administradores')
  const controller = useCrudListController(ADMINISTRADORES_CONFIG, administradoresListClient, access.canDelete)

  const columns = useMemo(() => (
    ADMINISTRADORES_CONFIG.columns.map((column) => ({
      id: column.id,
      label: t(column.labelKey, column.label),
      sortKey: column.sortKey,
      visibility: column.visibility,
      thClassName: column.thClassName,
      tdClassName: column.tdClassName,
      filter: column.filter
        ? {
            ...column.filter,
            id: column.id,
            label: t(column.filter.labelKey ?? column.labelKey, column.filter.label ?? column.label),
          }
        : undefined,
      cell: (record: CrudListRecord) => {
        if (column.id === 'ativo') {
          const checked = isTruthyFlag(record.ativo)
          return (
            <StatusBadge tone={checked ? 'success' : 'warning'}>
              {checked ? t('common.yes', 'Yes') : t('common.no', 'No')}
            </StatusBadge>
          )
        }

        if (column.id === 'ultimoAcesso') {
          return (
            <div className="space-y-1">
              <div>{String(record.ultimoAcesso || '-')}</div>
              {record.ipUltimoAcesso ? <div className="text-xs text-slate-500">IP: {String(record.ipUltimoAcesso)}</div> : null}
            </div>
          )
        }

        const value = column.valueKey ? record[column.valueKey] : record[column.id]
        return <span className="truncate">{String(value ?? '-')}</span>
      },
    })) satisfies AppDataTableColumn<CrudListRecord, CrudListFilters>[]
  ), [t])

  if (!access.canList) {
    return <AccessDeniedState title={t('administradores.title', 'Administrators')} backHref="/dashboard" />
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={[
          { label: t('routes.dashboard', 'Home'), href: '/dashboard' },
          { label: t(ADMINISTRADORES_CONFIG.breadcrumbSectionKey, ADMINISTRADORES_CONFIG.breadcrumbSection) },
          { label: t(ADMINISTRADORES_CONFIG.breadcrumbModuleKey, ADMINISTRADORES_CONFIG.breadcrumbModule), href: ADMINISTRADORES_CONFIG.routeBase },
        ]}
        actions={<DataTableSectionAction label={t('common.refresh', 'Refresh')} icon={RefreshCcw} onClick={controller.refreshList} />}
      />

      <AsyncState isLoading={controller.isLoading} error={controller.error?.message}>
        <SectionCard
          action={(
            <div className="flex w-full items-center justify-between gap-3">
              <DataTableFilterToggleAction
                expanded={controller.filtersExpanded}
                onClick={() => controller.setFiltersExpanded((current) => !current)}
                collapsedLabel={t('filters.button', 'Filtros')}
                expandedLabel={t('filters.hide', 'Ocultar filtros')}
              />
              <DataTablePageActions
                actions={[
                  access.canDelete && controller.tableState.selectedIds.length > 0
                    ? {
                        label: t('administradores.deleteSelected', 'Delete ({{count}})', { count: controller.tableState.selectedIds.length }),
                        icon: Trash2,
                        onClick: () => controller.setConfirmDeleteIds(controller.tableState.selectedIds),
                        tone: 'danger',
                      }
                    : null,
                  access.canCreate
                    ? { label: t('administradores.create', 'New'), icon: Plus, href: '/administradores/novo', tone: 'primary' }
                    : null,
                ]}
              />
            </div>
          )}
        >
          <DataTableFiltersCard
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

          <AppDataTable
            rows={controller.rows}
            getRowId={(record) => record.id}
            emptyMessage={t('administradores.empty', 'No administrators found with the current filters.')}
            columns={columns}
            sort={{ activeColumn: controller.filters.orderBy, direction: controller.filters.sort, onToggle: controller.tableState.toggleSort }}
            selectable
            selectedIds={controller.tableState.selectedIds}
            allSelected={controller.tableState.allSelected}
            onToggleSelect={controller.tableState.toggleSelection}
            onToggleSelectAll={controller.tableState.toggleSelectAll}
            mobileCard={{
              title: (record) => String(record.nome || '-'),
              subtitle: (record) => String(record.email || '-'),
              meta: (record) => String(record.perfil || '-'),
              badges: (record) => {
                const checked = isTruthyFlag(record.ativo)
                return (
                  <StatusBadge tone={checked ? 'success' : 'warning'}>
                    {checked ? t('common.yes', 'Yes') : t('common.no', 'No')}
                  </StatusBadge>
                )
              },
            }}
            rowActions={(record) => [
              {
                id: 'edit',
                label: access.canEdit ? t('administradores.actions.edit', 'Edit administrator') : t('administradores.actions.view', 'View administrator'),
                icon: access.canEdit ? Pencil : Eye,
                href: `/administradores/${record.id}/editar`,
                visible: access.canEdit || access.canView,
              },
              {
                id: 'password',
                label: t('administradores.actions.password', 'Change password'),
                icon: KeyRound,
                href: `/administradores/${record.id}/senha`,
                visible: access.canEdit,
              },
              {
                id: 'delete',
                label: t('simpleCrud.actions.delete', 'Delete'),
                icon: Trash2,
                tone: 'danger',
                onClick: () => controller.setConfirmDeleteIds([record.id]),
                visible: access.canDelete,
              },
            ]}
            renderExpandedRow={ADMINISTRADORES_CONFIG.details?.length ? (record) => (
              <div className="grid gap-3 rounded-[1.1rem] border border-[#ebe4d8] bg-white p-4 md:grid-cols-2 xl:grid-cols-3">
                {ADMINISTRADORES_CONFIG.details?.map((detail) => (
                  <div key={detail.key} className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-900">{t(detail.labelKey, detail.label)}:</span> {detail.render(record)}
                  </div>
                ))}
              </div>
            ) : undefined}
            expandedRowIds={controller.tableState.expandedRowIds}
            onToggleExpandedRow={ADMINISTRADORES_CONFIG.details?.length ? controller.tableState.toggleExpandedRow : undefined}
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

      <ConfirmDialog
        open={Boolean(controller.confirmDeleteIds?.length)}
        title={t('simpleCrud.confirmDeleteTitle', 'Delete record?')}
        description={
          controller.confirmDeleteIds && controller.confirmDeleteIds.length > 1
            ? t('simpleCrud.confirmDeleteMany', 'The selected records will be deleted. This action cannot be undone.')
            : t('simpleCrud.confirmDeleteSingle', 'The selected record will be deleted. This action cannot be undone.')
        }
        confirmLabel={t('simpleCrud.actions.delete', 'Delete')}
        cancelLabel={t('common.cancel', 'Cancel')}
        onClose={() => controller.setConfirmDeleteIds(null)}
        onConfirm={() => void controller.handleDelete(controller.confirmDeleteIds ?? [])}
      />
    </div>
  )
}
