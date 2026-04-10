'use client'

import { Trash2 } from 'lucide-react'
import { AsyncState } from '@/src/components/ui/async-state'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { OverlayModal } from '@/src/components/ui/overlay-modal'
import { useState } from 'react'
import type { UsuarioLinkedSeller, UsuarioListItem } from '@/src/features/usuarios/types/usuarios'
import { useI18n } from '@/src/i18n/use-i18n'

type UsuarioLinkedSellerModalProps = {
  open: boolean
  user: UsuarioListItem | null
  seller: UsuarioLinkedSeller | null
  isLoading: boolean
  error?: string
  canDelete: boolean
  onClose: () => void
  onRemove: () => void
}

export function UsuarioLinkedSellerModal({
  open,
  user,
  seller,
  isLoading,
  error,
  canDelete,
  onClose,
  onRemove,
}: UsuarioLinkedSellerModalProps) {
  const { t } = useI18n()
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <>
      <OverlayModal
        open={open}
        title={user ? `${t('usuarios.modals.linkedSellerTitle', 'Vendedor vinculado')} - ${user.email}` : t('usuarios.modals.linkedSellerTitle', 'Vendedor vinculado')}
        onClose={onClose}
      >
        <AsyncState isLoading={isLoading} error={error}>
          {seller ? (
            <div className="app-pane-muted flex flex-col gap-3 rounded-[1.1rem] border px-4 py-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[var(--app-text)]">{seller.nome || '-'}</p>
                <p className="text-xs text-[var(--app-muted)]">{t('usuarios.modals.clientCode', 'Código')}: {seller.codigo || '-'}</p>
                <p className="text-xs text-[var(--app-muted)]">{t('usuarios.modals.clientActivation', 'Ativação')}: {seller.codigoAtivacao || '-'}</p>
                <p className="text-xs text-[var(--app-muted)]">{t('usuarios.modals.document', 'CPF/CNPJ')}: {seller.cnpjCpf || '-'}</p>
              </div>
              {canDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  className="app-button-danger inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
                >
                  <Trash2 className="h-4 w-4" />
                  {t('common.remove', 'Remover')}
                </button>
              ) : null}
            </div>
          ) : (
            <div className="rounded-[1rem] border border-dashed border-[var(--app-border)] px-4 py-6 text-center text-sm text-[var(--app-muted)]">
              {t('usuarios.modals.linkedSellerEmpty', 'Não existe vendedor associado ao usuário.')}
            </div>
          )}
        </AsyncState>
      </OverlayModal>

      <ConfirmDialog
        open={confirmOpen}
        title={t('usuarios.modals.confirmRemoveSellerTitle', 'Remover vendedor vinculado?')}
        description={t('usuarios.modals.confirmRemoveSellerText', 'O vínculo do vendedor com este usuário será removido.')}
        confirmLabel={t('common.remove', 'Remover')}
        cancelLabel={t('common.cancel', 'Cancelar')}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          onRemove()
          setConfirmOpen(false)
        }}
      />
    </>
  )
}
