'use client'

import { Trash2 } from 'lucide-react'
import { AsyncState } from '@/src/components/ui/async-state'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { OverlayModal } from '@/src/components/ui/overlay-modal'
import { useState } from 'react'
import type { UsuarioLinkedClient, UsuarioListItem } from '@/src/features/usuarios/types/usuarios'
import { useI18n } from '@/src/i18n/use-i18n'

type UsuarioLinkedClientsModalProps = {
  open: boolean
  user: UsuarioListItem | null
  clients: UsuarioLinkedClient[]
  isLoading: boolean
  error?: string
  canDelete: boolean
  onClose: () => void
  onRemove: (clientId: string) => void
}

export function UsuarioLinkedClientsModal({
  open,
  user,
  clients,
  isLoading,
  error,
  canDelete,
  onClose,
  onRemove,
}: UsuarioLinkedClientsModalProps) {
  const { t } = useI18n()
  const [pendingRemovalId, setPendingRemovalId] = useState<string | null>(null)

  return (
    <>
      <OverlayModal
        open={open}
        title={user ? `${t('usuarios.modals.linkedClientsTitle', 'Clientes vinculados')} - ${user.email}` : t('usuarios.modals.linkedClientsTitle', 'Clientes vinculados')}
        onClose={onClose}
      >
        <AsyncState isLoading={isLoading} error={error}>
          <div className="space-y-3">
            {clients.length ? clients.map((client) => (
              <div
                key={client.idCliente}
                className="flex flex-col gap-3 rounded-[1.1rem] border border-[#ece5d9] bg-[#fcfaf5] px-4 py-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-950">{client.nomeFantasia || '-'}</p>
                  <p className="text-xs text-slate-500">{t('usuarios.modals.clientCode', 'Código')}: {client.codigo || '-'}</p>
                  <p className="text-xs text-slate-500">{t('usuarios.modals.clientActivation', 'Ativação')}: {client.codigoAtivacao || '-'}</p>
                  <p className="text-xs text-slate-500">{t('usuarios.modals.document', 'CPF/CNPJ')}: {client.cnpjCpf || '-'}</p>
                  <p className="text-xs text-slate-500">{t('usuarios.modals.companyName', 'Razão social')}: {client.razaoSocial || '-'}</p>
                  <p className="text-xs text-slate-500">{t('usuarios.modals.activatedAt', 'Data de ativação')}: {client.dataAtivacao || '-'}</p>
                </div>
                {canDelete ? (
                  <button
                    type="button"
                    onClick={() => setPendingRemovalId(client.idCliente)}
                    className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t('common.remove', 'Remover')}
                  </button>
                ) : null}
              </div>
            )) : (
              <div className="rounded-[1rem] border border-dashed border-[#e6dfd3] px-4 py-6 text-center text-sm text-slate-500">
                {t('usuarios.modals.linkedClientsEmpty', 'Não existem clientes associados ao usuário.')}
              </div>
            )}
          </div>
        </AsyncState>
      </OverlayModal>

      <ConfirmDialog
        open={Boolean(pendingRemovalId)}
        title={t('usuarios.modals.confirmRemoveClientTitle', 'Remover cliente vinculado?')}
        description={t('usuarios.modals.confirmRemoveClientText', 'O vínculo do cliente com este usuário será removido.')}
        confirmLabel={t('common.remove', 'Remover')}
        cancelLabel={t('common.cancel', 'Cancelar')}
        onClose={() => setPendingRemovalId(null)}
        onConfirm={() => {
          if (!pendingRemovalId) {
            return
          }

          onRemove(pendingRemovalId)
          setPendingRemovalId(null)
        }}
      />
    </>
  )
}
