'use client'

import { OverlayModal } from '@/src/components/ui/overlay-modal'
import { StatusBadge } from '@/src/components/ui/status-badge'
import type { CrudRecord } from '@/src/components/crud-base/types'
import { getNotificacaoPainelChannelLabel } from '@/src/features/notificacoes-painel/services/notificacoes-painel-mappers'
import { useI18n } from '@/src/i18n/use-i18n'
import { formatDateTime } from '@/src/lib/date-time'

function formatDate(value: unknown) {
  const text = String(value ?? '').trim()
  if (!text) return '-'
  return formatDateTime(text)
}

export function NotificacaoPainelPreviewModal({
  open,
  record,
  onClose,
}: {
  open: boolean
  record: CrudRecord | null
  onClose: () => void
}) {
  const { t } = useI18n()

  return (
    <OverlayModal open={open} onClose={onClose} title={t('panelNotifications.preview.title', 'Pré-visualizar notificação')} maxWidthClassName="max-w-3xl">
      {record ? (
        <div className="space-y-4">
          <div className="app-control-muted flex flex-wrap items-center gap-2 rounded-[1rem] px-4 py-3">
            <StatusBadge tone="neutral">{getNotificacaoPainelChannelLabel(record.canal)}</StatusBadge>
            <span className="text-sm text-[color:var(--app-muted)]">
              {formatDate(record.data_inicio)} - {formatDate(record.data_fim)}
            </span>
          </div>
          <article className="app-pane overflow-hidden rounded-[1.25rem]">
            <header className="border-b border-[color:var(--app-card-border)] px-5 py-4">
              <div className="text-sm font-semibold text-[color:var(--app-muted)]">{t('panelNotifications.title', 'Notificações')}</div>
              <h3 className="mt-2 text-xl font-black text-[color:var(--app-text)]">{String(record.titulo ?? '-')}</h3>
            </header>
            <div
              className="prose prose-slate max-w-none px-5 py-5 text-[color:var(--app-text)] dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: String(record.mensagem ?? '') || '<p>-</p>' }}
            />
          </article>
        </div>
      ) : (
        <div className="app-control-muted rounded-[1rem] px-4 py-8 text-center text-sm text-[color:var(--app-muted)]">
          {t('panelNotifications.preview.empty', 'Nenhuma notificação selecionada.')}
        </div>
      )}
    </OverlayModal>
  )
}
