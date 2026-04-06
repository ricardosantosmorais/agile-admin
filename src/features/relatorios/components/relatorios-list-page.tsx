'use client'

import { Eye, RefreshCcw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AppDataTable } from '@/src/components/data-table/app-data-table'
import { DataTableFiltersCard } from '@/src/components/data-table/data-table-filters'
import { DataTableFilterToggleAction, DataTableSectionAction } from '@/src/components/data-table/data-table-toolbar'
import type { AppDataTableColumn } from '@/src/components/data-table/types'
import { AsyncState } from '@/src/components/ui/async-state'
import { PageHeader } from '@/src/components/ui/page-header'
import { SectionCard } from '@/src/components/ui/section-card'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { relatoriosClient } from '@/src/features/relatorios/services/relatorios-client'
import type { RelatorioListFilters, RelatorioListRecord } from '@/src/features/relatorios/services/relatorios-types'
import { useAsyncData } from '@/src/hooks/use-async-data'
import { useI18n } from '@/src/i18n/use-i18n'

const DEFAULT_FILTERS: RelatorioListFilters = {
  page: 1,
  perPage: 15,
  orderBy: 'codigo',
  sort: 'asc',
  codigo: '',
  grupo: '',
  nome: '',
}

export function RelatoriosListPage() {
  const { t } = useI18n()
  const access = useFeatureAccess('relatorios')
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [filters, setFilters] = useState<RelatorioListFilters>(DEFAULT_FILTERS)
  const [filtersDraft, setFiltersDraft] = useState<RelatorioListFilters>(DEFAULT_FILTERS)
  const reportsState = useAsyncData(() => relatoriosClient.list(filters), [filters])
  const reports = reportsState.data?.data ?? []

  const columns = useMemo(() => ([
    {
      id: 'codigo',
      label: t('relatorios.code', 'Código'),
      sortKey: 'codigo',
      thClassName: 'w-[160px]',
      cell: (report: RelatorioListRecord) => <span className="font-semibold text-slate-950">{report.codigo}</span>,
      filter: {
        kind: 'text',
        id: 'codigo',
        key: 'codigo',
        label: t('relatorios.code', 'Código'),
      },
    },
    {
      id: 'grupo',
      label: t('relatorios.group', 'Grupo'),
      sortKey: 'grupo',
      visibility: 'lg',
      cell: (report: RelatorioListRecord) => report.grupo || '-',
      filter: {
        kind: 'text',
        id: 'grupo',
        key: 'grupo',
        label: t('relatorios.group', 'Grupo'),
      },
    },
    {
      id: 'nome',
      label: t('relatorios.name', 'Nome'),
      sortKey: 'nome',
      tdClassName: 'font-semibold text-slate-950',
      cell: (report: RelatorioListRecord) => <span className="truncate">{report.nome}</span>,
      filter: {
        kind: 'text',
        id: 'nome',
        key: 'nome',
        label: t('relatorios.name', 'Nome'),
      },
    },
  ]) satisfies AppDataTableColumn<RelatorioListRecord, RelatorioListFilters>[], [t])

  function patchDraft<K extends keyof RelatorioListFilters>(key: K, value: RelatorioListFilters[K]) {
    setFiltersDraft((current) => ({ ...current, [key]: value, page: 1 }))
  }

  function toggleSort(column: string) {
    setFilters((current) => ({
      ...current,
      orderBy: column as RelatorioListFilters['orderBy'],
      sort: current.orderBy === column && current.sort === 'asc' ? 'desc' : 'asc',
      page: 1,
    }))
  }

  if (!access.canList) {
    return <AccessDeniedState title={t('relatorios.title', 'Relatórios')} backHref="/dashboard" />
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={[
          { label: t('routes.dashboard', 'Home'), href: '/dashboard' },
          { label: t('relatorios.title', 'Relatórios v2'), href: '/relatorios' },
        ]}
        actions={<DataTableSectionAction label={t('common.refresh', 'Atualizar')} icon={RefreshCcw} onClick={reportsState.reload} />}
      />

      <AsyncState isLoading={reportsState.isLoading} error={reportsState.error}>
        <SectionCard
          action={(
            <div className="flex w-full items-center justify-between gap-3">
              <DataTableFilterToggleAction
                expanded={filtersExpanded}
                onClick={() => setFiltersExpanded((current) => !current)}
                collapsedLabel={t('filters.button', 'Filtros')}
                expandedLabel={t('filters.hide', 'Ocultar filtros')}
              />
            </div>
          )}
        >
          <DataTableFiltersCard
            variant="embedded"
            columns={columns as AppDataTableColumn<unknown, RelatorioListFilters>[]}
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
            rows={reports}
            getRowId={(report) => report.id}
            emptyMessage={t('relatorios.empty', 'Nenhum relatório encontrado com os filtros atuais.')}
            columns={columns}
            sort={{
              activeColumn: filters.orderBy,
              direction: filters.sort,
              onToggle: (column) => toggleSort(String(column)),
            }}
            mobileCard={{
              title: (report) => report.nome,
              subtitle: (report) => report.grupo,
              meta: (report) => report.codigo,
            }}
            rowActions={(report) => [
              {
                id: 'open',
                label: t('relatorios.actions.open', 'Acessar relatório'),
                icon: Eye,
                href: `/relatorios/${report.id}`,
                visible: access.canView || access.canEdit,
              },
            ]}
            actionsColumnClassName="w-[96px] whitespace-nowrap"
            pagination={reportsState.data?.meta}
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
    </div>
  )
}
