'use client'

import { Pencil, Plus, RefreshCcw, Search as SearchIcon, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { AppDataTable } from '@/src/components/data-table/app-data-table'
import { DataTableFiltersCard } from '@/src/components/data-table/data-table-filters'
import { DataTableFilterToggleAction, DataTablePageActions, DataTableSectionAction } from '@/src/components/data-table/data-table-toolbar'
import type { AppDataTableColumn, AppDataTableFilterConfig } from '@/src/components/data-table/types'
import { AsyncState } from '@/src/components/ui/async-state'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { PageHeader } from '@/src/components/ui/page-header'
import { SectionCard } from '@/src/components/ui/section-card'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
import { useI18n } from '@/src/i18n/use-i18n'
import { useCrudListController } from '@/src/components/crud-base/use-crud-list-controller'
import type { CrudDataClient, CrudListFilters, CrudListRecord, CrudModuleConfig, CrudRecord } from '@/src/components/crud-base/types'

function resolveFilterConfig(column: CrudModuleConfig['columns'][number], t: ReturnType<typeof useI18n>['t']): AppDataTableFilterConfig<CrudListFilters> | undefined {
  if (!column.filter) return undefined

  const label = t(column.filter.labelKey ?? column.labelKey, column.filter.label ?? column.label)
  switch (column.filter.kind) {
    case 'select':
      return {
        ...column.filter,
        id: column.id,
        label,
        options: column.filter.options.map((option) => ({
          ...option,
          label: option.labelKey
            ? t(option.labelKey, option.label)
            : option.value === '1'
              ? t('common.yes', 'Yes')
              : option.value === '0'
                ? t('common.no', 'No')
                : option.label,
        })),
      }
    case 'text':
    case 'date-range':
    case 'number-range':
    case 'custom':
      return { ...column.filter, id: column.id, label }
    default:
      return undefined
  }
}

export function CrudListPage({ config, client }: { config: CrudModuleConfig; client: CrudDataClient }) {
  const { t } = useI18n()
  const access = useFeatureAccess(config.featureKey)
  const { session } = useAuth()
  const tenantUrl = session?.currentTenant.url ?? null
  const controller = useCrudListController(config, client, access.canDelete)

  const columns = useMemo(() => config.columns.map((column) => ({
    id: column.id,
    label: t(column.labelKey, column.label),
    sortKey: column.sortKey,
    visibility: column.visibility,
    thClassName: column.thClassName,
    tdClassName: column.tdClassName,
    filter: resolveFilterConfig(column, t),
    cell: (record: CrudRecord) => {
      if (column.render) {
        return column.render(record, { tenantUrl })
      }
      if (column.id === 'ativo') {
        const activeValue = record.ativo as unknown
        const checked = activeValue === true || activeValue === 1 || activeValue === '1'
        return <StatusBadge tone={checked ? 'success' : 'warning'}>{checked ? t('common.yes', 'Yes') : t('common.no', 'No')}</StatusBadge>
      }
      if (column.id === 'disponivel') {
        const availableValue = record.disponivel as unknown
        const checked = availableValue === true || availableValue === 1 || availableValue === '1'
        return <StatusBadge tone={checked ? 'success' : 'warning'}>{checked ? t('common.yes', 'Yes') : t('common.no', 'No')}</StatusBadge>
      }
      const value = column.valueKey ? record[column.valueKey] : record[column.id]
      return <span className="truncate">{String(value ?? '-')}</span>
    },
  }) satisfies AppDataTableColumn<CrudRecord, CrudListFilters>), [config.columns, t, tenantUrl])

  if (!access.canList) {
    return <AccessDeniedState title={t(config.listTitleKey, config.listTitle)} backHref="/dashboard" />
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={[
          { label: t('routes.dashboard', 'Home'), href: '/dashboard' },
          { label: t(config.breadcrumbSectionKey, config.breadcrumbSection) },
          { label: t(config.breadcrumbModuleKey, config.breadcrumbModule), href: config.routeBase },
        ]}
        actions={<DataTableSectionAction label={t('simpleCrud.refresh', 'Refresh')} icon={RefreshCcw} onClick={controller.refreshList} />}
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
                  controller.deleteSelectionVisible
                    ? {
                        label: t('simpleCrud.deleteSelected', 'Delete ({{count}})', { count: controller.tableState.selectedIds.length }),
                        icon: Trash2,
                        onClick: () => controller.setConfirmDeleteIds(controller.tableState.selectedIds),
                        tone: 'danger',
                      }
                    : null,
                  access.canCreate ? { label: t('simpleCrud.createNew', 'New'), icon: Plus, href: `${config.routeBase}/novo`, tone: 'primary' } : null,
                ]}
              />
            </div>
          }
        >
          <DataTableFiltersCard<CrudListFilters>
            variant="embedded"
            columns={columns as AppDataTableColumn<unknown, CrudListFilters>[]}
            extraFilters={config.extraFilters?.map((filter, index) => resolveFilterConfig({
              id: `extra-filter-${index}`,
              labelKey: filter.labelKey ?? '',
              label: filter.label ?? '',
              filter,
            }, t)).filter(Boolean) as AppDataTableFilterConfig<CrudListFilters>[]}
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
            emptyMessage={t('simpleCrud.empty', 'No records found with the current filters.')}
            columns={columns}
            sort={{ activeColumn: controller.filters.orderBy, direction: controller.filters.sort, onToggle: controller.tableState.toggleSort }}
            rowActions={(record) => [
              { id: 'edit', label: access.canEdit ? t('simpleCrud.actions.edit', 'Edit') : t('simpleCrud.actions.view', 'View'), icon: access.canEdit ? Pencil : SearchIcon, href: `${config.routeBase}/${record.id}/editar`, visible: access.canEdit || access.canView },
              { id: 'delete', label: t('simpleCrud.actions.delete', 'Delete'), icon: Trash2, onClick: () => controller.setConfirmDeleteIds([record.id]), tone: 'danger', visible: access.canDelete },
            ]}
            selectable
            selectedIds={controller.tableState.selectedIds}
            allSelected={controller.tableState.allSelected}
            onToggleSelect={controller.tableState.toggleSelection}
            onToggleSelectAll={controller.tableState.toggleSelectAll}
            mobileCard={{ title: config.mobileTitle, subtitle: config.mobileSubtitle, meta: config.mobileMeta }}
            renderExpandedRow={config.details?.length ? (record) => (
              <div className="grid gap-3 rounded-[1.1rem] border border-[#ebe4d8] bg-white p-4 md:grid-cols-2 xl:grid-cols-3">
                {config.details?.map((detail) => (
                  <div key={detail.key} className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-900">{t(detail.labelKey, detail.label)}:</span> {detail.render(record)}
                  </div>
                ))}
              </div>
            ) : undefined}
            expandedRowIds={controller.tableState.expandedRowIds}
            onToggleExpandedRow={config.details?.length ? controller.tableState.toggleExpandedRow : undefined}
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
        description={controller.confirmDeleteIds && controller.confirmDeleteIds.length > 1
          ? t('simpleCrud.confirmDeleteMany', 'The selected records will be deleted. This action cannot be undone.')
          : t('simpleCrud.confirmDeleteSingle', 'The selected record will be deleted. This action cannot be undone.')}
        confirmLabel={t('simpleCrud.actions.delete', 'Delete')}
        cancelLabel={t('common.cancel', 'Cancel')}
        onClose={() => controller.setConfirmDeleteIds(null)}
        onConfirm={() => void controller.handleDelete(controller.confirmDeleteIds ?? [])}
      />
    </div>
  )
}
