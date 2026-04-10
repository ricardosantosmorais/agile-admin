'use client'

import {
  Eye,
  FileSearch,
  LockOpen,
  Pencil,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react'
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
import { ClientLinkedSellersModal } from '@/src/features/clientes/components/client-linked-sellers-modal'
import { ClientLinkedUsersModal } from '@/src/features/clientes/components/client-linked-users-modal'
import { ClientUnlockModal } from '@/src/features/clientes/components/client-unlock-modal'
import { ClientViewModal } from '@/src/features/clientes/components/client-view-modal'
import { useClientesListController } from '@/src/features/clientes/hooks/use-clientes-list-controller'
import type { ClientListFilters, ClientListItem } from '@/src/features/clientes/types/clientes'
import { useI18n } from '@/src/i18n/use-i18n'
import { formatDate } from '@/src/lib/formatters'


export function ClientesListPage() {
  const { t } = useI18n()
  const access = useFeatureAccess('clientes')
  const {
    filters,
    filtersDraft,
    filtersExpanded,
    state,
    clients,
    meta,
    modal,
    modalLoading,
    modalError,
    linkedUsers,
    linkedSellers,
    unlockDescription,
    confirmState,
    setFiltersExpanded,
    setUnlockDescription,
    setConfirmState,
    patchDraft,
    applyFilters,
    clearFilters,
    setPerPage,
    refreshList,
    openLinkedUsers,
    openLinkedSellers,
    openUnlock,
    openView,
    handleUnlock,
    handleConfirmAction,
    closeModal,
    tableState,
  } = useClientesListController({ canDelete: access.canDelete })

  const columns: AppDataTableColumn<ClientListItem, ClientListFilters>[] = [
    {
      id: 'codigo',
      label: t('clientes.columns.codigo', 'Código'),
      sortKey: 'codigo',
      cell: (client) => <div className="truncate">{client.codigo || '-'}</div>,
      thClassName: 'w-[84px]',
      tdClassName: 'text-sm font-semibold text-slate-700',
      filter: {
        id: 'codigo',
        kind: 'text',
        key: 'codigo',
        label: t('clientes.columns.codigo', 'Código'),
      },
    },
    {
      id: 'cnpjCpf',
      label: t('clientes.columns.cnpjCpf', 'CPF/CNPJ'),
      sortKey: 'cnpj_cpf',
      cell: (client) => <div className="truncate">{client.cnpjCpf || '-'}</div>,
      thClassName: 'w-[152px]',
      tdClassName: 'text-sm text-slate-700',
      filter: {
        id: 'cnpjCpf',
        kind: 'text',
        key: 'cnpjCpf',
        label: t('clientes.columns.cnpjCpf', 'CPF/CNPJ'),
      },
    },
    {
      id: 'nome',
      label: t('clientes.columns.nomeRazaoSocial', 'Nome / Razão social'),
      sortKey: 'razao_social',
      cell: (client) => (
        <div className="min-w-0 max-w-full">
          <p className="truncate text-sm font-semibold text-slate-950">{client.nomeRazaoSocial || '-'}</p>
          <p className="mt-1 truncate text-xs text-slate-500">{client.inscricaoEstadual || t('clientes.details.noStateRegistration', 'Sem inscrição estadual')}</p>
        </div>
      ),
      filter: {
        id: 'nomeRazaoSocial',
        kind: 'text',
        key: 'nomeRazaoSocial',
        label: t('clientes.columns.nomeRazaoSocial', 'Nome / Razão social'),
      },
    },
    {
      id: 'ultimoPedido',
      label: t('clientes.columns.ultimoPedido', 'Último pedido'),
      sortKey: 'ultimo_pedido',
      cell: (client) => (client.ultimoPedido ? formatDate(client.ultimoPedido) : '-'),
      visibility: '2xl',
      thClassName: 'w-[118px]',
      tdClassName: 'text-sm text-slate-700',
      filter: {
        id: 'ultimoPedido',
        kind: 'date-range',
        label: t('clientes.columns.ultimoPedido', 'Último pedido'),
        fromKey: 'ultimoPedidoFrom',
        toKey: 'ultimoPedidoTo',
      },
    },
    {
      id: 'ativo',
      label: t('clientes.columns.ativo', 'Ativo'),
      cell: (client) => (
        <StatusBadge tone={client.ativo ? 'success' : 'warning'}>
          {client.ativo ? t('clientes.status.active', 'Ativo') : t('clientes.status.inactive', 'Inativo')}
        </StatusBadge>
      ),
      thClassName: 'w-[90px]',
      filter: {
        id: 'ativo',
        kind: 'select',
        key: 'ativo',
        label: t('clientes.columns.ativo', 'Ativo'),
        options: [
          { value: '1', label: t('clientes.status.yes', 'Sim') },
          { value: '0', label: t('clientes.status.no', 'Não') },
        ],
      },
    },
  ]

  const extraFilters: AppDataTableFilterConfig<ClientListFilters>[] = [
    {
      id: 'dataAtivacao',
      kind: 'date-range',
      label: t('clientes.columns.dataAtivacao', 'Data de ativação'),
      fromKey: 'dataAtivacaoFrom',
      toKey: 'dataAtivacaoTo',
    },
    {
      id: 'qtdPedidos',
      kind: 'number-range',
      label: t('clientes.columns.qtdPedidos', 'Qtd. pedidos'),
      fromKey: 'qtdPedidosFrom',
      toKey: 'qtdPedidosTo',
      inputMode: 'numeric',
    },
  ]

  function getClientRowActions(client: ClientListItem) {
    return [
      {
        id: 'view',
        label: t('clientes.actions.view', 'Visualizar'),
        icon: Eye,
        onClick: () => openView(client),
        visible: access.canView,
      },
      {
        id: 'edit',
        label: t('clientes.actions.edit', 'Alterar'),
        icon: Pencil,
        href: `/clientes/${client.id}/editar`,
        visible: access.canEdit,
      },
      {
        id: 'linked-users',
        label: t('clientes.actions.linkedUsers', 'Usuários vinculados'),
        icon: Users,
        onClick: () => void openLinkedUsers(client),
        visible: access.canView,
      },
      {
        id: 'linked-sellers',
        label: t('clientes.actions.linkedSellers', 'Vendedores vinculados'),
        icon: UserRound,
        onClick: () => void openLinkedSellers(client),
        visible: access.canView,
      },
      {
        id: 'delete',
        label: t('clientes.actions.delete', 'Excluir'),
        icon: Trash2,
        onClick: () => setConfirmState({ kind: 'delete-client', ids: [client.id] }),
        tone: 'danger' as const,
        visible: access.canDelete,
      },
      {
        id: 'unlock',
        label: t('clientes.actions.unlockClient', 'Desbloquear cliente'),
        icon: LockOpen,
        onClick: () => openUnlock(client, false),
        visible: access.canUnblockClient && client.bloqueado,
      },
      {
        id: 'unlock-platform',
        label: t('clientes.actions.unlockPlatform', 'Desbloquear cliente na plataforma'),
        icon: ShieldCheck,
        onClick: () => openUnlock(client, true),
        visible: access.canUnblockClient && client.bloqueadoPlataforma,
      },
      {
        id: 'logs',
        label: t('clientes.actions.logs', 'Logs'),
        icon: FileSearch,
        visible: access.canLogs,
      },
    ]
  }

  if (!access.canList) {
    return <AccessDeniedState title={t('clientes.accessDeniedTitle', 'Clientes')} backHref="/dashboard" />
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={[
          { label: t('routes.dashboard', 'Home'), href: '/dashboard' },
          { label: t('routes.people', 'People') },
          { label: t('clientes.title', 'Clientes'), href: '/clientes' },
        ]}
        actions={<DataTableSectionAction label={t('clientes.refresh', 'Atualizar')} icon={RefreshCcw} onClick={refreshList} />}
      />

      <AsyncState isLoading={state.isLoading} error={state.error?.message}>
        <SectionCard
          action={
            <div className="flex w-full items-center justify-between gap-3">
              <DataTableFilterToggleAction
                expanded={filtersExpanded}
                onClick={() => setFiltersExpanded((current) => !current)}
                collapsedLabel={t('filters.button', 'Filtros')}
                expandedLabel={t('filters.hide', 'Ocultar filtros')}
              />
              <DataTablePageActions
                actions={[
                  access.canCreate
                    ? {
                        label: t('clientes.create', 'Novo'),
                        icon: Plus,
                        href: '/clientes/novo',
                        tone: 'primary',
                      }
                    : null,
                ]}
              />
            </div>
          }
        >
          <DataTableFiltersCard<ClientListFilters>
            variant="embedded"
            columns={columns as AppDataTableColumn<unknown, ClientListFilters>[]}
            extraFilters={extraFilters}
            draft={filtersDraft}
            applied={filters}
            expanded={filtersExpanded}
            onToggleExpanded={() => setFiltersExpanded((current) => !current)}
            onApply={applyFilters}
            onClear={clearFilters}
            patchDraft={patchDraft}
          />
          <AppDataTable<ClientListItem, ClientListFilters['orderBy'], ClientListFilters>
            rows={clients}
            getRowId={(client) => client.id}
            emptyMessage={t('clientes.empty', 'Nenhum cliente encontrado com os filtros atuais.')}
            sort={{
              activeColumn: filters.orderBy,
              direction: filters.sort,
              onToggle: tableState.toggleSort,
            }}
            rowActions={getClientRowActions}
            actionsColumnClassName="w-[260px] whitespace-nowrap"
            selectable
            selectedIds={tableState.selectedIds}
            allSelected={tableState.allSelected}
            onToggleSelect={tableState.toggleSelection}
            onToggleSelectAll={tableState.toggleSelectAll}
            mobileCard={{
              title: (client) => client.nomeRazaoSocial || '-',
              subtitle: (client) => client.cnpjCpf || '-',
              meta: (client) => `${t('clientes.details.code', 'Code')}: ${client.codigo || '-'}`,
              badges: (client) => (
                <>
                  <StatusBadge tone={client.ativo ? 'success' : 'warning'}>
                    {client.ativo ? t('clientes.status.active', 'Ativo') : t('clientes.status.inactive', 'Inativo')}
                  </StatusBadge>
                  <StatusBadge tone={client.bloqueado ? 'danger' : 'success'}>
                    {client.bloqueado ? t('clientes.status.blocked', 'Bloqueado') : t('clientes.status.released', 'Liberado')}
                  </StatusBadge>
                  <StatusBadge tone={client.bloqueadoPlataforma ? 'danger' : 'success'}>
                    {client.bloqueadoPlataforma ? t('clientes.status.platformBlocked', 'Plataforma bloqueada') : t('clientes.status.platformReleased', 'Plataforma liberada')}
                  </StatusBadge>
                </>
              ),
            }}
            columns={columns}
            pagination={
              meta
                ? {
                    from: meta.from,
                    to: meta.to,
                    total: meta.total,
                    page: meta.page,
                    pages: meta.pages,
                    perPage: meta.perPage,
                  }
                : undefined
            }
            onPageChange={tableState.setPage}
            pageSize={{
              value: filtersDraft.perPage,
              options: [15, 30, 45, 60],
              onChange: setPerPage,
            }}
          />
        </SectionCard>
      </AsyncState>

      <ClientViewModal
        open={modal.type === 'view'}
        client={modal.type === 'view' ? modal.client : null}
        onClose={closeModal}
      />

      <ClientLinkedUsersModal
        open={modal.type === 'linked-users'}
        client={modal.type === 'linked-users' ? modal.client : null}
        users={linkedUsers}
        isLoading={modalLoading}
        error={modalError || undefined}
        canDelete={access.canDelete}
        onClose={closeModal}
        onRemove={(userId) =>
          setConfirmState(
            modal.type === 'linked-users'
              ? {
                  kind: 'delete-users-link',
                  clientId: modal.client.id,
                  userId,
                }
              : null,
          )
        }
      />

      <ClientLinkedSellersModal
        open={modal.type === 'linked-sellers'}
        client={modal.type === 'linked-sellers' ? modal.client : null}
        sellers={linkedSellers}
        isLoading={modalLoading}
        error={modalError || undefined}
        onClose={closeModal}
      />

      <ClientUnlockModal
        open={modal.type === 'unlock'}
        client={modal.type === 'unlock' ? modal.client : null}
        platform={modal.type === 'unlock' ? modal.platform : false}
        description={unlockDescription}
        error={modalError || undefined}
        isLoading={modalLoading}
        onClose={closeModal}
        onChangeDescription={setUnlockDescription}
        onConfirm={() => void handleUnlock()}
      />

      <ConfirmDialog
        open={Boolean(confirmState)}
        title={confirmState?.kind === 'delete-users-link' ? t('clientes.modals.removeLinkedUserTitle', 'Remover usuário vinculado?') : t('clientes.modals.deleteClientTitle', 'Excluir cliente?')}
        description={
          confirmState?.kind === 'delete-users-link'
            ? t('clientes.modals.removeLinkedUserDescription', 'Essa ação remove o vínculo entre o usuário e o cliente.')
            : confirmState?.kind === 'delete-client'
              ? confirmState.ids.length > 1
                ? t('clientes.modals.deleteClientDescriptionMany', 'Os clientes selecionados serão excluídos. Essa ação não pode ser desfeita.')
                : t('clientes.modals.deleteClientDescriptionSingle', 'O cliente selecionado será excluído. Essa ação não pode ser desfeita.')
              : ''
        }
        confirmLabel={t('clientes.actions.confirmDelete', 'Confirmar exclus?o')}
        cancelLabel={t('common.cancel')}
        onClose={() => setConfirmState(null)}
        onConfirm={() => void handleConfirmAction()}
      />
    </div>
  )
}
