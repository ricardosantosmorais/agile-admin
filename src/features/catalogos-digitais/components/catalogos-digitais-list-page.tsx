'use client'

import Link from 'next/link'
import { AlertTriangle, ExternalLink, Pencil, Plus, RefreshCcw, Search, Store } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AppDataTable } from '@/src/components/data-table/app-data-table'
import type { AppDataTableColumn } from '@/src/components/data-table/types'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { AsyncState } from '@/src/components/ui/async-state'
import { PageHeader } from '@/src/components/ui/page-header'
import { SectionCard } from '@/src/components/ui/section-card'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { catalogosDigitaisClient } from '@/src/features/catalogos-digitais/services/catalogos-digitais-client'
import type { CatalogosDigitaisCatalog } from '@/src/features/catalogos-digitais/types/catalogos-digitais'
import { useAsyncData } from '@/src/hooks/use-async-data'
import { useI18n } from '@/src/i18n/use-i18n'
import type { Locale } from '@/src/i18n/types'

function statusTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' | 'info' {
  if (['pronto', 'publicado', 'ativo'].includes(status)) return 'success'
  if (['rascunho', 'em_edicao'].includes(status)) return 'warning'
  if (['erro', 'falha'].includes(status)) return 'danger'
  return 'neutral'
}

function statusLabel(status: string, t: (key: string, fallback?: string) => string) {
  const labels: Record<string, string> = {
    pronto: t('digitalCatalogs.status.ready', 'Pronto'),
    publicado: t('digitalCatalogs.status.published', 'Publicado'),
    rascunho: t('digitalCatalogs.status.draft', 'Rascunho'),
    em_edicao: t('digitalCatalogs.status.editing', 'Em edição'),
    erro: t('digitalCatalogs.status.error', 'Erro'),
  }
  return labels[status] || status || '-'
}

function publicationLabel(mode: string, t: (key: string, fallback?: string) => string) {
  const labels: Record<string, string> = {
    nao_publicar: t('digitalCatalogs.publication.none', 'Não publicar'),
    publica: t('digitalCatalogs.publication.public', 'Pública'),
    restrita_cliente: t('digitalCatalogs.publication.customer', 'Restrita por cliente'),
    restrita_vendedor: t('digitalCatalogs.publication.seller', 'Restrita por vendedor'),
    restrita_todos: t('digitalCatalogs.publication.restricted', 'Restrita'),
  }
  return labels[mode] || mode || '-'
}

function formatDate(value: string, locale: Locale) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(locale).format(date)
}

function ContractWarning({ moduleId }: { moduleId: string }) {
  const { t } = useI18n()

  return (
    <div className="app-card-modern flex flex-col gap-4 rounded-[1.1rem] border-amber-200 bg-amber-50 px-5 py-4 text-amber-950 shadow-sm md:flex-row md:items-center md:justify-between dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="font-bold">{t('digitalCatalogs.contractWarning', 'Atenção: o módulo Catálogos Digitais ainda não está contratado para sua loja.')}</p>
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-100/80">{t('digitalCatalogs.contractWarningDescription', 'A listagem fica disponível para administração, mas a criação e edição dependem da contratação do módulo.')}</p>
        </div>
      </div>
      <Link href={`/agile-store/${encodeURIComponent(moduleId)}`} className="app-button-secondary inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-bold">
        <Store className="h-4 w-4" />
        {t('sac.contractInAgileStore', 'Contratar na Agile Store')}
      </Link>
    </div>
  )
}

export function CatalogosDigitaisListPage() {
  const { locale, t } = useI18n()
  const access = useFeatureAccess('catalogosDigitais')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const listState = useAsyncData(
    () => catalogosDigitaisClient.list({ page, perpage: 15, q: search, status }),
    [page, search, status],
  )

  const data = listState.data
  const rows = data?.items ?? []
  const pages = data?.meta.pages ?? 1
  const appStore = data?.appStore

  const columns = useMemo<Array<AppDataTableColumn<CatalogosDigitaisCatalog>>>(
    () => [
      {
        id: 'name',
        header: t('digitalCatalogs.columns.catalog', 'Catálogo'),
        cell: (item) => (
          <div className="min-w-0">
            <p className="break-words font-semibold text-[color:var(--app-text)]">{item.name}</p>
            <p className="mt-1 break-words text-xs text-[color:var(--app-muted)]">{item.description || item.code}</p>
          </div>
        ),
      },
      { id: 'status', header: t('digitalCatalogs.columns.status', 'Status'), cell: (item) => <StatusBadge tone={statusTone(item.status)}>{statusLabel(item.status, t)}</StatusBadge> },
      { id: 'publication', header: t('digitalCatalogs.columns.publication', 'Publicação'), cell: (item) => <StatusBadge tone={item.published ? 'success' : 'neutral'}>{publicationLabel(item.publicationMode, t)}</StatusBadge> },
      { id: 'products', header: t('digitalCatalogs.columns.products', 'Produtos'), tdClassName: 'text-right', cell: (item) => item.productCount },
      { id: 'sections', header: t('digitalCatalogs.columns.sections', 'Blocos'), tdClassName: 'text-right', cell: (item) => item.sectionCount },
      {
        id: 'validity',
        header: t('digitalCatalogs.columns.validity', 'Vigência'),
        cell: (item) => `${formatDate(item.validFrom, locale)} - ${formatDate(item.validTo, locale)}`,
      },
      {
        id: 'publicUrl',
        header: t('digitalCatalogs.columns.url', 'URL'),
        cell: (item) => item.publicUrl ? (
          <a href={item.publicUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-accent">
            {t('common.open', 'Abrir')}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : '-',
      },
    ],
    [locale, t],
  )

  if (!access.canOpen && !access.canList) {
    return <AccessDeniedState title={t('digitalCatalogs.title', 'Catálogos Digitais')} backHref="/dashboard" />
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('digitalCatalogs.title', 'Catálogos Digitais')}
        breadcrumbs={[{ label: t('routes.dashboard', 'Início'), href: '/dashboard' }, { label: t('routes.catalogo', 'Catálogo') }, { label: t('digitalCatalogs.title', 'Catálogos Digitais') }]}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            {access.canCreate ? (
              <Link href="/catalogos-digitais/novo" className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold">
                <Plus className="h-4 w-4" />
                {t('digitalCatalogs.new', 'Novo catálogo')}
              </Link>
            ) : null}
            <button type="button" onClick={listState.reload} className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold">
              <RefreshCcw className="h-4 w-4" />
              {t('common.refresh', 'Atualizar')}
            </button>
          </div>
        }
      />

      {appStore && !appStore.contracted ? <ContractWarning moduleId={appStore.moduleId} /> : null}

      <SectionCard
        title={t('digitalCatalogs.listTitle', 'Catálogos criados')}
        description={t('digitalCatalogs.listDescription', 'Primeira superfície v2 para acompanhar catálogos digitais, status, publicação, vigência e volume de produtos.')}
      >
        <div className="mb-5 grid gap-3 lg:grid-cols-[minmax(240px,1fr)_220px]">
          <label className="app-control flex min-w-0 items-center gap-2 rounded-2xl px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder={t('digitalCatalogs.searchPlaceholder', 'Buscar por nome, código ou status')}
            />
          </label>
          <select
            className="app-control min-w-0 rounded-2xl px-3 py-2 text-sm"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value)
              setPage(1)
            }}
          >
            <option value="">{t('digitalCatalogs.allStatuses', 'Todos os status')}</option>
            <option value="rascunho">{statusLabel('rascunho', t)}</option>
            <option value="pronto">{statusLabel('pronto', t)}</option>
            <option value="publicado">{statusLabel('publicado', t)}</option>
          </select>
        </div>

        <AsyncState
          isLoading={listState.isLoading}
          error={listState.error}
          loadingTitle={t('digitalCatalogs.loadingTitle', 'Carregando catálogos')}
          loadingDescription={t('digitalCatalogs.loadingDescription', 'Consultando catálogos digitais da empresa ativa.')}
        >
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
              title: (item) => item.name,
              subtitle: (item) => item.description || item.code,
              meta: (item) => t('digitalCatalogs.mobileMeta', '{{count}} produtos · {{publication}}', { count: item.productCount, publication: publicationLabel(item.publicationMode, t) }),
              badges: (item) => <StatusBadge tone={statusTone(item.status)}>{statusLabel(item.status, t)}</StatusBadge>,
            }}
          />

          {pages > 1 ? (
            <nav className="mt-5 flex flex-wrap items-center justify-center gap-2" aria-label={t('digitalCatalogs.pagination', 'Paginação de Catálogos Digitais')}>
              {Array.from({ length: pages }, (_, index) => index + 1).map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-label={t('digitalCatalogs.pageLabel', 'Página {{page}}', { page: item })}
                  aria-current={page === item ? 'page' : undefined}
                  onClick={() => setPage(item)}
                  className={['h-10 min-w-10 rounded-xl border px-3 text-sm font-bold transition', page === item ? 'border-accent bg-accent text-white' : 'border-line bg-white text-slate-600 hover:text-slate-950'].join(' ')}
                >
                  {item}
                </button>
              ))}
            </nav>
          ) : null}
        </AsyncState>
      </SectionCard>
    </div>
  )
}
