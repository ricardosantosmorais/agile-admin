'use client'

import { Eye, FileSpreadsheet, Loader2, Play, RefreshCcw, RotateCw, Upload, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AppDataTable } from '@/src/components/data-table/app-data-table'
import { DataTableFiltersCard } from '@/src/components/data-table/data-table-filters'
import { DataTableFilterToggleAction, DataTablePageActions, DataTableSectionAction } from '@/src/components/data-table/data-table-toolbar'
import type { AppDataTableColumn, AppDataTableFilterConfig } from '@/src/components/data-table/types'
import { useDataTableState } from '@/src/components/data-table/use-data-table-state'
import { AsyncState } from '@/src/components/ui/async-state'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { OverlayModal } from '@/src/components/ui/overlay-modal'
import { PageHeader } from '@/src/components/ui/page-header'
import { PageToast } from '@/src/components/ui/page-toast'
import { SectionCard } from '@/src/components/ui/section-card'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { importarPlanilhaClient } from '@/src/features/importar-planilha/services/importar-planilha-client'
import type {
  ImportarPlanilhaFilters,
  ProcessoArquivoDetail,
  ProcessoArquivoLogRecord,
  ProcessoArquivoRecord,
} from '@/src/features/importar-planilha/services/importar-planilha-types'
import { useAsyncData } from '@/src/hooks/use-async-data'
import { useI18n } from '@/src/i18n/use-i18n'

const DEFAULT_FILTERS: ImportarPlanilhaFilters = {
  page: 1,
  perPage: 15,
  orderBy: 'created_at',
  sort: 'desc',
  id: '',
  usuario: '',
  data_inicio: '',
  data_fim: '',
  status: '',
}

type ToastState = {
  tone: 'success' | 'error'
  message: string
}

const EMPTY_ROWS: ProcessoArquivoRecord[] = []
const metricCardClasses = 'app-control-muted rounded-[1rem] px-4 py-3'
const detailCardClasses = 'app-control-muted rounded-[1rem] px-4 py-3'
const detailPanelClasses = 'app-control-muted rounded-[1.25rem] p-4'
const labelClasses = 'text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--app-muted)]'
const metricLabelClasses = 'text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--app-muted)]'
const valueClasses = 'mt-2 text-sm font-semibold text-[color:var(--app-text)]'

export function ImportarPlanilhaPage() {
  const { t } = useI18n()
  const access = useFeatureAccess('importarPlanilha')
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [filters, setFilters] = useState<ImportarPlanilhaFilters>(DEFAULT_FILTERS)
  const [filtersDraft, setFiltersDraft] = useState<ImportarPlanilhaFilters>(DEFAULT_FILTERS)
  const [detailTarget, setDetailTarget] = useState<ProcessoArquivoRecord | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [cancelTarget, setCancelTarget] = useState<ProcessoArquivoRecord | null>(null)

  const listState = useAsyncData(() => importarPlanilhaClient.list(filters), [filters])
  const detailState = useAsyncData<ProcessoArquivoDetail | null>(
    () => (detailTarget ? importarPlanilhaClient.getById(detailTarget.id) : Promise.resolve(null)),
    [detailTarget?.id],
  )

  const rows = listState.data?.data ?? EMPTY_ROWS
  const statusSummary = useMemo(() => ({
    total: rows.length,
    draft: rows.filter((row) => row.status === 'rascunho').length,
    running: rows.filter((row) => row.status === 'criado' || row.status === 'iniciado').length,
    success: rows.filter((row) => row.status === 'sucesso').length,
    error: rows.filter((row) => row.status === 'erro').length,
  }), [rows])

  const tableState = useDataTableState<ProcessoArquivoRecord, ImportarPlanilhaFilters, ImportarPlanilhaFilters['orderBy']>({
    rows,
    getRowId: (row) => row.id,
    filters,
    setFilters,
    setFiltersDraft,
    selectableRowIds: rows.filter((row) => row.canCancel).map((row) => row.id),
  })

  const columns = useMemo(
    () => ([
      {
        id: 'id',
        label: t('maintenance.spreadsheetImport.fields.id', 'ID'),
        sortKey: 'id',
        thClassName: 'w-[120px]',
        cell: (row: ProcessoArquivoRecord) => <span className="font-semibold text-[color:var(--app-text)]">{row.id || '-'}</span>,
        filter: {
          kind: 'text',
          id: 'id',
          key: 'id',
          label: t('maintenance.spreadsheetImport.fields.id', 'ID'),
        },
      },
      {
        id: 'usuario',
        label: t('maintenance.spreadsheetImport.fields.user', 'Usuário'),
        sortKey: 'usuario',
        cell: (row: ProcessoArquivoRecord) => row.usuarioNome,
        filter: {
          kind: 'text',
          id: 'usuario',
          key: 'usuario',
          label: t('maintenance.spreadsheetImport.fields.user', 'Usuário'),
        },
      },
      {
        id: 'createdAt',
        label: t('maintenance.spreadsheetImport.fields.sentAt', 'Data do envio'),
        sortKey: 'created_at',
        thClassName: 'w-[180px]',
        cell: (row: ProcessoArquivoRecord) => row.createdAt,
      },
      {
        id: 'status',
        label: t('maintenance.spreadsheetImport.fields.status', 'Status'),
        sortKey: 'status',
        thClassName: 'w-[160px]',
        cell: (row: ProcessoArquivoRecord) => <StatusBadge tone={row.statusTone}>{row.statusLabel}</StatusBadge>,
        filter: {
          kind: 'select',
          id: 'status',
          key: 'status',
          label: t('maintenance.spreadsheetImport.fields.status', 'Status'),
          options: [
            { value: 'rascunho', label: t('maintenance.spreadsheetImport.status.rascunho', 'Rascunho') },
            { value: 'criado', label: t('maintenance.spreadsheetImport.status.criado', 'Criado') },
            { value: 'iniciado', label: t('maintenance.spreadsheetImport.status.iniciado', 'Iniciado') },
            { value: 'cancelado', label: t('maintenance.spreadsheetImport.status.cancelado', 'Cancelado') },
            { value: 'sucesso', label: t('maintenance.spreadsheetImport.status.sucesso', 'Sucesso') },
            { value: 'erro', label: t('maintenance.spreadsheetImport.status.erro', 'Erro') },
          ],
        },
      },
    ]) satisfies AppDataTableColumn<ProcessoArquivoRecord, ImportarPlanilhaFilters>[],
    [t],
  )

  const extraFilters = useMemo(
    () => ([
      {
        kind: 'date-range',
        id: 'createdAt',
        fromKey: 'data_inicio',
        toKey: 'data_fim',
        label: t('maintenance.spreadsheetImport.fields.sentAt', 'Data do envio'),
        widthClassName: 'md:col-span-2 xl:col-span-4',
      },
    ]) satisfies AppDataTableFilterConfig<ImportarPlanilhaFilters>[],
    [t],
  )

  const logColumns = useMemo(
    () => ([
      {
        id: 'id',
        label: t('maintenance.spreadsheetImport.detail.logId', 'ID'),
        cell: (row: ProcessoArquivoLogRecord) => row.id,
      },
      {
        id: 'tipo',
        label: t('maintenance.spreadsheetImport.detail.logType', 'Tipo'),
        cell: (row: ProcessoArquivoLogRecord) => <StatusBadge tone={row.tipoTone}>{row.tipoLabel}</StatusBadge>,
      },
      {
        id: 'createdAt',
        label: t('maintenance.spreadsheetImport.detail.logDate', 'Data'),
        cell: (row: ProcessoArquivoLogRecord) => row.createdAt,
      },
      {
        id: 'mensagem',
        label: t('maintenance.spreadsheetImport.detail.logMessage', 'Descrição'),
        cell: (row: ProcessoArquivoLogRecord) => row.mensagem,
      },
    ]) satisfies AppDataTableColumn<ProcessoArquivoLogRecord>[],
    [t],
  )

  function patchDraft<K extends keyof ImportarPlanilhaFilters>(key: K, value: ImportarPlanilhaFilters[K]) {
    setFiltersDraft((current) => ({ ...current, [key]: value, page: 1 }))
  }

  async function handleCancel(id: string) {
    try {
      await importarPlanilhaClient.cancelar(id)
      setToast({ tone: 'success', message: t('maintenance.spreadsheetImport.feedback.cancelSuccess', 'Processo cancelado com sucesso.') })
      await listState.reload()
      tableState.clearSelection()
    } catch (error) {
      setToast({
        tone: 'error',
        message: error instanceof Error
          ? error.message
          : t('maintenance.spreadsheetImport.feedback.cancelError', 'Não foi possível cancelar o processo.'),
      })
    }
  }

  async function handleCancelSelected() {
    const ids = tableState.selectedIds
    if (!ids.length) {
      setToast({ tone: 'error', message: t('maintenance.spreadsheetImport.feedback.selectToCancel', 'Selecione ao menos um processo para cancelar.') })
      return
    }

    for (const id of ids) {
      await handleCancel(id)
    }
  }

  async function handleStart(id: string) {
    try {
      await importarPlanilhaClient.iniciar(id)
      setToast({ tone: 'success', message: t('maintenance.spreadsheetImport.feedback.startSuccess', 'Processo iniciado com sucesso.') })
      await listState.reload()
    } catch (error) {
      setToast({
        tone: 'error',
        message: error instanceof Error
          ? error.message
          : t('maintenance.spreadsheetImport.feedback.startError', 'Não foi possível iniciar o processo.'),
      })
    }
  }

  async function handleReprocess(id: string) {
    try {
      await importarPlanilhaClient.reprocessar(id)
      setToast({ tone: 'success', message: t('maintenance.spreadsheetImport.feedback.reprocessSuccess', 'Processo enviado para reprocessamento.') })
      await listState.reload()
    } catch (error) {
      setToast({
        tone: 'error',
        message: error instanceof Error
          ? error.message
          : t('maintenance.spreadsheetImport.feedback.reprocessError', 'Não foi possível reprocessar o processo.'),
      })
    }
  }

  async function handleUpload() {
    if (!uploadFile) {
      setToast({ tone: 'error', message: t('maintenance.spreadsheetImport.feedback.fileRequired', 'Selecione um arquivo XLS ou XLSX para continuar.') })
      return
    }

    setUploading(true)
    setUploadProgress(0)
    try {
      const response = await importarPlanilhaClient.uploadSpreadsheet(uploadFile, (progress) => setUploadProgress(progress))
      setToast({ tone: 'success', message: response.message || t('maintenance.spreadsheetImport.feedback.uploadSuccess', 'Arquivo enviado com sucesso.') })
      setUploadOpen(false)
      setUploadFile(null)
      setUploadProgress(0)
      await listState.reload()
    } catch (error) {
      setToast({
        tone: 'error',
        message: error instanceof Error
          ? error.message
          : t('maintenance.spreadsheetImport.feedback.uploadError', 'Não foi possível enviar o arquivo da planilha.'),
      })
    } finally {
      setUploading(false)
    }
  }

  if (!access.canList) {
    return <AccessDeniedState title={t('maintenance.spreadsheetImport.title', 'Importar Planilha')} backHref="/dashboard" />
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={[
          { label: t('routes.dashboard', 'Início'), href: '/dashboard' },
          { label: t('routes.manutencao', 'Manutenção'), href: '/sequenciais' },
          { label: t('routes.importarPlanilha', 'Importar Planilha'), href: '/importar-planilha' },
        ]}
        actions={<DataTableSectionAction label={t('common.refresh', 'Atualizar')} icon={RefreshCcw} onClick={listState.reload} />}
      />

      <AsyncState isLoading={listState.isLoading} error={listState.error}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className={metricCardClasses}>
            <div className={metricLabelClasses}>{t('maintenance.spreadsheetImport.title', 'Importar Planilha')}</div>
            <div className="mt-2 text-2xl font-black tracking-tight text-[color:var(--app-text)]">{statusSummary.total}</div>
          </div>
          <div className={metricCardClasses}>
            <div className={metricLabelClasses}>{t('maintenance.spreadsheetImport.status.rascunho', 'Rascunho')}</div>
            <div className="mt-2 text-2xl font-black tracking-tight text-[color:var(--app-text)]">{statusSummary.draft}</div>
          </div>
          <div className={metricCardClasses}>
            <div className={metricLabelClasses}>{t('maintenance.spreadsheetImport.status.iniciado', 'Iniciado')}</div>
            <div className="mt-2 text-2xl font-black tracking-tight text-[color:var(--app-text)]">{statusSummary.running}</div>
          </div>
          <div className="app-metric-card-success rounded-[1rem] px-4 py-3">
            <div className="app-metric-card-success-label text-[11px] font-semibold uppercase tracking-[0.16em]">{t('maintenance.spreadsheetImport.status.sucesso', 'Sucesso')}</div>
            <div className="app-metric-card-success-value mt-2 text-2xl font-black tracking-tight">{statusSummary.success}</div>
          </div>
          <div className="app-metric-card-danger rounded-[1rem] px-4 py-3">
            <div className="app-metric-card-danger-label text-[11px] font-semibold uppercase tracking-[0.16em]">{t('maintenance.spreadsheetImport.status.erro', 'Erro')}</div>
            <div className="app-metric-card-danger-value mt-2 text-2xl font-black tracking-tight">{statusSummary.error}</div>
          </div>
        </div>

        <SectionCard
          action={(
            <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <DataTableFilterToggleAction
                expanded={filtersExpanded}
                onClick={() => setFiltersExpanded((current) => !current)}
                collapsedLabel={t('filters.button', 'Filtros')}
                expandedLabel={t('filters.hide', 'Ocultar filtros')}
              />
              <DataTablePageActions
                actions={[
                  {
                    label: t('maintenance.spreadsheetImport.actions.cancelSelected', 'Cancelar selecionados'),
                    icon: XCircle,
                    onClick: () => void handleCancelSelected(),
                    tone: 'danger',
                    disabled: tableState.selectedIds.length === 0,
                  },
                  {
                    label: t('maintenance.spreadsheetImport.actions.newSpreadsheet', 'Novo (XLS ou XLSX)'),
                    icon: Upload,
                    onClick: () => setUploadOpen(true),
                    tone: 'primary',
                  },
                ]}
              />
            </div>
          )}
        >
          <DataTableFiltersCard
            variant="embedded"
            columns={columns as AppDataTableColumn<unknown, ImportarPlanilhaFilters>[]}
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
            emptyMessage={t('maintenance.spreadsheetImport.empty', 'Nenhum processo encontrado com os filtros atuais.')}
            columns={columns}
            selectable
            isRowSelectable={(row) => row.canCancel}
            selectedIds={tableState.selectedIds}
            allSelected={tableState.allSelected}
            onToggleSelect={tableState.toggleSelection}
            onToggleSelectAll={tableState.toggleSelectAll}
            sort={{
              activeColumn: filters.orderBy,
              direction: filters.sort,
              onToggle: (column) => tableState.toggleSort(column as ImportarPlanilhaFilters['orderBy']),
            }}
            mobileCard={{
              title: (row) => `#${row.id}`,
              subtitle: (row) => row.usuarioNome,
              meta: (row) => row.createdAt,
              badges: (row) => <StatusBadge tone={row.statusTone}>{row.statusLabel}</StatusBadge>,
            }}
            rowActions={(row) => [
              {
                id: 'detalhes',
                label: t('maintenance.spreadsheetImport.actions.details', 'Detalhes'),
                icon: Eye,
                onClick: () => setDetailTarget(row),
              },
              {
                id: 'iniciar',
                label: t('maintenance.spreadsheetImport.actions.start', 'Iniciar processo'),
                icon: Play,
                visible: row.canStart,
                onClick: () => void handleStart(row.id),
              },
              {
                id: 'cancelar',
                label: t('maintenance.spreadsheetImport.actions.cancel', 'Cancelar processo'),
                icon: XCircle,
                tone: 'danger',
                visible: row.canCancel,
                onClick: () => setCancelTarget(row),
              },
              {
                id: 'reprocessar',
                label: t('maintenance.spreadsheetImport.actions.reprocess', 'Reprocessar'),
                icon: RotateCw,
                visible: row.canReprocess,
                onClick: () => void handleReprocess(row.id),
              },
            ]}
            actionsColumnClassName="w-[200px]"
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

      <OverlayModal
        open={uploadOpen}
        title={t('maintenance.spreadsheetImport.modalUploadTitle', 'Enviar novo arquivo')}
        maxWidthClassName="max-w-2xl"
        onClose={() => {
          if (!uploading) {
            setUploadOpen(false)
            setUploadFile(null)
            setUploadProgress(0)
          }
        }}
      >
        <div className="space-y-5">
          <label
            className={[
              'group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[1.25rem] border border-dashed px-6 py-8 text-center transition',
              uploading
                ? 'app-control-muted cursor-not-allowed opacity-80'
                : 'app-control-muted hover:border-[color:var(--app-control-border-strong)]',
            ].join(' ')}
          >
            <input
              type="file"
              accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
              disabled={uploading}
              className="sr-only"
            />
            <span className="app-control inline-flex h-14 w-14 items-center justify-center rounded-full text-[color:var(--app-text)]">
              <FileSpreadsheet className="h-6 w-6" />
            </span>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[color:var(--app-text)]">
                {uploadFile ? uploadFile.name : t('maintenance.spreadsheetImport.noFileSelected', 'Nenhum arquivo selecionado.')}
              </p>
              <p className="text-sm text-[color:var(--app-muted)]">{t('common.selectFile', 'Selecionar arquivo')}</p>
            </div>
          </label>

          {uploading ? (
            <div className="app-control-muted space-y-2 rounded-[1rem] px-4 py-3">
              <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--app-muted)]">
                <span>{t('maintenance.spreadsheetImport.uploadProgress', 'Progresso do envio')}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[color:var(--app-control-border)]">
                <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          ) : null}

          <div className="app-control-muted rounded-[1.1rem] px-4 py-4">
            <div className="space-y-1 text-sm text-[color:var(--app-muted)]">
              <p>{t('maintenance.spreadsheetImport.hints.one', 'Use somente arquivos .xls ou .xlsx no modelo esperado.')}</p>
              <p>{t('maintenance.spreadsheetImport.hints.two', 'O processamento está restrito a arquivos de até 500 MB.')}</p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void handleUpload()}
              disabled={uploading}
              className="app-button-primary inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading
                ? t('maintenance.spreadsheetImport.actions.uploading', 'Enviando...')
                : t('maintenance.spreadsheetImport.actions.upload', 'Enviar arquivo')}
            </button>
          </div>
        </div>
      </OverlayModal>

      <OverlayModal
        open={Boolean(detailTarget)}
        title={t('maintenance.spreadsheetImport.detail.title', 'Detalhes do processo')}
        maxWidthClassName="max-w-5xl"
        onClose={() => setDetailTarget(null)}
      >
        <AsyncState isLoading={detailState.isLoading} error={detailState.error}>
          {detailState.data ? (
            <div className="space-y-5">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className={detailCardClasses}>
                  <div className={labelClasses}>{t('maintenance.spreadsheetImport.fields.id', 'ID')}</div>
                  <div className={valueClasses}>{detailState.data.id}</div>
                </div>
                <div className={detailCardClasses}>
                  <div className={labelClasses}>{t('maintenance.spreadsheetImport.fields.user', 'Usuário')}</div>
                  <div className={valueClasses}>{detailState.data.usuarioNome}</div>
                </div>
                <div className={detailCardClasses}>
                  <div className={labelClasses}>{t('maintenance.spreadsheetImport.fields.status', 'Status')}</div>
                  <div className="mt-2"><StatusBadge tone={detailState.data.statusTone}>{detailState.data.statusLabel}</StatusBadge></div>
                </div>
                <div className={detailCardClasses}>
                  <div className={labelClasses}>{t('maintenance.spreadsheetImport.detail.processedAt', 'Data do processamento')}</div>
                  <div className={valueClasses}>{detailState.data.dataProcessado || '-'}</div>
                </div>
              </div>

              <div className={detailCardClasses}>
                <div className={labelClasses}>{t('maintenance.spreadsheetImport.detail.file', 'Arquivo')}</div>
                <div className={valueClasses}>{detailState.data.arquivo || '-'}</div>
              </div>

              <div className={detailPanelClasses}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--app-muted)]">{t('maintenance.spreadsheetImport.detail.logs', 'Logs')}</h3>
                  <span className="app-control rounded-full px-3 py-1 text-xs font-semibold text-[color:var(--app-muted)]">
                    {detailState.data.logs.length}
                  </span>
                </div>
                <div className="overflow-hidden rounded-[1rem]">
                  <AppDataTable
                    rows={detailState.data.logs}
                    getRowId={(row) => row.id}
                    emptyMessage={t('maintenance.spreadsheetImport.detail.emptyLogs', 'Nenhum log disponível para este processo.')}
                    columns={logColumns}
                    mobileCard={{
                      title: (row) => row.tipoLabel,
                      subtitle: (row) => row.mensagem,
                      meta: (row) => row.createdAt,
                    }}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </AsyncState>
      </OverlayModal>

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        title={t('maintenance.spreadsheetImport.confirm.cancelTitle', 'Confirmar cancelamento?')}
        description={t('maintenance.spreadsheetImport.confirm.cancelDescription', 'Essa ação cancela o processo selecionado e não pode ser desfeita.')}
        confirmLabel={t('maintenance.spreadsheetImport.actions.cancel', 'Cancelar processo')}
        tone="danger"
        onCancel={() => setCancelTarget(null)}
        onConfirm={() => {
          if (cancelTarget) {
            void handleCancel(cancelTarget.id)
          }
          setCancelTarget(null)
        }}
      />

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
