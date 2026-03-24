'use client'

import { Plus, RefreshCcw, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppDataTable } from '@/src/components/data-table/app-data-table'
import { DataTableFiltersCard } from '@/src/components/data-table/data-table-filters'
import { DataTableFilterToggleAction, DataTablePageActions, DataTableSectionAction } from '@/src/components/data-table/data-table-toolbar'
import type { AppDataTableFilterConfig } from '@/src/components/data-table/types'
import { AsyncState } from '@/src/components/ui/async-state'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { LookupSelect, type LookupOption } from '@/src/components/ui/lookup-select'
import { PageHeader } from '@/src/components/ui/page-header'
import { PageToast } from '@/src/components/ui/page-toast'
import { SectionCard } from '@/src/components/ui/section-card'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { loadCatalogLookupOptions } from '@/src/features/catalog/services/catalog-lookups'
import { useI18n } from '@/src/i18n/use-i18n'
import { produtosDepartamentosClient, type ProdutoDepartamentoFilters, type ProdutoDepartamentoRecord } from '@/src/features/produtos-departamentos/services/produtos-departamentos-client'

const INITIAL_FILTERS: ProdutoDepartamentoFilters = {
  page: 1,
  perPage: 15,
  orderBy: 'id_produto',
  sort: 'asc',
  id_produto: '',
  id_departamento: '',
  'produto:nome::like': '',
  'departamento:nome::like': '',
}

export function ProdutosDepartamentosListPage() {
  const { t } = useI18n()
  const access = useFeatureAccess('produtosDepartamentos')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [rows, setRows] = useState<ProdutoDepartamentoRecord[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [draft, setDraft] = useState(INITIAL_FILTERS)
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [produtoLookup, setProdutoLookup] = useState<LookupOption | null>(null)
  const [departamentoLookup, setDepartamentoLookup] = useState<LookupOption | null>(null)
  const [meta, setMeta] = useState({ page: 1, pages: 1, perPage: 15, from: 0, to: 0, total: 0 })

  const loadRows = useCallback(async (nextFilters: ProdutoDepartamentoFilters) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await produtosDepartamentosClient.list(nextFilters)
      setRows(response.data)
      setMeta(response.meta)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar os relacionamentos.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadRows(filters)
  }, [filters, loadRows])

  const allSelected = useMemo(() => rows.length > 0 && selectedIds.length === rows.length, [rows, selectedIds])
  const extraFilters = useMemo<AppDataTableFilterConfig<ProdutoDepartamentoFilters>[]>(() => [
    {
      id: 'produto_lookup',
      kind: 'custom',
      label: t('catalog.produtosDepartamentos.fields.product', 'Produto'),
      render: ({ patchDraft }) => (
        <LookupSelect
          label={t('catalog.produtosDepartamentos.fields.product', 'Produto')}
          value={produtoLookup}
          onChange={(value) => {
            setProdutoLookup(value)
            patchDraft('id_produto', (value?.id || '') as ProdutoDepartamentoFilters['id_produto'])
            patchDraft('produto:nome::like', '' as ProdutoDepartamentoFilters['produto:nome::like'])
          }}
          loadOptions={(query, page, perPage) => loadCatalogLookupOptions('produtos', query, page, perPage)}
        />
      ),
    },
    {
      id: 'departamento_lookup',
      kind: 'custom',
      label: t('catalog.departamentos.title', 'Departamento'),
      render: ({ patchDraft }) => (
        <LookupSelect
          label={t('catalog.departamentos.title', 'Departamento')}
          value={departamentoLookup}
          onChange={(value) => {
            setDepartamentoLookup(value)
            patchDraft('id_departamento', (value?.id || '') as ProdutoDepartamentoFilters['id_departamento'])
            patchDraft('departamento:nome::like', '' as ProdutoDepartamentoFilters['departamento:nome::like'])
          }}
          loadOptions={(query, page, perPage) => loadCatalogLookupOptions('departamentos', query, page, perPage)}
        />
      ),
    },
  ], [departamentoLookup, produtoLookup, t])

  if (!access.canList) {
    return <AccessDeniedState title={t('catalog.produtosDepartamentos.title', 'Produtos x Departamentos')} backHref="/dashboard" />
  }

  async function handleDelete() {
    try {
      await produtosDepartamentosClient.delete(selectedIds.map((id) => {
        const [id_produto, id_departamento] = id.split(':')
        return { id_produto, id_departamento }
      }))
      setSelectedIds([])
      setConfirmOpen(false)
      await loadRows(filters)
    } catch (deleteError) {
      setFeedback(deleteError instanceof Error ? deleteError.message : 'Nao foi possivel excluir os relacionamentos.')
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={[
          { label: t('routes.dashboard', 'Inicio'), href: '/dashboard' },
          { label: t('simpleCrud.sections.catalog', 'Catalogo') },
          { label: t('catalog.produtosDepartamentos.title', 'Produtos x Departamentos'), href: '/produtos-departamentos' },
        ]}
        actions={<DataTableSectionAction label={t('simpleCrud.refresh', 'Atualizar')} icon={RefreshCcw} onClick={() => void loadRows(filters)} />}
      />

      <AsyncState isLoading={isLoading} error={error || undefined}>
        <PageToast message={feedback} onClose={() => setFeedback(null)} />

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
                  selectedIds.length ? { label: t('common.delete', 'Excluir'), icon: Trash2, onClick: () => setConfirmOpen(true), tone: 'danger' } : null,
                  access.canCreate ? { label: t('common.new', 'Novo'), icon: Plus, href: '/produtos-departamentos/novo', tone: 'primary' } : null,
                ]}
              />
            </div>
          }
        >
          <DataTableFiltersCard<ProdutoDepartamentoFilters>
            variant="embedded"
            draft={draft}
            applied={filters}
            expanded={filtersExpanded}
            extraFilters={extraFilters}
            onToggleExpanded={() => setFiltersExpanded((current) => !current)}
            onApply={() => setFilters({ ...draft, page: 1 })}
            onClear={() => {
              setDraft(INITIAL_FILTERS)
              setFilters(INITIAL_FILTERS)
              setProdutoLookup(null)
              setDepartamentoLookup(null)
            }}
            patchDraft={(key, value) => setDraft((current) => ({ ...current, [key]: value }))}
          />
          <AppDataTable<ProdutoDepartamentoRecord, string, never>
            rows={rows}
            getRowId={(row) => `${row.id_produto}:${row.id_departamento}`}
            emptyMessage={t('catalog.produtosDepartamentos.empty', 'Nenhum relacionamento encontrado.')}
            columns={[
              { id: 'id_produto', label: t('catalog.produtosDepartamentos.fields.productId', 'ID produto'), cell: (row) => row.id_produto, thClassName: 'w-[180px]' },
              { id: 'produto', label: t('catalog.produtosDepartamentos.fields.product', 'Produto'), cell: (row) => String(row.produto?.nome || '-'), tdClassName: 'font-semibold text-slate-950' },
              { id: 'departamento', label: t('catalog.departamentos.title', 'Departamento'), cell: (row) => String(row.departamento?.nome || '-') },
            ]}
            selectable
            selectedIds={selectedIds}
            allSelected={allSelected}
            onToggleSelect={(id) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])}
            onToggleSelectAll={() => setSelectedIds((current) => current.length === rows.length ? [] : rows.map((row) => `${row.id_produto}:${row.id_departamento}`))}
            pagination={meta}
            onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
            pageSize={{
              value: filters.perPage,
              options: [15, 30, 50, 100],
              onChange: (perPage) => {
                const next = { ...filters, perPage, page: 1 }
                setDraft(next)
                setFilters(next)
              },
            }}
            mobileCard={{
              title: (row) => String(row.produto?.nome || '-'),
              subtitle: (row) => String(row.departamento?.nome || '-'),
              meta: (row) => `Produto: ${row.id_produto}`,
            }}
          />
        </SectionCard>
      </AsyncState>

      <ConfirmDialog
        open={confirmOpen}
        title={t('catalog.produtosDepartamentos.confirmDeleteTitle', 'Excluir relacionamentos')}
        description={t('catalog.produtosDepartamentos.confirmDeleteDescription', 'Os relacionamentos selecionados serao removidos.')}
        confirmLabel={t('common.delete', 'Excluir')}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}
