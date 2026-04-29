'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { OverlayModal } from '@/src/components/ui/overlay-modal'
import { PageToast } from '@/src/components/ui/page-toast'
import { inputClasses } from '@/src/components/ui/input-styles'
import { appsClient } from '@/src/features/apps/services/apps-client'

export type AppsDeployAction = {
  id: string
  platform: 'android' | 'ios'
  name: string
} | null

export type AppsBuildAction = {
  id: string
  name: string
} | null

export function AppsDeployConfirm({
  action,
  onClose,
}: {
  action: AppsDeployAction
  onClose: (refresh?: boolean) => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [feedback, setFeedback] = useState('')

  async function confirm() {
    if (!action) return
    setIsLoading(true)
    setFeedback('')
    try {
      await appsClient.deploy(action.id, action.platform)
      onClose(true)
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível enviar o app para publicação.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <PageToast message={feedback || null} onClose={() => setFeedback('')} />
      <ConfirmDialog
        open={Boolean(action)}
        title="Confirmar publicação?"
        description={`Deseja realmente publicar o app ${action?.name || ''} ${action?.platform === 'ios' ? 'no App Store' : 'no Google Play'} agora?`}
        confirmLabel="Publicar"
        cancelLabel="Cancelar"
        tone="default"
        isLoading={isLoading}
        onConfirm={() => void confirm()}
        onClose={() => onClose()}
      />
    </>
  )
}

export function AppsBuildEmailModal({
  action,
  onClose,
}: {
  action: AppsBuildAction
  onClose: (refresh?: boolean) => void
}) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [feedback, setFeedback] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!action) return
    setIsLoading(true)
    setFeedback('')
    try {
      await appsClient.buildEmail(action.id, email)
      onClose(true)
      setEmail('')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível solicitar a compilação.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <OverlayModal open={Boolean(action)} title="Compilar Android" onClose={() => onClose()} maxWidthClassName="max-w-xl">
      <PageToast message={feedback || null} onClose={() => setFeedback('')} />
      <form className="space-y-5" onSubmit={(event) => void submit(event)}>
        <p className="text-sm leading-6 text-[color:var(--app-muted)]">
          Informe o e-mail que receberá o build do app {action?.name || ''}. No legado essa ação dispara o workflow send_build_email.yml no GitHub.
        </p>
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-[color:var(--app-text)]">E-mail de destino</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClasses()}
            placeholder="nome@empresa.com.br"
          />
        </label>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => onClose()} className="app-button-secondary rounded-full px-4 py-2.5 text-sm font-semibold">Cancelar</button>
          <button type="submit" disabled={isLoading} className="app-button-primary rounded-full px-4 py-2.5 text-sm font-semibold disabled:opacity-50">
            {isLoading ? 'Solicitando...' : 'Solicitar build'}
          </button>
        </div>
      </form>
    </OverlayModal>
  )
}
