'use client'

import { AsyncState } from '@/src/components/ui/async-state'
import { OverlayModal } from '@/src/components/ui/overlay-modal'
import type { ClientLinkedSellerListItem, ClientListItem } from '@/src/features/clientes/types/clientes'
import { useI18n } from '@/src/i18n/use-i18n'

type ClientLinkedSellersModalProps = {
  open: boolean
  client: ClientListItem | null
  sellers: ClientLinkedSellerListItem[]
  isLoading: boolean
  error?: string
  onClose: () => void
}

export function ClientLinkedSellersModal({
  open,
  client,
  sellers,
  isLoading,
  error,
  onClose,
}: ClientLinkedSellersModalProps) {
  const { t } = useI18n()
  return (
    <OverlayModal
      open={open}
      title={client ? `${t('clientes.modals.linkedSellersTitle', 'Vendedores vinculados')} - ${client.nomeRazaoSocial}` : t('clientes.modals.linkedSellersTitle', 'Vendedores vinculados')}
      onClose={onClose}
    >
      <AsyncState isLoading={isLoading} error={error}>
        <div className="space-y-3">
          {sellers.length ? (
            sellers.map((seller) => (
              <div
                key={seller.idVendedor}
                className="rounded-[1.1rem] border border-[#ece5d9] bg-[#fcfaf5] px-4 py-3"
              >
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold text-slate-950">{seller.nome || '-'}</p>
                  <p className="text-xs text-slate-500">{t('clientes.modals.sellerCode', 'Codigo: {{value}}', { value: seller.codigo || '-' })}</p>
                  <p className="text-xs text-slate-500">{t('clientes.modals.sellerEmail', 'E-mail: {{value}}', { value: seller.email || '-' })}</p>
                  <p className="text-xs text-slate-500">{t('clientes.modals.sellerPhone', 'Telefone: {{value}}', { value: seller.telefone || seller.celular || '-' })}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[1rem] border border-dashed border-[#e6dfd3] px-4 py-6 text-center text-sm text-slate-500">
              {t('clientes.modals.linkedSellersEmpty', 'Nenhum vendedor vinculado encontrado.')}
            </div>
          )}
        </div>
      </AsyncState>
    </OverlayModal>
  )
}
