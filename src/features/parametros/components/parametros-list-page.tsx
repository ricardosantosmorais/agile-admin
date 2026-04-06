'use client'

import { Eye, Pencil, Plus, RefreshCcw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AppDataTable } from '@/src/components/data-table/app-data-table'
import { DataTableFiltersCard } from '@/src/components/data-table/data-table-filters'
import { DataTableFilterToggleAction, DataTablePageActions, DataTableSectionAction } from '@/src/components/data-table/data-table-toolbar'
import type { AppDataTableColumn } from '@/src/components/data-table/types'
import { AsyncState } from '@/src/components/ui/async-state'
import { OverlayModal } from '@/src/components/ui/overlay-modal'
import { PageHeader } from '@/src/components/ui/page-header'
import { SectionCard } from '@/src/components/ui/section-card'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { parametrosClient } from '@/src/features/parametros/services/parametros-client'
import type { ParametroListFilters, ParametroListRecord, ParametroViewRecord } from '@/src/features/parametros/services/parametros-types'
import { useAsyncData } from '@/src/hooks/use-async-data'
import { useI18n } from '@/src/i18n/use-i18n'

const DEFAULT_FILTERS: ParametroListFilters = {
  page: 1,
  perPage: 15,
  orderBy: 'chave',
  sort: 'asc',
  id: '',
  chave: '',
  filial: '',
  descricao: '',
  parametros: '',
  posicao: '',
  permissao: '',
  ativo: '',
}

function permissaoBadgeLabel(t: ReturnType<typeof useI18n>['t'], value: ParametroListRecord['permissao']) {
  switch (value) {
    case 'todos':
      return t('parameters.permission.all', 'Todos')
    case 'publico':
      return t('parameters.permission.public', 'Público')
    case 'restrito':
      return t('parameters.permission.restricted', 'Restrito')
    default:
      return '-'
  }
}

function formatParametroJson(value: string) {
  try {
    return JSON.stringify(JSON.parse(value || '{}'), null, 2)
  } catch {
    return value || '{}'
  }
}

export function ParametrosListPage() {
  const { t } = useI18n()
  const access = useFeatureAccess('parametros')
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [filters, setFilters] = useState<ParametroListFilters>(DEFAULT_FILTERS)
  const [filtersDraft, setFiltersDraft] = useState<ParametroListFilters>(DEFAULT_FILTERS)
  const [selectedViewId, setSelectedViewId] = useState<string | null>(null)
  const listState = useAsyncData(() => parametrosClient.list(filters), [filters])
  const viewState = useAsyncData<ParametroViewRecord | null>(
    () => (selectedViewId ? parametrosClient.view(selectedViewId) : Promise.resolve(null)),
    [selectedViewId],
  )

  const rows = listState.data?.data ?? []

  const columns = useMemo(
    () =>
      ([
        {
          id: 'id',
          label: t('parameters.fields.id', 'ID'),
          sortKey: 'id',
          thClassName: 'w-[120px]',
          cell: (row: ParametroListRecord) => <span className="font-semibold text-slate-950">{row.id}</span>,
          filter: { kind: 'text', id: 'id', key: 'id', label: t('parameters.fields.id', 'ID') },
        },
        {
          id: 'chave',
          label: t('parameters.fields.key', 'Chave'),
          sortKey: 'chave',
          tdClassName: 'font-semibold text-slate-950',
          cell: (row: ParametroListRecord) => row.chave,
          filter: { kind: 'text', id: 'chave', key: 'chave', label: t('parameters.fields.key', 'Chave') },
        },
        {
          id: 'filial',
          label: t('parameters.fields.branch', 'Filial'),
          sortKey: 'filial:nome_fantasia',
          visibility: 'lg',
          cell: (row: ParametroListRecord) => row.filial,
          filter: { kind: 'text', id: 'filial', key: 'filial', label: t('parameters.fields.branch', 'Filial') },
        },
        {
          id: 'descricao',
          label: t('parameters.fields.description', 'Descrição'),
          sortKey: 'descricao',
          cell: (row: ParametroListRecord) => row.descricao || '-',
          filter: { kind: 'text', id: 'descricao', key: 'descricao', label: t('parameters.fields.description', 'Descrição') },
        },
        {
          id: 'parametros',
          label: t('parameters.fields.parameters', 'Parâmetros'),
          sortKey: 'parametros',
          visibility: 'xl',
          cell: (row: ParametroListRecord) => row.parametrosPreview || '-',
          filter: { kind: 'text', id: 'parametros', key: 'parametros', label: t('parameters.fields.parameters', 'Parâmetros') },
        },
        {
          id: 'posicao',
          label: t('parameters.fields.position', 'Posição'),
          sortKey: 'posicao',
          visibility: 'lg',
          cell: (row: ParametroListRecord) => row.posicao || '-',
          filter: { kind: 'text', id: 'posicao', key: 'posicao', label: t('parameters.fields.position', 'Posição') },
        },
        {
          id: 'permissao',
          label: t('parameters.fields.permission', 'Permissão'),
          sortKey: 'permissao',
          visibility: 'xl',
          cell: (row: ParametroListRecord) => permissaoBadgeLabel(t, row.permissao),
          filter: {
            kind: 'select',
            id: 'permissao',
            key: 'permissao',
            label: t('parameters.fields.permission', 'Permissão'),
            options: [
              { value: 'todos', label: t('parameters.permission.all', 'Todos') },
              { value: 'publico', label: t('parameters.permission.public', 'Público') },
              { value: 'restrito', label: t('parameters.permission.restricted', 'Restrito') },
            ],
          },
        },
        {
          id: 'ativo',
          label: t('parameters.fields.active', 'Ativo'),
          sortKey: 'ativo',
          visibility: 'xl',
          cell: (row: ParametroListRecord) => (row.ativo ? t('common.yes', 'Sim') : t('common.no', 'Não')),
          filter: {
            kind: 'select',
            id: 'ativo',
            key: 'ativo',
            label: t('parameters.fields.active', 'Ativo'),
            options: [
              { value: '1', label: t('common.yes', 'Sim') },
              { value: '0', label: t('common.no', 'Não') },
            ],
          },
        },
      ]) satisfies AppDataTableColumn<ParametroListRecord, ParametroListFilters>[],
    [t],
  )

  function patchDraft<K extends keyof ParametroListFilters>(key: K, value: ParametroListFilters[K]) {
    setFiltersDraft((current) => ({ ...current, [key]: value, page: 1 }))
  }

  function handleSort(column: string) {
    setFilters((current) => ({
      ...current,
      orderBy: column as ParametroListFilters['orderBy'],
      sort: current.orderBy === column && current.sort === 'asc' ? 'desc' : 'asc',
      page: 1,
    }))
  }

  if (!access.canList) {
    return <AccessDeniedState title={t('parameters.title', 'Parâmetros')} backHref="/dashboard" />
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={[
          { label: t('routes.dashboard', 'Início'), href: '/dashboard' },
          { label: t('routes.configuracoes', 'Configurações'), href: '/configuracoes' },
          { label: t('parameters.title', 'Parâmetros'), href: '/configuracoes/parametros' },
        ]}
        actions={<DataTableSectionAction label={t('common.refresh', 'Atualizar')} icon={RefreshCcw} onClick={listState.reload} />}
      />

      <AsyncState isLoading={listState.isLoading} error={listState.error}>
        <SectionCard
          action={(
            <div className="flex w-full items-center justify-between gap-3">
              <DataTableFilterToggleAction
                expanded={filtersExpanded}
                onClick={() => setFiltersExpanded((current) => !current)}
                collapsedLabel={t('filters.button', 'Filtros')}
                expandedLabel={t('filters.hide', 'Ocultar filtros')}
              />
              <DataTablePageActions
                actions={[
                  access.canCreate ? { label: t('common.new', 'Novo'), href: '/configuracoes/parametros/novo', icon: Plus } : null,
                ]}
              />
            </div>
          )}
        >
          <DataTableFiltersCard
            variant="embedded"
            columns={columns as AppDataTableColumn<unknown, ParametroListFilters>[]}
            draft={filtersDraft}
            applied={filters}
            expanded={filtersExpanded}
            onToggleExpanded={() => setFiltersExpanded((current) => !current)}
            onApply={() => setFilters(filtersDraft)}
            onClear={() => {
              setFilters(DEFAULT_FILTERS)
              setFiltersDraft(DEFAULT_FILTERS)
            }}
            patchDraft={patchDraft}
          />

          <AppDataTable
            rows={rows}
            getRowId={(row) => row.id}
            emptyMessage={t('parameters.empty', 'Nenhum parâmetro encontrado com os filtros atuais.')}
            columns={columns}
            sort={{
              activeColumn: filters.orderBy,
              direction: filters.sort,
              onToggle: (column) => handleSort(String(column)),
            }}
            mobileCard={{
              title: (row) => row.chave,
              subtitle: (row) => row.descricao || '-',
              meta: (row) => row.filial,
            }}
            rowActions={(row) => [
              {
                id: 'view',
                label: t('common.open', 'Abrir'),
                icon: Eye,
                onClick: () => setSelectedViewId(row.id),
                visible: access.canView || access.canEdit,
              },
              {
                id: 'edit',
                label: t('common.edit', 'Editar'),
                icon: Pencil,
                href: `/configuracoes/parametros/${row.id}/editar`,
                visible: access.canEdit,
              },
            ]}
            actionsColumnClassName="w-[104px] whitespace-nowrap"
            pagination={listState.data?.meta}
            onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
            pageSize={{
              value: filters.perPage,
              options: [15, 30, 50, 100],
              onChange: (perPage) => {
                const next = { ...filters, perPage, page: 1 }
                setFilters(next)
                setFiltersDraft(next)
              },
            }}
          />
        </SectionCard>
      </AsyncState>

      <OverlayModal
        open={Boolean(selectedViewId)}
        title={t('parameters.viewModal.title', 'Visualizar parâmetro')}
        onClose={() => setSelectedViewId(null)}
        maxWidthClassName="max-w-3xl"
      >
        <AsyncState isLoading={Boolean(selectedViewId) && viewState.isLoading} error={selectedViewId ? viewState.error : ''}>
          {viewState.data ? (
            <div className="space-y-5">
              <div className="rounded-[1.15rem] border border-[#ebe4d8] bg-[#fcfaf5] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {viewState.data.chave}
                </p>
                {viewState.data.descricao ? (
                  <p className="mt-2 text-sm leading-6 text-slate-600">{viewState.data.descricao}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {t('parameters.fields.parameters', 'Parâmetros')}
                </p>
                <pre className="overflow-x-auto rounded-[1rem] border border-[#ebe4d8] bg-slate-950 p-4 text-sm leading-6 text-slate-100">
                  <code>{formatParametroJson(viewState.data.parametros)}</code>
                </pre>
              </div>
            </div>
          ) : null}
        </AsyncState>
      </OverlayModal>
    </div>
  )
}
