'use client'

import { inputClasses } from '@/src/components/ui/input-styles'
import { OverlayModal } from '@/src/components/ui/overlay-modal'
import type { ClientListItem } from '@/src/features/clientes/types/clientes'
import { useI18n } from '@/src/i18n/use-i18n'

type ClientUnlockModalProps = {
  open: boolean
  client: ClientListItem | null
  platform: boolean
  description: string
  error?: string
  isLoading: boolean
  onClose: () => void
  onChangeDescription: (value: string) => void
  onConfirm: () => void
}

export function ClientUnlockModal({
  open,
  client,
  platform,
  description,
  error,
  isLoading,
  onClose,
  onChangeDescription,
  onConfirm,
}: ClientUnlockModalProps) {
  const { t } = useI18n()
  const title = client
    ? platform
      ? `${t('clientes.modals.unlockPlatformTitle', 'Desbloquear cliente na plataforma')} - ${client.nomeRazaoSocial}`
      : `${t('clientes.modals.unlockClientTitle', 'Desbloquear cliente')} - ${client.nomeRazaoSocial}`
    : t('clientes.modals.unlockClientTitle', 'Desbloquear cliente')

  return (
    <OverlayModal open={open} title={title} onClose={onClose}>
      <div className="space-y-4">
        <label className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--app-muted)]">{t('clientes.modals.justification', 'Justificativa')}</span>
          <textarea
            value={description}
            onChange={(event) => onChangeDescription(event.target.value)}
            rows={5}
            className={`${inputClasses()} resize-none`}
          />
        </label>
        {error ? (
          <div className="app-error-panel rounded-[1rem] px-4 py-3 text-sm">
            {error}
          </div>
        ) : null}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t('clientes.modals.confirm', 'Confirmar')}
          </button>
        </div>
      </div>
    </OverlayModal>
  )
}
