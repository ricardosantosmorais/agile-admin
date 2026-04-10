'use client'

import { AsyncState } from '@/src/components/ui/async-state'
import { OverlayModal } from '@/src/components/ui/overlay-modal'
import type { UsuarioAccessItem, UsuarioListItem } from '@/src/features/usuarios/types/usuarios'
import { useI18n } from '@/src/i18n/use-i18n'

type UsuarioAccessesModalProps = {
  open: boolean
  user: UsuarioListItem | null
  accesses: UsuarioAccessItem[]
  isLoading: boolean
  error?: string
  onClose: () => void
}

export function UsuarioAccessesModal({
  open,
  user,
  accesses,
  isLoading,
  error,
  onClose,
}: UsuarioAccessesModalProps) {
  const { t } = useI18n()

  return (
    <OverlayModal
      open={open}
      title={user ? `${t('usuarios.modals.accessesTitle', 'Acessos do usuário')} - ${user.email}` : t('usuarios.modals.accessesTitle', 'Acessos do usuário')}
      onClose={onClose}
    >
      <AsyncState isLoading={isLoading} error={error}>
        <div className="space-y-3">
          {accesses.length ? accesses.map((access) => (
            <div
              key={access.id}
              className="app-pane-muted grid gap-2 rounded-[1.1rem] border px-4 py-3 md:grid-cols-2"
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--app-muted)]">
                  {t('usuarios.columns.lastAccess', 'Último acesso')}
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--app-text)]">{access.ultimoAcesso || '-'}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--app-muted)]">IP</p>
                <p className="mt-1 text-sm font-semibold text-[var(--app-text)]">{access.ipUltimoAcesso || '-'}</p>
              </div>
            </div>
          )) : (
            <div className="rounded-[1rem] border border-dashed border-[var(--app-border)] px-4 py-6 text-center text-sm text-[var(--app-muted)]">
              {t('usuarios.modals.accessesEmpty', 'Não existem acessos registrados para este usuário.')}
            </div>
          )}
        </div>
      </AsyncState>
    </OverlayModal>
  )
}
