'use client'

import { Trash2 } from 'lucide-react'
import { AsyncState } from '@/src/components/ui/async-state'
import { OverlayModal } from '@/src/components/ui/overlay-modal'
import { useI18n } from '@/src/i18n/use-i18n'
import type { VendedorLinkedUser } from '@/src/features/vendedores/types/vendedores'

type VendedorLinkedUsersModalProps = {
  open: boolean
  vendedorNome: string | null
  users: VendedorLinkedUser[]
  isLoading: boolean
  error?: string
  canDelete: boolean
  onClose: () => void
  onRemove: (userId: string) => void
}

export function VendedorLinkedUsersModal({
  open,
  vendedorNome,
  users,
  isLoading,
  error,
  canDelete,
  onClose,
  onRemove,
}: VendedorLinkedUsersModalProps) {
  const { t } = useI18n()

  return (
    <OverlayModal
      open={open}
      title={vendedorNome ? `${t('people.sellers.modals.linkedUsersTitle', 'Linked users')} - ${vendedorNome}` : t('people.sellers.modals.linkedUsersTitle', 'Linked users')}
      onClose={onClose}
    >
      <AsyncState isLoading={isLoading} error={error}>
        <div className="space-y-3">
          {users.length ? users.map((user) => (
            <div
              key={user.idUsuario}
              className="flex flex-col gap-3 rounded-[1.1rem] border border-[#ece5d9] bg-[#fcfaf5] px-4 py-3 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-slate-950">{user.email || '-'}</p>
                <p className="mt-1 text-xs text-slate-500">{user.nome || '-'}</p>
              </div>
              {canDelete ? (
                <button
                  type="button"
                  onClick={() => onRemove(user.idUsuario)}
                  className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700"
                >
                  <Trash2 className="h-4 w-4" />
                  {t('common.remove', 'Remove')}
                </button>
              ) : null}
            </div>
          )) : (
            <div className="rounded-[1rem] border border-dashed border-[#e6dfd3] px-4 py-6 text-center text-sm text-slate-500">
              {t('people.sellers.modals.linkedUsersEmpty', 'There are no users linked to this seller.')}
            </div>
          )}
        </div>
      </AsyncState>
    </OverlayModal>
  )
}
