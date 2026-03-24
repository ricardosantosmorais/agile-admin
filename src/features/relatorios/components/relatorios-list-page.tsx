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
import { useAsyncData } from '@/src/hooks/use-async-data'
import { useI18n } from '@/src/i18n/use-i18n'
import { appData } from '@/src/services/app-data'

type ReportFilters = {
  codigo: string
  grupo: string
  nome: string
}

const DEFAULT_FILTERS: ReportFilters = {
  codigo: '',
  grupo: '',
  nome: '',
}

export function RelatoriosListPage() {
  const { t } = useI18n()
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [filters, setFilters] = useState<ReportFilters>(DEFAULT_FILTERS)
  const [filtersDraft, setFiltersDraft] = useState<ReportFilters>(DEFAULT_FILTERS)
  const reportsState = useAsyncData(() => appData.reports.list(), [])

  const reports = useMemo(() => {
    const termoCodigo = filters.codigo.trim().toLowerCase()
    const termoGrupo = filters.grupo.trim().toLowerCase()
    const termoNome = filters.nome.trim().toLowerCase()

    return (reportsState.data ?? []).filter((report) => {
      const byCodigo = !termoCodigo || report.codigo.toLowerCase().includes(termoCodigo)
      const byGrupo = !termoGrupo || report.grupo.toLowerCase().includes(termoGrupo)
      const byNome = !termoNome || report.nome.toLowerCase().includes(termoNome)
      return byCodigo && byGrupo && byNome
    })
  }, [filters.codigo, filters.grupo, filters.nome, reportsState.data])

  const columns = useMemo(() => ([
    {
      id: 'codigo',
      label: t('relatorios.code', 'Code'),
      thClassName: 'w-[140px]',
      cell: (report: (typeof reports)[number]) => <span className="font-semibold text-slate-950">{report.codigo}</span>,
      filter: {
        kind: 'text',
        id: 'codigo',
        key: 'codigo',
        label: t('relatorios.code', 'Code'),
      },
    },
    {
      id: 'grupo',
      label: t('relatorios.group', 'Group'),
      visibility: 'lg',
      cell: (report: (typeof reports)[number]) => report.grupo,
      filter: {
        kind: 'text',
        id: 'grupo',
        key: 'grupo',
        label: t('relatorios.group', 'Group'),
      },
    },
    {
      id: 'nome',
      label: t('relatorios.name', 'Name'),
      tdClassName: 'font-semibold text-slate-950',
      cell: (report: (typeof reports)[number]) => <span className="truncate">{report.nome}</span>,
      filter: {
        kind: 'text',
        id: 'nome',
        key: 'nome',
        label: t('relatorios.name', 'Name'),
      },
    },
  ]) satisfies AppDataTableColumn<(typeof reports)[number], ReportFilters>[], [t])

  function patchDraft<K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) {
    setFiltersDraft((current) => ({ ...current, [key]: value }))
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={[
          { label: t('routes.dashboard', 'Home'), href: '/dashboard' },
          { label: t('relatorios.title', 'Reports'), href: '/relatorios' },
        ]}
        actions={<DataTableSectionAction label={t('common.refresh', 'Refresh')} icon={RefreshCcw} onClick={reportsState.reload} />}
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
              <div />
            </div>
          )}
        >
          <DataTableFiltersCard
            variant="embedded"
            columns={columns as AppDataTableColumn<unknown, ReportFilters>[]}
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
            emptyMessage={t('relatorios.empty', 'No reports found with the current filters.')}
            columns={columns}
            mobileCard={{
              title: (report) => report.nome,
              subtitle: (report) => report.grupo,
              meta: (report) => report.codigo,
            }}
            rowActions={(report) => [
              {
                id: 'open',
                label: t('relatorios.actions.open', 'Open report'),
                icon: Eye,
                href: `/relatorios/${report.id}`,
              },
            ]}
            actionsColumnClassName="w-[96px] whitespace-nowrap"
          />
        </SectionCard>
      </AsyncState>
    </div>
  )
}
