'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { AsyncState } from '@/src/components/ui/async-state'
import { InlineDataTable, type InlineDataTableColumn } from '@/src/components/ui/inline-data-table'
import { PageHeader } from '@/src/components/ui/page-header'
import { SectionCard } from '@/src/components/ui/section-card'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { integracaoAplicativosClient } from '@/src/features/integracao-aplicativos/services/integracao-aplicativos-client'
import type { AplicativoIntegracaoPermissaoRecord } from '@/src/features/integracao-aplicativos/services/integracao-aplicativos-mappers'
import { useI18n } from '@/src/i18n/use-i18n'
import { useRouteParams } from '@/src/next/route-context'

type VerbKey = 'verboGet' | 'verboSalvar' | 'verboDelete'

const VERB_COLUMNS: Array<{ key: VerbKey; label: string }> = [
  { key: 'verboGet', label: 'GET' },
  { key: 'verboSalvar', label: 'Salvar (POST/PUT)' },
  { key: 'verboDelete', label: 'DELETE' },
]

export function AplicativoPermissoesPage({ id }: { id?: string }) {
  const { t } = useI18n()
  const router = useRouter()
  const routeParams = useRouteParams<{ id?: string }>()
  const resolvedId = id ?? routeParams.id ?? ''
  const access = useFeatureAccess('integracaoAplicativos')
  const canOpen = access.canView || access.canEdit
  const canSave = access.canEdit

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>('')
  const [search, setSearch] = useState('')
  const [usuarioNome, setUsuarioNome] = useState('')
  const [rows, setRows] = useState<AplicativoIntegracaoPermissaoRecord[]>([])

  useEffect(() => {
    let active = true

    void (async () => {
      try {
        setLoading(true)
        setError('')
        const response = await integracaoAplicativosClient.getPermissoes(resolvedId)
        if (!active) return

        setUsuarioNome(response.usuario.nome || response.usuario.email || response.usuario.id)
        setRows(response.rows)
      } catch (loadError) {
        if (!active) return
        setError(loadError instanceof Error ? loadError.message : t('integrationApps.permissions.loadError', 'Nao foi possivel carregar as permissoes do aplicativo.'))
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    })()

    return () => {
      active = false
    }
  }, [resolvedId, t])

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    if (!normalizedSearch) return rows
    return rows.filter((row) => row.tabelaNome.toLowerCase().includes(normalizedSearch))
  }, [rows, search])

  const permissionColumns = useMemo<Array<InlineDataTableColumn<AplicativoIntegracaoPermissaoRecord>>>(() => [
    {
      id: 'route',
      header: t('integrationApps.permissions.routeColumn', 'Rota'),
      cell: (row) => <span className="font-mono text-[13px] font-semibold text-slate-900">{row.tabelaNome}</span>,
      cellClassName: 'min-w-[280px]',
    },
    ...VERB_COLUMNS.map<InlineDataTableColumn<AplicativoIntegracaoPermissaoRecord>>((column) => ({
      id: column.key,
      header: (
        <label className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
          <input
            type="checkbox"
            checked={rows.length > 0 && rows.every((row) => row[column.key])}
            disabled={!canSave}
            onChange={(event) => setAllForColumn(column.key, event.target.checked)}
          />
          <span>{column.label}</span>
        </label>
      ),
      cell: (row) => {
        const rowIndex = rows.findIndex((item) => item.tabelaNome === row.tabelaNome)
        return (
          <input
            type="checkbox"
            checked={row[column.key]}
            disabled={!canSave}
            onChange={(event) => setSingleRow(rowIndex, column.key, event.target.checked)}
          />
        )
      },
      headerClassName: 'text-center',
      cellClassName: 'min-w-[160px] text-center',
    })),
  ], [canSave, rows, t])

  if (!canOpen) {
    return <AccessDeniedState title={t('integrationApps.permissions.title', 'Permissoes de acesso')} backHref="/api-de-integracao/aplicativos" />
  }

  function setAllForColumn(verb: VerbKey, value: boolean) {
    setRows((current) => current.map((row) => ({ ...row, [verb]: value })))
  }

  function setSingleRow(index: number, verb: VerbKey, value: boolean) {
    setRows((current) => current.map((row, currentIndex) => (
      currentIndex === index ? { ...row, [verb]: value } : row
    )))
  }

  async function handleSave() {
    try {
      setSaving(true)
      await integracaoAplicativosClient.savePermissoes(resolvedId, rows)
      router.push('/api-de-integracao/aplicativos')
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : t('integrationApps.permissions.saveError', 'Nao foi possivel salvar as permissoes.'),
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={[
          { label: t('routes.dashboard', 'Inicio'), href: '/dashboard' },
          { label: t('menuKeys.api-de-integracao', 'API de Integracao') },
          { label: t('integrationApps.title', 'Aplicativos'), href: '/api-de-integracao/aplicativos' },
          { label: t('integrationApps.permissions.title', 'Permissoes de acesso') },
        ]}
        actions={(
          <div className="flex flex-wrap gap-2">
            {canSave ? (
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t('common.save', 'Salvar')}
              </button>
            ) : null}
            <Link
              href="/api-de-integracao/aplicativos"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('common.back', 'Voltar')}
            </Link>
          </div>
        )}
      />

      <AsyncState isLoading={loading} error={error}>
        <SectionCard
          title={t('integrationApps.permissions.title', 'Permissoes de acesso')}
          description={
            usuarioNome
              ? `${t('integrationApps.permissions.userLabel', 'Aplicativo')}: ${usuarioNome}`
              : t('integrationApps.permissions.description', 'Defina os verbos permitidos por tabela para o aplicativo selecionado.')
          }
        >
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[#e8dece] bg-[#fcf7ef] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Rotas</p>
                <p className="mt-1 text-lg font-black text-slate-900">{rows.length}</p>
              </div>
              <div className="rounded-xl border border-[#e8dece] bg-[#fcf7ef] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Exibidas</p>
                <p className="mt-1 text-lg font-black text-slate-900">{filteredRows.length}</p>
              </div>
              <div className="rounded-xl border border-[#e8dece] bg-[#fcf7ef] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Com acesso GET</p>
                <p className="mt-1 text-lg font-black text-slate-900">{rows.filter((row) => row.verboGet).length}</p>
              </div>
            </div>

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('integrationApps.permissions.searchPlaceholder', 'Buscar rota/tabela')}
              className="w-full rounded-[0.9rem] border border-[#e5dccf] bg-white px-3.5 py-2.5 text-sm"
            />

            <InlineDataTable
              rows={filteredRows}
              getRowId={(row) => row.tabelaNome}
              columns={permissionColumns}
              emptyMessage={t('integrationApps.permissions.empty', 'Nenhuma rota encontrada para o filtro informado.')}
              minWidthClassName="min-w-[820px]"
            />
          </div>
        </SectionCard>
      </AsyncState>
    </div>
  )
}
