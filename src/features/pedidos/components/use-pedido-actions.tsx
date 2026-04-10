'use client'

import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { OverlayModal } from '@/src/components/ui/overlay-modal'
import { PageToast } from '@/src/components/ui/page-toast'
import { pedidosClient } from '@/src/features/pedidos/services/pedidos-client'
import { useI18n } from '@/src/i18n/use-i18n'

type PedidoActionTarget = {
  id: string
}

type ToastState = {
  message: string | null
  tone: 'success' | 'error'
}

export function usePedidoActions(onSuccess: () => void | Promise<void>) {
  const { t } = useI18n()
  const [approveTarget, setApproveTarget] = useState<PedidoActionTarget | null>(null)
  const [cancelTarget, setCancelTarget] = useState<PedidoActionTarget | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelReasonError, setCancelReasonError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<ToastState>({ message: null, tone: 'success' })

  function closeApprove() {
    if (isSubmitting) return
    setApproveTarget(null)
  }

  function closeCancel() {
    if (isSubmitting) return
    setCancelTarget(null)
    setCancelReason('')
    setCancelReasonError(null)
  }

  async function handleApprove() {
    if (!approveTarget) return

    setIsSubmitting(true)
    try {
      await pedidosClient.approve(approveTarget.id)
      setApproveTarget(null)
      await Promise.resolve(onSuccess())
      setToast({
        message: t('orders.feedback.approveSuccess', 'Pagamento aprovado com sucesso.'),
        tone: 'success',
      })
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : t('orders.feedback.approveError', 'Não foi possível aprovar o pagamento.'),
        tone: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCancel() {
    if (!cancelTarget) return

    const descricao = cancelReason.trim()
    if (!descricao) {
      setCancelReasonError(t('orders.feedback.cancelReasonRequired', 'Informe o motivo do cancelamento.'))
      return
    }

    setIsSubmitting(true)
    try {
      await pedidosClient.cancel(cancelTarget.id, descricao)
      setCancelTarget(null)
      setCancelReason('')
      setCancelReasonError(null)
      await Promise.resolve(onSuccess())
      setToast({
        message: t('orders.feedback.cancelSuccess', 'Pedido cancelado com sucesso.'),
        tone: 'success',
      })
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : t('orders.feedback.cancelError', 'Não foi possível cancelar o pedido.'),
        tone: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    openApprove: (id: string) => setApproveTarget({ id }),
    openCancel: (id: string) => {
      setCancelTarget({ id })
      setCancelReason('')
      setCancelReasonError(null)
    },
    dialogs: (
      <>
        <ConfirmDialog
          open={Boolean(approveTarget)}
          title={t('orders.actions.approveConfirmTitle', 'Confirmar aprovação do pagamento?')}
          description={t('orders.actions.approveConfirmDescription', 'Essa ação aprova o pagamento manualmente e atualiza o status do pedido.')}
          confirmLabel={t('orders.actions.approve', 'Aprovar pagamento')}
          cancelLabel={t('common.cancel', 'Cancelar')}
          tone="default"
          isLoading={isSubmitting}
          onClose={closeApprove}
          onConfirm={() => void handleApprove()}
        />

        <OverlayModal
          open={Boolean(cancelTarget)}
          title={t('orders.actions.cancel', 'Cancelar pedido')}
          onClose={closeCancel}
          maxWidthClassName="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="pedido-cancel-reason" className="text-sm font-semibold text-slate-700">
                {t('orders.fields.cancelReason', 'Motivo do cancelamento')}
              </label>
              <textarea
                id="pedido-cancel-reason"
                value={cancelReason}
                onChange={(event) => {
                  setCancelReason(event.target.value)
                  if (cancelReasonError) {
                    setCancelReasonError(null)
                  }
                }}
                rows={5}
                className={[
                  'app-control w-full rounded-[1.1rem] px-4 py-3 text-sm text-slate-900 outline-none transition',
                  cancelReasonError ? 'border-rose-400 focus:border-rose-500' : 'focus:border-slate-400',
                ].join(' ')}
                placeholder={t('orders.actions.cancelPlaceholder', 'Descreva o motivo do cancelamento.')}
              />
              <p className="text-sm text-slate-500">
                {t('orders.actions.cancelDescription', 'Esse motivo será registrado no histórico operacional do pedido.')}
              </p>
              {cancelReasonError ? <p className="text-sm font-semibold text-rose-600">{cancelReasonError}</p> : null}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeCancel}
                disabled={isSubmitting}
                className="app-button-secondary rounded-full px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t('common.cancel', 'Cancelar')}
              </button>
              <button
                type="button"
                onClick={() => void handleCancel()}
                disabled={isSubmitting}
                className="app-button-danger inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? t('common.loading', 'Carregando...') : t('orders.actions.cancel', 'Cancelar pedido')}
              </button>
            </div>
          </div>
        </OverlayModal>

        <PageToast
          message={toast.message}
          tone={toast.tone}
          onClose={() => setToast((current) => ({ ...current, message: null }))}
        />
      </>
    ),
  }
}
