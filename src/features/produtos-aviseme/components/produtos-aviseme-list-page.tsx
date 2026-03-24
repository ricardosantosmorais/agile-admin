'use client'

import { FileSearch, RefreshCcw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { AppDataTable } from '@/src/components/data-table/app-data-table'
import { DataTableFiltersCard } from '@/src/components/data-table/data-table-filters'
import { DataTableFilterToggleAction, DataTableSectionAction } from '@/src/components/data-table/data-table-toolbar'
import type { AppDataTableFilterConfig } from '@/src/components/data-table/types'
import { AsyncState } from '@/src/components/ui/async-state'
import { LookupSelect, type LookupOption } from '@/src/components/ui/lookup-select'
import { OverlayModal } from '@/src/components/ui/overlay-modal'
import { PageHeader } from '@/src/components/ui/page-header'
import { PageToast } from '@/src/components/ui/page-toast'
import { SectionCard } from '@/src/components/ui/section-card'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { loadCatalogLookupOptions } from '@/src/features/catalog/services/catalog-lookups'
import { INITIAL_PRODUTOS_AVISEME_FILTERS, produtosAvisemeClient, type ProdutosAvisemeFilters } from '@/src/features/produtos-aviseme/services/produtos-aviseme-client'
import type { AvisemeDetailItem, AvisemeListItem } from '@/src/features/produtos-aviseme/services/produtos-aviseme-mappers'
import { useI18n } from '@/src/i18n/use-i18n'
import { formatDateTime } from '@/src/lib/date-time'

export function ProdutosAvisemeListPage() {
  const { t } = useI18n()
  const access = useFeatureAccess('produtosAviseme')
  const [filters, setFilters] = useState(INITIAL_PRODUTOS_AVISEME_FILTERS)
  const [draft, setDraft] = useState(INITIAL_PRODUTOS_AVISEME_FILTERS)
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [rows, setRows] = useState<AvisemeListItem[]>([])
  const [meta, setMeta] = useState({ page: 1, pages: 1, perPage: 30, from: 0, to: 0, total: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [produtoLookup, setProdutoLookup] = useState<LookupOption | null>(null)
  const [filialLookup, setFilialLookup] = useState<LookupOption | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRows, setDetailRows] = useState<AvisemeDetailItem[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true

    async function load() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await produtosAvisemeClient.list(filters)
        if (!alive) {
          return
        }
        setRows(response.data)
        setMeta(response.meta)
      } catch (loadError) {
        if (!alive) {
          return
        }
        setError(loadError instanceof Error ? loadError.message : t('marketing.aviseme.loadError', 'Não foi possível carregar o avise-me.'))
      } finally {
        if (alive) {
          setIsLoading(false)
        }
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [filters, t])

  const extraFilters = useMemo<AppDataTableFilterConfig<ProdutosAvisemeFilters>[]>(() => [
    {
      id: 'produto_lookup',
      kind: 'custom',
      label: t('marketing.aviseme.fields.product', 'Produto'),
      render: ({ patchDraft }) => (
        <LookupSelect
          label={t('marketing.aviseme.fields.product', 'Produto')}
          value={produtoLookup}
          onChange={(value) => {
            setProdutoLookup(value)
            patchDraft('id_produto', (value?.id || '') as ProdutosAvisemeFilters['id_produto'])
          }}
          loadOptions={(query, page, perPage) => loadCatalogLookupOptions('produtos', query, page, perPage)}
        />
      ),
    },
    {
      id: 'filial_lookup',
      kind: 'custom',
      label: t('marketing.aviseme.fields.branch', 'Filial'),
      render: ({ patchDraft }) => (
        <LookupSelect
          label={t('marketing.aviseme.fields.branch', 'Filial')}
          value={filialLookup}
          onChange={(value) => {
            setFilialLookup(value)
            patchDraft('id_filial', (value?.id || '') as ProdutosAvisemeFilters['id_filial'])
          }}
          loadOptions={(query, page, perPage) => loadCatalogLookupOptions('filiais', query, page, perPage)}
        />
      ),
    },
    {
      id: 'periodo',
      kind: 'date-range',
      label: t('marketing.aviseme.fields.period', 'Período'),
      fromKey: 'data_inicio',
      toKey: 'data_fim',
    },
  ], [filialLookup, produtoLookup, t])

  if (!access.canList) {
    return <AccessDeniedState title={t('menuKeys.avise-me', 'Avise-me')} backHref="/dashboard" />
  }

  async function openDetails(row: AvisemeListItem) {
    setDetailOpen(true)
    setDetailLoading(true)
    setDetailError(null)
    try {
      const details = await produtosAvisemeClient.getDetails(row.id_produto, row.id_filial)
      setDetailRows(details)
    } catch (loadError) {
      setDetailError(loadError instanceof Error ? loadError.message : t('marketing.aviseme.detail.loadError', 'Não foi possível carregar os detalhes.'))
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={[
          { label: t('routes.dashboard', 'Home'), href: '/dashboard' },
          { label: t('simpleCrud.sections.marketing', 'Marketing') },
          { label: t('menuKeys.avise-me', 'Avise-me'), href: '/avise-me' },
        ]}
        actions={<DataTableSectionAction label={t('simpleCrud.refresh', 'Atualizar')} icon={RefreshCcw} onClick={() => setFilters((current) => ({ ...current }))} />}
      />

      <AsyncState isLoading={isLoading} error={error || undefined}>
        <PageToast message={feedback} onClose={() => setFeedback(null)} />
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
          <DataTableFiltersCard<ProdutosAvisemeFilters>
            variant="embedded"
            draft={draft}
            applied={filters}
            expanded={filtersExpanded}
            extraFilters={extraFilters}
            onToggleExpanded={() => setFiltersExpanded((current) => !current)}
            onApply={() => setFilters({ ...draft, page: 1 })}
            onClear={() => {
              setDraft(INITIAL_PRODUTOS_AVISEME_FILTERS)
              setFilters(INITIAL_PRODUTOS_AVISEME_FILTERS)
              setProdutoLookup(null)
              setFilialLookup(null)
            }}
            patchDraft={(key, value) => setDraft((current) => ({ ...current, [key]: value }))}
          />

          <AppDataTable<AvisemeListItem, string, never>
            rows={rows}
            getRowId={(row) => row.id}
            emptyMessage={t('marketing.aviseme.empty', 'Nenhuma solicitação encontrada.')}
            columns={[
              { id: 'produto', label: t('marketing.aviseme.fields.product', 'Produto'), sortKey: 'produto:nome', cell: (row) => `${row.id_produto} - ${row.nome_produto}`, tdClassName: 'font-semibold text-slate-950' },
              { id: 'filial', label: t('marketing.aviseme.fields.branch', 'Filial'), sortKey: 'filial:nome_fantasia', cell: (row) => `${row.id_filial} - ${row.nome_filial}` },
              { id: 'quantidade', label: t('marketing.aviseme.fields.requests', 'Solicitações'), sortKey: 'quantidade_solicitacoes', thClassName: 'w-[140px]', cell: (row) => String(row.quantidade_solicitacoes) },
              { id: 'ultima', label: t('marketing.aviseme.fields.lastRequest', 'Data da última solicitação'), sortKey: 'ultima_data_solicitacao', cell: (row) => row.ultima_data_solicitacao ? formatDateTime(row.ultima_data_solicitacao) : '-' },
            ]}
            rowActions={(row) => [
              { id: 'detail', label: t('marketing.aviseme.actions.detail', 'Detalhes'), icon: FileSearch, onClick: () => void openDetails(row), visible: access.canView || access.canList },
            ]}
            sort={{
              activeColumn: filters.orderBy,
              direction: filters.sort,
              onToggle: (columnId) => setFilters((current) => ({
                ...current,
                page: 1,
                orderBy: current.orderBy === columnId && current.sort === 'asc' ? columnId : columnId,
                sort: current.orderBy === columnId && current.sort === 'asc' ? 'desc' : 'asc',
              })),
            }}
            mobileCard={{
              title: (row) => `${row.id_produto} - ${row.nome_produto}`,
              subtitle: (row) => `${row.id_filial} - ${row.nome_filial}`,
              meta: (row) => `${t('marketing.aviseme.fields.requests', 'Solicitações')}: ${row.quantidade_solicitacoes}`,
            }}
            pagination={meta}
            onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
            pageSize={{
              value: filters.perPage,
              options: [15, 30, 45, 60],
              onChange: (perPage) => {
                setDraft((current) => ({ ...current, page: 1, perPage }))
                setFilters((current) => ({ ...current, page: 1, perPage }))
              },
            }}
          />
        </SectionCard>
      </AsyncState>

      <OverlayModal open={detailOpen} title={t('marketing.aviseme.detail.title', 'Lista de solicitações')} onClose={() => setDetailOpen(false)}>
        <AsyncState isLoading={detailLoading} error={detailError || undefined}>
          <div className="space-y-4">
            {detailRows.length ? detailRows.map((item) => (
              <div key={item.id} className="rounded-[1rem] border border-[#ebe4d8] bg-white p-4">
                <dl className="grid gap-3 md:grid-cols-2">
                  <div><dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{t('marketing.aviseme.fields.product', 'Produto')}</dt><dd className="mt-1 text-sm text-slate-900">{item.produto || '-'}</dd></div>
                  <div><dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{t('marketing.aviseme.fields.package', 'Embalagem')}</dt><dd className="mt-1 text-sm text-slate-900">{item.embalagem || '-'}</dd></div>
                  <div><dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{t('marketing.aviseme.fields.branch', 'Filial')}</dt><dd className="mt-1 text-sm text-slate-900">{item.filial || '-'}</dd></div>
                  <div><dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{t('marketing.aviseme.fields.customer', 'Cliente')}</dt><dd className="mt-1 text-sm text-slate-900">{item.cliente || '-'}</dd></div>
                  <div><dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{t('simpleCrud.fields.email', 'E-mail')}</dt><dd className="mt-1 text-sm text-slate-900">{item.email || '-'}</dd></div>
                  <div><dt className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{t('marketing.aviseme.fields.requestDate', 'Data')}</dt><dd className="mt-1 text-sm text-slate-900">{item.data ? formatDateTime(item.data) : '-'}</dd></div>
                </dl>
              </div>
            )) : !detailLoading ? (
              <p className="text-sm text-slate-600">{t('marketing.aviseme.detail.empty', 'Nenhuma solicitação detalhada foi encontrada.')}</p>
            ) : null}
          </div>
        </AsyncState>
      </OverlayModal>
    </div>
  )
}
