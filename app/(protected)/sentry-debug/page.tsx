'use client'

import * as Sentry from '@sentry/nextjs'
import { useState } from 'react'
import { useAuth } from '@/src/contexts/auth-context'
import { applySentrySessionContext } from '@/src/lib/sentry'

type TriggerState = {
  kind: 'idle' | 'success' | 'error'
  message: string
}

const idleState: TriggerState = {
  kind: 'idle',
  message: '',
}

export default function SentryDebugPage() {
  const { isAuthenticated, isLoading, session, user } = useAuth()
  const [clientState, setClientState] = useState<TriggerState>(idleState)
  const [serverState, setServerState] = useState<TriggerState>(idleState)
  const disabled = process.env.NODE_ENV === 'production'

  async function triggerClientError() {
    try {
      applySentrySessionContext(session)
      const marker = new Date().toISOString()

      const eventId = Sentry.captureException(new Error(`Sentry client test trigger ${marker}`), {
        tags: {
          source: 'manual-test',
          trigger: 'client-page',
          trigger_scope: 'client',
        },
        level: 'error',
        extra: {
          marker,
        },
      })

      await Sentry.flush(2000)

      setClientState({
        kind: 'success',
        message: eventId ? `Evento client enviado: ${eventId} (${marker})` : `Evento client disparado (${marker}).`,
      })
    } catch (error) {
      setClientState({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Falha ao disparar erro client.',
      })
    }
  }

  async function triggerServerError() {
    try {
      const response = await fetch('/api/dev/sentry-test', {
        method: 'GET',
        cache: 'no-store',
      })

      const payload = (await response.json()) as { eventId?: string; message?: string }

      if (!response.ok) {
        throw new Error(payload.message || 'Falha ao disparar erro server.')
      }

      setServerState({
        kind: 'success',
        message: payload.eventId ? `Evento server enviado: ${payload.eventId}` : payload.message || 'Evento server disparado.',
      })
    } catch (error) {
      setServerState({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Falha ao disparar erro server.',
      })
    }
  }

  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Sentry Debug</h1>
        <p className="text-sm text-slate-600">
          Use esta tela para validar manualmente a integração com o Sentry no client e no server.
        </p>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">Sessão atual</h2>
        <div className="mt-3 space-y-1 text-sm text-slate-600">
          <p>Status: {isLoading ? 'Carregando sessão...' : isAuthenticated ? 'Autenticado' : 'Não autenticado'}</p>
          <p>Usuário: {user?.nome || '-'}</p>
          <p>E-mail: {user?.email || '-'}</p>
          <p>Tenant: {session?.currentTenant?.nome || '-'}</p>
        </div>
      </section>

      {disabled ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Esta rota fica disponível apenas fora de produção.
        </div>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-medium text-slate-900">Erro client-side</h2>
            <p className="text-sm text-slate-600">Envia um evento diretamente do navegador.</p>
          </div>
          <button
            type="button"
            onClick={() => void triggerClientError()}
            disabled={disabled || isLoading}
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Disparar erro client
          </button>
        </div>
        {clientState.message ? (
          <p
            className={`mt-4 text-sm ${clientState.kind === 'error' ? 'text-rose-600' : 'text-emerald-700'}`}
          >
            {clientState.message}
          </p>
        ) : null}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-medium text-slate-900">Erro server-side</h2>
            <p className="text-sm text-slate-600">Chama uma rota de teste que captura a exceção no servidor.</p>
          </div>
          <button
            type="button"
            onClick={() => void triggerServerError()}
            disabled={disabled || isLoading}
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Disparar erro server
          </button>
        </div>
        {serverState.message ? (
          <p
            className={`mt-4 text-sm ${serverState.kind === 'error' ? 'text-rose-600' : 'text-emerald-700'}`}
          >
            {serverState.message}
          </p>
        ) : null}
      </section>
    </main>
  )
}
