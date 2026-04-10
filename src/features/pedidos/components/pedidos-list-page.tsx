'use client'

import { Ban, CheckCircle2, Eye, Filter, ListFilter, RefreshCcw, ShoppingBag, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { loadCrudLookupOptions } from '@/src/components/crud-base/crud-client'
import { AppDataTable } from '@/src/components/data-table/app-data-table'
import { DataTableFiltersCard } from '@/src/components/data-table/data-table-filters'
import { DataTableFilterToggleAction, DataTableSectionAction } from '@/src/components/data-table/data-table-toolbar'
import type { AppDataTableColumn } from '@/src/components/data-table/types'
import { AsyncState } from '@/src/components/ui/async-state'
import { PageHeader } from '@/src/components/ui/page-header'
import { SectionCard } from '@/src/components/ui/section-card'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { usePedidoActions } from '@/src/features/pedidos/components/use-pedido-actions'
import { pedidosClient } from '@/src/features/pedidos/services/pedidos-client'
import { PEDIDO_STATUS_OPTIONS } from '@/src/features/pedidos/services/pedidos-meta'
import type { PedidoListFilters, PedidoListRecord } from '@/src/features/pedidos/services/pedidos-types'
import { useAsyncData } from '@/src/hooks/use-async-data'
import { useI18n } from '@/src/i18n/use-i18n'
import { formatDateTime } from '@/src/lib/date-time'
import { formatCurrency } from '@/src/lib/formatters'

const defaultFilters: PedidoListFilters = {
  page: 1,
  perPage: 15,
  orderBy: 'data',
  sort: 'desc',
  id: '',
  id_transacao: '',
  codigo: '',
  id_filial: '',
  id_filial_label: '',
  id_filial_estoque: '',
  id_filial_estoque_label: '',
  id_filial_retira: '',
  id_filial_retira_label: '',
  cliente_codigo: '',
  cliente_cnpj_cpf: '',
  data_inicio: '',
  data_fim: '',
  id_vendedor: '',
  id_vendedor_label: '',
  id_forma_pagamento_convertida: '',
  id_forma_pagamento_convertida_label: '',
  id_condicao_pagamento_convertida: '',
  id_condicao_pagamento_convertida_label: '',
  id_forma_entrega: '',
  id_forma_entrega_label: '',
  status: '',
}

type LookupResource = 'filiais' | 'vendedores' | 'formas_pagamento' | 'condicoes_pagamento' | 'formas_entrega'
type ListMetricCardProps = {
  label: string
  value: string
  helper?: string
  icon: ReactNode
  tone?: 'slate' | 'emerald' | 'amber' | 'sky'
}

async function loadLookup(resource: LookupResource, query: string, page: number, perPage: number) {
  const items = await loadCrudLookupOptions(resource, query, page, perPage)
  return items.map((item) => ({ id: item.value, label: item.label }))
}

function ListMetricCard({ label, value, helper, icon, tone = 'slate' }: ListMetricCardProps) {
  const toneClasses = {
    slate: 'app-stat-card-icon text-slate-300',
    emerald: 'app-stat-card-icon app-stat-card-icon-emerald',
    amber: 'app-stat-card-icon app-stat-card-icon-amber',
    sky: 'app-stat-card-icon app-stat-card-icon-sky',
  }

  const accentClasses = {
    slate: 'app-stat-card-accent app-stat-card-accent-sky',
    emerald: 'app-stat-card-accent app-stat-card-accent-emerald',
    amber: 'app-stat-card-accent app-stat-card-accent-amber',
    sky: 'app-stat-card-accent app-stat-card-accent-sky',
  }

  return (
    <div className="app-stat-card relative overflow-hidden rounded-[1.2rem] px-5 py-4">
      <div className={accentClasses[tone]} aria-hidden="true" />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <div className="mt-2 text-lg font-bold tracking-tight text-[color:var(--app-text)]">{value}</div>
          {helper ? <p className="mt-1 text-sm text-slate-500">{helper}</p> : null}
        </div>
        <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${toneClasses[tone]}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function formatChannel(value: string, t: (key: string, fallback?: string) => string) {
  const normalized = String(value || '').trim().toLowerCase()
  if (!normalized) return '-'
  if (normalized === 'pc') return t('orders.channels.pc', 'PC')
  if (normalized === 'app') return t('orders.channels.app', 'App')
  if (normalized === 'mobile') return t('orders.channels.mobile', 'Mobile')
  if (normalized === 'pluggto') return t('orders.channels.pluggto', 'Plugg.to')
  return normalized
}

function countAppliedFilters(filters: PedidoListFilters) {
  const keys: Array<keyof PedidoListFilters> = [
    'id',
    'id_transacao',
    'codigo',
    'id_filial',
    'id_filial_estoque',
    'id_filial_retira',
    'cliente_codigo',
    'cliente_cnpj_cpf',
    'data_inicio',
    'data_fim',
    'id_vendedor',
    'id_forma_pagamento_convertida',
    'id_condicao_pagamento_convertida',
    'id_forma_entrega',
    'status',
  ]

  return keys.reduce((sum, key) => {
    const value = filters[key]
    return String(value || '').trim() ? sum + 1 : sum
  }, 0)
}

export function PedidosListPage() {
  const { t } = useI18n()
  const access = useFeatureAccess('pedidos')
  const [filters, setFilters] = useState<PedidoListFilters>(defaultFilters)
  const [draft, setDraft] = useState<PedidoListFilters>(defaultFilters)
  const [expanded, setExpanded] = useState(false)
  const pedidosState = useAsyncData(() => pedidosClient.list(filters), [filters])
  const pedidoActions = usePedidoActions(async () => {
    await pedidosState.reload()
  })

  const rows = pedidosState.data?.data ?? []

  function patchDraft(patch: Partial<PedidoListFilters>) {
    setDraft((current) => ({ ...current, ...patch, page: 1 }))
  }

  function applyFilters() {
    setFilters({ ...draft, page: 1 })
  }

  function clearFilters() {
    setDraft(defaultFilters)
    setFilters(defaultFilters)
  }

  const appliedFiltersCount = countAppliedFilters(filters)
  const selectedStatusLabel = filters.status
    ? (PEDIDO_STATUS_OPTIONS.find((option) => option.value === filters.status)?.label || filters.status)
    : t('orders.overview.allStatuses', 'Todos os status')
  const selectedPeriodLabel = filters.data_inicio || filters.data_fim
    ? [filters.data_inicio || t('orders.overview.periodOpenStart', 'Início aberto'), filters.data_fim || t('orders.overview.periodOpenEnd', 'Fim aberto')].join(' → ')
    : t('orders.overview.allPeriod', 'Todo o período')
  const orderingLabel = `${filters.orderBy} · ${filters.sort === 'asc' ? t('orders.overview.ascending', 'Ascendente') : t('orders.overview.descending', 'Descendente')}`

  const columns = useMemo(
    () => [
      {
        id: 'id',
        label: t('orders.fields.id', 'ID'),
        sortKey: 'id',
        filter: { id: 'id', label: t('orders.fields.id', 'ID'), kind: 'text', key: 'id' as const },
        thClassName: 'w-[260px]',
        tdClassName: 'w-[260px]',
        cell: (record: PedidoListRecord) => (
          <div className="space-y-2">
            <div className="font-semibold text-slate-950">{record.id}</div>
            {record.id_transacao ? <div className="text-xs text-slate-500">{t('orders.fields.transaction', 'Transação')}: {record.id_transacao}</div> : null}
            {record.codigo ? <div className="text-xs text-slate-500">{t('common.code', 'Código')}: {record.codigo}</div> : null}
            <div className="flex flex-wrap gap-2">
              {record.brinde ? <StatusBadge tone="info">{t('orders.badges.gift', 'Brinde')}</StatusBadge> : null}
              {record.orcamento ? <StatusBadge tone="info">{t('orders.badges.quote', 'Orçamento')}</StatusBadge> : null}
              {record.hasCorte ? <StatusBadge tone="warning">{t('orders.badges.cutOrder', 'Pedido com corte')}</StatusBadge> : null}
            </div>
          </div>
        ),
      },
      {
        id: 'cliente',
        label: t('orders.fields.customer', 'Cliente'),
        thClassName: 'w-[280px]',
        tdClassName: 'w-[280px]',
        cell: (record: PedidoListRecord) => (
          <div className="space-y-2">
            <div className="font-medium text-slate-900">{record.cliente_nome || '-'}</div>
            <div className="flex flex-wrap gap-2">
              {record.canal ? <StatusBadge tone="neutral">{formatChannel(record.canal, t)}</StatusBadge> : null}
              {record.venda_assistida ? <StatusBadge tone="info">{t('orders.badges.assistedSale', 'Venda assistida')}</StatusBadge> : null}
              {record.internalizado ? <StatusBadge tone="success">{t('orders.badges.erpIntegrated', 'ERP integrado')}</StatusBadge> : null}
            </div>
          </div>
        ),
      },
      {
        id: 'vendedor',
        label: t('orders.fields.seller', 'Vendedor'),
        cell: (record: PedidoListRecord) => <span>{record.vendedor_nome || '-'}</span>,
      },
      {
        id: 'data',
        label: t('orders.fields.date', 'Data'),
        sortKey: 'data',
        cell: (record: PedidoListRecord) => <span>{record.data ? formatDateTime(record.data) : '-'}</span>,
      },
      {
        id: 'valor',
        label: t('orders.fields.amount', 'Valor'),
        sortKey: 'valor',
        cell: (record: PedidoListRecord) => (
          <div className="space-y-1 text-right">
            <span className="block font-semibold text-slate-950">{formatCurrency(Number(record.valor_total_atendido || 0))}</span>
            {record.utm_campaign ? <span className="block text-xs text-slate-500">{record.utm_campaign}</span> : null}
          </div>
        ),
      },
      {
        id: 'forma_entrega',
        label: t('orders.fields.deliveryMethod', 'Forma de entrega'),
        cell: (record: PedidoListRecord) => (
          <div className="space-y-1">
            <div className="font-medium text-slate-900">{record.forma_entrega_nome || '-'}</div>
            {record.utm_source ? <div className="text-xs text-slate-500">{`UTM: ${record.utm_source}`}</div> : null}
          </div>
        ),
      },
      {
        id: 'status',
        label: t('orders.fields.status', 'Status'),
        sortKey: 'status',
        cell: (record: PedidoListRecord) => <StatusBadge tone={record.status_tone}>{record.status_label || '-'}</StatusBadge>,
      },
    ] satisfies AppDataTableColumn<PedidoListRecord, PedidoListFilters>[],
    [t],
  )

  const filterColumns = useMemo(
    () => [
      ...columns,
      {
        id: 'id_transacao',
        label: t('orders.fields.transaction', 'Transação'),
        cell: () => null,
        filter: { id: 'id_transacao', label: t('orders.fields.transaction', 'Transação'), kind: 'text', key: 'id_transacao' as const },
      },
      {
        id: 'codigo',
        label: t('common.code', 'Código'),
        cell: () => null,
        filter: { id: 'codigo', label: t('common.code', 'Código'), kind: 'text', key: 'codigo' as const },
      },
      {
        id: 'id_filial',
        label: t('orders.fields.billingBranch', 'Filial de faturamento'),
        cell: () => null,
        filter: {
          id: 'id_filial',
          label: t('orders.fields.billingBranch', 'Filial de faturamento'),
          kind: 'lookup',
          key: 'id_filial' as const,
          loadOptions: (query: string, page: number, perPage: number) => loadLookup('filiais', query, page, perPage),
        },
      },
      {
        id: 'id_filial_estoque',
        label: t('orders.fields.stockBranch', 'Filial de estoque'),
        cell: () => null,
        filter: {
          id: 'id_filial_estoque',
          label: t('orders.fields.stockBranch', 'Filial de estoque'),
          kind: 'lookup',
          key: 'id_filial_estoque' as const,
          loadOptions: (query: string, page: number, perPage: number) => loadLookup('filiais', query, page, perPage),
        },
      },
      {
        id: 'id_filial_retira',
        label: t('orders.fields.pickupBranch', 'Filial de retirada'),
        cell: () => null,
        filter: {
          id: 'id_filial_retira',
          label: t('orders.fields.pickupBranch', 'Filial de retirada'),
          kind: 'lookup',
          key: 'id_filial_retira' as const,
          loadOptions: (query: string, page: number, perPage: number) => loadLookup('filiais', query, page, perPage),
        },
      },
      {
        id: 'cliente_codigo',
        label: t('orders.fields.customerCode', 'Código do cliente'),
        cell: () => null,
        filter: { id: 'cliente_codigo', label: t('orders.fields.customerCode', 'Código do cliente'), kind: 'text', key: 'cliente_codigo' as const },
      },
      {
        id: 'cliente_cnpj_cpf',
        label: t('orders.fields.customerDocument', 'CPF/CNPJ do cliente'),
        cell: () => null,
        filter: { id: 'cliente_cnpj_cpf', label: t('orders.fields.customerDocument', 'CPF/CNPJ do cliente'), kind: 'text', key: 'cliente_cnpj_cpf' as const },
      },
      {
        id: 'periodo',
        label: t('orders.fields.period', 'Período'),
        cell: () => null,
        filter: {
          id: 'periodo',
          label: t('orders.fields.period', 'Período'),
          kind: 'date-range',
          fromKey: 'data_inicio' as const,
          toKey: 'data_fim' as const,
        },
      },
      {
        id: 'id_vendedor',
        label: t('orders.fields.seller', 'Vendedor'),
        cell: () => null,
        filter: {
          id: 'id_vendedor',
          label: t('orders.fields.seller', 'Vendedor'),
          kind: 'lookup',
          key: 'id_vendedor' as const,
          loadOptions: (query: string, page: number, perPage: number) => loadLookup('vendedores', query, page, perPage),
        },
      },
      {
        id: 'id_forma_pagamento_convertida',
        label: t('orders.fields.paymentMethod', 'Forma de pagamento'),
        cell: () => null,
        filter: {
          id: 'id_forma_pagamento_convertida',
          label: t('orders.fields.paymentMethod', 'Forma de pagamento'),
          kind: 'lookup',
          key: 'id_forma_pagamento_convertida' as const,
          loadOptions: (query: string, page: number, perPage: number) => loadLookup('formas_pagamento', query, page, perPage),
        },
      },
      {
        id: 'id_condicao_pagamento_convertida',
        label: t('orders.fields.paymentTerm', 'Condição de pagamento'),
        cell: () => null,
        filter: {
          id: 'id_condicao_pagamento_convertida',
          label: t('orders.fields.paymentTerm', 'Condição de pagamento'),
          kind: 'lookup',
          key: 'id_condicao_pagamento_convertida' as const,
          loadOptions: (query: string, page: number, perPage: number) => loadLookup('condicoes_pagamento', query, page, perPage),
        },
      },
      {
        id: 'id_forma_entrega',
        label: t('orders.fields.deliveryMethod', 'Forma de entrega'),
        cell: () => null,
        filter: {
          id: 'id_forma_entrega',
          label: t('orders.fields.deliveryMethod', 'Forma de entrega'),
          kind: 'lookup',
          key: 'id_forma_entrega' as const,
          loadOptions: (query: string, page: number, perPage: number) => loadLookup('formas_entrega', query, page, perPage),
        },
      },
      {
        id: 'status_filter',
        label: t('orders.fields.status', 'Status'),
        cell: () => null,
        filter: {
          id: 'status',
          label: t('orders.fields.status', 'Status'),
          kind: 'select',
          key: 'status' as const,
          options: PEDIDO_STATUS_OPTIONS,
        },
      },
    ] satisfies AppDataTableColumn<PedidoListRecord, PedidoListFilters>[],
    [columns, t],
  )

  if (!access.canList) {
    return <AccessDeniedState title={t('orders.title', 'Pedidos')} backHref="/dashboard" />
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={[
          { label: t('routes.dashboard', 'Home'), href: '/dashboard' },
          { label: t('routes.pedidos', 'Pedidos'), href: '/pedidos' },
        ]}
        actions={<DataTableSectionAction label={t('common.refresh', 'Atualizar')} icon={RefreshCcw} onClick={pedidosState.reload} />}
      />

      <AsyncState isLoading={pedidosState.isLoading} error={pedidosState.error}>
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          <ListMetricCard
            label={t('orders.overview.filteredOrders', 'Pedidos filtrados')}
            value={String(pedidosState.data?.meta?.total ?? 0)}
            helper={pedidosState.data?.meta ? t('table.showingResults', 'Exibindo {{from}} a {{to}} de {{total}} registros', { from: pedidosState.data.meta.from, to: pedidosState.data.meta.to, total: pedidosState.data.meta.total }) : undefined}
            icon={<ShoppingBag className="h-5 w-5" />}
          />
          <ListMetricCard
            label={t('orders.overview.activeStatus', 'Status ativo')}
            value={selectedStatusLabel}
            helper={t('orders.overview.activeStatusHelper', 'Mostra o recorte atual aplicado ao status do pedido.')}
            icon={<ListFilter className="h-5 w-5" />}
            tone="emerald"
          />
          <ListMetricCard
            label={t('orders.overview.selectedPeriod', 'Período selecionado')}
            value={selectedPeriodLabel}
            helper={t('orders.overview.selectedPeriodHelper', 'Faixa usada para consultar os pedidos nessa listagem.')}
            icon={<Filter className="h-5 w-5" />}
            tone="amber"
          />
          <ListMetricCard
            label={t('orders.overview.activeView', 'Visão atual')}
            value={orderingLabel}
            helper={t('orders.overview.activeViewHelper', '{{count}} filtro(s) aplicado(s) nessa consulta.', { count: String(appliedFiltersCount) })}
            icon={<SlidersHorizontal className="h-5 w-5" />}
            tone="sky"
          />
        </div>

        <SectionCard
          title={t('orders.title', 'Pedidos')}
          description={t('orders.listDescription', 'Listagem operacional com status, contexto comercial e atalhos para ações do pedido.')}
          action={(
            <div className="flex w-full items-center justify-between gap-3">
              <DataTableFilterToggleAction
                expanded={expanded}
                onClick={() => setExpanded((current) => !current)}
                collapsedLabel={t('filters.button', 'Filtros')}
                expandedLabel={t('filters.hide', 'Ocultar filtros')}
              />
            </div>
          )}
        >
          <DataTableFiltersCard<PedidoListFilters>
            variant="embedded"
            columns={filterColumns as AppDataTableColumn<unknown, PedidoListFilters>[]}
            draft={draft}
            applied={filters}
            expanded={expanded}
            onToggleExpanded={() => setExpanded((current) => !current)}
            onApply={applyFilters}
            onClear={clearFilters}
            patchDraft={(key, value) => patchDraft({ [key]: value } as Partial<PedidoListFilters>)}
          />

          <AppDataTable<PedidoListRecord, string, PedidoListFilters>
            rows={rows}
            getRowId={(record) => record.id}
            columns={columns}
            emptyMessage={t('orders.empty', 'Nenhum pedido encontrado com os filtros atuais.')}
            sort={{
              activeColumn: filters.orderBy,
              direction: filters.sort,
              onToggle: (columnId) => setFilters((current) => ({
                ...current,
                orderBy: columnId,
                sort: current.orderBy === columnId && current.sort === 'asc' ? 'desc' : 'asc',
              })),
            }}
            rowActions={(record) => [
              {
                id: 'view',
                label: t('simpleCrud.actions.view', 'Visualizar'),
                icon: Eye,
                href: `/pedidos/${record.id}`,
                visible: access.canView || access.canEdit,
              },
              {
                id: 'approve',
                label: t('orders.actions.approve', 'Aprovar pagamento'),
                icon: CheckCircle2,
                onClick: () => pedidoActions.openApprove(record.id),
                visible: access.canEdit && record.canApprovePayment === true,
              },
              {
                id: 'cancel',
                label: t('orders.actions.cancel', 'Cancelar pedido'),
                icon: Ban,
                onClick: () => pedidoActions.openCancel(record.id),
                tone: 'danger',
                visible: access.canEdit && record.canCancel === true,
              },
            ]}
            mobileCard={{
              title: (record) => `${record.id}${record.codigo ? ` • ${record.codigo}` : ''}`,
              subtitle: (record) => record.cliente_nome || '-',
              meta: (record) => record.status_label || '-',
              badges: (record) => (
                <>
                  <StatusBadge tone={record.status_tone}>{record.status_label || '-'}</StatusBadge>
                  {record.canal ? <StatusBadge tone="neutral">{formatChannel(record.canal, t)}</StatusBadge> : null}
                  {record.hasCorte ? <StatusBadge tone="warning">{t('orders.badges.cutOrder', 'Pedido com corte')}</StatusBadge> : null}
                </>
              ),
            }}
            pagination={pedidosState.data?.meta}
            onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
            pageSize={{
              value: filters.perPage,
              options: [15, 30, 45, 60],
              onChange: (perPage) => {
                setFilters((current) => ({ ...current, perPage, page: 1 }))
                setDraft((current) => ({ ...current, perPage, page: 1 }))
              },
            }}
          />
        </SectionCard>
      </AsyncState>

      {pedidoActions.dialogs}
    </div>
  )
}

