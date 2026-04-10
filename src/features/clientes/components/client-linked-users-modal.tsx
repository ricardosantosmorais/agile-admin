'use client'

import { Trash2 } from 'lucide-react'
import { AsyncState } from '@/src/components/ui/async-state'
import { OverlayModal } from '@/src/components/ui/overlay-modal'
import { formatDate } from '@/src/lib/formatters'
import type { ClientLinkedUser, ClientListItem } from '@/src/features/clientes/types/clientes'
import { useI18n } from '@/src/i18n/use-i18n'

type ClientLinkedUsersModalProps = {
  open: boolean
  client: ClientListItem | null
  users: ClientLinkedUser[]
  isLoading: boolean
  error?: string
  canDelete: boolean
  onClose: () => void
  onRemove: (userId: string) => void
}

export function ClientLinkedUsersModal({
  open,
  client,
  users,
  isLoading,
  error,
  canDelete,
  onClose,
  onRemove,
}: ClientLinkedUsersModalProps) {
  const { t } = useI18n()

  return (
    <OverlayModal
      open={open}
      title={client ? `${t('clientes.modals.linkedUsersTitle', 'Usuários vinculados')} - ${client.nomeRazaoSocial}` : t('clientes.modals.linkedUsersTitle', 'Usuários vinculados')}
      onClose={onClose}
    >
      <AsyncState isLoading={isLoading} error={error}>
        <div className="space-y-3">
          {users.length ? (
            users.map((user) => (
              <div
                key={user.idUsuario}
                className="app-pane-muted flex flex-col gap-3 rounded-[1.1rem] border px-4 py-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--app-text)]">{user.email || '-'}</p>
                  <p className="mt-1 text-xs text-[var(--app-muted)]">
                    {t('clientes.modals.activatedAt', 'Ativado em {{date}}', { date: user.dataAtivacao ? formatDate(user.dataAtivacao) : '-' })}
                  </p>
                </div>
                {canDelete ? (
                  <button
                    type="button"
                    onClick={() => onRemove(user.idUsuario)}
                    className="app-button-danger inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t('clientes.actions.remove', 'Remover')}
                  </button>
                ) : null}
              </div>
            ))
          ) : (
            <div className="rounded-[1rem] border border-dashed border-[var(--app-border)] px-4 py-6 text-center text-sm text-[var(--app-muted)]">
              {t('clientes.modals.linkedUsersEmpty', 'Nenhum usuário vinculado encontrado.')}
            </div>
          )}
        </div>
      </AsyncState>
    </OverlayModal>
  )
}
