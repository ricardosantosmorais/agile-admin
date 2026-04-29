'use client'

import { Copy, Eye, Pencil, Plus, RefreshCcw, Search as SearchIcon, Send, Trash2, Users } from 'lucide-react'
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
import type { CrudListFilters, CrudListRecord, CrudRecord } from '@/src/components/crud-base/types'
import { NotificacaoPainelPreviewModal } from '@/src/features/notificacoes-painel/components/notificacao-painel-preview-modal'
import { NotificacaoPainelUsuariosModal } from '@/src/features/notificacoes-painel/components/notificacao-painel-usuarios-modal'
import { notificacoesPainelClient } from '@/src/features/notificacoes-painel/services/notificacoes-painel-client'
import { NOTIFICACOES_PAINEL_CONFIG } from '@/src/features/notificacoes-painel/services/notificacoes-painel-config'
import { getNotificacaoPainelChannelLabel, isPublished } from '@/src/features/notificacoes-painel/services/notificacoes-painel-mappers'
import { useI18n } from '@/src/i18n/use-i18n'
import { formatDateTime } from '@/src/lib/date-time'

type PendingAction = { type: 'duplicate' | 'publish'; id: string; title: string } | null

function isTruthy(value: unknown) {
  return value === true || value === 1 || value === '1'
}

function formatPeriod(record: CrudRecord) {
  const start = record.data_inicio ? formatDateTime(String(record.data_inicio)) : '-'
  const end = record.data_fim ? formatDateTime(String(record.data_fim)) : '-'
  return `${start} até ${end}`
}

export function NotificacoesPainelListPage() {
  const { t } = useI18n()
  const access = useFeatureAccess('notificacoesPainel')
  const controller = useCrudListController(NOTIFICACOES_PAINEL_CONFIG, notificacoesPainelClient, access.canDelete)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [feedbackTone, setFeedbackTone] = useState<'success' | 'error'>('success')
  const [previewRecord, setPreviewRecord] = useState<CrudRecord | null>(null)
  const [usersNotificationId, setUsersNotificationId] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [isActionLoading, setIsActionLoading] = useState(false)

  const columns = useMemo<AppDataTableColumn<CrudListRecord, CrudListFilters>[]>(() => [
    {
      id: 'id',
      label: t('simpleCrud.fields.id', 'ID'),
      sortKey: 'id',
      thClassName: 'w-[90px]',
      cell: (record) => String(record.id || '-'),
      filter: { id: 'id', kind: 'text', key: 'id', label: t('simpleCrud.fields.id', 'ID') },
    },
    {
      id: 'titulo',
      label: t('simpleCrud.fields.title', 'Título'),
      sortKey: 'titulo',
      tdClassName: 'font-semibold text-[color:var(--app-text)]',
      cell: (record) => String(record.titulo || '-'),
      filter: { id: 'titulo', kind: 'text', key: 'titulo::like', label: t('simpleCrud.fields.title', 'Título') },
    },
    {
      id: 'data_inicio',
      label: t('panelNotifications.fields.displayPeriod', 'Exibição'),
      sortKey: 'data_inicio',
      cell: formatPeriod,
      filter: { id: 'data_inicio', kind: 'date-range', fromKey: 'data_inicio::ge', toKey: 'data_fim::le', label: t('panelNotifications.fields.displayPeriod', 'Exibição') },
    },
    {
      id: 'canal',
      label: t('panelNotifications.fields.channel', 'Canal'),
      sortKey: 'canal',
      cell: (record) => getNotificacaoPainelChannelLabel(record.canal),
      filter: { id: 'canal', kind: 'select', key: 'canal', label: t('panelNotifications.fields.channel', 'Canal'), options: [
        { value: 'todos', label: t('panelNotifications.channels.all', 'Todos') },
        { value: 'admin', label: t('panelNotifications.channels.admin', 'Admin') },
        { value: 'email', label: t('panelNotifications.channels.email', 'E-mail') },
        { value: 'novidades', label: t('panelNotifications.channels.news', 'Novidades') },
      ] },
    },
    {
      id: 'publicado',
      label: t('panelNotifications.fields.published', 'Publicada'),
      sortKey: 'publicado',
      cell: (record) => <StatusBadge tone={isPublished(record.publicado) ? 'success' : 'warning'}>{isPublished(record.publicado) ? t('common.yes', 'Sim') : t('common.no', 'Não')}</StatusBadge>,
      filter: { id: 'publicado', kind: 'select', key: 'publicado', label: t('panelNotifications.fields.published', 'Publicada'), options: [{ value: '1', label: t('common.yes', 'Sim') }, { value: '0', label: t('common.no', 'Não') }] },
    },
    {
      id: 'ativo',
      label: t('simpleCrud.fields.active', 'Ativo'),
      sortKey: 'ativo',
      cell: (record) => <StatusBadge tone={isTruthy(record.ativo) ? 'success' : 'warning'}>{isTruthy(record.ativo) ? t('common.yes', 'Sim') : t('common.no', 'Não')}</StatusBadge>,
      filter: { id: 'ativo', kind: 'select', key: 'ativo', label: t('simpleCrud.fields.active', 'Ativo'), options: [{ value: '1', label: t('common.yes', 'Sim') }, { value: '0', label: t('common.no', 'Não') }] },
    },
  ], [t])

  if (!access.canList) {
    return <AccessDeniedState title={t('panelNotifications.title', 'Notificações')} backHref="/dashboard" />
  }

  function showFeedback(message: string, tone: 'success' | 'error' = 'success') {
    setFeedback(message)
    setFeedbackTone(tone)
  }

  async function openPreview(id: string) {
    try {
      const record = await notificacoesPainelClient.getById(id)
      setPreviewRecord(record)
    } catch (error) {
      showFeedback(error instanceof Error ? error.message : t('panelNotifications.preview.loadError', 'Não foi possível carregar a pré-visualização.'), 'error')
    }
  }

  async function executePendingAction() {
    if (!pendingAction) return
    setIsActionLoading(true)
    try {
      if (pendingAction.type === 'duplicate') {
        await notificacoesPainelClient.duplicate(pendingAction.id)
        showFeedback(t('panelNotifications.feedback.duplicated', 'Notificação duplicada com sucesso.'))
      } else {
        await notificacoesPainelClient.publish(pendingAction.id)
        showFeedback(t('panelNotifications.feedback.published', 'Notificação publicada com sucesso.'))
      }
      setPendingAction(null)
      controller.refreshList()
    } catch (error) {
      showFeedback(error instanceof Error ? error.message : t('panelNotifications.feedback.actionError', 'Não foi possível concluir a ação.'), 'error')
    } finally {
      setIsActionLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={[
          { label: t('routes.dashboard', 'Home'), href: '/dashboard' },
          { label: t('panelNotifications.title', 'Notificações'), href: '/notificacoes-painel' },
        ]}
        actions={<DataTableSectionAction label={t('simpleCrud.refresh', 'Atualizar')} icon={RefreshCcw} onClick={controller.refreshList} />}
      />

      <AsyncState isLoading={controller.isLoading} error={controller.error?.message}>
        <PageToast message={feedback} tone={feedbackTone} onClose={() => setFeedback(null)} />

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
                  controller.deleteSelectionVisible
                    ? {
                        label: t('simpleCrud.deleteSelected', 'Excluir ({{count}})', { count: controller.tableState.selectedIds.length }),
                        icon: Trash2,
                        onClick: () => controller.setConfirmDeleteIds(controller.tableState.selectedIds),
                        tone: 'danger',
                      }
                    : null,
                  access.canCreate ? { label: t('common.new', 'Novo'), icon: Plus, href: '/notificacoes-painel/novo', tone: 'primary' } : null,
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
            emptyMessage={t('panelNotifications.empty', 'Nenhuma notificação encontrada com os filtros atuais.')}
            columns={columns}
            sort={{ activeColumn: controller.filters.orderBy, direction: controller.filters.sort, onToggle: controller.tableState.toggleSort }}
            selectable
            selectedIds={controller.tableState.selectedIds}
            allSelected={controller.tableState.allSelected}
            onToggleSelect={controller.tableState.toggleSelection}
            onToggleSelectAll={controller.tableState.toggleSelectAll}
            rowActions={(record) => [
              { id: 'edit', label: access.canEdit ? t('simpleCrud.actions.edit', 'Editar') : t('simpleCrud.actions.view', 'Visualizar'), icon: access.canEdit ? Pencil : SearchIcon, href: `/notificacoes-painel/${record.id}/editar`, visible: access.canEdit || access.canView },
              { id: 'preview', label: t('panelNotifications.actions.preview', 'Visualizar'), icon: Eye, onClick: () => void openPreview(record.id), visible: access.canView || access.canEdit },
              { id: 'duplicate', label: t('panelNotifications.actions.duplicate', 'Duplicar'), icon: Copy, onClick: () => setPendingAction({ type: 'duplicate', id: record.id, title: String(record.titulo || record.id) }), visible: access.canCreate },
              { id: 'publish', label: t('panelNotifications.actions.publish', 'Publicar'), icon: Send, onClick: () => setPendingAction({ type: 'publish', id: record.id, title: String(record.titulo || record.id) }), visible: access.canEdit && !isPublished(record.publicado) },
              { id: 'users', label: t('panelNotifications.actions.viewUsers', 'Visualizar usuários'), icon: Users, onClick: () => setUsersNotificationId(record.id), visible: access.canView || access.canEdit },
              { id: 'delete', label: t('simpleCrud.actions.delete', 'Excluir'), icon: Trash2, onClick: () => controller.setConfirmDeleteIds([record.id]), tone: 'danger', visible: access.canDelete },
            ]}
            mobileCard={{
              title: (record) => String(record.titulo || '-'),
              subtitle: formatPeriod,
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
        title={t('simpleCrud.confirmDeleteTitle', 'Excluir registro?')}
        description={controller.confirmDeleteIds && controller.confirmDeleteIds.length > 1
          ? t('simpleCrud.confirmDeleteMany', 'Os registros selecionados serão excluídos. Esta ação não poderá ser desfeita.')
          : t('simpleCrud.confirmDeleteSingle', 'O registro selecionado será excluído. Esta ação não poderá ser desfeita.')}
        confirmLabel={t('simpleCrud.actions.delete', 'Excluir')}
        cancelLabel={t('common.cancel', 'Cancelar')}
        onClose={() => controller.setConfirmDeleteIds(null)}
        onConfirm={() => void controller.handleDelete(controller.confirmDeleteIds ?? [])}
      />

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={pendingAction?.type === 'publish' ? t('panelNotifications.confirm.publishTitle', 'Confirma publicação?') : t('panelNotifications.confirm.duplicateTitle', 'Confirma duplicação?')}
        description={pendingAction?.type === 'publish'
          ? t('panelNotifications.confirm.publishDescription', 'A publicação envia a notificação para as empresas vinculadas ou para o público geral quando não houver vínculos específicos.')
          : t('panelNotifications.confirm.duplicateDescription', 'Uma cópia será criada como rascunho não publicado.')}
        confirmLabel={pendingAction?.type === 'publish' ? t('panelNotifications.actions.publish', 'Publicar') : t('panelNotifications.actions.duplicate', 'Duplicar')}
        cancelLabel={t('common.cancel', 'Cancelar')}
        isLoading={isActionLoading}
        onClose={() => setPendingAction(null)}
        onConfirm={() => void executePendingAction()}
      />

      <NotificacaoPainelPreviewModal open={Boolean(previewRecord)} record={previewRecord} onClose={() => setPreviewRecord(null)} />
      <NotificacaoPainelUsuariosModal open={Boolean(usersNotificationId)} id={usersNotificationId} onClose={() => setUsersNotificationId(null)} />
    </div>
  )
}
