'use client'

import { Play, RefreshCcw } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { CodeEditor } from '@/src/components/ui/code-editor'
import { DynamicResultGrid } from '@/src/components/ui/dynamic-result-grid'
import { LookupSelect, type LookupOption } from '@/src/components/ui/lookup-select'
import { SectionCard } from '@/src/components/ui/section-card'
import type { CrudRecord } from '@/src/components/crud-base/types'
import { relatoriosMasterClient } from '@/src/features/relatorios-master/services/relatorios-master-client'
import { httpClient } from '@/src/services/http/http-client'
import { useI18n } from '@/src/i18n/use-i18n'

type RelatorioQueryTabProps = {
  form: CrudRecord
  readOnly: boolean
  patch: (key: string, value: unknown) => void
  onFeedback: (message: string | null, tone?: 'success' | 'error') => void
}

function extractRows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[]
  if (typeof payload !== 'object' || payload === null) return []
  const record = payload as Record<string, unknown>
  if (Array.isArray(record.data)) return record.data as Record<string, unknown>[]
  if (Array.isArray(record.rows)) return record.rows as Record<string, unknown>[]
  return []
}

export function RelatorioQueryTab({ form, readOnly, patch, onFeedback }: RelatorioQueryTabProps) {
  const { t } = useI18n()
  const [empresa, setEmpresa] = useState<LookupOption | null>(null)
  const [result, setResult] = useState<unknown>(null)
  const [view, setView] = useState<'json' | 'grid'>('json')
  const [isExecuting, setIsExecuting] = useState(false)
  const sql = String(form.query ?? '')
  const rows = useMemo(() => extractRows(result), [result])

  const loadCompanies = useCallback(async (query: string, page: number, perPage: number) => {
    const response = await httpClient<Array<{ value?: string; id?: string; label: string }>>(`/api/lookups/empresas?page=${page}&perPage=${perPage}&q=${encodeURIComponent(query)}`, {
      method: 'GET',
      cache: 'no-store',
    })
    return response.map((option) => ({
      id: String(option.value ?? option.id ?? ''),
      label: option.label,
    })).filter((option) => option.id)
  }, [])

  async function executeQuery() {
    onFeedback(null)
    if (!empresa?.id) {
      onFeedback(t('maintenance.reportsMaster.query.selectCompany', 'Selecione uma empresa para executar a query.'), 'error')
      return
    }
    if (!sql.trim()) {
      onFeedback(t('maintenance.reportsMaster.query.emptySql', 'Informe a query antes de executar.'), 'error')
      return
    }

    setIsExecuting(true)
    try {
      const payload = await relatoriosMasterClient.executeQuery({ idEmpresa: empresa.id, sql, fonteDados: 'agileecommerce' })
      setResult(payload)
      setView('json')
    } catch (error) {
      onFeedback(error instanceof Error ? error.message : t('maintenance.reportsMaster.query.executeError', 'Nao foi possivel executar a query.'), 'error')
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(380px,0.65fr)]">
      <SectionCard className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--app-border)] px-5 py-4">
          <div>
            <h2 className="text-base font-black text-[color:var(--app-text)]">{t('maintenance.reportsMaster.query.editor', 'Editor SQL')}</h2>
            <p className="text-sm text-[color:var(--app-muted)]">{t('maintenance.reportsMaster.query.editorHint', 'Edite e execute a consulta do relatorio sem sair do cadastro.')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => patch('query', '')}
              disabled={readOnly}
              className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              <RefreshCcw className="h-4 w-4" />
              {t('maintenance.reportsMaster.query.clear', 'Limpar')}
            </button>
            <button
              type="button"
              onClick={() => void executeQuery()}
              disabled={isExecuting}
              className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              <Play className="h-4 w-4" />
              {isExecuting ? t('common.loading', 'Carregando...') : t('maintenance.reportsMaster.query.execute', 'Executar')}
            </button>
          </div>
        </div>
        <div className="grid gap-4 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <LookupSelect
            label={t('maintenance.reportsMaster.query.company', 'Empresa para execucao')}
            value={empresa}
            onChange={setEmpresa}
            loadOptions={loadCompanies}
            disabled={isExecuting}
          />
          <div className="app-control-muted flex items-center rounded-[1rem] px-4 text-sm font-semibold text-[color:var(--app-text)]">
            {t('maintenance.reportsMaster.query.source', 'Fonte')}: agileecommerce
          </div>
        </div>
        <div className="px-5 pb-5">
          <CodeEditor
            editorId={`relatorio-master-query-${String(form.id ?? 'novo')}`}
            language="sql"
            value={sql}
            onChange={(nextValue) => patch('query', nextValue)}
            readOnly={readOnly}
            height="520px"
          />
        </div>
      </SectionCard>

      <SectionCard className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-[color:var(--app-border)] px-5 py-4">
          <div>
            <h2 className="text-base font-black text-[color:var(--app-text)]">{t('maintenance.reportsMaster.query.result', 'Resultado')}</h2>
            <p className="text-sm text-[color:var(--app-muted)]">{rows.length ? `${rows.length} linhas` : t('maintenance.reportsMaster.query.noResult', 'Execute a query para visualizar o retorno.')}</p>
          </div>
          <div className="app-segmented inline-flex rounded-full p-1">
            {(['json', 'grid'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setView(item)}
                className={['rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em]', view === item ? 'app-segmented-active' : 'text-[color:var(--app-muted)]'].join(' ')}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="p-5">
          {view === 'json' ? (
            <CodeEditor
              editorId={`relatorio-master-query-result-${String(form.id ?? 'novo')}`}
              language="json"
              value={result ? JSON.stringify(result, null, 2) : '[]'}
              onChange={() => undefined}
              readOnly
              height="560px"
            />
          ) : (
            <DynamicResultGrid rows={rows} emptyMessage={t('maintenance.reportsMaster.query.gridEmpty', 'Nenhum dado para exibir.')} />
          )}
        </div>
      </SectionCard>
    </div>
  )
}
