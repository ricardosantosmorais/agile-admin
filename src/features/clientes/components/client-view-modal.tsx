'use client'

import type { ReactNode } from 'react'
import { OverlayModal } from '@/src/components/ui/overlay-modal'
import { StatusBadge } from '@/src/components/ui/status-badge'
import type { ClientListItem } from '@/src/features/clientes/types/clientes'
import { useI18n } from '@/src/i18n/use-i18n'
import { formatDate, formatNumber } from '@/src/lib/formatters'

type ClientViewModalProps = {
  open: boolean
  client: ClientListItem | null
  onClose: () => void
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div className="grid gap-1 border-b border-[var(--app-border)] py-2 last:border-b-0 md:grid-cols-[180px_minmax(0,1fr)]">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-muted)]">{label}</span>
      <div className="min-w-0 text-sm text-[var(--app-text)]">{value}</div>
    </div>
  )
}

export function ClientViewModal({ open, client, onClose }: ClientViewModalProps) {
  const { t } = useI18n()

  return (
    <OverlayModal
      open={open}
      title={client ? `${t('clientes.actions.view', 'Visualizar')} - ${client.nomeRazaoSocial}` : t('clientes.actions.view', 'Visualizar')}
      onClose={onClose}
      maxWidthClassName="max-w-4xl"
    >
      {client ? (
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="app-pane-muted rounded-[1.2rem] border p-4">
              <h3 className="mb-3 text-sm font-bold text-[var(--app-text)]">{t('clientes.modals.viewSummaryTitle', 'Resumo do cliente')}</h3>
              <div className="space-y-2">
                <DetailRow label={t('clientes.columns.codigo', 'Código')} value={client.codigo || '-'} />
                <DetailRow label={t('clientes.columns.cnpjCpf', 'CPF/CNPJ')} value={client.cnpjCpf || '-'} />
                <DetailRow label={t('clientes.columns.nomeRazaoSocial', 'Nome / Razão social')} value={client.nomeRazaoSocial || '-'} />
                <DetailRow
                  label={t('clientes.columns.inscricaoEstadual', 'Inscrição estadual')}
                  value={client.inscricaoEstadual || t('clientes.details.noStateRegistration', 'Sem inscrição estadual')}
                />
                <DetailRow
                  label={t('clientes.columns.dataAtivacao', 'Data de ativação')}
                  value={client.dataAtivacao ? formatDate(client.dataAtivacao) : '-'}
                />
              </div>
            </div>

            <div className="app-pane-muted rounded-[1.2rem] border p-4">
              <h3 className="mb-3 text-sm font-bold text-[var(--app-text)]">{t('clientes.modals.viewStatusTitle', 'Situação e atividade')}</h3>
              <div className="space-y-2">
                <DetailRow
                  label={t('clientes.columns.ultimoPedido', 'Último pedido')}
                  value={client.ultimoPedido ? formatDate(client.ultimoPedido) : '-'}
                />
                <DetailRow
                  label={t('clientes.columns.qtdPedidos', 'Qtd. pedidos')}
                  value={formatNumber(client.qtdPedidos)}
                />
                <DetailRow
                  label={t('clientes.columns.ativo', 'Ativo')}
                  value={
                    <StatusBadge tone={client.ativo ? 'success' : 'warning'}>
                      {client.ativo ? t('clientes.status.active', 'Ativo') : t('clientes.status.inactive', 'Inativo')}
                    </StatusBadge>
                  }
                />
                <DetailRow
                  label={t('clientes.columns.bloqueado', 'Bloqueado')}
                  value={
                    <StatusBadge tone={client.bloqueado ? 'danger' : 'success'}>
                      {client.bloqueado ? t('clientes.status.yes', 'Sim') : t('clientes.status.no', 'Não')}
                    </StatusBadge>
                  }
                />
                <DetailRow
                  label={t('clientes.columns.plataforma', 'Plataforma')}
                  value={
                    <StatusBadge tone={client.bloqueadoPlataforma ? 'danger' : 'success'}>
                      {client.bloqueadoPlataforma
                        ? t('clientes.status.platformBlocked', 'Plataforma bloqueada')
                        : t('clientes.status.platformReleased', 'Plataforma liberada')}
                    </StatusBadge>
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold"
            >
              {t('common.close', 'Fechar')}
            </button>
          </div>
        </div>
      ) : null}
    </OverlayModal>
  )
}
