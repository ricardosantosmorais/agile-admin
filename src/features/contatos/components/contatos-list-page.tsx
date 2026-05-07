'use client'

import { Check, Eye, Pencil, RefreshCcw, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useCrudListController } from '@/src/components/crud-base/use-crud-list-controller'
import { AppDataTable } from '@/src/components/data-table/app-data-table'
import { DataTableFiltersCard } from '@/src/components/data-table/data-table-filters'
import { DataTableFilterToggleAction, DataTableSectionAction } from '@/src/components/data-table/data-table-toolbar'
import type { AppDataTableColumn } from '@/src/components/data-table/types'
import type { CrudDataClient, CrudRecord } from '@/src/components/crud-base/types'
import { AsyncState } from '@/src/components/ui/async-state'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { PageHeader } from '@/src/components/ui/page-header'
import { SectionCard } from '@/src/components/ui/section-card'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { ContatoEditModal } from '@/src/features/contatos/components/contato-edit-modal'
import { ContatoDetailModal } from '@/src/features/contatos/components/contato-detail-modal'
import { contatosClient, DEFAULT_CONTATOS_FILTERS } from '@/src/features/contatos/services/contatos-client'
import type { ContatoDetail, ContatoListFilters, ContatoListItem } from '@/src/features/contatos/types/contatos'
import { useI18n } from '@/src/i18n/use-i18n'
import { formatCpfCnpj, formatDate } from '@/src/lib/formatters'

const CONTATOS_CONFIG = {
  key: 'contatos',
  listEmbed: undefined,
  defaultFilters: DEFAULT_CONTATOS_FILTERS,
} as const

const contatosListClient: CrudDataClient = {
  list(filters) {
    return contatosClient.list(filters as ContatoListFilters)
  },
  async getById() {
    return {} as CrudRecord
  },
  async save() {
    return []
  },
  async delete() {
    return { success: true }
  },
  async listOptions() {
    return []
  },
}

type PendingAction =
  | { type: 'approve'; item: ContatoListItem }
  | { type: 'reject'; item: ContatoListItem }
  | null

function isInternalized(value: unknown) {
  if (typeof value === 'string') {
    return ['1', 'true', 'sim', 'yes', 'on'].includes(value.trim().toLowerCase())
  }

  return value === true || value === 1
}

export function ContatosListPage() {
  const { t } = useI18n()
  const access = useFeatureAccess('contatos')
  const controller = useCrudListController(CONTATOS_CONFIG as never, contatosListClient, false)
  const [selectedContact, setSelectedContact] = useState<ContatoListItem | null>(null)
  const [contactDetail, setContactDetail] = useState<ContatoDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string>()
  const [editingContact, setEditingContact] = useState<ContatoDetail | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string>()
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)

  const columns = useMemo(() => ([
    {
      id: 'cnpj_cpf',
      label: t('people.contacts.fields.document', 'CPF/CNPJ'),
      sortKey: 'cnpj_cpf',
      cell: (record: ContatoListItem) => formatCpfCnpj(record.cnpj_cpf),
      filter: { kind: 'text', id: 'cnpj_cpf', key: 'cnpj_cpf', label: t('people.contacts.fields.document', 'CPF/CNPJ') },
    },
    {
      id: 'nome_fantasia',
      label: t('people.contacts.fields.customer', 'Cliente'),
      sortKey: 'nome_fantasia',
      tdClassName: 'font-semibold text-slate-950',
      cell: (record: ContatoListItem) => record.nome_fantasia || '-',
      filter: { kind: 'text', id: 'nome_fantasia', key: 'nome_fantasia::like', label: t('people.contacts.fields.customer', 'Cliente') },
    },
    {
      id: 'pessoa_contato',
      label: t('people.contacts.fields.contactPerson', 'Contato'),
      sortKey: 'pessoa_contato',
      cell: (record: ContatoListItem) => record.pessoa_contato || '-',
      filter: { kind: 'text', id: 'pessoa_contato', key: 'pessoa_contato::like', label: t('people.contacts.fields.contactPerson', 'Contato') },
    },
    {
      id: 'email',
      label: t('simpleCrud.fields.email', 'E-mail'),
      sortKey: 'email',
      visibility: 'lg',
      cell: (record: ContatoListItem) => record.email || '-',
      filter: { kind: 'text', id: 'email', key: 'email::like', label: t('simpleCrud.fields.email', 'E-mail') },
    },
    {
      id: 'telefone1',
      label: t('people.contacts.fields.phone', 'Telefone'),
      sortKey: 'telefone1',
      visibility: 'xl',
      cell: (record: ContatoListItem) => record.telefone1 || '-',
      filter: { kind: 'text', id: 'telefone1', key: 'telefone1::like', label: t('people.contacts.fields.phone', 'Telefone') },
    },
    {
      id: 'celular',
      label: t('people.contacts.fields.mobile', 'Celular'),
      sortKey: 'celular',
      visibility: 'xl',
      cell: (record: ContatoListItem) => record.celular || '-',
      filter: { kind: 'text', id: 'celular', key: 'celular::like', label: t('people.contacts.fields.mobile', 'Celular') },
    },
    {
      id: 'created_at',
      label: t('people.contacts.fields.date', 'Data'),
      sortKey: 'created_at',
      visibility: 'lg',
      cell: (record: ContatoListItem) => record.created_at ? formatDate(record.created_at) : '-',
      filter: { kind: 'date-range', id: 'created_at', fromKey: 'created_at::ge', toKey: 'created_at::le', label: t('people.contacts.fields.date', 'Data') },
    },
    {
      id: 'status',
      label: t('people.contacts.fields.status', 'Status'),
      sortKey: 'status',
      cell: (record: ContatoListItem) => (
        <StatusBadge tone={record.status === 'aprovado' ? 'success' : record.status === 'reprovado' ? 'danger' : 'warning'}>
          {t(`people.contacts.status.${record.status}`, record.status)}
        </StatusBadge>
      ),
      filter: {
        kind: 'select',
        id: 'status',
        key: 'status',
        label: t('people.contacts.fields.status', 'Status'),
        options: [
          { value: 'recebido', label: t('people.contacts.status.recebido', 'Recebido') },
          { value: 'aprovado', label: t('people.contacts.status.aprovado', 'Aprovado') },
          { value: 'reprovado', label: t('people.contacts.status.reprovado', 'Reprovado') },
        ],
      },
    },
  ]) satisfies AppDataTableColumn<ContatoListItem, ContatoListFilters>[], [t])

  if (!access.canList) {
    return <AccessDeniedState title={t('people.contacts.title', 'Contatos')} backHref="/dashboard" />
  }

  async function openDetail(item: ContatoListItem) {
    setSelectedContact(item)
    setContactDetail(null)
    setDetailError(undefined)
    setDetailLoading(true)
    try {
      setContactDetail(await contatosClient.getById(item.id))
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : t('people.contacts.loadDetailError', 'Não foi possível carregar o contato.'))
    } finally {
      setDetailLoading(false)
    }
  }

  async function openEdit(item: ContatoListItem) {
    setEditError(undefined)
    setDetailError(undefined)
    setDetailLoading(true)
    try {
      const detail = await contatosClient.getById(item.id)
      setContactDetail(detail)
      setSelectedContact(item)
      setEditingContact(detail)
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : t('people.contacts.loadDetailError', 'Não foi possível carregar o contato.'))
    } finally {
      setDetailLoading(false)
    }
  }

  async function handleSaveEdit(values: Parameters<typeof contatosClient.update>[1]) {
    if (!editingContact) {
      return
    }

    try {
      setEditSaving(true)
      setEditError(undefined)
      await contatosClient.update(editingContact.id, values)
      setEditingContact(null)
      controller.refreshList()
      if (selectedContact?.id === editingContact.id) {
        await openDetail(selectedContact)
      }
    } catch (error) {
      setEditError(error instanceof Error ? error.message : t('people.contacts.saveError', 'Não foi possível salvar o contato.'))
    } finally {
      setEditSaving(false)
    }
  }

  async function handleConfirmAction() {
    if (!pendingAction) {
      return
    }

    await contatosClient.updateStatus(pendingAction.item.id, pendingAction.type === 'approve' ? 'aprovado' : 'reprovado')
    setPendingAction(null)
    controller.refreshList()

    if (selectedContact?.id === pendingAction.item.id) {
      await openDetail(pendingAction.item)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={[
          { label: t('routes.dashboard', 'Início'), href: '/dashboard' },
          { label: t('routes.people', 'Pessoas') },
          { label: t('people.contacts.title', 'Contatos'), href: '/contatos' },
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
            </div>
          )}
        >
          <DataTableFiltersCard
            variant="embedded"
            columns={columns as unknown as AppDataTableColumn<unknown, CrudRecord>[]}
            draft={controller.filtersDraft as unknown as ContatoListFilters}
            applied={controller.filters as unknown as ContatoListFilters}
            expanded={controller.filtersExpanded}
            onToggleExpanded={() => controller.setFiltersExpanded((current) => !current)}
            onApply={controller.applyFilters}
            onClear={controller.clearFilters}
            patchDraft={controller.patchDraft as never}
          />
          <AppDataTable
            rows={controller.rows as ContatoListItem[]}
            getRowId={(record) => record.id}
            emptyMessage={t('people.contacts.empty', 'Nenhum contato encontrado com os filtros atuais.')}
            columns={columns}
            sort={{ activeColumn: controller.filters.orderBy, direction: controller.filters.sort, onToggle: controller.tableState.toggleSort }}
            rowActions={(record) => [
              { id: 'details', label: t('people.contacts.actions.details', 'Informações'), icon: Eye, onClick: () => void openDetail(record), visible: access.canView || access.canEdit },
              { id: 'edit', label: t('people.contacts.actions.edit', 'Editar'), icon: Pencil, onClick: () => void openEdit(record), visible: access.canEdit && !isInternalized(record.internalizado) },
              { id: 'approve', label: t('people.contacts.actions.approve', 'Aprovar'), icon: Check, onClick: () => setPendingAction({ type: 'approve', item: record }), visible: access.canEdit && (record.status === 'recebido' || record.status === 'reprovado') },
              { id: 'reject', label: t('people.contacts.actions.reject', 'Reprovar'), icon: X, onClick: () => setPendingAction({ type: 'reject', item: record }), visible: access.canEdit && record.status === 'recebido', tone: 'danger' as const },
            ]}
            mobileCard={{
              title: (record) => record.nome_fantasia || '-',
              subtitle: (record) => formatCpfCnpj(record.cnpj_cpf),
              meta: (record) => record.pessoa_contato || '',
              badges: (record) => (
                <StatusBadge tone={record.status === 'aprovado' ? 'success' : record.status === 'reprovado' ? 'danger' : 'warning'}>
                  {t(`people.contacts.status.${record.status}`, record.status)}
                </StatusBadge>
              ),
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

      <ContatoDetailModal
        open={Boolean(selectedContact)}
        detail={contactDetail}
        isLoading={detailLoading}
        error={detailError}
        onClose={() => setSelectedContact(null)}
        onApprove={selectedContact ? () => setPendingAction({ type: 'approve', item: selectedContact }) : undefined}
        onReject={selectedContact ? () => setPendingAction({ type: 'reject', item: selectedContact }) : undefined}
        onEdit={selectedContact ? () => void openEdit(selectedContact) : undefined}
        canEdit={access.canEdit}
      />

      <ContatoEditModal
        open={Boolean(editingContact)}
        detail={editingContact}
        isSaving={editSaving}
        error={editError}
        onClose={() => setEditingContact(null)}
        onSubmit={handleSaveEdit}
      />

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={pendingAction?.type === 'approve'
          ? t('people.contacts.confirmApproveTitle', 'Confirmar aprovação do contato?')
          : t('people.contacts.confirmRejectTitle', 'Confirmar reprovação do contato?')}
        description={pendingAction?.type === 'approve'
          ? t('people.contacts.confirmApproveDescription', 'O cliente será enviado para gravação na base do ERP.')
          : t('people.contacts.confirmRejectDescription', 'O cliente não será gravado na base do ERP.')}
        confirmLabel={pendingAction?.type === 'approve' ? t('people.contacts.actions.approve', 'Aprovar') : t('people.contacts.actions.reject', 'Reprovar')}
        cancelLabel={t('common.cancel', 'Cancelar')}
        onClose={() => setPendingAction(null)}
        onConfirm={() => void handleConfirmAction()}
      />
    </div>
  )
}
