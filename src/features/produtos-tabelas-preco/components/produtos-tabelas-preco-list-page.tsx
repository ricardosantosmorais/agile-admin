'use client'

import { Pencil, RefreshCcw, Tags, Trash2 } from 'lucide-react'
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
import { useCrudListController } from '@/src/components/crud-base/use-crud-list-controller'
import { produtosTabelasPrecoClient } from '@/src/features/produtos-tabelas-preco/services/produtos-tabelas-preco-client'
import { PRODUTOS_TABELAS_PRECO_LIST_CONFIG } from '@/src/features/produtos-tabelas-preco/services/produtos-tabelas-preco-list-config'
import { useI18n } from '@/src/i18n/use-i18n'
import type { CrudListFilters, CrudListRecord } from '@/src/components/crud-base/types'

function resolveFilterConfig(column: typeof PRODUTOS_TABELAS_PRECO_LIST_CONFIG.columns[number], t: ReturnType<typeof useI18n>['t']): AppDataTableFilterConfig<CrudListFilters> | undefined {
  if (!column.filter) return undefined
  const label = t(column.labelKey, column.label)
  if (column.filter.kind === 'select') {
    return {
      ...column.filter,
      id: column.id,
      label,
      options: column.filter.options.map((option) => ({
        ...option,
        label: option.value === '1' ? t('common.yes', 'Yes') : option.value === '0' ? t('common.no', 'No') : option.label,
      })),
    }
  }
  return { ...column.filter, id: column.id, label }
}

export function ProdutosTabelasPrecoListPage() {
  const { t } = useI18n()
  const config = PRODUTOS_TABELAS_PRECO_LIST_CONFIG
  const access = useFeatureAccess(config.featureKey)
  const client = useMemo(() => ({
    list: produtosTabelasPrecoClient.list,
    getById: async () => ({}),
    save: async () => [],
    delete: produtosTabelasPrecoClient.delete,
    listOptions: async () => [],
  }), [])
  const controller = useCrudListController(
    config,
    client,
    access.canDelete,
  )

  const columns = useMemo(() => config.columns.map((column) => ({
    id: column.id,
    label: t(column.labelKey, column.label),
    sortKey: column.sortKey,
    filter: resolveFilterConfig(column, t),
    tdClassName: column.tdClassName,
    cell: (record: CrudListRecord) => {
      if (column.id === 'ativo') {
        const checked = record.ativo === true || record.ativo === 1 || record.ativo === '1'
        return <StatusBadge tone={checked ? 'success' : 'warning'}>{checked ? t('common.yes', 'Yes') : t('common.no', 'No')}</StatusBadge>
      }
      if (column.render) {
        return column.render(record, {})
      }
      return <span className="truncate">{String(record[column.id] ?? '-')}</span>
    },
  }) satisfies AppDataTableColumn<CrudListRecord, CrudListFilters>), [config.columns, t])

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
        actions={<DataTableSectionAction label={t('common.refresh', 'Refresh')} icon={RefreshCcw} onClick={controller.refreshList} />}
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
                  access.canCreate ? { label: t('priceStock.productPriceTables.quickPricingAction', 'Precificação rápida'), icon: Tags, href: `${config.routeBase}/novo`, tone: 'primary' } : null,
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
            emptyMessage={t('simpleCrud.empty', 'No records found with the current filters.')}
            columns={columns}
            sort={{ activeColumn: controller.filters.orderBy, direction: controller.filters.sort, onToggle: controller.tableState.toggleSort }}
            rowActions={(record) => [
              { id: 'edit', label: t('simpleCrud.actions.edit', 'Edit'), icon: Pencil, href: `${config.routeBase}/${String(record.id_produto)}/editar`, visible: access.canEdit || access.canView },
              { id: 'delete', label: t('simpleCrud.actions.delete', 'Delete'), icon: Trash2, onClick: () => controller.setConfirmDeleteIds([record.id]), tone: 'danger', visible: access.canDelete },
            ]}
            selectable
            selectedIds={controller.tableState.selectedIds}
            allSelected={controller.tableState.allSelected}
            onToggleSelect={controller.tableState.toggleSelection}
            onToggleSelectAll={controller.tableState.toggleSelectAll}
            mobileCard={{ title: config.mobileTitle, subtitle: config.mobileSubtitle, meta: config.mobileMeta }}
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
        description={t('simpleCrud.confirmDeleteSingle', 'The selected record will be deleted. This action cannot be undone.')}
        confirmLabel={t('simpleCrud.actions.delete', 'Delete')}
        cancelLabel={t('common.cancel', 'Cancel')}
        onClose={() => controller.setConfirmDeleteIds(null)}
        onConfirm={() => void controller.handleDelete(controller.confirmDeleteIds ?? [])}
      />
    </div>
  )
}
