'use client'

import { Pencil, RefreshCcw, Sparkles, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { CrudListFilters, CrudListRecord } from '@/src/components/crud-base/types'
import { AppDataTable } from '@/src/components/data-table/app-data-table'
import { DataTableFiltersCard } from '@/src/components/data-table/data-table-filters'
import {
  DataTableFilterToggleAction,
  DataTablePageActions,
  DataTableSectionAction,
} from '@/src/components/data-table/data-table-toolbar'
import type { AppDataTableColumn, AppDataTableFilterConfig } from '@/src/components/data-table/types'
import { useDataTableState } from '@/src/components/data-table/use-data-table-state'
import { AsyncState } from '@/src/components/ui/async-state'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { PageHeader } from '@/src/components/ui/page-header'
import { PageToast } from '@/src/components/ui/page-toast'
import { SectionCard } from '@/src/components/ui/section-card'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { excecoesProdutosClient } from '@/src/features/excecoes-produtos/services/excecoes-produtos-client'
import { useAsyncData } from '@/src/hooks/use-async-data'
import { useI18n } from '@/src/i18n/use-i18n'
import { formatDateTime } from '@/src/lib/date-time'

type ExcecoesProdutosFilters = CrudListFilters & {
  q: string
  ativo: string
}

const DEFAULT_FILTERS: ExcecoesProdutosFilters = {
  page: 1,
  perPage: 15,
  orderBy: 'created_at',
  sort: 'desc',
  q: '',
  ativo: '',
}

const TARGET_FIELDS = [
  ['id_cliente', 'Cliente'],
  ['id_filial', 'Filial'],
  ['id_grupo', 'Grupo'],
  ['id_canal_distribuicao_cliente', 'Canal'],
  ['id_rede', 'Rede'],
  ['id_segmento', 'Segmento'],
  ['id_tabela_preco', 'Tabela preço'],
  ['id_praca', 'Praça'],
  ['uf', 'UF'],
  ['tipo_cliente', 'Tipo cliente'],
  ['id_supervisor', 'Supervisor'],
  ['id_vendedor', 'Vendedor'],
  ['contribuinte', 'Contribuinte'],
] as const

const PRODUCT_FIELDS = [
  ['id_produto', 'Produto'],
  ['id_marca', 'Marca'],
  ['id_produto_pai', 'Produto pai'],
  ['id_fornecedor', 'Fornecedor'],
  ['id_canal_distribuicao_produto', 'Canal'],
  ['id_colecao', 'Coleção'],
  ['id_departamento', 'Departamento'],
  ['id_promocao', 'Promoção'],
] as const

function firstNonEmpty(...values: unknown[]) {
  for (const value of values) {
    const normalized = String(value ?? '').trim()
    if (normalized) return normalized
  }
  return ''
}

function pickLabel(record: CrudListRecord, field: string) {
  const relation = record[field.replace(/^id_/, '')]
  if (relation && typeof relation === 'object') {
    const entity = relation as Record<string, unknown>
    return firstNonEmpty(entity.nome_fantasia, entity.razao_social, entity.nome, record[field])
  }

  const raw = record[field]
  if (field === 'contribuinte') {
    const normalized = String(raw ?? '').trim()
    return normalized === '1' ? 'Sim' : normalized === '0' ? 'Não' : ''
  }

  return String(raw ?? '').trim()
}

function getRules(record: CrudListRecord) {
  const rules = [record]
  const children = Array.isArray(record.filhos) ? record.filhos : []
  children.forEach((child) => {
    if (child && typeof child === 'object') {
      rules.push(child as CrudListRecord)
    }
  })
  return rules
}

function describeSide(record: CrudListRecord, entries: ReadonlyArray<readonly [string, string]>) {
  const resolved = entries
    .map(([field, label]) => {
      const value = pickLabel(record, field)
      return value ? { label, value } : null
    })
    .filter(Boolean) as Array<{ label: string; value: string }>

  if (!resolved.length) {
    return <span className="text-slate-400">Todos</span>
  }

  return (
    <div className="space-y-1">
      {resolved.map((entry) => (
        <div key={`${entry.label}-${entry.value}`} className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{entry.label}:</span> {entry.value}
        </div>
      ))}
    </div>
  )
}

function buildPreview(record: CrudListRecord) {
  const labels = getRules(record).map((rule) => {
    const target = TARGET_FIELDS.find(([field]) => pickLabel(rule, field))
    const product = PRODUCT_FIELDS.find(([field]) => pickLabel(rule, field))
    const left = target ? `${target[1]}: ${pickLabel(rule, target[0])}` : 'Alvo: Todos'
    const right = product ? `${product[1]}: ${pickLabel(rule, product[0])}` : 'Produtos: Todos'
    return `${left} -> ${right}`
  })

  const unique = [...new Set(labels)]
  const first = unique.slice(0, 2).join(' | ')
  return unique.length > 2 ? `${first} | +${unique.length - 2}` : first
}

export function ExcecoesProdutosListPage() {
  const { t } = useI18n()
  const access = useFeatureAccess('excecoesProdutos')
  const [filters, setFilters] = useState<ExcecoesProdutosFilters>(DEFAULT_FILTERS)
  const [filtersDraft, setFiltersDraft] = useState<ExcecoesProdutosFilters>(DEFAULT_FILTERS)
  const [confirmDeleteIds, setConfirmDeleteIds] = useState<string[] | null>(null)
  const [expandedRowIds, setExpandedRowIds] = useState<string[]>([])
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)

  const listState = useAsyncData(() => excecoesProdutosClient.list(filters), [filters])
  const rows = useMemo(() => listState.data?.data ?? [], [listState.data?.data])

  const tableState = useDataTableState<
    CrudListRecord,
    ExcecoesProdutosFilters,
    ExcecoesProdutosFilters['orderBy']
  >({
    rows,
    getRowId: (row) => String(row.id),
    filters,
    setFilters,
    setFiltersDraft,
  })

  const columns = useMemo<AppDataTableColumn<CrudListRecord, ExcecoesProdutosFilters>[]>(() => [
    {
      id: 'id',
      label: t('common.id', 'ID'),
      sortKey: 'id',
      thClassName: 'w-[120px]',
      cell: (row) => <span className="font-medium text-slate-600">{String(row.id || '-')}</span>,
    },
    {
      id: 'preview',
      label: t('maintenance.productExceptions.list.preview', 'Regras (preview)'),
      cell: (row) => <span className="text-sm font-semibold text-slate-900">{buildPreview(row)}</span>,
    },
    {
      id: 'ativo',
      label: t('simpleCrud.fields.active', 'Ativo'),
      sortKey: 'ativo',
      thClassName: 'w-[120px]',
      cell: (row) => {
        const active = row.ativo === true || row.ativo === 1 || row.ativo === '1'
        return (
          <StatusBadge tone={active ? 'success' : 'neutral'}>
            {active ? t('common.yes', 'Sim') : t('common.no', 'Não')}
          </StatusBadge>
        )
      },
      filter: {
        kind: 'select',
        id: 'ativo',
        key: 'ativo',
        label: t('simpleCrud.fields.active', 'Ativo'),
        options: [
          { value: '1', label: t('common.yes', 'Sim') },
          { value: '0', label: t('common.no', 'Não') },
        ],
      },
    },
  ], [t])

  const filterColumns = useMemo<AppDataTableColumn<CrudListRecord, ExcecoesProdutosFilters>[]>(() => [
    {
      id: 'q',
      label: t('common.search', 'Buscar'),
      cell: () => null,
      filter: {
        kind: 'text',
        id: 'q',
        key: 'q',
        label: t('common.search', 'Buscar'),
      } satisfies AppDataTableFilterConfig<ExcecoesProdutosFilters>,
    } as AppDataTableColumn<CrudListRecord, ExcecoesProdutosFilters>,
    ...columns,
  ], [columns, t])

  if (!access.canList) {
    return (
      <AccessDeniedState
        title={t('maintenance.productExceptions.title', 'Exceções x Produtos')}
        backHref="/dashboard"
      />
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={[
          { label: t('routes.dashboard', 'Início'), href: '/dashboard' },
          { label: t('routes.manutencao', 'Manutenção') },
          { label: t('routes.excecoesProdutos', 'Exceções x Produtos'), href: '/excecoes-produtos' },
        ]}
        actions={
          <DataTableSectionAction
            label={t('common.refresh', 'Atualizar')}
            icon={RefreshCcw}
            onClick={listState.reload}
          />
        }
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
                  tableState.selectedIds.length
                    ? {
                        label: t('simpleCrud.deleteSelected', 'Excluir ({{count}})', {
                          count: tableState.selectedIds.length,
                        }),
                        icon: Trash2,
                        onClick: () => setConfirmDeleteIds(tableState.selectedIds),
                        tone: 'danger',
                      }
                    : null,
                  access.canCreate
                    ? {
                        label: t(
                          'maintenance.productExceptions.actions.creationAssistant',
                          'Assistente de criação',
                        ),
                        icon: Sparkles,
                        href: '/excecoes-produtos/novo',
                        tone: 'primary',
                      }
                    : null,
                ]}
              />
            </div>
          )}
        >
          <DataTableFiltersCard
            variant="embedded"
            columns={filterColumns as AppDataTableColumn<unknown, ExcecoesProdutosFilters>[]}
            draft={filtersDraft}
            applied={filters}
            expanded={filtersExpanded}
            onToggleExpanded={() => setFiltersExpanded((current) => !current)}
            onApply={() => setFilters(filtersDraft)}
            onClear={() => {
              setFilters(DEFAULT_FILTERS)
              setFiltersDraft(DEFAULT_FILTERS)
            }}
            patchDraft={(key, value) => setFiltersDraft((current) => ({ ...current, [key]: value, page: 1 }))}
          />

          <AppDataTable
            rows={rows}
            getRowId={(row) => String(row.id)}
            columns={columns}
            emptyMessage={t('simpleCrud.empty', 'Nenhum registro encontrado com os filtros atuais.')}
            sort={{
              activeColumn: filters.orderBy,
              direction: filters.sort,
              onToggle: (column) => tableState.toggleSort(column as ExcecoesProdutosFilters['orderBy']),
            }}
            renderExpandedRow={(row) => {
              const rules = getRules(row)

              return (
                <div className="rounded-[1rem] border border-[#ece4d8] bg-white p-4">
                  <div className="mb-3 text-sm font-semibold text-slate-900">
                    {t('maintenance.productExceptions.sections.rules', 'Regras')} ({rules.length})
                  </div>
                  <div className="overflow-x-auto rounded-[0.9rem] border border-[#eee6da]">
                    <table className="min-w-full divide-y divide-[#eee6da] text-sm">
                      <thead className="bg-[#fcfaf5] text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                        <tr>
                          <th className="px-4 py-3">{t('maintenance.productExceptions.sections.target', 'Alvo')}</th>
                          <th className="px-4 py-3">{t('maintenance.productExceptions.sections.products', 'Produtos')}</th>
                          <th className="px-4 py-3">{t('maintenance.productExceptions.sections.period', 'Período')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f1ebe0] bg-white">
                        {rules.map((rule, index) => (
                          <tr key={`${String(rule.id || row.id)}-${index}`}>
                            <td className="px-4 py-3">{describeSide(rule, TARGET_FIELDS)}</td>
                            <td className="px-4 py-3">{describeSide(rule, PRODUCT_FIELDS)}</td>
                            <td className="px-4 py-3 text-slate-600">
                              {rule.data_inicio ? formatDateTime(String(rule.data_inicio)) : '—'} {'->'} {rule.data_fim ? formatDateTime(String(rule.data_fim)) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            }}
            expandedRowIds={expandedRowIds}
            onToggleExpandedRow={(id) => {
              setExpandedRowIds((current) => (
                current.includes(id)
                  ? current.filter((item) => item !== id)
                  : [...current, id]
              ))
            }}
            rowActions={(row) => [
              {
                id: 'edit',
                label: t('simpleCrud.actions.edit', 'Editar'),
                icon: Pencil,
                href: `/excecoes-produtos/${String(row.id)}/editar`,
                visible: access.canEdit || access.canView,
              },
              {
                id: 'delete',
                label: t('simpleCrud.actions.delete', 'Excluir'),
                icon: Trash2,
                tone: 'danger',
                onClick: () => setConfirmDeleteIds([String(row.id)]),
                visible: access.canDelete,
              },
            ]}
            selectable
            selectedIds={tableState.selectedIds}
            allSelected={tableState.allSelected}
            onToggleSelect={tableState.toggleSelection}
            onToggleSelectAll={tableState.toggleSelectAll}
            mobileCard={{
              title: (row) => buildPreview(row),
              subtitle: () => '',
              meta: (row) => (
                row.ativo === true || row.ativo === 1 || row.ativo === '1'
                  ? t('common.yes', 'Sim')
                  : t('common.no', 'Não')
              ),
            }}
            pagination={listState.data?.meta}
            onPageChange={tableState.setPage}
            pageSize={{
              value: filters.perPage,
              options: [15, 30, 45, 60],
              onChange: (perPage) => {
                const next = { ...filters, perPage, page: 1 }
                setFilters(next)
                setFiltersDraft(next)
              },
            }}
          />
        </SectionCard>
      </AsyncState>

      <ConfirmDialog
        open={Boolean(confirmDeleteIds?.length)}
        title={t('simpleCrud.confirmDeleteTitle', 'Excluir registro?')}
        description={t(
          'simpleCrud.confirmDeleteSingle',
          'O registro selecionado será excluído. Essa ação não pode ser desfeita.',
        )}
        confirmLabel={t('simpleCrud.actions.delete', 'Excluir')}
        cancelLabel={t('common.cancel', 'Cancelar')}
        onClose={() => setConfirmDeleteIds(null)}
        onConfirm={async () => {
          const ids = confirmDeleteIds ?? []
          try {
            await excecoesProdutosClient.delete(ids)
            setConfirmDeleteIds(null)
            tableState.clearSelection()
            setFeedback({
              tone: 'success',
              message: t('maintenance.productExceptions.deleteSuccess', 'Exceção removida com sucesso.'),
            })
            await listState.reload()
          } catch (error) {
            setFeedback({
              tone: 'error',
              message: error instanceof Error
                ? error.message
                : t('maintenance.productExceptions.deleteError', 'Não foi possível excluir a exceção.'),
            })
          }
        }}
      />

      {feedback ? (
        <PageToast
          variant={feedback.tone === 'success' ? 'success' : 'danger'}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      ) : null}
    </div>
  )
}
