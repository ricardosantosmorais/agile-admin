'use client'

import { RefreshCcw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppDataTable } from '@/src/components/data-table/app-data-table'
import type { AppDataTableColumn } from '@/src/components/data-table/types'
import { OverlayModal } from '@/src/components/ui/overlay-modal'
import { PageToast } from '@/src/components/ui/page-toast'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { appsClient, type AppLogRecord } from '@/src/features/apps/services/apps-client'
import { formatDateTime } from '@/src/lib/date-time'

type AppsLogsModalProps = {
  app: { id: string; chaveCliente?: string | null } | null
  onClose: () => void
}

const LOGS_PAGE_SIZE = 15

function statusTone(status: unknown) {
  const text = String(status ?? '').toLowerCase()
  if (/(success|completed|conclu|done|published)/i.test(text)) return 'success' as const
  if (/(fail|erro|cancel|rejected)/i.test(text)) return 'danger' as const
  return 'warning' as const
}

export function AppsLogsModal({ app, onClose }: AppsLogsModalProps) {
  const columns = useMemo<AppDataTableColumn<AppLogRecord>[]>(() => [
    {
      id: 'plataforma',
      label: 'Plataforma',
      cell: (row) => <span className="font-semibold">{row.plataforma || '-'}</span>,
    },
    {
      id: 'created_at',
      label: 'Data',
      cell: (row) => <span className="text-[color:var(--app-muted)]">{row.created_at ? formatDateTime(String(row.created_at)) : '-'}</span>,
    },
    {
      id: 'status',
      label: 'Status',
      thClassName: 'w-[160px]',
      tdClassName: 'w-[160px]',
      cell: (row) => <StatusBadge tone={statusTone(row.status)}>{String(row.status || '-')}</StatusBadge>,
    },
  ], [])
  const [rows, setRows] = useState<AppLogRecord[]>([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [feedback, setFeedback] = useState('')

  const load = useCallback(async () => {
    if (!app?.id) return

    setIsLoading(true)
    setFeedback('')
    try {
      const response = await appsClient.logs(app.id, {
        page,
        perPage: LOGS_PAGE_SIZE,
        orderBy: 'created_at',
        sort: 'desc',
      })
      setRows(response.data)
      setPages(response.meta.pages || 1)
      setTotal(response.meta.total || 0)
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível carregar os logs.')
    } finally {
      setIsLoading(false)
    }
  }, [app?.id, page])

  useEffect(() => {
    if (app) void load()
  }, [app, load])

  return (
    <OverlayModal
      open={Boolean(app)}
      title={`Atualizações do App${app?.chaveCliente ? ` #${app.chaveCliente}` : ''}`}
      onClose={onClose}
      maxWidthClassName="max-w-5xl"
      headerActions={(
        <button type="button" onClick={() => void load()} className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold">
          <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      )}
    >
      <PageToast message={feedback || null} onClose={() => setFeedback('')} />
      <AppDataTable<AppLogRecord>
        rows={rows}
        getRowId={(row) => String(row.id)}
        columns={columns}
        emptyMessage={isLoading ? 'Carregando logs...' : 'Nenhuma atualização encontrada para este app.'}
        mobileCard={{
          title: (row) => row.plataforma || '-',
          subtitle: (row) => row.created_at ? formatDateTime(String(row.created_at)) : '-',
          badges: (row) => <StatusBadge tone={statusTone(row.status)}>{String(row.status || '-')}</StatusBadge>,
        }}
        pagination={{
          from: rows.length ? ((page - 1) * LOGS_PAGE_SIZE) + 1 : 0,
          to: rows.length ? ((page - 1) * LOGS_PAGE_SIZE) + rows.length : 0,
          total,
          page,
          pages,
          perPage: LOGS_PAGE_SIZE,
        }}
        onPageChange={setPage}
      />
    </OverlayModal>
  )
}
