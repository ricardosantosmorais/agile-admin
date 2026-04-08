'use client'

import { Eye, RefreshCcw } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { AppDataTable } from '@/src/components/data-table/app-data-table'
import { DataTableFiltersCard } from '@/src/components/data-table/data-table-filters'
import { DataTableFilterToggleAction, DataTableSectionAction } from '@/src/components/data-table/data-table-toolbar'
import type { AppDataTableColumn, AppDataTableFilterConfig } from '@/src/components/data-table/types'
import { AsyncState } from '@/src/components/ui/async-state'
import { OverlayModal } from '@/src/components/ui/overlay-modal'
import { PageHeader } from '@/src/components/ui/page-header'
import { SectionCard } from '@/src/components/ui/section-card'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { logsClient } from '@/src/features/logs/services/logs-client'
import { buildJsonDiffRows } from '@/src/features/logs/services/logs-diff'
import { LOG_MODULE_OPTIONS } from '@/src/features/logs/services/logs-module-map'
import type { LogAction, LogsListFilters, LogsListRecord } from '@/src/features/logs/services/logs-types'
import { useAsyncData } from '@/src/hooks/use-async-data'
import { useI18n } from '@/src/i18n/use-i18n'
import { formatDateTime } from '@/src/lib/date-time'

const DEFAULT_FILTERS: LogsListFilters = {
  page: 1,
  perPage: 15,
  orderBy: 'data',
  sort: 'desc',
  id_registro: '',
  modulo: '',
  id_usuario: '',
  'data::ge': '',
  'data::le': '',
  acao: '',
}

function buildFiltersFromQuery(searchParams: ReturnType<typeof useSearchParams>): LogsListFilters {
  return {
    ...DEFAULT_FILTERS,
    id_registro: searchParams.get('id_registro') ?? '',
    modulo: searchParams.get('modulo') ?? '',
    id_usuario: searchParams.get('id_usuario') ?? '',
    acao: searchParams.get('acao') ?? '',
  }
}

function formatActionLabel(
  action: LogAction,
  t: ReturnType<typeof useI18n>['t'],
) {
  if (action === 'inclusao') {
    return t('maintenance.logs.actionLabels.create', 'Inclusão')
  }

  if (action === 'alteracao') {
    return t('maintenance.logs.actionLabels.update', 'Alteração')
  }

  if (action === 'exclusao') {
    return t('maintenance.logs.actionLabels.delete', 'Exclusão')
  }

  return '-'
}

function prettifyJson(value: string | null) {
  if (!value) {
    return null
  }

  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}

type JsonSide = 'previous' | 'next'

function extractPathKeys(path: string) {
  return path
    .split('.')
    .map((segment) => segment.replace(/\[\d+\]/g, '').trim())
    .filter(Boolean)
}

function buildHighlightedJsonLines(
  snapshot: string | null,
  diffRows: ReturnType<typeof buildJsonDiffRows>,
  side: JsonSide,
) {
  const pretty = prettifyJson(snapshot)
  if (!pretty) {
    return []
  }

  const sideRows = diffRows.filter((row) => {
    if (side === 'previous') {
      return row.kind === 'changed' || row.kind === 'removed'
    }

    return row.kind === 'changed' || row.kind === 'added'
  })

  const pathKeys = new Set(sideRows.flatMap((row) => extractPathKeys(row.path)))
  const lines = pretty.split('\n')

  return lines.map((line) => {
    const highlighted = Array.from(pathKeys).some((key) => line.includes(`"${key}"`))
    return { text: line, highlighted }
  })
}

export function LogsPage() {
  const { t } = useI18n()
  const searchParams = useSearchParams()
  const queryFilters = useMemo(() => buildFiltersFromQuery(searchParams), [searchParams])
  const access = useFeatureAccess('logsManutencao')
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [filters, setFilters] = useState<LogsListFilters>(queryFilters)
  const [filtersDraft, setFiltersDraft] = useState<LogsListFilters>(queryFilters)
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null)

  useEffect(() => {
    setFilters(queryFilters)
    setFiltersDraft(queryFilters)
  }, [queryFilters])
  const listState = useAsyncData(() => logsClient.list(filters), [filters])
  const detailState = useAsyncData(
    () => (selectedLogId ? logsClient.getById(selectedLogId) : Promise.resolve(null)),
    [selectedLogId],
  )

  const rows = listState.data?.data ?? []
  const userFilterOptions = useMemo(
    () => (listState.data?.lookups.users ?? []).map((user) => ({ value: user.id, label: user.nome })),
    [listState.data?.lookups.users],
  )

  const columns = useMemo(
    () =>
      ([
        {
          id: 'id_registro',
          label: t('maintenance.logs.fields.recordId', 'ID'),
          sortKey: 'id_registro',
          thClassName: 'w-[120px]',
          cell: (row: LogsListRecord) => <span className="font-semibold text-slate-950">{row.id_registro || '-'}</span>,
          filter: { kind: 'text', id: 'id_registro', key: 'id_registro', label: t('maintenance.logs.fields.recordId', 'ID') },
        },
        {
          id: 'modulo',
          label: t('maintenance.logs.fields.module', 'Módulo'),
          sortKey: 'modulo',
          thClassName: 'w-[220px]',
          cell: (row: LogsListRecord) => row.modulo_nome || t('maintenance.logs.moduleNotMapped', 'Módulo não mapeado'),
          filter: {
            kind: 'select',
            id: 'modulo',
            key: 'modulo',
            label: t('maintenance.logs.fields.module', 'Módulo'),
            options: LOG_MODULE_OPTIONS,
          },
        },
        {
          id: 'usuario_nome',
          label: t('maintenance.logs.fields.user', 'Usuário'),
          sortKey: 'id_usuario',
          cell: (row: LogsListRecord) => row.usuario_nome || '-',
          filter: {
            kind: 'select',
            id: 'id_usuario',
            key: 'id_usuario',
            label: t('maintenance.logs.fields.user', 'Usuário'),
            options: userFilterOptions,
          },
        },
        {
          id: 'data',
          label: t('maintenance.logs.fields.date', 'Data'),
          sortKey: 'data',
          thClassName: 'w-[190px]',
          cell: (row: LogsListRecord) => (row.data ? formatDateTime(row.data) : '-'),
        },
        {
          id: 'acao',
          label: t('maintenance.logs.fields.action', 'Ação'),
          sortKey: 'acao',
          thClassName: 'w-[140px]',
          cell: (row: LogsListRecord) => {
            const label = formatActionLabel(row.acao, t)
            const tone = row.acao === 'inclusao'
              ? 'success'
              : row.acao === 'alteracao'
                ? 'warning'
                : row.acao === 'exclusao'
                  ? 'danger'
                  : 'neutral'

            return <StatusBadge tone={tone}>{label}</StatusBadge>
          },
          filter: {
            kind: 'select',
            id: 'acao',
            key: 'acao',
            label: t('maintenance.logs.fields.action', 'Ação'),
            options: [
              { value: 'inclusao', label: t('maintenance.logs.actionLabels.create', 'Inclusão') },
              { value: 'alteracao', label: t('maintenance.logs.actionLabels.update', 'Alteração') },
              { value: 'exclusao', label: t('maintenance.logs.actionLabels.delete', 'Exclusão') },
            ],
          },
        },
      ]) satisfies AppDataTableColumn<LogsListRecord, LogsListFilters>[],
    [t, userFilterOptions],
  )

  const extraFilters = useMemo(
    () => ([
      {
        kind: 'date-range',
        id: 'data',
        fromKey: 'data::ge',
        toKey: 'data::le',
        label: t('maintenance.logs.fields.date', 'Data'),
        widthClassName: 'md:col-span-2 xl:col-span-4',
      },
    ]) satisfies AppDataTableFilterConfig<LogsListFilters>[],
    [t],
  )

  function patchDraft<K extends keyof LogsListFilters>(key: K, value: LogsListFilters[K]) {
    setFiltersDraft((current) => ({ ...current, [key]: value, page: 1 }))
  }

  function handleSort(column: string) {
    setFilters((current) => ({
      ...current,
      orderBy: column as LogsListFilters['orderBy'],
      sort: current.orderBy === column && current.sort === 'asc' ? 'desc' : 'asc',
      page: 1,
    }))
  }

  if (!access.canList) {
    return <AccessDeniedState title={t('maintenance.logs.title', 'Logs')} backHref="/dashboard" />
  }

  const detail = detailState.data
  const previousRecord = prettifyJson(detail?.json_registro_anterior ?? null)
  const newRecord = prettifyJson(detail?.json_registro_novo ?? null)
  const diffRows = buildJsonDiffRows(detail?.json_registro_anterior ?? null, detail?.json_registro_novo ?? null)
  const previousLines = buildHighlightedJsonLines(detail?.json_registro_anterior ?? null, diffRows, 'previous')
  const nextLines = buildHighlightedJsonLines(detail?.json_registro_novo ?? null, diffRows, 'next')
  const previousChangedLines = previousLines.filter((line) => line.highlighted).length
  const nextChangedLines = nextLines.filter((line) => line.highlighted).length

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={[
          { label: t('routes.dashboard', 'Início'), href: '/dashboard' },
          { label: t('routes.manutencao', 'Manutenção'), href: '/sequenciais' },
          { label: t('maintenance.logs.title', 'Logs'), href: '/logs' },
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
            </div>
          )}
        >
          <DataTableFiltersCard
            variant="embedded"
            columns={columns as AppDataTableColumn<unknown, LogsListFilters>[]}
            extraFilters={extraFilters}
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
            emptyMessage={t('simpleCrud.emptyMessage', 'Nenhum registro encontrado com os filtros atuais.')}
            columns={columns}
            sort={{
              activeColumn: filters.orderBy,
              direction: filters.sort,
              onToggle: (column) => handleSort(String(column)),
            }}
            mobileCard={{
              title: (row) => row.id_registro || '-',
              subtitle: (row) => row.modulo_nome || t('maintenance.logs.moduleNotMapped', 'Módulo não mapeado'),
              meta: (row) => (row.data ? formatDateTime(row.data) : '-'),
              badges: (row) => {
                const tone = row.acao === 'inclusao'
                  ? 'success'
                  : row.acao === 'alteracao'
                    ? 'warning'
                    : row.acao === 'exclusao'
                      ? 'danger'
                      : 'neutral'

                return <StatusBadge tone={tone}>{formatActionLabel(row.acao, t)}</StatusBadge>
              },
            }}
            rowActions={(row) => [
              {
                id: 'view',
                label: t('maintenance.logs.actions.view', 'Detalhes'),
                icon: Eye,
                onClick: () => setSelectedLogId(row.id),
                visible: access.canView || access.canEdit,
              },
            ]}
            actionsColumnClassName="w-[64px] whitespace-nowrap"
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
        open={Boolean(selectedLogId)}
        title={t('maintenance.logs.actions.view', 'Detalhes')}
        onClose={() => setSelectedLogId(null)}
        maxWidthClassName="max-w-6xl"
      >
        <AsyncState isLoading={Boolean(selectedLogId) && detailState.isLoading} error={selectedLogId ? detailState.error : ''}>
          {detail ? (
            <div className="space-y-5">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-[1rem] border border-[#ebe4d8] bg-[#fcfaf5] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {t('maintenance.logs.fields.action', 'Ação')}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{formatActionLabel(detail.acao, t)}</p>
                </div>
                <div className="rounded-[1rem] border border-[#ebe4d8] bg-[#fcfaf5] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {t('maintenance.logs.fields.module', 'Módulo')}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {detail.modulo_nome || t('maintenance.logs.moduleNotMapped', 'Módulo não mapeado')}
                  </p>
                </div>
                <div className="rounded-[1rem] border border-[#ebe4d8] bg-[#fcfaf5] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {t('maintenance.logs.fields.user', 'Usuário')}
                  </p>
                  <p className="mt-1 text-sm text-slate-900">{detail.usuario_nome || '-'}</p>
                </div>
                <div className="rounded-[1rem] border border-[#ebe4d8] bg-[#fcfaf5] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {t('maintenance.logs.fields.date', 'Data')}
                  </p>
                  <p className="mt-1 text-sm text-slate-900">{detail.data ? formatDateTime(detail.data) : '-'}</p>
                </div>
              </div>

              {detail.descricao ? (
                <div className="rounded-[1rem] border border-[#ebe4d8] bg-[#fcfaf5] p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {t('maintenance.logs.fields.description', 'Descrição')}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{detail.descricao}</p>
                </div>
              ) : null}

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {t('maintenance.logs.fields.previousRecord', 'Registro anterior')}
                  </p>
                  <div className="overflow-hidden rounded-[1rem] border border-[#ebe4d8] bg-slate-950">
                    <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-2.5">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">
                        {t('maintenance.logs.fields.changedLines', 'Linhas alteradas')}
                      </span>
                      <span className="rounded-full bg-rose-500/20 px-2.5 py-1 text-[11px] font-semibold text-rose-200">
                        {previousChangedLines}
                      </span>
                    </div>
                    <pre className="max-h-[360px] overflow-auto p-0 text-xs leading-6 text-slate-100">
                      {previousRecord ? (
                        <code className="block">
                          {previousLines.map((line, index) => (
                            <span
                              key={`prev-line-${index + 1}`}
                              className={`grid grid-cols-[40px_1fr] px-3 py-0.5 font-mono whitespace-pre ${
                                line.highlighted ? 'bg-rose-500/15' : ''
                              }`}
                            >
                              <span className="select-none pr-3 text-right text-slate-500">{index + 1}</span>
                              <span>{line.text || ' '}</span>
                            </span>
                          ))}
                        </code>
                      ) : (
                        <code className="block px-4 py-3">{t('maintenance.logs.emptyJson', 'Sem dados disponíveis.')}</code>
                      )}
                    </pre>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {t('maintenance.logs.fields.newRecord', 'Registro novo')}
                  </p>
                  <div className="overflow-hidden rounded-[1rem] border border-[#ebe4d8] bg-slate-950">
                    <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-2.5">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">
                        {t('maintenance.logs.fields.changedLines', 'Linhas alteradas')}
                      </span>
                      <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
                        {nextChangedLines}
                      </span>
                    </div>
                    <pre className="max-h-[360px] overflow-auto p-0 text-xs leading-6 text-slate-100">
                      {newRecord ? (
                        <code className="block">
                          {nextLines.map((line, index) => (
                            <span
                              key={`new-line-${index + 1}`}
                              className={`grid grid-cols-[40px_1fr] px-3 py-0.5 font-mono whitespace-pre ${
                                line.highlighted ? 'bg-emerald-500/15' : ''
                              }`}
                            >
                              <span className="select-none pr-3 text-right text-slate-500">{index + 1}</span>
                              <span>{line.text || ' '}</span>
                            </span>
                          ))}
                        </code>
                      ) : (
                        <code className="block px-4 py-3">{t('maintenance.logs.emptyJson', 'Sem dados disponíveis.')}</code>
                      )}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </AsyncState>
      </OverlayModal>
    </div>
  )
}

