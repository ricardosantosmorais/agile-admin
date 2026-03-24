'use client'

import Link from 'next/link'
import { ArrowUpRight, Bell, Sparkles } from 'lucide-react'
import { useEffect } from 'react'
import { AsyncState } from '@/src/components/ui/async-state'
import { PageHeader } from '@/src/components/ui/page-header'
import { SectionCard } from '@/src/components/ui/section-card'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
import { useAsyncData } from '@/src/hooks/use-async-data'
import { useRouteParams } from '@/src/next/route-context'
import { appData } from '@/src/services/app-data'

function getActionHref(url?: string) {
  if (!url) {
    return ''
  }

  if (/^https?:\/\//i.test(url)) {
    return url
  }

  if (url.startsWith('/')) {
    return url
  }

  return `/${url.replace(/^\/+/, '')}`
}

export function NotificationDetailPage() {
  useAuth()
  const { id } = useRouteParams<{ id?: string }>()
  const notificationState = useAsyncData(() => (id ? appData.shell.getNotificationById(id) : Promise.resolve(null)), [id])
  const notification = notificationState.data
  const actionHref = getActionHref(notification?.url)
  const isExternalAction = /^https?:\/\//i.test(actionHref)

  useEffect(() => {
    if (!notification?.id || notification.lida) {
      return
    }

    void appData.shell
      .markNotificationsAsRead([{ id: notification.id }])
      .then(() => {})
      .catch(() => {
        // noop
      })
  }, [notification?.id, notification?.lida])

  if (!notificationState.isLoading && !notificationState.error && !notification) {
    return (
      <SectionCard title="Notificacao nao encontrada">
        <p className="text-sm text-slate-600">Nao encontramos a notificacao solicitada para o tenant atual.</p>
      </SectionCard>
    )
  }

  return (
    <div className="space-y-5">
      <AsyncState isLoading={notificationState.isLoading} error={notificationState.error}>
        {notification ? (
          <>
            <PageHeader
              title={notification.titulo}
            />

            <SectionCard title="Notificacoes">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accentSoft text-accent">
                  {notification.novidades ? <Sparkles className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                </div>

                <div className="min-w-0 flex-1 space-y-6">
                  <div>
                    <h1 className="text-2xl font-extrabold text-slate-950">{notification.titulo}</h1>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{notification.data || '-'}</p>
                  </div>

                  <div className="bg-white text-sm leading-7 text-slate-700">
                    <div
                      className="notification-html max-w-none"
                      dangerouslySetInnerHTML={{ __html: notification.html || `<p>${notification.descricao}</p>` }}
                    />
                  </div>

                  {actionHref ? (
                    isExternalAction ? (
                      <a
                        href={actionHref}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex w-fit items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
                      >
                        Abrir acao relacionada
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    ) : (
                      <Link
                        href={actionHref}
                        className="inline-flex w-fit items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
                      >
                        Abrir acao relacionada
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    )
                  ) : null}
                </div>
              </div>
            </SectionCard>
          </>
        ) : null}
      </AsyncState>
    </div>
  )
}
