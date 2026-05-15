'use client'

import Link from 'next/link'
import { AlertTriangle, Pencil, Plus, RefreshCcw, Store } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AppDataTable } from '@/src/components/data-table/app-data-table'
import { DataTableFiltersCard } from '@/src/components/data-table/data-table-filters'
import { DataTableFilterToggleAction, DataTablePageActions, DataTableSectionAction } from '@/src/components/data-table/data-table-toolbar'
import type { AppDataTableColumn, AppDataTableFilterConfig } from '@/src/components/data-table/types'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { AsyncState } from '@/src/components/ui/async-state'
import { PageHeader } from '@/src/components/ui/page-header'
import { SectionCard } from '@/src/components/ui/section-card'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { catalogosDigitaisClient } from '@/src/features/catalogos-digitais/services/catalogos-digitais-client'
import type { CatalogosDigitaisCatalog, CatalogosDigitaisListFilters } from '@/src/features/catalogos-digitais/types/catalogos-digitais'
import { useAsyncData } from '@/src/hooks/use-async-data'
import { useI18n } from '@/src/i18n/use-i18n'
import type { Locale, TranslationParams } from '@/src/i18n/types'

const DEFAULT_FILTERS: CatalogosDigitaisListFilters = {
  code: '',
  name: '',
  status: '',
  validFrom: '',
  validTo: '',
}

function statusTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' | 'info' {
  if (status === 'pronto') return 'success'
  if (status === 'rascunho') return 'warning'
  if (['erro', 'falha'].includes(status)) return 'danger'
  return 'neutral'
}

type Translate = (key: string, fallback?: string, params?: TranslationParams) => string

function statusLabel(status: string, t: Translate) {
  const labels: Record<string, string> = {
    pronto: t('digitalCatalogs.status.ready', 'Pronto'),
    rascunho: t('digitalCatalogs.status.draft', 'Rascunho'),
    erro: t('digitalCatalogs.status.error', 'Erro'),
  }
  return labels[status] || status || '-'
}

function parseDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatDate(value: string, locale: Locale) {
  if (!value) return ''
  const date = parseDate(value)
  if (!date) return value
  return new Intl.DateTimeFormat(locale).format(date)
}

function validityLabel(item: CatalogosDigitaisCatalog, locale: Locale, t: Translate) {
  const from = formatDate(item.validFrom, locale)
  const to = formatDate(item.validTo, locale)

  if (from && to) return `${from} ${t('digitalCatalogs.validity.separator', 'até')} ${to}`
  if (from) return `${t('digitalCatalogs.validity.fromPrefix', 'A partir de')} ${from}`
  if (to) return `${t('digitalCatalogs.validity.toPrefix', 'Até')} ${to}`
  return '-'
}

function ContractWarning({ moduleId }: { moduleId: string }) {
  const { t } = useI18n()

  return (
    <div
      data-testid="catalogos-digitais-contract-warning"
      className="app-card-modern flex flex-col gap-4 rounded-[1.1rem] border-orange-200 bg-orange-50 px-5 py-4 text-slate-900 shadow-sm md:flex-row md:items-center md:justify-between dark:border-orange-400/30 dark:bg-orange-400/10 dark:text-orange-50"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-700 dark:bg-orange-400/20 dark:text-orange-100">
          <AlertTriangle className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="font-bold">{t('digitalCatalogs.contractWarning', 'Atenção: o módulo Catálogos Digitais ainda não está contratado para sua loja.')}</p>
          <p className="mt-1 text-sm text-slate-700 dark:text-orange-50/80">{t('digitalCatalogs.contractWarningDescription', 'A listagem fica disponível para administração, mas a criação e edição dependem da contratação do módulo.')}</p>
        </div>
      </div>
      <Link href={`/agile-store/${encodeURIComponent(moduleId)}`} className="app-button-secondary inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-bold">
        <Store className="h-4 w-4" />
        {t('sac.contractInAgileStore', 'Contratar na Agile Store')}
      </Link>
    </div>
  )
}

function paginationRange(meta: { page: number; perPage: number; total: number; pages: number }) {
  if (!meta.total) {
    return { from: 0, to: 0 }
  }

  const from = ((meta.page - 1) * meta.perPage) + 1
  return {
    from,
    to: Math.min(meta.total, from + meta.perPage - 1),
  }
}

export function CatalogosDigitaisListPage() {
  const { locale, t } = useI18n()
  const access = useFeatureAccess('catalogosDigitais')
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [filtersDraft, setFiltersDraft] = useState<CatalogosDigitaisListFilters>({ ...DEFAULT_FILTERS })
  const [filters, setFilters] = useState<CatalogosDigitaisListFilters>({ ...DEFAULT_FILTERS })
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(15)

  const listState = useAsyncData(
    () => catalogosDigitaisClient.list({ page, perpage: perPage, ...filters }),
    [page, perPage, filters],
  )

  const data = listState.data
  const rows = data?.items ?? []
  const appStore = data?.appStore
  const moduleContracted = appStore?.contracted === true
  const canCreateCatalog = access.canCreate && moduleContracted

  const filterConfig = useMemo<Array<AppDataTableFilterConfig<CatalogosDigitaisListFilters>>>(
    () => [
      {
        kind: 'text',
        id: 'code',
        key: 'code',
        label: t('digitalCatalogs.filters.code', 'Código'),
        placeholder: t('digitalCatalogs.filters.codePlaceholder', 'Código do catálogo'),
      },
      {
        kind: 'text',
        id: 'name',
        key: 'name',
        label: t('digitalCatalogs.filters.name', 'Nome'),
        placeholder: t('digitalCatalogs.filters.namePlaceholder', 'Nome ou descrição'),
      },
      {
        kind: 'date-range',
        id: 'validity',
        fromKey: 'validFrom',
        toKey: 'validTo',
        label: t('digitalCatalogs.columns.validity', 'Vigência'),
      },
      {
        kind: 'select',
        id: 'status',
        key: 'status',
        label: t('digitalCatalogs.columns.status', 'Status'),
        emptyLabel: t('digitalCatalogs.allStatuses', 'Todos os status'),
        options: [
          { value: 'rascunho', label: statusLabel('rascunho', t) },
          { value: 'pronto', label: statusLabel('pronto', t) },
        ],
      },
    ],
    [t],
  )

  const columns = useMemo<Array<AppDataTableColumn<CatalogosDigitaisCatalog>>>(
    () => [
      {
        id: 'code',
        label: t('digitalCatalogs.columns.code', 'Código'),
        thClassName: 'w-[170px]',
        tdClassName: 'font-semibold text-slate-950',
        cell: (item) => item.code || '-',
      },
      {
        id: 'name',
        label: t('digitalCatalogs.columns.name', 'Nome'),
        cell: (item) => (
          <div className="min-w-0">
            {item.publicUrl ? (
              <a href={item.publicUrl} target="_blank" rel="noreferrer" className="font-semibold text-[color:var(--app-text)] transition hover:text-accent">
                {item.name || '-'}
              </a>
            ) : (
              <span className="font-semibold text-[color:var(--app-text)]">{item.name || '-'}</span>
            )}
            {item.description ? <p className="mt-1 break-words text-xs text-[color:var(--app-muted)]">{item.description}</p> : null}
          </div>
        ),
      },
      {
        id: 'validity',
        label: t('digitalCatalogs.columns.validity', 'Vigência'),
        thClassName: 'w-[220px]',
        cell: (item) => validityLabel(item, locale, t),
      },
      {
        id: 'status',
        label: t('digitalCatalogs.columns.status', 'Status'),
        thClassName: 'w-[150px]',
        cell: (item) => <StatusBadge tone={statusTone(item.status)}>{statusLabel(item.status, t)}</StatusBadge>,
      },
    ],
    [locale, t],
  )

  function patchDraft<K extends keyof CatalogosDigitaisListFilters>(key: K, value: CatalogosDigitaisListFilters[K]) {
    setFiltersDraft((current) => ({ ...current, [key]: value }))
  }

  function applyFilters() {
    setPage(1)
    setFilters({ ...filtersDraft })
  }

  function clearFilters() {
    setPage(1)
    setFiltersDraft({ ...DEFAULT_FILTERS })
    setFilters({ ...DEFAULT_FILTERS })
  }

  if (!access.canOpen && !access.canList) {
    return <AccessDeniedState title={t('digitalCatalogs.title', 'Catálogos Digitais')} backHref="/dashboard" />
  }

  const meta = data?.meta
  const pagination = meta ? paginationRange(meta) : null

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={[{ label: t('routes.dashboard', 'Início'), href: '/dashboard' }, { label: t('routes.catalogo', 'Catálogo') }, { label: t('digitalCatalogs.title', 'Catálogos Digitais') }]}
        actions={<DataTableSectionAction label={t('common.refresh', 'Atualizar')} icon={RefreshCcw} onClick={listState.reload} />}
      />

      {appStore && !moduleContracted ? <ContractWarning moduleId={appStore.moduleId} /> : null}

      <AsyncState
        isLoading={listState.isLoading}
        error={listState.error}
        loadingTitle={t('digitalCatalogs.loadingTitle', 'Carregando catálogos')}
        loadingDescription={t('digitalCatalogs.loadingDescription', 'Consultando catálogos digitais da empresa ativa.')}
      >
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
                  access.canCreate
                    ? {
                        label: t('digitalCatalogs.new', 'Novo catálogo'),
                        icon: Plus,
                        href: canCreateCatalog ? '/catalogos-digitais/novo' : undefined,
                        tone: 'primary',
                        disabled: !canCreateCatalog,
                      }
                    : null,
                ]}
              />
            </div>
          )}
        >
          <DataTableFiltersCard
            variant="embedded"
            extraFilters={filterConfig}
            draft={filtersDraft}
            applied={filters}
            expanded={filtersExpanded}
            onToggleExpanded={() => setFiltersExpanded((current) => !current)}
            onApply={applyFilters}
            onClear={clearFilters}
            patchDraft={patchDraft}
          />

          <AppDataTable
            rows={rows}
            getRowId={(item) => item.id || item.code}
            columns={columns}
            emptyMessage={t('digitalCatalogs.empty', 'Nenhum catálogo digital encontrado.')}
            rowActions={(item) => [
              {
                id: 'edit',
                label: `${t('digitalCatalogs.editCatalog', 'Editar catálogo')} ${item.name}`,
                icon: Pencil,
                href: `/catalogos-digitais/${encodeURIComponent(item.id)}/editar`,
                visible: access.canEdit || access.canView,
              },
            ]}
            actionsLabel={t('digitalCatalogs.columns.actions', 'Ações')}
            mobileCard={{
              title: (item) => item.name || item.code,
              subtitle: (item) => item.description || item.code,
              meta: (item) => validityLabel(item, locale, t),
              badges: (item) => <StatusBadge tone={statusTone(item.status)}>{statusLabel(item.status, t)}</StatusBadge>,
            }}
            pagination={meta && pagination ? {
              from: pagination.from,
              to: pagination.to,
              total: meta.total,
              page: meta.page,
              pages: meta.pages,
              perPage: meta.perPage,
            } : undefined}
            onPageChange={setPage}
            pageSize={{ value: perPage, options: [15, 30, 45, 60], onChange: (value) => {
              setPage(1)
              setPerPage(value)
            } }}
          />
        </SectionCard>
      </AsyncState>
    </div>
  )
}
