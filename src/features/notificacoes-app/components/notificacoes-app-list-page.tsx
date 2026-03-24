'use client'

import { Copy, Pencil, Plus, RefreshCcw, Search as SearchIcon, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AppDataTable } from '@/src/components/data-table/app-data-table'
import { DataTableFiltersCard } from '@/src/components/data-table/data-table-filters'
import { DataTableFilterToggleAction, DataTablePageActions, DataTableSectionAction } from '@/src/components/data-table/data-table-toolbar'
import type { AppDataTableColumn } from '@/src/components/data-table/types'
import { AsyncState } from '@/src/components/ui/async-state'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { PageHeader } from '@/src/components/ui/page-header'
import { PageToast } from '@/src/components/ui/page-toast'
import { SectionCard } from '@/src/components/ui/section-card'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { useCrudListController } from '@/src/components/crud-base/use-crud-list-controller'
import type { CrudListFilters, CrudListRecord } from '@/src/components/crud-base/types'
import { notificacoesAppClient } from '@/src/features/notificacoes-app/services/notificacoes-app-client'
import { NOTIFICACOES_APP_CONFIG } from '@/src/features/notificacoes-app/services/notificacoes-app-config'
import { useI18n } from '@/src/i18n/use-i18n'
import { formatDateTime } from '@/src/lib/date-time'

export function NotificacoesAppListPage() {
  const { t } = useI18n()
  const access = useFeatureAccess('notificacoesApp')
  const controller = useCrudListController(NOTIFICACOES_APP_CONFIG, notificacoesAppClient, access.canDelete)
  const [feedback, setFeedback] = useState<string | null>(null)

  const columns = useMemo<AppDataTableColumn<CrudListRecord, CrudListFilters>[]>(() => [
    {
      id: 'id',
      label: t('simpleCrud.fields.id', 'ID'),
      sortKey: 'id',
      thClassName: 'w-[110px]',
      cell: (record) => String(record.id || '-'),
      filter: { id: 'id', kind: 'text', key: 'id', label: t('simpleCrud.fields.id', 'ID') },
    },
    {
      id: 'titulo',
      label: t('simpleCrud.fields.title', 'Título'),
      sortKey: 'titulo',
      tdClassName: 'font-semibold text-slate-950',
      cell: (record) => String(record.titulo || '-'),
      filter: { id: 'titulo', kind: 'text', key: 'titulo::like', label: t('simpleCrud.fields.title', 'Título') },
    },
    {
      id: 'data_envio',
      label: t('marketing.notifications.fields.sendAt', 'Data de envio'),
      sortKey: 'data_envio',
      cell: (record) => record.data_envio ? formatDateTime(String(record.data_envio)) : '-',
      filter: { id: 'data_envio', kind: 'date-range', fromKey: 'data_envio::ge', toKey: 'data_envio::le', label: t('marketing.notifications.fields.sendAt', 'Data de envio') },
    },
    {
      id: 'enviado',
      label: t('marketing.notifications.fields.sent', 'Enviado'),
      sortKey: 'enviado',
      thClassName: 'w-[110px]',
      cell: (record) => <StatusBadge tone={record.enviado === true || record.enviado === 1 || record.enviado === '1' ? 'success' : 'warning'}>{record.enviado === true || record.enviado === 1 || record.enviado === '1' ? t('common.yes', 'Yes') : t('common.no', 'No')}</StatusBadge>,
      filter: { id: 'enviado', kind: 'select', key: 'enviado', label: t('marketing.notifications.fields.sent', 'Enviado'), options: [{ value: '1', label: t('common.yes', 'Yes') }, { value: '0', label: t('common.no', 'No') }] },
    },
    {
      id: 'ativo',
      label: t('simpleCrud.fields.active', 'Ativo'),
      sortKey: 'ativo',
      thClassName: 'w-[100px]',
      cell: (record) => <StatusBadge tone={record.ativo === true || record.ativo === 1 || record.ativo === '1' ? 'success' : 'warning'}>{record.ativo === true || record.ativo === 1 || record.ativo === '1' ? t('common.yes', 'Yes') : t('common.no', 'No')}</StatusBadge>,
      filter: { id: 'ativo', kind: 'select', key: 'ativo', label: t('simpleCrud.fields.active', 'Ativo'), options: [{ value: '1', label: t('common.yes', 'Yes') }, { value: '0', label: t('common.no', 'No') }] },
    },
  ], [t])

  if (!access.canList) {
    return <AccessDeniedState title={t('marketing.notifications.title', 'Notificações App')} backHref="/dashboard" />
  }

  async function handleDuplicate(id: string) {
    try {
      await notificacoesAppClient.duplicate(id)
      controller.refreshList()
      setFeedback(t('marketing.notifications.feedback.duplicated', 'Notificação duplicada com sucesso.'))
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : t('marketing.notifications.feedback.duplicateError', 'Não foi possível duplicar a notificação.'))
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={[
          { label: t('routes.dashboard', 'Home'), href: '/dashboard' },
          { label: t('simpleCrud.sections.marketing', 'Marketing') },
          { label: t('menuKeys.notificacoes-app', 'Notificações App'), href: '/notificacoes-app' },
        ]}
        actions={<DataTableSectionAction label={t('simpleCrud.refresh', 'Atualizar')} icon={RefreshCcw} onClick={controller.refreshList} />}
      />

      <AsyncState isLoading={controller.isLoading} error={controller.error?.message}>
        <PageToast message={feedback} onClose={() => setFeedback(null)} />

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
                  access.canCreate ? { label: t('common.new', 'Novo'), icon: Plus, href: '/notificacoes-app/novo', tone: 'primary' } : null,
                ]}
              />
            </div>
          )}
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
            emptyMessage={t('marketing.notifications.empty', 'Nenhuma notificação encontrada com os filtros atuais.')}
            columns={columns}
            sort={{ activeColumn: controller.filters.orderBy, direction: controller.filters.sort, onToggle: controller.tableState.toggleSort }}
            selectable
            selectedIds={controller.tableState.selectedIds}
            allSelected={controller.tableState.allSelected}
            onToggleSelect={controller.tableState.toggleSelection}
            onToggleSelectAll={controller.tableState.toggleSelectAll}
            rowActions={(record) => [
              { id: 'edit', label: access.canEdit ? t('simpleCrud.actions.edit', 'Edit') : t('simpleCrud.actions.view', 'View'), icon: access.canEdit ? Pencil : SearchIcon, href: `/notificacoes-app/${record.id}/editar`, visible: access.canEdit || access.canView },
              { id: 'duplicate', label: t('marketing.notifications.actions.duplicate', 'Duplicar'), icon: Copy, onClick: () => void handleDuplicate(record.id), visible: access.canEdit || access.canCreate },
              { id: 'delete', label: t('simpleCrud.actions.delete', 'Delete'), icon: Trash2, onClick: () => controller.setConfirmDeleteIds([record.id]), tone: 'danger', visible: access.canDelete },
            ]}
            mobileCard={{
              title: (record) => String(record.titulo || '-'),
              subtitle: (record) => record.data_envio ? formatDateTime(String(record.data_envio)) : '-',
              meta: (record) => `ID: ${String(record.id || '-')}`,
            }}
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
