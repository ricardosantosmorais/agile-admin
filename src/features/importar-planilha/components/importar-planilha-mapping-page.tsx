'use client'

import { AlertTriangle, ArrowLeft, CheckCircle2, Database, FileSpreadsheet, Loader2, RefreshCcw, Save, Wand2, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { AsyncState } from '@/src/components/ui/async-state'
import { PageHeader } from '@/src/components/ui/page-header'
import { PageToast } from '@/src/components/ui/page-toast'
import { SectionCard } from '@/src/components/ui/section-card'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { importarPlanilhaClient } from '@/src/features/importar-planilha/services/importar-planilha-client'
import type { ProcessoArquivoDictionaryField, ProcessoArquivoSpreadsheetColumn } from '@/src/features/importar-planilha/services/importar-planilha-types'
import { useAsyncData } from '@/src/hooks/use-async-data'
import { useI18n } from '@/src/i18n/use-i18n'

type MappingDraft = {
  sourceColumn: string
  targetFieldId: string
}

type ToastState = {
  tone: 'success' | 'error'
  message: string
}

const inputClassName = 'app-control w-full rounded-[1rem] px-4 py-3 text-sm text-[color:var(--app-text)] outline-none'
const labelClassName = 'text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--app-muted)]'

function normalizeMatch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '')
    .toLowerCase()
}

function dedupeColumns(columns: ProcessoArquivoSpreadsheetColumn[]) {
  const seen = new Set<string>()
  const result: ProcessoArquivoSpreadsheetColumn[] = []

  for (const column of columns) {
    if (!column.letter || seen.has(column.letter)) continue
    seen.add(column.letter)
    result.push(column)
  }

  return result
}

function buildSourceLabel(column: ProcessoArquivoSpreadsheetColumn | undefined, fallback: string) {
  if (!column) return fallback
  return `${column.letter}: ${column.name}`
}

function FieldCard({
  field,
  source,
  onMap,
  onUnmap,
}: {
  field: ProcessoArquivoDictionaryField
  source?: ProcessoArquivoSpreadsheetColumn
  onMap: () => void
  onUnmap: () => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onMap}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onMap()
        }
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        onMap()
      }}
      className={[
        'group w-full cursor-pointer rounded-[1rem] border px-3 py-3 text-left transition',
        source
          ? 'border-emerald-300/70 bg-emerald-500/10'
          : 'border-[color:var(--app-control-border)] bg-[color:var(--app-panel-solid)] hover:bg-[color:var(--app-hover-surface)]',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-[color:var(--app-text)]">{field.name}</span>
            {field.required ? <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700">Obrigatório</span> : null}
          </div>
          <p className="mt-1 text-xs text-[color:var(--app-muted)]">{field.type}</p>
        </div>
        {source ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : null}
      </div>
      {source ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-[0.85rem] bg-[color:var(--app-panel-solid)] px-3 py-2 text-xs font-semibold text-[color:var(--app-text)]">
          <span className="min-w-0 truncate">{buildSourceLabel(source, '-')}</span>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onUnmap()
            }}
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[color:var(--app-muted)] hover:bg-[color:var(--app-hover-surface)]"
            aria-label="Remover mapeamento"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function ImportarPlanilhaMappingPage({ id }: { id: string }) {
  const { t } = useI18n()
  const router = useRouter()
  const detailState = useAsyncData(() => importarPlanilhaClient.getMappingDetail(id), [id])
  const [selectedTableId, setSelectedTableId] = useState('')
  const [selectedSource, setSelectedSource] = useState('')
  const [mappings, setMappings] = useState<MappingDraft[]>([])
  const [manualLetter, setManualLetter] = useState('')
  const [manualName, setManualName] = useState('')
  const [manualColumns, setManualColumns] = useState<ProcessoArquivoSpreadsheetColumn[]>([])
  const [sourceQuery, setSourceQuery] = useState('')
  const [targetQuery, setTargetQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  useEffect(() => {
    if (!detailState.data) return
    const tableFromMapping = detailState.data.mappings[0]?.tableId || ''
    setSelectedTableId(tableFromMapping || detailState.data.tables[0]?.id || '')
    setMappings(detailState.data.mappings.map((mapping) => ({
      sourceColumn: mapping.sourceColumn,
      targetFieldId: mapping.targetFieldId,
    })))
    setSelectedSource(detailState.data.preview.columns[0]?.letter || '')
    setManualColumns([])
  }, [detailState.data])

  const tables = useMemo(() => detailState.data?.tables ?? [], [detailState.data?.tables])
  const selectedTable = useMemo(
    () => tables.find((table) => table.id === selectedTableId) ?? null,
    [selectedTableId, tables],
  )
  const allColumns = useMemo(
    () => dedupeColumns([...(detailState.data?.preview.columns ?? []), ...manualColumns]),
    [detailState.data?.preview.columns, manualColumns],
  )
  const sourceByLetter = useMemo(
    () => new Map(allColumns.map((column) => [column.letter, column])),
    [allColumns],
  )
  const fields = selectedTable?.fields ?? []
  const mappedTargetIds = useMemo(() => new Set(mappings.map((mapping) => mapping.targetFieldId)), [mappings])
  const mappedSourceByTarget = useMemo(
    () => new Map(mappings.map((mapping) => [mapping.targetFieldId, sourceByLetter.get(mapping.sourceColumn)])),
    [mappings, sourceByLetter],
  )
  const requiredMissing = fields.filter((field) => field.required && !mappedTargetIds.has(field.id))
  const coverage = fields.length ? Math.round((mappedTargetIds.size / fields.length) * 100) : 0
  const filteredSources = allColumns.filter((column) => normalizeMatch(`${column.letter} ${column.name}`).includes(normalizeMatch(sourceQuery)))
  const filteredFields = fields.filter((field) => normalizeMatch(`${field.name} ${field.type}`).includes(normalizeMatch(targetQuery)))

  function mapSelectedSourceToField(fieldId: string, forcedSource = selectedSource) {
    if (!forcedSource) {
      setToast({ tone: 'error', message: t('maintenance.spreadsheetImport.mapping.feedback.selectSource', 'Selecione uma coluna da planilha antes de mapear.') })
      return
    }

    setMappings((current) => [
      ...current.filter((mapping) => mapping.targetFieldId !== fieldId),
      { sourceColumn: forcedSource, targetFieldId: fieldId },
    ])
  }

  function addManualColumn() {
    const letter = manualLetter.trim().toUpperCase()
    const name = manualName.trim() || `Coluna ${letter}`
    if (!letter) return
    setManualColumns((current) => dedupeColumns([...current, { letter, name }]))
    setSelectedSource(letter)
    setManualLetter('')
    setManualName('')
  }

  function autoMap() {
    if (!selectedTable || !allColumns.length) return
    const byName = new Map(allColumns.map((column) => [normalizeMatch(column.name), column.letter]))
    const nextMappings = [...mappings]

    for (const field of selectedTable.fields) {
      if (nextMappings.some((mapping) => mapping.targetFieldId === field.id)) continue
      const source = byName.get(normalizeMatch(field.name))
      if (source) {
        nextMappings.push({ sourceColumn: source, targetFieldId: field.id })
      }
    }

    setMappings(nextMappings)
  }

  async function handleSave() {
    if (!selectedTableId) {
      setToast({ tone: 'error', message: t('maintenance.spreadsheetImport.mapping.feedback.selectTable', 'Selecione o destino dos dados.') })
      return
    }

    if (!mappings.length) {
      setToast({ tone: 'error', message: t('maintenance.spreadsheetImport.mapping.feedback.emptyMapping', 'Faça pelo menos um mapeamento antes de salvar.') })
      return
    }

    setSaving(true)
    try {
      await importarPlanilhaClient.saveMappings(id, { tableId: selectedTableId, mappings })
      router.push('/importar-planilha')
    } catch (error) {
      setToast({
        tone: 'error',
        message: error instanceof Error ? error.message : t('maintenance.spreadsheetImport.mapping.feedback.saveError', 'Não foi possível salvar o mapeamento.'),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={[
          { label: t('routes.dashboard', 'Início'), href: '/dashboard' },
          { label: t('routes.importarPlanilha', 'Importar Planilha'), href: '/importar-planilha' },
          { label: `ID #${id}` },
        ]}
        actions={(
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Link href="/importar-planilha" className="app-button-secondary inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold">
              <ArrowLeft className="h-4 w-4" />
              {t('common.back', 'Voltar')}
            </Link>
            <button
              type="button"
              onClick={() => void detailState.reload()}
              className="app-button-secondary inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"
            >
              <RefreshCcw className="h-4 w-4" />
              {t('common.refresh', 'Atualizar')}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="app-button-primary inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {t('maintenance.spreadsheetImport.mapping.actions.save', 'Salvar mapeamento')}
            </button>
          </div>
        )}
      />

      <AsyncState isLoading={detailState.isLoading} error={detailState.error}>
        {detailState.data ? (
          <>
            <SectionCard>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="app-control inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[color:var(--app-text)]">
                      <FileSpreadsheet className="h-4 w-4" />
                      {t('maintenance.spreadsheetImport.mapping.badge', 'Mapeamento')}
                    </span>
                    <StatusBadge tone={detailState.data.processo.statusTone}>{detailState.data.processo.statusLabel}</StatusBadge>
                  </div>
                  <h1 className="mt-3 text-2xl font-black tracking-tight text-[color:var(--app-text)]">ID #{detailState.data.processo.id}</h1>
                  <p className="mt-1 truncate text-sm text-[color:var(--app-muted)]">{detailState.data.processo.arquivo || '-'}</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="app-control-muted rounded-[1rem] px-3 py-3">
                    <div className={labelClassName}>{t('maintenance.spreadsheetImport.mapping.metrics.columns', 'Colunas')}</div>
                    <div className="mt-2 text-xl font-black text-[color:var(--app-text)]">{allColumns.length}</div>
                  </div>
                  <div className="app-control-muted rounded-[1rem] px-3 py-3">
                    <div className={labelClassName}>{t('maintenance.spreadsheetImport.mapping.metrics.coverage', 'Cobertura')}</div>
                    <div className="mt-2 text-xl font-black text-[color:var(--app-text)]">{coverage}%</div>
                  </div>
                  <div className="app-control-muted rounded-[1rem] px-3 py-3">
                    <div className={labelClassName}>{t('maintenance.spreadsheetImport.mapping.metrics.missing', 'Pendentes')}</div>
                    <div className="mt-2 text-xl font-black text-[color:var(--app-text)]">{requiredMissing.length}</div>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title={t('maintenance.spreadsheetImport.mapping.destinationTitle', 'Destino dos dados')}
              description={t('maintenance.spreadsheetImport.mapping.destinationDescription', 'Selecione a tabela do dicionário e vincule as colunas da planilha aos campos de destino.')}
            >
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div>
                  <label className={labelClassName} htmlFor="mapping-table">{t('maintenance.spreadsheetImport.mapping.fields.destination', 'Destino dos dados')}</label>
                  <select id="mapping-table" className={`${inputClassName} mt-2`} value={selectedTableId} onChange={(event) => {
                    setSelectedTableId(event.target.value)
                    setMappings([])
                  }}>
                    {tables.map((table) => <option key={table.id} value={table.id}>{table.name}</option>)}
                  </select>
                </div>
                <button type="button" onClick={autoMap} className="app-button-secondary inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold">
                  <Wand2 className="h-4 w-4" />
                  {t('maintenance.spreadsheetImport.mapping.actions.autoMap', 'Mapear nomes iguais')}
                </button>
              </div>
            </SectionCard>

            {detailState.data.preview.warning ? (
              <div className="rounded-[1rem] border border-amber-300/70 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-800">
                <span className="inline-flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{detailState.data.preview.warning}</span>
              </div>
            ) : null}

            <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
              <SectionCard title={t('maintenance.spreadsheetImport.mapping.sourceTitle', 'Colunas da planilha')} description={t('maintenance.spreadsheetImport.mapping.sourceDescription', 'Escolha uma coluna de origem e clique no campo de destino.')}>
                <div className="space-y-4">
                  <input className={inputClassName} value={sourceQuery} onChange={(event) => setSourceQuery(event.target.value)} placeholder={t('common.search', 'Buscar')} />
                  <div className="max-h-[430px] space-y-2 overflow-y-auto pr-1">
                    {filteredSources.length ? filteredSources.map((column) => {
                      const selected = selectedSource === column.letter
                      return (
                        <button
                          key={column.letter}
                          type="button"
                          draggable
                          onDragStart={(event) => {
                            event.dataTransfer.setData('text/plain', column.letter)
                            setSelectedSource(column.letter)
                          }}
                          onClick={() => setSelectedSource(column.letter)}
                          className={[
                            'w-full rounded-[1rem] border px-3 py-3 text-left transition',
                            selected ? 'border-emerald-400 bg-emerald-500/10' : 'border-[color:var(--app-control-border)] bg-[color:var(--app-panel-solid)] hover:bg-[color:var(--app-hover-surface)]',
                          ].join(' ')}
                        >
                          <span className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">{column.letter}</span>
                          <span className="mt-1 block truncate text-sm font-semibold text-[color:var(--app-text)]">{column.name}</span>
                        </button>
                      )
                    }) : <div className="app-control-muted rounded-[1rem] px-4 py-6 text-center text-sm text-[color:var(--app-muted)]">{t('maintenance.spreadsheetImport.mapping.emptySources', 'Nenhuma coluna disponível.')}</div>}
                  </div>
                  <div className="app-control-muted space-y-3 rounded-[1rem] p-3">
                    <div className={labelClassName}>{t('maintenance.spreadsheetImport.mapping.manualTitle', 'Adicionar coluna manual')}</div>
                    <div className="grid grid-cols-[90px_minmax(0,1fr)] gap-2">
                      <input className={inputClassName} value={manualLetter} onChange={(event) => setManualLetter(event.target.value)} placeholder="A" />
                      <input className={inputClassName} value={manualName} onChange={(event) => setManualName(event.target.value)} placeholder={t('maintenance.spreadsheetImport.mapping.fields.columnName', 'Nome da coluna')} />
                    </div>
                    <button type="button" onClick={addManualColumn} className="app-button-secondary w-full rounded-full px-4 py-2.5 text-sm font-semibold">
                      {t('maintenance.spreadsheetImport.mapping.actions.addColumn', 'Adicionar coluna')}
                    </button>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title={t('maintenance.spreadsheetImport.mapping.targetTitle', 'Campos de destino')} description={t('maintenance.spreadsheetImport.mapping.targetDescription', 'Cada campo recebe uma coluna. A mesma coluna pode alimentar mais de um campo, como no legado.')}>
                <div className="space-y-4">
                  <input className={inputClassName} value={targetQuery} onChange={(event) => setTargetQuery(event.target.value)} placeholder={t('common.search', 'Buscar')} />
                  <div className="grid max-h-[600px] gap-2 overflow-y-auto pr-1 md:grid-cols-2">
                    {filteredFields.length ? filteredFields.map((field) => (
                      <FieldCard
                        key={field.id}
                        field={field}
                        source={mappedSourceByTarget.get(field.id)}
                        onMap={() => mapSelectedSourceToField(field.id)}
                        onUnmap={() => setMappings((current) => current.filter((mapping) => mapping.targetFieldId !== field.id))}
                      />
                    )) : <div className="app-control-muted rounded-[1rem] px-4 py-6 text-center text-sm text-[color:var(--app-muted)]">{t('maintenance.spreadsheetImport.mapping.emptyTargets', 'Nenhum campo disponível para o destino selecionado.')}</div>}
                  </div>
                </div>
              </SectionCard>
            </div>

            <SectionCard
              title={t('maintenance.spreadsheetImport.mapping.previewTitle', 'Preview da planilha')}
              description={detailState.data.preview.sheetName ? t('maintenance.spreadsheetImport.mapping.previewDescription', 'Amostra carregada no servidor, sem baixar o arquivo inteiro para o navegador.') : undefined}
              action={detailState.data.preview.sheetName ? <span className="app-control rounded-full px-3 py-1.5 text-xs font-semibold text-[color:var(--app-muted)]">{detailState.data.preview.sheetName}</span> : null}
            >
              {detailState.data.preview.columns.length && detailState.data.preview.rows.length ? (
                <div className="app-table-shell overflow-x-auto rounded-[1.1rem]">
                  <table className="min-w-full border-separate border-spacing-0 text-sm">
                    <thead>
                      <tr className="app-table-muted text-left text-xs font-bold uppercase tracking-[0.12em] text-[color:var(--app-muted)]">
                        {detailState.data.preview.columns.map((column) => (
                          <th key={column.letter} className="min-w-[180px] border-b border-line/60 px-3 py-3">{column.name} ({column.letter})</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {detailState.data.preview.rows.map((row, index) => (
                        <tr key={`${index}-${row.join('|')}`} className="border-b border-line/40">
                          {detailState.data?.preview.columns.map((column, columnIndex) => (
                            <td key={`${column.letter}-${columnIndex}`} className="max-w-[260px] border-b border-line/40 px-3 py-3 text-[color:var(--app-text)]">
                              <span className="line-clamp-3 break-words">{row[columnIndex] || '-'}</span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="app-control-muted rounded-[1rem] px-4 py-6 text-center text-sm text-[color:var(--app-muted)]">
                  <Database className="mx-auto mb-2 h-5 w-5" />
                  {t('maintenance.spreadsheetImport.mapping.emptyPreview', 'Preview indisponível para este arquivo. Você ainda pode adicionar colunas manualmente.')}
                </div>
              )}
            </SectionCard>
          </>
        ) : null}
      </AsyncState>

      {toast ? (
        <PageToast
          variant={toast.tone === 'success' ? 'success' : 'danger'}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      ) : null}
    </div>
  )
}
