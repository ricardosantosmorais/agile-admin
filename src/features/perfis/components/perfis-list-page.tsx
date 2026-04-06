'use client'

import { Eye, Pencil, Plus, RefreshCcw, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import type { AppDataTableColumn } from '@/src/components/data-table/types'
import { useCrudListController } from '@/src/components/crud-base/use-crud-list-controller'
import type { CrudDataClient, CrudListFilters, CrudListRecord, CrudRecord } from '@/src/components/crud-base/types'
import { AppDataTable } from '@/src/components/data-table/app-data-table'
import { DataTableFiltersCard } from '@/src/components/data-table/data-table-filters'
import { DataTableFilterToggleAction, DataTablePageActions, DataTableSectionAction } from '@/src/components/data-table/data-table-toolbar'
import { AsyncState } from '@/src/components/ui/async-state'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { PageHeader } from '@/src/components/ui/page-header'
import { SectionCard } from '@/src/components/ui/section-card'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { perfisClient } from '@/src/features/perfis/services/perfis-client'
import { PERFIS_CONFIG } from '@/src/features/perfis/services/perfis-config'
import type { PerfilListFilters } from '@/src/features/perfis/services/perfis-mappers'
import { useI18n } from '@/src/i18n/use-i18n'
import { isTruthyFlag } from '@/src/lib/boolean-utils'

const perfisListClient: CrudDataClient = {
  async list(filters) {
    return perfisClient.list(filters as PerfilListFilters)
  },
  async getById(id) {
    return await perfisClient.getById(id) as CrudRecord
  },
  async save(payload) {
    const result = await perfisClient.save(payload as never, [])
    return [{ id: result.id }]
  },
  delete: async (ids) => {
    await perfisClient.delete(ids)
    return { success: true }
  },
  async listOptions() {
    return []
  },
}

export function PerfisListPage() {
  const { t } = useI18n()
  const access = useFeatureAccess('perfis')
  const controller = useCrudListController(PERFIS_CONFIG, perfisListClient, access.canDelete)

  const columns = useMemo(() => (
    PERFIS_CONFIG.columns.map((column) => ({
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

        const value = column.valueKey ? record[column.valueKey] : record[column.id]
        return <span className="truncate">{String(value ?? '-')}</span>
      },
    })) satisfies AppDataTableColumn<CrudListRecord, CrudListFilters>[]
  ), [t])

  if (!access.canList) {
    return <AccessDeniedState title={t('perfis.title', 'Perfis')} backHref="/dashboard" />
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={[
          { label: t('routes.dashboard', 'Home'), href: '/dashboard' },
          { label: t('routes.administration', 'Administration') },
          { label: t('routes.perfis', 'Profiles'), href: '/perfis' },
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
                        label: t('perfis.deleteSelected', 'Excluir ({{count}})', { count: controller.tableState.selectedIds.length }),
                        icon: Trash2,
                        onClick: () => controller.setConfirmDeleteIds(controller.tableState.selectedIds),
                        tone: 'danger',
                      }
                    : null,
                  access.canCreate
                    ? { label: t('perfis.create', 'Novo'), icon: Plus, href: '/perfis/novo', tone: 'primary' }
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
            emptyMessage={t('perfis.empty', 'Nenhum perfil encontrado com os filtros atuais.')}
            columns={columns}
            sort={{ activeColumn: controller.filters.orderBy, direction: controller.filters.sort, onToggle: controller.tableState.toggleSort }}
            selectable
            selectedIds={controller.tableState.selectedIds}
            allSelected={controller.tableState.allSelected}
            onToggleSelect={controller.tableState.toggleSelection}
            onToggleSelectAll={controller.tableState.toggleSelectAll}
            mobileCard={{
              title: (record) => String(record.nome || '-'),
              subtitle: (record) => String(record.codigo || '-'),
              meta: (record) => `#${String(record.id || '-')}`,
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
                label: access.canEdit ? t('perfis.actions.edit', 'Editar perfil') : t('perfis.actions.view', 'Visualizar perfil'),
                icon: access.canEdit ? Pencil : Eye,
                href: `/perfis/${record.id}/editar`,
                visible: access.canEdit || access.canView,
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
