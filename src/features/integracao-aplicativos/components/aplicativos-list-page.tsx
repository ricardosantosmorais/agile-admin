'use client'

import { Copy, Eye, KeyRound, Pencil, Plus, RefreshCcw, ShieldCheck, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useCrudListController } from '@/src/components/crud-base/use-crud-list-controller'
import { AppDataTable } from '@/src/components/data-table/app-data-table'
import { DataTableFiltersCard } from '@/src/components/data-table/data-table-filters'
import {
  DataTableFilterToggleAction,
  DataTablePageActions,
  DataTableSectionAction,
} from '@/src/components/data-table/data-table-toolbar'
import type { AppDataTableColumn } from '@/src/components/data-table/types'
import type { CrudDataClient, CrudListFilters, CrudListRecord, CrudRecord } from '@/src/components/crud-base/types'
import { AsyncState } from '@/src/components/ui/async-state'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { PageHeader } from '@/src/components/ui/page-header'
import { PageToast } from '@/src/components/ui/page-toast'
import { SectionCard } from '@/src/components/ui/section-card'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import {
  INTEGRACAO_APLICATIVOS_CONFIG,
} from '@/src/features/integracao-aplicativos/services/integracao-aplicativos-config'
import type { AplicativoIntegracaoListFilters } from '@/src/features/integracao-aplicativos/services/integracao-aplicativos-mappers'
import { integracaoAplicativosClient } from '@/src/features/integracao-aplicativos/services/integracao-aplicativos-client'
import { useI18n } from '@/src/i18n/use-i18n'
import { copyTextToClipboard } from '@/src/lib/clipboard'
import { isTruthyFlag } from '@/src/lib/boolean-utils'

const aplicativosListClient: CrudDataClient = {
  async list(filters) {
    return integracaoAplicativosClient.list(filters as AplicativoIntegracaoListFilters)
  },
  async getById(id) {
    const record = await integracaoAplicativosClient.getById(id)
    return (record ?? {}) as CrudRecord
  },
  async save(payload) {
    const result = await integracaoAplicativosClient.save(payload as never)
    return [{ id: result.id }]
  },
  delete: async (ids) => {
    await integracaoAplicativosClient.delete(ids)
    return { success: true }
  },
  async listOptions() {
    return []
  },
}

export function AplicativosListPage() {
  const { t } = useI18n()
  const access = useFeatureAccess('integracaoAplicativos')
  const controller = useCrudListController(INTEGRACAO_APLICATIVOS_CONFIG, aplicativosListClient, access.canDelete)
  const [toast, setToast] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)

  const columns = useMemo(() => (
    INTEGRACAO_APLICATIVOS_CONFIG.columns.map((column) => ({
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
              {checked ? t('common.yes', 'Sim') : t('common.no', 'Não')}
            </StatusBadge>
          )
        }

        const value = column.valueKey ? record[column.valueKey] : record[column.id]
        return <span className="truncate">{String(value ?? '-')}</span>
      },
    })) satisfies AppDataTableColumn<CrudListRecord, CrudListFilters>[]
  ), [t])

  if (!access.canList) {
    return <AccessDeniedState title={t('integrationApps.title', 'Aplicativos')} backHref="/dashboard" />
  }

  async function copyCredential(value: string, successMessage: string) {
    try {
      await copyTextToClipboard(value)
      setToast({ tone: 'success', message: successMessage })
    } catch {
      setToast({ tone: 'error', message: t('integrationApps.feedback.copyError', 'Não foi possível copiar o valor.') })
    }
  }

  async function refreshSecret(id: string) {
    try {
      await integracaoAplicativosClient.refreshSecret(id)
      controller.refreshList()
      setToast({ tone: 'success', message: t('integrationApps.feedback.secretRefreshed', 'Secret renovado com sucesso.') })
    } catch (error) {
      setToast({
        tone: 'error',
        message: error instanceof Error
          ? error.message
          : t('integrationApps.feedback.secretRefreshError', 'Não foi possível renovar o secret.'),
      })
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={[
          { label: t('routes.dashboard', 'Início'), href: '/dashboard' },
          { label: t('menuKeys.api-de-integracao', 'API de Integração') },
          { label: t('integrationApps.title', 'Aplicativos'), href: '/api-de-integracao/aplicativos' },
        ]}
        actions={<DataTableSectionAction label={t('common.refresh', 'Atualizar')} icon={RefreshCcw} onClick={controller.refreshList} />}
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
                        label: t('integrationApps.deleteSelected', 'Excluir ({{count}})', { count: controller.tableState.selectedIds.length }),
                        icon: Trash2,
                        onClick: () => controller.setConfirmDeleteIds(controller.tableState.selectedIds),
                        tone: 'danger',
                      }
                    : null,
                  access.canCreate
                    ? {
                        label: t('integrationApps.create', 'Novo'),
                        icon: Plus,
                        href: '/api-de-integracao/aplicativos/novo',
                        tone: 'primary',
                      }
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
            emptyMessage={t('integrationApps.empty', 'Nenhum aplicativo encontrado com os filtros atuais.')}
            columns={columns}
            sort={{
              activeColumn: controller.filters.orderBy,
              direction: controller.filters.sort,
              onToggle: controller.tableState.toggleSort,
            }}
            selectable
            selectedIds={controller.tableState.selectedIds}
            allSelected={controller.tableState.allSelected}
            onToggleSelect={controller.tableState.toggleSelection}
            onToggleSelectAll={controller.tableState.toggleSelectAll}
            mobileCard={{
              title: (record) => String(record.nome || '-'),
              subtitle: (record) => String(record.email || '-'),
              meta: (record) => String(record.codigo || '-'),
              badges: (record) => {
                const checked = isTruthyFlag(record.ativo)
                return (
                  <StatusBadge tone={checked ? 'success' : 'warning'}>
                    {checked ? t('common.yes', 'Sim') : t('common.no', 'Não')}
                  </StatusBadge>
                )
              },
            }}
            rowActions={(record) => [
              {
                id: 'edit',
                label: access.canEdit
                  ? t('integrationApps.actions.edit', 'Alterar aplicativo')
                  : t('integrationApps.actions.view', 'Visualizar aplicativo'),
                icon: access.canEdit ? Pencil : Eye,
                href: `/api-de-integracao/aplicativos/${record.id}/editar`,
                visible: access.canEdit || access.canView,
              },
              {
                id: 'permissions',
                label: t('integrationApps.actions.permissions', 'Permissões de acesso'),
                icon: ShieldCheck,
                href: `/api-de-integracao/aplicativos/${record.id}/permissoes`,
                visible: access.canEdit || access.canView,
              },
              {
                id: 'copy-client-id',
                label: t('integrationApps.actions.copyClientId', 'Copiar Client ID'),
                icon: Copy,
                onClick: () => void copyCredential(String(record.login || ''), t('integrationApps.feedback.clientIdCopied', 'Client ID copiado.')),
                visible: access.canView,
              },
              {
                id: 'copy-secret',
                label: t('integrationApps.actions.copySecret', 'Copiar Secret'),
                icon: KeyRound,
                onClick: () => void copyCredential(String(record.senha || ''), t('integrationApps.feedback.secretCopied', 'Secret copiado.')),
                visible: access.canView,
              },
              {
                id: 'refresh-secret',
                label: t('integrationApps.actions.refreshSecret', 'Gerar novo secret'),
                icon: RefreshCcw,
                onClick: () => void refreshSecret(String(record.id || '')),
                visible: access.canEdit,
              },
              {
                id: 'delete',
                label: t('simpleCrud.actions.delete', 'Excluir'),
                icon: Trash2,
                tone: 'danger',
                onClick: () => controller.setConfirmDeleteIds([record.id]),
                visible: access.canDelete,
              },
            ]}
            pagination={controller.meta
              ? {
                  from: controller.meta.from,
                  to: controller.meta.to,
                  total: controller.meta.total,
                  page: controller.meta.page,
                  pages: controller.meta.pages,
                  perPage: controller.meta.perPage,
                }
              : undefined}
            onPageChange={controller.tableState.setPage}
            pageSize={{ value: controller.filters.perPage, options: [15, 30, 45, 60], onChange: controller.setPerPage }}
          />
        </SectionCard>
      </AsyncState>

      <ConfirmDialog
        open={Boolean(controller.confirmDeleteIds?.length)}
        title={t('simpleCrud.confirmDeleteTitle', 'Excluir registro?')}
        description={
          controller.confirmDeleteIds && controller.confirmDeleteIds.length > 1
            ? t('simpleCrud.confirmDeleteMany', 'Os registros selecionados serão excluídos. Esta ação não pode ser desfeita.')
            : t('simpleCrud.confirmDeleteSingle', 'O registro selecionado será excluído. Esta ação não pode ser desfeita.')
        }
        confirmLabel={t('simpleCrud.actions.delete', 'Excluir')}
        cancelLabel={t('common.cancel', 'Cancelar')}
        onClose={() => controller.setConfirmDeleteIds(null)}
        onConfirm={() => void controller.handleDelete(controller.confirmDeleteIds ?? [])}
      />

      {toast ? <PageToast tone={toast.tone} message={toast.message} onClose={() => setToast(null)} /> : null}
    </div>
  )
}

