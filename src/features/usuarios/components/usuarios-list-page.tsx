'use client'

import { Eye, KeyRound, RefreshCcw, Trash2, UserCog, UserRoundSearch, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useCrudListController } from '@/src/components/crud-base/use-crud-list-controller'
import { AppDataTable } from '@/src/components/data-table/app-data-table'
import { DataTableFiltersCard } from '@/src/components/data-table/data-table-filters'
import { DataTableFilterToggleAction, DataTablePageActions, DataTableSectionAction } from '@/src/components/data-table/data-table-toolbar'
import type { AppDataTableColumn } from '@/src/components/data-table/types'
import type { CrudDataClient, CrudListFilters, CrudRecord } from '@/src/components/crud-base/types'
import { AsyncState } from '@/src/components/ui/async-state'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { PageHeader } from '@/src/components/ui/page-header'
import { SectionCard } from '@/src/components/ui/section-card'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { UsuarioAccessesModal } from '@/src/features/usuarios/components/usuario-accesses-modal'
import { UsuarioLinkedClientsModal } from '@/src/features/usuarios/components/usuario-linked-clients-modal'
import { UsuarioLinkedSellerModal } from '@/src/features/usuarios/components/usuario-linked-seller-modal'
import { USUARIOS_CONFIG } from '@/src/features/usuarios/services/usuarios-config'
import { DEFAULT_USUARIO_ACCESS_FILTERS } from '@/src/features/usuarios/services/usuarios-mappers'
import { usuariosClient } from '@/src/features/usuarios/services/usuarios-client'
import type {
  UsuarioAccessFilters,
  UsuarioAccessItem,
  UsuarioLinkedClient,
  UsuarioLinkedSeller,
  UsuarioListFilters,
  UsuarioListItem,
} from '@/src/features/usuarios/types/usuarios'
import { useI18n } from '@/src/i18n/use-i18n'

type ModalState =
  | { type: 'clients'; user: UsuarioListItem }
  | { type: 'seller'; user: UsuarioListItem }
  | { type: 'accesses'; user: UsuarioListItem }
  | null

const usuariosListClient: CrudDataClient = {
  async list(filters) {
    return usuariosClient.list(filters as UsuarioListFilters)
  },
  async getById() {
    return {} as CrudRecord
  },
  async save() {
    return []
  },
  delete: async (ids) => {
    await usuariosClient.delete(ids)
    return { success: true }
  },
  async listOptions() {
    return []
  },
}

export function UsuariosListPage() {
  const { t } = useI18n()
  const access = useFeatureAccess('usuarios')
  const controller = useCrudListController(USUARIOS_CONFIG, usuariosListClient, access.canDelete)
  const [modalState, setModalState] = useState<ModalState>(null)
  const [linkedClients, setLinkedClients] = useState<UsuarioLinkedClient[]>([])
  const [linkedSeller, setLinkedSeller] = useState<UsuarioLinkedSeller | null>(null)
  const [accesses, setAccesses] = useState<UsuarioAccessItem[]>([])
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState<string | undefined>()

  const columns = useMemo(() => ([
    {
      id: 'email',
      label: t('usuarios.columns.email', 'E-mail'),
      sortKey: 'email',
      tdClassName: 'font-semibold text-slate-950',
      cell: (record: UsuarioListItem) => <span className="truncate">{record.email}</span>,
      filter: {
        kind: 'text',
        id: 'email',
        key: 'email::like',
        label: t('usuarios.columns.email', 'E-mail'),
      },
    },
    {
      id: 'perfil',
      label: t('usuarios.columns.profile', 'Perfil'),
      sortKey: 'perfil',
      visibility: 'lg',
      cell: (record: UsuarioListItem) => record.perfilLabel,
      filter: {
        kind: 'text',
        id: 'perfil',
        key: 'perfil',
        label: t('usuarios.columns.profile', 'Perfil'),
      },
    },
    {
      id: 'codigo',
      label: t('usuarios.columns.sellerCode', 'Código do vendedor'),
      sortKey: 'codigo',
      visibility: 'lg',
      cell: (record: UsuarioListItem) => record.codigoVendedor || '-',
      filter: {
        kind: 'text',
        id: 'codigo',
        key: 'codigo::like',
        label: t('usuarios.columns.sellerCode', 'Código do vendedor'),
      },
    },
    {
      id: 'ultimoAcesso',
      label: t('usuarios.columns.lastAccess', 'Último acesso'),
      sortKey: 'ultimo_acesso',
      visibility: 'xl',
      thClassName: 'w-[220px]',
      cell: (record: UsuarioListItem) => (
        <div className="space-y-1">
          <div>{record.ultimoAcesso || '-'}</div>
          {record.ipUltimoAcesso ? <div className="text-xs text-slate-500">IP: {record.ipUltimoAcesso}</div> : null}
        </div>
      ),
      filter: {
        kind: 'date-range',
        id: 'ultimoAcesso',
        fromKey: 'ultimo_acesso::ge',
        toKey: 'ultimo_acesso::le',
        label: t('usuarios.columns.lastAccess', 'Último acesso'),
      },
    },
    {
      id: 'ultimoPedido',
      label: t('usuarios.columns.lastOrder', 'Último pedido'),
      sortKey: 'ultimo_pedido',
      visibility: 'xl',
      cell: (record: UsuarioListItem) => record.ultimoPedido || '-',
      filter: {
        kind: 'date-range',
        id: 'ultimoPedido',
        fromKey: 'ultimo_pedido::ge',
        toKey: 'ultimo_pedido::le',
        label: t('usuarios.columns.lastOrder', 'Último pedido'),
      },
    },
    {
      id: 'ativo',
      label: t('usuarios.columns.active', 'Ativo'),
      sortKey: 'ativo',
      thClassName: 'w-[120px]',
      cell: (record: UsuarioListItem) => (
        <StatusBadge tone={record.ativo ? 'success' : 'warning'}>
          {record.ativo ? t('common.yes', 'Sim') : t('common.no', 'Não')}
        </StatusBadge>
      ),
      filter: {
        kind: 'select',
        id: 'ativo',
        key: 'ativo',
        label: t('usuarios.columns.active', 'Ativo'),
        options: [
          { value: '1', label: t('common.yes', 'Sim') },
          { value: '0', label: t('common.no', 'Não') },
        ],
      },
    },
  ]) satisfies AppDataTableColumn<UsuarioListItem, CrudListFilters>[], [t])

  if (!access.canList) {
    return <AccessDeniedState title={t('usuarios.title', 'Usuários')} backHref="/dashboard" />
  }

  async function openClientsModal(user: UsuarioListItem) {
    setModalState({ type: 'clients', user })
    setModalLoading(true)
    setModalError(undefined)
    setLinkedClients([])
    try {
      const result = await usuariosClient.listLinkedClients(user.id)
      setLinkedClients(result)
    } catch (modalLoadError) {
      setModalError(modalLoadError instanceof Error ? modalLoadError.message : t('usuarios.modals.loadClientsError', 'Não foi possível carregar os clientes vinculados.'))
    } finally {
      setModalLoading(false)
    }
  }

  async function openSellerModal(user: UsuarioListItem) {
    setModalState({ type: 'seller', user })
    setModalLoading(true)
    setModalError(undefined)
    setLinkedSeller(null)
    try {
      const result = await usuariosClient.getLinkedSeller(user.id)
      setLinkedSeller(result)
    } catch (modalLoadError) {
      setModalError(modalLoadError instanceof Error ? modalLoadError.message : t('usuarios.modals.loadSellerError', 'Não foi possível carregar o vendedor vinculado.'))
    } finally {
      setModalLoading(false)
    }
  }

  async function openAccessesModal(user: UsuarioListItem) {
    setModalState({ type: 'accesses', user })
    setModalLoading(true)
    setModalError(undefined)
    setAccesses([])
    try {
      const result = await usuariosClient.listAccesses(user.id, { ...DEFAULT_USUARIO_ACCESS_FILTERS } satisfies UsuarioAccessFilters)
      setAccesses(result.data)
    } catch (modalLoadError) {
      setModalError(modalLoadError instanceof Error ? modalLoadError.message : t('usuarios.modals.loadAccessesError', 'Não foi possível carregar os acessos do usuário.'))
    } finally {
      setModalLoading(false)
    }
  }

  function closeModal() {
    setModalState(null)
    setModalError(undefined)
    setLinkedClients([])
    setLinkedSeller(null)
    setAccesses([])
  }

  async function handleDelete() {
    if (!controller.confirmDeleteIds?.length) {
      return
    }

    await controller.handleDelete(controller.confirmDeleteIds)
  }

  async function handleRemoveClient(clientId: string) {
    if (!modalState || modalState.type !== 'clients') {
      return
    }

    await usuariosClient.removeLinkedClient(modalState.user.id, clientId)
    setLinkedClients((current) => current.filter((item) => item.idCliente !== clientId))
  }

  async function handleRemoveSeller() {
    if (!modalState || modalState.type !== 'seller') {
      return
    }

    await usuariosClient.removeLinkedSeller(modalState.user.id)
    setLinkedSeller(null)
    controller.refreshList()
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={[
          { label: t('routes.dashboard', 'Início'), href: '/dashboard' },
          { label: t('routes.people', 'Pessoas') },
          { label: t('usuarios.title', 'Usuários'), href: '/usuarios' },
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
                        label: t('usuarios.deleteSelected', 'Excluir ({{count}})', { count: controller.tableState.selectedIds.length }),
                        icon: Trash2,
                        onClick: () => controller.setConfirmDeleteIds(controller.tableState.selectedIds),
                        tone: 'danger',
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
            rows={controller.rows as UsuarioListItem[]}
            getRowId={(record) => record.id}
            emptyMessage={t('usuarios.empty', 'Nenhum usuário encontrado com os filtros atuais.')}
            columns={columns}
            sort={{ activeColumn: controller.filters.orderBy, direction: controller.filters.sort, onToggle: controller.tableState.toggleSort }}
            selectable
            selectedIds={controller.tableState.selectedIds}
            allSelected={controller.tableState.allSelected}
            onToggleSelect={controller.tableState.toggleSelection}
            onToggleSelectAll={controller.tableState.toggleSelectAll}
            mobileCard={{
              title: (record) => record.email,
              subtitle: (record) => record.perfilLabel,
              meta: (record) => record.codigoVendedor || undefined,
              badges: (record) => (
                <StatusBadge tone={record.ativo ? 'success' : 'warning'}>
                  {record.ativo ? t('common.yes', 'Sim') : t('common.no', 'Não')}
                </StatusBadge>
              ),
            }}
            rowActions={(record) => [
              {
                id: 'linked-clients',
                label: t('usuarios.actions.linkedClients', 'Clientes vinculados'),
                icon: Users,
                onClick: () => void openClientsModal(record),
                visible: access.canView && record.perfil === 'cliente',
              },
              {
                id: 'linked-seller',
                label: t('usuarios.actions.linkedSeller', 'Vendedor vinculado'),
                icon: UserRoundSearch,
                onClick: () => void openSellerModal(record),
                visible: access.canView && record.perfil === 'vendedor',
              },
              {
                id: 'password',
                label: t('usuarios.actions.password', 'Alterar senha'),
                icon: KeyRound,
                href: `/usuarios/${record.id}/senha`,
                visible: access.canEdit,
              },
              {
                id: 'accesses',
                label: t('usuarios.actions.accesses', 'Acessos do usuário'),
                icon: UserCog,
                onClick: () => void openAccessesModal(record),
                visible: access.canView,
              },
              {
                id: 'delete',
                label: t('simpleCrud.actions.delete', 'Excluir'),
                icon: Trash2,
                tone: 'danger',
                onClick: () => controller.setConfirmDeleteIds([record.id]),
                visible: access.canDelete,
              },
              {
                id: 'view',
                label: t('simpleCrud.actions.view', 'Visualizar'),
                icon: Eye,
                href: `/usuarios/${record.id}/senha`,
                visible: access.canView && !access.canEdit,
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
        title={t('simpleCrud.confirmDeleteTitle', 'Excluir registro?')}
        description={
          controller.confirmDeleteIds && controller.confirmDeleteIds.length > 1
            ? t('simpleCrud.confirmDeleteMany', 'Os registros selecionados serão excluídos. Esta ação não pode ser desfeita.')
            : t('simpleCrud.confirmDeleteSingle', 'O registro selecionado será excluído. Esta ação não pode ser desfeita.')
        }
        confirmLabel={t('simpleCrud.actions.delete', 'Excluir')}
        cancelLabel={t('common.cancel', 'Cancelar')}
        onClose={() => controller.setConfirmDeleteIds(null)}
        onConfirm={() => void handleDelete()}
      />

      <UsuarioLinkedClientsModal
        open={modalState?.type === 'clients'}
        user={modalState?.type === 'clients' ? modalState.user : null}
        clients={linkedClients}
        isLoading={modalLoading}
        error={modalError}
        canDelete={access.canDelete}
        onClose={closeModal}
        onRemove={(clientId) => void handleRemoveClient(clientId)}
      />

      <UsuarioLinkedSellerModal
        open={modalState?.type === 'seller'}
        user={modalState?.type === 'seller' ? modalState.user : null}
        seller={linkedSeller}
        isLoading={modalLoading}
        error={modalError}
        canDelete={access.canDelete}
        onClose={closeModal}
        onRemove={() => void handleRemoveSeller()}
      />

      <UsuarioAccessesModal
        open={modalState?.type === 'accesses'}
        user={modalState?.type === 'accesses' ? modalState.user : null}
        accesses={accesses}
        isLoading={modalLoading}
        error={modalError}
        onClose={closeModal}
      />
    </div>
  )
}
