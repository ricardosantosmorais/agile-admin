'use client'

import { Pencil, RefreshCcw, Sparkles, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import type { CrudListFilters, CrudListRecord, CrudModuleConfig } from '@/src/components/crud-base/types'
import { useCrudListController } from '@/src/components/crud-base/use-crud-list-controller'
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
import { produtosPrecificadoresClient } from '@/src/features/produtos-precificadores/services/produtos-precificadores-client'
import { PRODUTOS_PRECIFICADORES_LIST_CONFIG } from '@/src/features/produtos-precificadores/services/produtos-precificadores-list-config'
import { useI18n } from '@/src/i18n/use-i18n'

const ORIGIN_BADGE_TONES: Record<string, 'neutral' | 'info' | 'warning' | 'success'> = {
  balcao: 'neutral',
  ecommerce: 'info',
  televendas: 'warning',
  app: 'success',
}

function resolveFilterConfig(
  column: typeof PRODUTOS_PRECIFICADORES_LIST_CONFIG.columns[number],
  t: ReturnType<typeof useI18n>['t'],
): AppDataTableFilterConfig<CrudListFilters> | undefined {
  if (!column.filter) return undefined
  const label = t(column.labelKey, column.label)

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

export function ProdutosPrecificadoresListPage() {
  const { t } = useI18n()
  const config = PRODUTOS_PRECIFICADORES_LIST_CONFIG
  const access = useFeatureAccess(config.featureKey)
  const client = useMemo(
    () => ({
      list: produtosPrecificadoresClient.list,
      getById: async () => ({}),
      save: async () => [],
      delete: produtosPrecificadoresClient.delete,
      listOptions: async () => [],
    }),
    [],
  )
  const controller = useCrudListController(config as unknown as CrudModuleConfig, client, access.canDelete)

  const columns = useMemo(
    () =>
      config.columns.map(
        (column) =>
          ({
            id: column.id,
            label: t(column.labelKey, column.label),
            sortKey: column.sortKey,
            filter: resolveFilterConfig(column, t),
            tdClassName: 'tdClassName' in column ? column.tdClassName : undefined,
            cell: (record: CrudListRecord) => {
              if (column.id === 'ativo' && column.render) {
                return column.render(record)
              }

              if (column.id === 'tipo') {
                const value = String(record.tipo || '-')
                return <StatusBadge tone="neutral">{value === '-' ? value : value.replace(/_/g, ' ')}</StatusBadge>
              }

              if (column.id === 'origem') {
                const value = String(record.origem || '-')
                return (
                  <StatusBadge tone={ORIGIN_BADGE_TONES[value] ?? 'neutral'}>
                    {value === '-' ? value : value.replace(/_/g, ' ')}
                  </StatusBadge>
                )
              }

              if (column.id === 'id') {
                const rowId = String(record.id || '-')
                const isChild = typeof record.id_pai === 'string' && record.id_pai.trim().length > 0
                const showChildBadge = controller.filters.incluirDependentes === '1' && isChild
                return (
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm text-slate-600">{rowId}</span>
                    {showChildBadge ? <StatusBadge tone="warning">Dependente</StatusBadge> : null}
                  </div>
                )
              }

              return <span className="truncate">{String(record[column.id] ?? '-')}</span>
            },
          }) satisfies AppDataTableColumn<CrudListRecord, CrudListFilters>,
      ),
    [config.columns, controller.filters.incluirDependentes, t],
  )

  const filterColumns = useMemo(
    () => [
      ...columns,
      {
        id: 'incluirDependentes',
        label: t('priceStock.productPricers.filters.includeChildren', 'Exibir dependentes'),
        cell: () => null,
        filter: {
          id: 'incluirDependentes',
          label: t('priceStock.productPricers.filters.includeChildren', 'Exibir dependentes'),
          kind: 'select' as const,
          key: 'incluirDependentes',
          options: [
            { value: '1', label: t('common.yes', 'Sim') },
            { value: '0', label: t('common.no', 'Não') },
          ],
        },
      } satisfies AppDataTableColumn<CrudListRecord, CrudListFilters>,
    ],
    [columns, t],
  )

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
                  access.canCreate
                    ? {
                        label: t('priceStock.productPricers.actions.creationAssistant', 'Assistente de criação'),
                        icon: Sparkles,
                        href: `${config.routeBase}/novo`,
                        tone: 'primary',
                      }
                    : null,
                ]}
              />
            </div>
          }
        >
          <DataTableFiltersCard<CrudListFilters>
            variant="embedded"
            columns={filterColumns as AppDataTableColumn<unknown, CrudListFilters>[]}
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
            getRowId={(record) => String(record.id)}
            columns={columns}
            emptyMessage={t('simpleCrud.empty', 'No records found with the current filters.')}
            sort={{ activeColumn: controller.filters.orderBy, direction: controller.filters.sort, onToggle: controller.tableState.toggleSort }}
            rowActions={(record) => [
              {
                id: 'edit',
                label: t('simpleCrud.actions.edit', 'Edit'),
                icon: Pencil,
                href: `${config.routeBase}/${String((record.wizardId as string | undefined) || record.id)}/editar`,
                visible: access.canEdit || access.canView,
              },
              {
                id: 'delete',
                label: t('simpleCrud.actions.delete', 'Delete'),
                icon: Trash2,
                onClick: () => controller.setConfirmDeleteIds([String(record.id)]),
                tone: 'danger',
                visible: access.canDelete,
              },
            ]}
            selectable
            selectedIds={controller.tableState.selectedIds}
            allSelected={controller.tableState.allSelected}
            onToggleSelect={controller.tableState.toggleSelection}
            onToggleSelectAll={controller.tableState.toggleSelectAll}
            mobileCard={{
              title: (record) => String(record.nome || '-'),
              subtitle: (record) => String(record.tipo || '-'),
              meta: (record) => ((record.ativo === true || record.ativo === 1 || record.ativo === '1') ? 'Sim' : 'Não'),
            }}
            pagination={
              controller.meta
                ? {
                    from: controller.meta.from,
                    to: controller.meta.to,
                    total: controller.meta.total,
                    page: controller.meta.page,
                    pages: controller.meta.pages,
                    perPage: controller.meta.perPage,
                  }
                : undefined
            }
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
