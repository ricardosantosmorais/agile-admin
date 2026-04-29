'use client'

import { useEffect, useMemo, useState } from 'react'
import { AppDataTable } from '@/src/components/data-table/app-data-table'
import type { AppDataTableColumn } from '@/src/components/data-table/types'
import { AsyncState } from '@/src/components/ui/async-state'
import { OverlayModal } from '@/src/components/ui/overlay-modal'
import type { CrudListFilters } from '@/src/components/crud-base/types'
import { notificacoesPainelClient, type NotificacaoPainelUsuarioRecord } from '@/src/features/notificacoes-painel/services/notificacoes-painel-client'
import { useI18n } from '@/src/i18n/use-i18n'
import { formatDateTime } from '@/src/lib/date-time'

const INITIAL_FILTERS: CrudListFilters = {
  page: 1,
  perPage: 15,
  orderBy: 'data',
  sort: 'desc',
}

export function NotificacaoPainelUsuariosModal({
  open,
  id,
  onClose,
}: {
  open: boolean
  id: string | null
  onClose: () => void
}) {
  const { t } = useI18n()
  const [filters, setFilters] = useState<CrudListFilters>(INITIAL_FILTERS)
  const [rows, setRows] = useState<NotificacaoPainelUsuarioRecord[]>([])
  const [meta, setMeta] = useState<Awaited<ReturnType<typeof notificacoesPainelClient.usuarios>>['meta'] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !id) return
    let alive = true
    setIsLoading(true)
    setError(null)
    notificacoesPainelClient.usuarios(id, filters)
      .then((response) => {
        if (!alive) return
        setRows(response.data)
        setMeta(response.meta)
      })
      .catch((loadError) => {
        if (!alive) return
        setError(loadError instanceof Error ? loadError.message : t('panelNotifications.users.loadError', 'Não foi possível carregar os usuários.'))
      })
      .finally(() => {
        if (alive) setIsLoading(false)
      })

    return () => {
      alive = false
    }
  }, [filters, id, open, t])

  const columns = useMemo<AppDataTableColumn<NotificacaoPainelUsuarioRecord, CrudListFilters>[]>(() => [
    {
      id: 'usuario',
      label: t('panelNotifications.users.user', 'Usuário'),
      sortKey: 'usuario',
      cell: (record) => record.usuario?.nome || '-',
    },
    {
      id: 'empresa',
      label: t('routes.empresas', 'Empresa'),
      sortKey: 'empresa',
      cell: (record) => record.empresa?.nome_fantasia || record.empresa?.nome || '-',
    },
    {
      id: 'data',
      label: t('panelNotifications.users.viewedAt', 'Data'),
      sortKey: 'data',
      cell: (record) => record.data ? formatDateTime(String(record.data)) : '-',
    },
  ], [t])

  function toggleSort(column: string) {
    setFilters((current) => ({
      ...current,
      page: 1,
      orderBy: column,
      sort: current.orderBy === column && current.sort === 'asc' ? 'desc' : 'asc',
    }))
  }

  return (
    <OverlayModal open={open} onClose={onClose} title={t('panelNotifications.users.title', 'Usuários visualizadores')} maxWidthClassName="max-w-5xl">
      <AsyncState isLoading={isLoading} error={error ?? undefined}>
        <AppDataTable<NotificacaoPainelUsuarioRecord, string, CrudListFilters>
          rows={rows}
          getRowId={(record) => record.id}
          emptyMessage={t('panelNotifications.users.empty', 'Nenhum usuário visualizador encontrado.')}
          columns={columns}
          sort={{ activeColumn: filters.orderBy, direction: filters.sort, onToggle: toggleSort }}
          selectable={false}
          mobileCard={{
            title: (record) => record.usuario?.nome || '-',
            subtitle: (record) => record.empresa?.nome_fantasia || record.empresa?.nome || '-',
            meta: (record) => record.data ? formatDateTime(String(record.data)) : '-',
          }}
          pagination={meta ? {
            from: meta.from,
            to: meta.to,
            total: meta.total,
            page: meta.page,
            pages: meta.pages,
            perPage: meta.perPage,
          } : undefined}
          onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
          pageSize={{ value: filters.perPage, options: [15, 30, 45, 60], onChange: (perPage) => setFilters((current) => ({ ...current, page: 1, perPage })) }}
        />
      </AsyncState>
    </OverlayModal>
  )
}
