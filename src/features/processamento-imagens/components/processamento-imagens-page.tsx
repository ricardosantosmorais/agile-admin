'use client'

import { Eye, FileArchive, Loader2, RefreshCcw, RotateCw, Upload, XCircle } from 'lucide-react'
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
import { processamentoImagensClient } from '@/src/features/processamento-imagens/services/processamento-imagens-client'
import type {
  ProcessoImagemDetail,
  ProcessoImagemLogRecord,
  ProcessoImagemRecord,
  ProcessamentoImagensFilters,
} from '@/src/features/processamento-imagens/services/processamento-imagens-types'
import { useAsyncData } from '@/src/hooks/use-async-data'
import { useI18n } from '@/src/i18n/use-i18n'

const DEFAULT_FILTERS: ProcessamentoImagensFilters = {
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

const EMPTY_ROWS: ProcessoImagemRecord[] = []

export function ProcessamentoImagensPage() {
  const { t } = useI18n()
  const access = useFeatureAccess('processamentoImagens')
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [filters, setFilters] = useState<ProcessamentoImagensFilters>(DEFAULT_FILTERS)
  const [filtersDraft, setFiltersDraft] = useState<ProcessamentoImagensFilters>(DEFAULT_FILTERS)
  const [detailTarget, setDetailTarget] = useState<ProcessoImagemRecord | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [cancelTarget, setCancelTarget] = useState<ProcessoImagemRecord | null>(null)

  const listState = useAsyncData(() => processamentoImagensClient.list(filters), [filters])
  const detailState = useAsyncData<ProcessoImagemDetail | null>(
    () => (detailTarget ? processamentoImagensClient.getById(detailTarget.id) : Promise.resolve(null)),
    [detailTarget?.id],
  )

  const rows = listState.data?.data ?? EMPTY_ROWS
  const selectableRowsCount = rows.filter((row) => row.canCancel).length
  const statusSummary = useMemo(() => ({
    total: rows.length,
    running: rows.filter((row) => row.status === 'criado' || row.status === 'iniciado').length,
    success: rows.filter((row) => row.status === 'sucesso').length,
    error: rows.filter((row) => row.status === 'erro').length,
  }), [rows])

  const tableState = useDataTableState<ProcessoImagemRecord, ProcessamentoImagensFilters, ProcessamentoImagensFilters['orderBy']>({
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
        label: t('maintenance.imageProcessing.fields.id', 'ID'),
        sortKey: 'id',
        thClassName: 'w-[120px]',
        cell: (row: ProcessoImagemRecord) => <span className="font-semibold text-slate-950">{row.id || '-'}</span>,
        filter: {
          kind: 'text',
          id: 'id',
          key: 'id',
          label: t('maintenance.imageProcessing.fields.id', 'ID'),
        },
      },
      {
        id: 'usuario',
        label: t('maintenance.imageProcessing.fields.user', 'Usuário'),
        sortKey: 'usuario',
        cell: (row: ProcessoImagemRecord) => row.usuarioNome,
        filter: {
          kind: 'text',
          id: 'usuario',
          key: 'usuario',
          label: t('maintenance.imageProcessing.fields.user', 'Usuário'),
        },
      },
      {
        id: 'createdAt',
        label: t('maintenance.imageProcessing.fields.sentAt', 'Data do envio'),
        sortKey: 'created_at',
        thClassName: 'w-[180px]',
        cell: (row: ProcessoImagemRecord) => row.createdAt,
      },
      {
        id: 'status',
        label: t('maintenance.imageProcessing.fields.status', 'Status'),
        sortKey: 'status',
        thClassName: 'w-[160px]',
        cell: (row: ProcessoImagemRecord) => <StatusBadge tone={row.statusTone}>{row.statusLabel}</StatusBadge>,
        filter: {
          kind: 'select',
          id: 'status',
          key: 'status',
          label: t('maintenance.imageProcessing.fields.status', 'Status'),
          options: [
            { value: 'criado', label: t('maintenance.imageProcessing.status.criado', 'Criado') },
            { value: 'iniciado', label: t('maintenance.imageProcessing.status.iniciado', 'Iniciado') },
            { value: 'cancelado', label: t('maintenance.imageProcessing.status.cancelado', 'Cancelado') },
            { value: 'sucesso', label: t('maintenance.imageProcessing.status.sucesso', 'Sucesso') },
            { value: 'erro', label: t('maintenance.imageProcessing.status.erro', 'Erro') },
          ],
        },
      },
    ]) satisfies AppDataTableColumn<ProcessoImagemRecord, ProcessamentoImagensFilters>[],
    [t],
  )

  const extraFilters = useMemo(
    () => ([
      {
        kind: 'date-range',
        id: 'createdAt',
        fromKey: 'data_inicio',
        toKey: 'data_fim',
        label: t('maintenance.imageProcessing.fields.sentAt', 'Data do envio'),
        widthClassName: 'md:col-span-2 xl:col-span-4',
      },
    ]) satisfies AppDataTableFilterConfig<ProcessamentoImagensFilters>[],
    [t],
  )

  const logColumns = useMemo(
    () => ([
      {
        id: 'id',
        label: t('maintenance.imageProcessing.detail.logId', 'ID'),
        cell: (row: ProcessoImagemLogRecord) => row.id,
      },
      {
        id: 'tipo',
        label: t('maintenance.imageProcessing.detail.logType', 'Tipo'),
        cell: (row: ProcessoImagemLogRecord) => <StatusBadge tone={row.tipoTone}>{row.tipoLabel}</StatusBadge>,
      },
      {
        id: 'createdAt',
        label: t('maintenance.imageProcessing.detail.logDate', 'Data'),
        cell: (row: ProcessoImagemLogRecord) => row.createdAt,
      },
      {
        id: 'mensagem',
        label: t('maintenance.imageProcessing.detail.logMessage', 'Descrição'),
        cell: (row: ProcessoImagemLogRecord) => row.mensagem,
      },
    ]) satisfies AppDataTableColumn<ProcessoImagemLogRecord>[],
    [t],
  )

  function patchDraft<K extends keyof ProcessamentoImagensFilters>(key: K, value: ProcessamentoImagensFilters[K]) {
    setFiltersDraft((current) => ({ ...current, [key]: value, page: 1 }))
  }

  async function handleCancel(id: string) {
    try {
      await processamentoImagensClient.cancelar(id)
      setToast({ tone: 'success', message: t('maintenance.imageProcessing.feedback.cancelSuccess', 'Processo cancelado com sucesso.') })
      await listState.reload()
      tableState.clearSelection()
    } catch (error) {
      setToast({
        tone: 'error',
        message: error instanceof Error
          ? error.message
          : t('maintenance.imageProcessing.feedback.cancelError', 'Não foi possível cancelar o processo.'),
      })
    }
  }

  async function handleCancelSelected() {
    const ids = tableState.selectedIds
    if (!ids.length) {
      setToast({ tone: 'error', message: t('maintenance.imageProcessing.feedback.selectToCancel', 'Selecione ao menos um processo para cancelar.') })
      return
    }

    for (const id of ids) {
      await handleCancel(id)
    }
  }

  async function handleReprocess(id: string) {
    try {
      await processamentoImagensClient.reprocessar(id)
      setToast({ tone: 'success', message: t('maintenance.imageProcessing.feedback.reprocessSuccess', 'Processo enviado para reprocessamento.') })
      await listState.reload()
    } catch (error) {
      setToast({
        tone: 'error',
        message: error instanceof Error
          ? error.message
          : t('maintenance.imageProcessing.feedback.reprocessError', 'Não foi possível reprocessar o processo.'),
      })
    }
  }

  async function handleUpload() {
    if (!uploadFile) {
      setToast({ tone: 'error', message: t('maintenance.imageProcessing.feedback.fileRequired', 'Selecione um arquivo ZIP para continuar.') })
      return
    }

    setUploading(true)
    setUploadProgress(0)
    try {
      const response = await processamentoImagensClient.uploadZip(uploadFile, (progress) => setUploadProgress(progress))
      setToast({ tone: 'success', message: response.message || t('maintenance.imageProcessing.feedback.uploadSuccess', 'Arquivo enviado com sucesso.') })
      setUploadOpen(false)
      setUploadFile(null)
      setUploadProgress(0)
      await listState.reload()
    } catch (error) {
      setToast({
        tone: 'error',
        message: error instanceof Error
          ? error.message
          : t('maintenance.imageProcessing.feedback.uploadError', 'Não foi possível enviar o arquivo ZIP.'),
      })
    } finally {
      setUploading(false)
    }
  }

  if (!access.canList) {
    return <AccessDeniedState title={t('maintenance.imageProcessing.title', 'Processamento de Imagens')} backHref="/dashboard" />
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={[
          { label: t('routes.dashboard', 'Início'), href: '/dashboard' },
          { label: t('routes.manutencao', 'Manutenção'), href: '/sequenciais' },
          { label: t('maintenance.imageProcessing.title', 'Processamento de Imagens'), href: '/processamento-de-imagens' },
        ]}
        actions={<DataTableSectionAction label={t('common.refresh', 'Atualizar')} icon={RefreshCcw} onClick={listState.reload} />}
      />

      <AsyncState isLoading={listState.isLoading} error={listState.error}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1rem] border border-[#ece4d8] bg-[#fcfaf5] px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{t('maintenance.imageProcessing.title', 'Processamento de Imagens')}</div>
            <div className="mt-2 text-2xl font-black tracking-tight text-slate-950">{statusSummary.total}</div>
          </div>
          <div className="rounded-[1rem] border border-[#ece4d8] bg-[#fcfaf5] px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{t('maintenance.imageProcessing.status.iniciado', 'Iniciado')}</div>
            <div className="mt-2 text-2xl font-black tracking-tight text-slate-950">{statusSummary.running}</div>
          </div>
          <div className="rounded-[1rem] border border-emerald-100 bg-emerald-50/60 px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">{t('maintenance.imageProcessing.status.sucesso', 'Sucesso')}</div>
            <div className="mt-2 text-2xl font-black tracking-tight text-emerald-900">{statusSummary.success}</div>
          </div>
          <div className="rounded-[1rem] border border-rose-100 bg-rose-50/70 px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-700">{t('maintenance.imageProcessing.status.erro', 'Erro')}</div>
            <div className="mt-2 text-2xl font-black tracking-tight text-rose-900">{statusSummary.error}</div>
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
                  selectableRowsCount > 0
                    ? {
                        label: t('maintenance.imageProcessing.actions.cancelSelected', 'Cancelar selecionados'),
                        icon: XCircle,
                        onClick: () => void handleCancelSelected(),
                        tone: 'danger',
                      }
                    : null,
                  {
                    label: t('maintenance.imageProcessing.actions.newZip', 'Novo (ZIP)'),
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
            columns={columns as AppDataTableColumn<unknown, ProcessamentoImagensFilters>[]}
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
            emptyMessage={t('maintenance.imageProcessing.empty', 'Nenhum processo encontrado com os filtros atuais.')}
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
              onToggle: (column) => tableState.toggleSort(column as ProcessamentoImagensFilters['orderBy']),
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
                label: t('maintenance.imageProcessing.actions.details', 'Detalhes'),
                icon: Eye,
                onClick: () => setDetailTarget(row),
              },
              {
                id: 'cancelar',
                label: t('maintenance.imageProcessing.actions.cancel', 'Cancelar processo'),
                icon: XCircle,
                tone: 'danger',
                visible: row.canCancel,
                onClick: () => setCancelTarget(row),
              },
              {
                id: 'reprocessar',
                label: t('maintenance.imageProcessing.actions.reprocess', 'Reprocessar'),
                icon: RotateCw,
                visible: row.canReprocess,
                onClick: () => void handleReprocess(row.id),
              },
            ]}
            actionsColumnClassName="w-[160px]"
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
        title={t('maintenance.imageProcessing.modalUploadTitle', 'Enviar novo arquivo')}
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
                ? 'cursor-not-allowed border-[#eadfcd] bg-[#f7f3eb] opacity-80'
                : 'border-[#d8ccb7] bg-[#fcfaf5] hover:border-[#cdbb9d] hover:bg-[#f8f3ea]',
            ].join(' ')}
          >
            <input
              type="file"
              accept=".zip,application/zip"
              onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
              disabled={uploading}
              className="sr-only"
            />
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-[#e7dece] bg-white text-slate-700">
              <FileArchive className="h-6 w-6" />
            </span>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">
                {uploadFile ? uploadFile.name : t('maintenance.imageProcessing.noFileSelected', 'Nenhum arquivo selecionado.')}
              </p>
              <p className="text-sm text-slate-500">{t('common.selectFile', 'Selecionar arquivo')}</p>
            </div>
          </label>

          {uploading ? (
            <div className="space-y-2 rounded-[1rem] border border-[#ece4d8] bg-[#fcfaf5] px-4 py-3">
              <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                <span>{t('maintenance.imageProcessing.uploadProgress', 'Progresso do envio')}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#ece5d9]">
                <div className="h-full rounded-full bg-slate-950 transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          ) : null}

          <div className="rounded-[1.1rem] border border-[#ece4d8] bg-[#fcfaf5] px-4 py-4">
            <div className="space-y-1 text-sm text-slate-600">
              <p>{t('maintenance.imageProcessing.hints.one', 'Use somente arquivos .zip com imagens na pasta raiz.')}</p>
              <p>{t('maintenance.imageProcessing.hints.two', 'Nomeie os arquivos com o ID do produto, por exemplo: 1234_1.jpg, 1234_2.jpg.')}</p>
              <p>{t('maintenance.imageProcessing.hints.three', 'Cada imagem deve ter no máximo 1 MB e o ZIP até 500 MB.')}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a href="/assets/media/files/produtos_exemplo.zip" className="text-sm font-semibold text-slate-700 underline decoration-[#ccb999] underline-offset-4" target="_blank" rel="noreferrer">
              {t('maintenance.imageProcessing.actions.downloadExample', 'Baixar arquivo de exemplo')}
            </a>
            <button
              type="button"
              onClick={() => void handleUpload()}
              disabled={uploading}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading
                ? t('maintenance.imageProcessing.actions.uploading', 'Enviando...')
                : t('maintenance.imageProcessing.actions.upload', 'Enviar arquivo')}
            </button>
          </div>
        </div>
      </OverlayModal>

      <OverlayModal
        open={Boolean(detailTarget)}
        title={t('maintenance.imageProcessing.detail.title', 'Detalhes do processo')}
        maxWidthClassName="max-w-5xl"
        onClose={() => setDetailTarget(null)}
      >
        <AsyncState isLoading={detailState.isLoading} error={detailState.error}>
          {detailState.data ? (
            <div className="space-y-5">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[1rem] border border-[#ece4d8] bg-[#fcfaf5] px-4 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{t('maintenance.imageProcessing.fields.id', 'ID')}</div>
                  <div className="mt-2 text-sm font-semibold text-slate-950">{detailState.data.id}</div>
                </div>
                <div className="rounded-[1rem] border border-[#ece4d8] bg-[#fcfaf5] px-4 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{t('maintenance.imageProcessing.fields.user', 'Usuário')}</div>
                  <div className="mt-2 text-sm font-semibold text-slate-950">{detailState.data.usuarioNome}</div>
                </div>
                <div className="rounded-[1rem] border border-[#ece4d8] bg-[#fcfaf5] px-4 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{t('maintenance.imageProcessing.fields.status', 'Status')}</div>
                  <div className="mt-2"><StatusBadge tone={detailState.data.statusTone}>{detailState.data.statusLabel}</StatusBadge></div>
                </div>
                <div className="rounded-[1rem] border border-[#ece4d8] bg-[#fcfaf5] px-4 py-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{t('maintenance.imageProcessing.detail.processedAt', 'Data do processamento')}</div>
                  <div className="mt-2 text-sm font-semibold text-slate-950">{detailState.data.dataProcessado || '-'}</div>
                </div>
              </div>

              <div className="rounded-[1rem] border border-[#ece4d8] bg-[#fcfaf5] px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{t('maintenance.imageProcessing.detail.file', 'Arquivo')}</div>
                <div className="mt-2 text-sm font-semibold text-slate-950">{detailState.data.arquivo || '-'}</div>
              </div>

              <div className="rounded-[1.25rem] border border-[#ece4d8] bg-[#fcfaf5] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-600">{t('maintenance.imageProcessing.detail.logs', 'Logs')}</h3>
                  <span className="rounded-full border border-[#e6dfd3] bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                    {detailState.data.logs.length}
                  </span>
                </div>
                <div className="overflow-hidden rounded-[1rem] bg-white">
                  <AppDataTable
                    rows={detailState.data.logs}
                    getRowId={(row) => row.id}
                    emptyMessage={t('maintenance.imageProcessing.detail.emptyLogs', 'Nenhum log disponível para este processo.')}
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
        title={t('maintenance.imageProcessing.confirm.cancelTitle', 'Confirmar cancelamento?')}
        description={t('maintenance.imageProcessing.confirm.cancelDescription', 'Essa ação cancela o processo selecionado e não pode ser desfeita.')}
        confirmLabel={t('maintenance.imageProcessing.actions.cancel', 'Cancelar processo')}
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
