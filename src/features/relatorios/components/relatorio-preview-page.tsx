'use client'

import Link from 'next/link'
import { Download, Loader2, Play, RefreshCcw, RotateCcw, ScrollText, SquareX } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { AppDataTable } from '@/src/components/data-table/app-data-table'
import { DataTableFiltersCard } from '@/src/components/data-table/data-table-filters'
import { DataTableFilterToggleAction, DataTableSectionAction } from '@/src/components/data-table/data-table-toolbar'
import type { AppDataTableColumn, AppDataTableFilterConfig } from '@/src/components/data-table/types'
import { AsyncState } from '@/src/components/ui/async-state'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { CurrencyInput } from '@/src/components/ui/currency-input'
import { FormField } from '@/src/components/ui/form-field'
import { OverlayModal } from '@/src/components/ui/overlay-modal'
import { PageHeader } from '@/src/components/ui/page-header'
import { PageToast } from '@/src/components/ui/page-toast'
import { SectionCard } from '@/src/components/ui/section-card'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { inputClasses } from '@/src/components/ui/input-styles'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { relatoriosClient } from '@/src/features/relatorios/services/relatorios-client'
import { createRelatorioFilterDraft } from '@/src/features/relatorios/services/relatorios-mappers'
import type {
  RelatorioFiltroDinamico,
  RelatorioProcessoLogRecord,
  RelatorioProcessosFilters,
  RelatorioProcessoRecord,
} from '@/src/features/relatorios/services/relatorios-types'
import { useAsyncData } from '@/src/hooks/use-async-data'
import { useI18n } from '@/src/i18n/use-i18n'
import { useRouteParams } from '@/src/next/route-context'
import { fetchWithTenantContext } from '@/src/services/http/tenant-context'

type ToastState = {
  tone: 'success' | 'error'
  message: string | null
}

const DEFAULT_PROCESS_FILTERS: RelatorioProcessosFilters = {
  page: 1,
  perPage: 50,
  orderBy: 'created_at',
  sort: 'desc',
  id: '',
  usuario: '',
  data_inicio: '',
  data_fim: '',
  status: '',
}

const EMPTY_LOGS = {
  data: [] as RelatorioProcessoLogRecord[],
  meta: { total: 0, from: 0, to: 0, page: 1, pages: 1, perPage: 30 },
}

function dynamicFieldSort(a: RelatorioFiltroDinamico, b: RelatorioFiltroDinamico) {
  const posA = a.posicaoOrdenacao ?? Number.MAX_SAFE_INTEGER
  const posB = b.posicaoOrdenacao ?? Number.MAX_SAFE_INTEGER
  if (posA !== posB) return posA - posB
  return a.titulo.localeCompare(b.titulo, 'pt-BR')
}

function sanitizeProcessDraft(fields: RelatorioFiltroDinamico[], values: Record<string, string>) {
  const next: Record<string, string> = {}
  for (const field of fields) {
    if (field.tipo === 'data' || field.tipo === 'inteiro' || field.tipo === 'valor') {
      next[`${field.campo}__start`] = values[`${field.campo}__start`] ?? ''
      next[`${field.campo}__end`] = values[`${field.campo}__end`] ?? ''
      continue
    }

    next[field.campo] = values[field.campo] ?? ''
  }
  return next
}

function parseDownloadFileName(contentDisposition: string | null, fallback: string) {
  if (!contentDisposition) {
    return fallback
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]).replace(/[/\\]/g, '_')
    } catch {
      return utf8Match[1].replace(/[/\\]/g, '_')
    }
  }

  const plainMatch = contentDisposition.match(/filename="?([^"]+)"?/i)
  if (plainMatch?.[1]) {
    return plainMatch[1].replace(/[/\\]/g, '_')
  }

  return fallback
}

function isRangeField(field: RelatorioFiltroDinamico) {
  return field.tipo === 'data' || field.tipo === 'inteiro' || field.tipo === 'valor'
}

function DynamicReportRangeField({
  field,
  values,
  disabled,
  onChange,
}: {
  field: RelatorioFiltroDinamico
  values: Record<string, string>
  disabled: boolean
  onChange: (key: string, value: string) => void
}) {
  const renderInput = (boundary: 'start' | 'end') => {
    const key = `${field.campo}__${boundary}`
    const label = boundary === 'start' ? 'De' : 'Até'

    if (field.tipo === 'data') {
      return (
        <FormField key={key} label={`${field.titulo} ${label}`}>
          <input
            type="date"
            value={values[key] ?? ''}
            onChange={(event) => onChange(key, event.target.value)}
            className={inputClasses()}
            disabled={disabled}
          />
        </FormField>
      )
    }

    if (field.tipo === 'inteiro') {
      return (
        <FormField key={key} label={`${field.titulo} ${label}`}>
          <input
            type="text"
            inputMode="numeric"
            value={values[key] ?? ''}
            onChange={(event) => onChange(key, event.target.value.replace(/\D/g, ''))}
            className={inputClasses()}
            disabled={disabled}
          />
        </FormField>
      )
    }

    return (
      <FormField key={key} label={`${field.titulo} ${label}`}>
        <CurrencyInput
          value={values[key] ?? ''}
          onChange={(value) => onChange(key, value)}
          disabled={disabled}
        />
      </FormField>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:col-span-2">
      {renderInput('start')}
      {renderInput('end')}
    </div>
  )
}

function DynamicReportField({
  field,
  values,
  disabled,
  onChange,
}: {
  field: RelatorioFiltroDinamico
  values: Record<string, string>
  disabled: boolean
  onChange: (key: string, value: string) => void
}) {
  if (field.tipo === 'data') {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">De</label>
          <input
            type="date"
            value={values[`${field.campo}__start`] ?? ''}
            onChange={(event) => onChange(`${field.campo}__start`, event.target.value)}
            className={inputClasses()}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Até</label>
          <input
            type="date"
            value={values[`${field.campo}__end`] ?? ''}
            onChange={(event) => onChange(`${field.campo}__end`, event.target.value)}
            className={inputClasses()}
            disabled={disabled}
          />
        </div>
      </div>
    )
  }

  if (field.tipo === 'inteiro') {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">De</label>
          <input
            type="text"
            inputMode="numeric"
            value={values[`${field.campo}__start`] ?? ''}
            onChange={(event) => onChange(`${field.campo}__start`, event.target.value.replace(/\D/g, ''))}
            className={inputClasses()}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Até</label>
          <input
            type="text"
            inputMode="numeric"
            value={values[`${field.campo}__end`] ?? ''}
            onChange={(event) => onChange(`${field.campo}__end`, event.target.value.replace(/\D/g, ''))}
            className={inputClasses()}
            disabled={disabled}
          />
        </div>
      </div>
    )
  }

  if (field.tipo === 'valor') {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">De</label>
          <CurrencyInput
            value={values[`${field.campo}__start`] ?? ''}
            onChange={(value) => onChange(`${field.campo}__start`, value)}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Até</label>
          <CurrencyInput
            value={values[`${field.campo}__end`] ?? ''}
            onChange={(value) => onChange(`${field.campo}__end`, value)}
            disabled={disabled}
          />
        </div>
      </div>
    )
  }

  return (
    <input
      type="text"
      value={values[field.campo] ?? ''}
      onChange={(event) => onChange(field.campo, event.target.value)}
      className={inputClasses()}
      disabled={disabled}
    />
  )
}

export function RelatorioPreviewPage() {
  const { t } = useI18n()
  const { id } = useRouteParams<{ id?: string }>()
  const access = useFeatureAccess('relatorios')
  const [processDraft, setProcessDraft] = useState<Record<string, string>>({})
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [filters, setFilters] = useState<RelatorioProcessosFilters>(DEFAULT_PROCESS_FILTERS)
  const [filtersDraft, setFiltersDraft] = useState<RelatorioProcessosFilters>(DEFAULT_PROCESS_FILTERS)
  const [toast, setToast] = useState<ToastState>({ tone: 'success', message: null })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [downloadTargetId, setDownloadTargetId] = useState<string | null>(null)
  const [cancelTarget, setCancelTarget] = useState<RelatorioProcessoRecord | null>(null)
  const [logTarget, setLogTarget] = useState<RelatorioProcessoRecord | null>(null)
  const [logPage, setLogPage] = useState(1)

  const reportState = useAsyncData(() => (id ? relatoriosClient.getById(id) : Promise.resolve(null)), [id])
  const report = reportState.data
  const processFields = useMemo(() => [...(report?.filtros ?? [])].sort(dynamicFieldSort), [report?.filtros])

  useEffect(() => {
    if (!report) return
    setProcessDraft((current) =>
      sanitizeProcessDraft(
        processFields,
        Object.keys(current).length ? current : createRelatorioFilterDraft(processFields),
      ),
    )
  }, [processFields, report])

  const processosState = useAsyncData(
    () => (
      id
        ? relatoriosClient.listProcessos(id, filters)
        : Promise.resolve({ data: [], meta: { total: 0, from: 0, to: 0, page: 1, pages: 1, perPage: 50 } })
    ),
    [id, filters],
  )

  const logsState = useAsyncData(
    () => (logTarget ? relatoriosClient.listLogs(logTarget.id, logPage, 30) : Promise.resolve(EMPTY_LOGS)),
    [logTarget?.id, logPage],
  )

  const processColumns = useMemo(
    () => ([
      {
        id: 'id',
        label: t('relatorios.processos.fields.id', 'ID'),
        sortKey: 'id',
        thClassName: 'w-[180px]',
        cell: (item: RelatorioProcessoRecord) => <span className="font-semibold text-slate-950">{item.id}</span>,
        filter: {
          kind: 'text',
          id: 'id',
          key: 'id',
          label: t('relatorios.processos.fields.id', 'ID'),
        },
      },
      {
        id: 'usuario',
        label: t('relatorios.processos.fields.user', 'Usuário'),
        sortKey: 'usuario',
        cell: (item: RelatorioProcessoRecord) => item.usuarioNome,
        filter: {
          kind: 'text',
          id: 'usuario',
          key: 'usuario',
          label: t('relatorios.processos.fields.user', 'Usuário'),
        },
      },
      {
        id: 'campos',
        label: t('relatorios.processos.fields.filters', 'Filtros'),
        tdClassName: 'max-w-[420px] whitespace-pre-line text-sm text-slate-600',
        cell: (item: RelatorioProcessoRecord) => item.camposResumo,
      },
      {
        id: 'createdAt',
        label: t('relatorios.processos.fields.createdAt', 'Data do envio'),
        sortKey: 'created_at',
        thClassName: 'w-[180px]',
        cell: (item: RelatorioProcessoRecord) => item.createdAt,
      },
      {
        id: 'status',
        label: t('relatorios.processos.fields.status', 'Status'),
        sortKey: 'status',
        thClassName: 'w-[160px]',
        cell: (item: RelatorioProcessoRecord) => <StatusBadge tone={item.statusTone}>{item.statusLabel}</StatusBadge>,
        filter: {
          kind: 'select',
          id: 'status',
          key: 'status',
          label: t('relatorios.processos.fields.status', 'Status'),
          options: [
            { value: 'criado', label: t('relatorios.processos.status.criado', 'Criado') },
            { value: 'iniciado', label: t('relatorios.processos.status.iniciado', 'Iniciado') },
            { value: 'finalizado', label: t('relatorios.processos.status.finalizado', 'Finalizado') },
            { value: 'cancelado', label: t('relatorios.processos.status.cancelado', 'Cancelado') },
            { value: 'erro', label: t('relatorios.processos.status.erro', 'Erro') },
          ],
        },
      },
    ]) satisfies AppDataTableColumn<RelatorioProcessoRecord, RelatorioProcessosFilters>[],
    [t],
  )

  const processExtraFilters = useMemo(
    () => ([
      {
        kind: 'date-range',
        id: 'createdAtRange',
        fromKey: 'data_inicio',
        toKey: 'data_fim',
        label: t('relatorios.processos.fields.createdAt', 'Data do envio'),
        widthClassName: 'xl:col-span-2',
      },
    ]) satisfies AppDataTableFilterConfig<RelatorioProcessosFilters>[],
    [t],
  )

  const logColumns = useMemo(
    () => ([
      {
        id: 'createdAt',
        label: t('relatorios.logs.fields.createdAt', 'Data'),
        cell: (item: RelatorioProcessoLogRecord) => item.createdAt,
        thClassName: 'w-[180px]',
      },
      {
        id: 'tipo',
        label: t('relatorios.logs.fields.type', 'Tipo'),
        cell: (item: RelatorioProcessoLogRecord) => <StatusBadge tone={item.tipoTone}>{item.tipoLabel}</StatusBadge>,
        thClassName: 'w-[160px]',
      },
      {
        id: 'mensagem',
        label: t('relatorios.logs.fields.message', 'Mensagem'),
        tdClassName: 'whitespace-pre-line text-sm text-slate-600',
        cell: (item: RelatorioProcessoLogRecord) => item.mensagem,
      },
    ]) satisfies AppDataTableColumn<RelatorioProcessoLogRecord>[],
    [t],
  )

  async function reloadAll() {
    await Promise.all([reportState.reload(), processosState.reload()])
  }

  async function handleProcessar() {
    if (!id) return

    setIsSubmitting(true)
    try {
      await relatoriosClient.processar(id, processDraft)
      setToast({
        tone: 'success',
        message: t(
          'relatorios.processos.feedback.processSuccess',
          'Relatório solicitado com sucesso. Aguarde alguns minutos.',
        ),
      })
      setReportModalOpen(false)
      await processosState.reload()
    } catch (error) {
      setToast({
        tone: 'error',
        message:
          error instanceof Error
            ? error.message
            : t(
                'relatorios.processos.feedback.processError',
                'Não foi possível solicitar o relatório.',
              ),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCancelarProcesso() {
    if (!cancelTarget) return

    setIsSubmitting(true)
    try {
      await relatoriosClient.cancelarProcesso(cancelTarget.id)
      setCancelTarget(null)
      await processosState.reload()
    } catch (error) {
      setToast({
        tone: 'error',
        message:
          error instanceof Error
            ? error.message
            : t(
                'relatorios.processos.feedback.cancelError',
                'Não foi possível cancelar o processo.',
              ),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleReprocessar(item: RelatorioProcessoRecord) {
    setIsSubmitting(true)
    try {
      await relatoriosClient.reprocessarProcesso(item.id)
      await processosState.reload()
    } catch (error) {
      setToast({
        tone: 'error',
        message:
          error instanceof Error
            ? error.message
            : t(
                'relatorios.processos.feedback.reprocessError',
                'Não foi possível reprocessar o relatório.',
              ),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function openDownload(item: RelatorioProcessoRecord) {
    try {
      setDownloadTargetId(item.id)
      const response = await fetchWithTenantContext(
        `/api/processos-relatorios/${encodeURIComponent(item.id)}/download`,
        {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        },
      )

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(
          typeof payload?.message === 'string'
            ? payload.message
            : t(
                'relatorios.processos.feedback.downloadError',
                'Não foi possível baixar o arquivo.',
              ),
        )
      }

      const blob = await response.blob()
      const fileName = parseDownloadFileName(
        response.headers.get('content-disposition'),
        `${item.id}.bin`,
      )

      const objectUrl = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = objectUrl
      anchor.download = fileName
      anchor.style.display = 'none'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(objectUrl)
    } catch (error) {
      setToast({
        tone: 'error',
        message:
          error instanceof Error
            ? error.message
            : t(
                'relatorios.processos.feedback.downloadError',
                'Não foi possível baixar o arquivo.',
              ),
      })
    } finally {
      setDownloadTargetId(null)
    }
  }

  function updateProcessDraft(key: string, value: string) {
    setProcessDraft((current) => ({ ...current, [key]: value }))
  }

  function patchFiltersDraft<K extends keyof RelatorioProcessosFilters>(
    key: K,
    value: RelatorioProcessosFilters[K],
  ) {
    setFiltersDraft((current) => ({ ...current, [key]: value, page: 1 }))
  }

  function toggleSort(column: string) {
    setFilters((current) => ({
      ...current,
      orderBy: column as RelatorioProcessosFilters['orderBy'],
      sort: current.orderBy === column && current.sort === 'asc' ? 'desc' : 'asc',
      page: 1,
    }))
  }

  if (!access.canList) {
    return (
      <AccessDeniedState title={t('relatorios.title', 'Relatórios')} backHref="/dashboard" />
    )
  }

  if (!reportState.isLoading && !reportState.error && !report) {
    return (
      <SectionCard>
        <p className="text-sm text-slate-600">
          {t(
            'relatorios.notFoundDescription',
            'Não foi possível localizar o relatório solicitado.',
          )}
        </p>
      </SectionCard>
    )
  }

  const processos = processosState.data?.data ?? []
  const logs = logsState.data?.data ?? []

  return (
    <div className="space-y-5">
      <AsyncState isLoading={reportState.isLoading} error={reportState.error}>
        {report ? (
          <>
            <PageHeader
              breadcrumbs={[
                { label: t('routes.dashboard', 'Home'), href: '/dashboard' },
                { label: t('relatorios.title', 'Relatórios v2'), href: '/relatorios' },
                { label: `${report.codigo} - ${report.nome}`, href: `/relatorios/${report.id}` },
              ]}
              actions={(
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/relatorios"
                    className="rounded-full border border-[#e6dfd3] bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
                  >
                    {t('common.back', 'Voltar')}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    <Play className="h-4 w-4" />
                    {t('relatorios.processos.newTitle', 'Novo relatório')}
                  </button>
                  <DataTableSectionAction
                    label={t('relatorios.processos.actions.refresh', 'Atualizar processos')}
                    icon={RefreshCcw}
                    onClick={() => void reloadAll()}
                  />
                </div>
              )}
            />

            <AsyncState isLoading={processosState.isLoading} error={processosState.error}>
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
                  columns={processColumns as AppDataTableColumn<unknown, RelatorioProcessosFilters>[]}
                  extraFilters={processExtraFilters}
                  draft={filtersDraft}
                  applied={filters}
                  expanded={filtersExpanded}
                  onToggleExpanded={() => setFiltersExpanded((current) => !current)}
                  onApply={() => setFilters(filtersDraft)}
                  onClear={() => {
                    setFilters(DEFAULT_PROCESS_FILTERS)
                    setFiltersDraft(DEFAULT_PROCESS_FILTERS)
                  }}
                  patchDraft={patchFiltersDraft}
                />

                <AppDataTable
                  rows={processos}
                  getRowId={(item) => item.id}
                  emptyMessage={t(
                    'relatorios.processos.empty',
                    'Nenhum processo encontrado para este relatório.',
                  )}
                  columns={processColumns}
                  sort={{
                    activeColumn: filters.orderBy,
                    direction: filters.sort,
                    onToggle: (column) => toggleSort(String(column)),
                  }}
                  mobileCard={{
                    title: (item) => item.id,
                    subtitle: (item) => item.usuarioNome,
                    meta: (item) => item.createdAt,
                    badges: (item) => (
                      <StatusBadge tone={item.statusTone}>{item.statusLabel}</StatusBadge>
                    ),
                  }}
                  rowActions={(item) => [
                    {
                      id: 'download',
                      label:
                        downloadTargetId === item.id
                          ? t('common.loading', 'Carregando...')
                          : t('relatorios.processos.actions.download', 'Baixar arquivo'),
                      icon: downloadTargetId === item.id ? Loader2 : Download,
                      onClick: (target) => void openDownload(target),
                      visible: item.canDownload,
                    },
                    {
                      id: 'cancel',
                      label: t('relatorios.processos.actions.cancel', 'Cancelar processo'),
                      icon: SquareX,
                      onClick: setCancelTarget,
                      tone: 'danger',
                      visible: item.canCancel && access.canEdit,
                    },
                    {
                      id: 'retry',
                      label: t(
                        'relatorios.processos.actions.retry',
                        'Reprocessar relatório',
                      ),
                      icon: RefreshCcw,
                      onClick: (target) => void handleReprocessar(target),
                      visible: item.canReprocess && access.canEdit,
                    },
                    {
                      id: 'logs',
                      label: t('relatorios.processos.actions.logs', 'Logs'),
                      icon: ScrollText,
                      onClick: (target) => {
                        setLogTarget(target)
                        setLogPage(1)
                      },
                      visible: access.canLogs,
                    },
                  ]}
                  actionsColumnClassName="w-[188px] whitespace-nowrap"
                  pagination={processosState.data?.meta}
                  onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
                  pageSize={{
                    value: filters.perPage,
                    options: [30, 50, 100],
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
              open={reportModalOpen}
              title={t('relatorios.processos.newTitle', 'Novo relatório')}
              onClose={() => setReportModalOpen(false)}
              maxWidthClassName="max-w-5xl"
            >
              <div className="space-y-5">
                <SectionCard>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-1">
                      <h3 className="text-lg font-black tracking-tight text-slate-950">{`${report.codigo} - ${report.nome}`}</h3>
                      <p className="max-w-3xl text-sm text-slate-600">
                        {report.descricao || t(
                          'relatorios.processos.newDescription',
                          'Preencha os filtros dinâmicos do relatório e envie para a fila de processamento.',
                        )}
                      </p>
                    </div>
                    <div className="inline-flex items-center rounded-full border border-[#dcebdd] bg-[#f4fbf6] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                      {t('relatorios.processos.modal.dynamicFilters', 'Filtros dinâmicos')}
                    </div>
                  </div>
                </SectionCard>

                <SectionCard
                  title={t('relatorios.processos.modal.filtersTitle', 'Parâmetros do relatório')}
                  description={t(
                    'relatorios.processos.modal.filtersDescription',
                    'Preencha somente os filtros necessários para montar o processo. Campos em faixa aceitam intervalo inicial e final.',
                  )}
                >
                  {processFields.length ? (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {processFields.map((field) =>
                        isRangeField(field) ? (
                          <DynamicReportRangeField
                            key={field.campo}
                            field={field}
                            values={processDraft}
                            onChange={updateProcessDraft}
                            disabled={isSubmitting}
                          />
                        ) : (
                          <FormField key={field.campo} label={field.titulo}>
                            <DynamicReportField
                              field={field}
                              values={processDraft}
                              onChange={updateProcessDraft}
                              disabled={isSubmitting}
                            />
                          </FormField>
                        ),
                      )}
                    </div>
                  ) : (
                    <div className="rounded-[1.1rem] border border-dashed border-[#e6dfd3] px-4 py-6 text-sm text-slate-500">
                      {t(
                        'relatorios.processos.noDynamicFilters',
                        'Este relatório não possui filtros dinâmicos configurados.',
                      )}
                    </div>
                  )}
                </SectionCard>

                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setProcessDraft(createRelatorioFilterDraft(processFields))}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-full border border-[#e6dfd3] bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-60"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {t('common.clear', 'Limpar')}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleProcessar()}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    {isSubmitting
                      ? t('common.loading', 'Carregando...')
                      : t('relatorios.processos.actions.process', 'Processar relatório')}
                  </button>
                </div>
              </div>
            </OverlayModal>

            <ConfirmDialog
              open={Boolean(cancelTarget)}
              title={t('relatorios.processos.confirm.cancelTitle', 'Confirmar cancelamento?')}
              description={t(
                'relatorios.processos.confirm.cancelDescription',
                'Essa ação cancela o processo selecionado e não pode ser desfeita.',
              )}
              confirmLabel={t('relatorios.processos.actions.cancel', 'Cancelar processo')}
              isLoading={isSubmitting}
              onClose={() => setCancelTarget(null)}
              onConfirm={() => void handleCancelarProcesso()}
            />

            <OverlayModal
              open={Boolean(logTarget)}
              title={t('relatorios.logs.titleWithId', 'Logs do processo #{{id}}', { id: logTarget?.id ?? '' })}
              onClose={() => setLogTarget(null)}
              maxWidthClassName="max-w-5xl"
            >
              <AsyncState isLoading={logsState.isLoading} error={logsState.error}>
                <AppDataTable
                  rows={logs}
                  getRowId={(item) => item.id}
                  emptyMessage={t(
                    'relatorios.logs.empty',
                    'Nenhum log encontrado para o processo selecionado.',
                  )}
                  columns={logColumns}
                  mobileCard={{
                    title: (item) => item.createdAt,
                    subtitle: (item) => item.mensagem,
                    badges: (item) => (
                      <StatusBadge tone={item.tipoTone}>{item.tipoLabel}</StatusBadge>
                    ),
                  }}
                  pagination={logsState.data?.meta}
                  onPageChange={(page) => setLogPage(page)}
                />
              </AsyncState>
            </OverlayModal>

            <PageToast
              message={toast.message}
              tone={toast.tone}
              onClose={() => setToast((current) => ({ ...current, message: null }))}
            />
          </>
        ) : null}
      </AsyncState>
    </div>
  )
}
