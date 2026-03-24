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
              className="grid gap-2 rounded-[1.1rem] border border-[#ece5d9] bg-[#fcfaf5] px-4 py-3 md:grid-cols-2"
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500">
                  {t('usuarios.columns.lastAccess', 'Último acesso')}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-950">{access.ultimoAcesso || '-'}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500">IP</p>
                <p className="mt-1 text-sm font-semibold text-slate-950">{access.ipUltimoAcesso || '-'}</p>
              </div>
            </div>
          )) : (
            <div className="rounded-[1rem] border border-dashed border-[#e6dfd3] px-4 py-6 text-center text-sm text-slate-500">
              {t('usuarios.modals.accessesEmpty', 'Não existem acessos registrados para este usuário.')}
            </div>
          )}
        </div>
      </AsyncState>
    </OverlayModal>
  )
}
