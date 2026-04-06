'use client'

import Link from 'next/link'
import { ExternalLink, LoaderCircle, RefreshCcw, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AsyncState } from '@/src/components/ui/async-state'
import { PageHeader } from '@/src/components/ui/page-header'
import { SectionCard } from '@/src/components/ui/section-card'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
import { useI18n } from '@/src/i18n/use-i18n'
import { httpClient } from '@/src/services/http/http-client'

type EmbedState = {
  embedUrl: string
  origin: string
}

export function ConfiguracoesAssistenteVendasIaPage() {
  const { t } = useI18n()
  const { user } = useAuth()
  const access = useFeatureAccess('configuracoesAssistenteVendasIa')
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [embed, setEmbed] = useState<EmbedState | null>(null)

  const breadcrumbs = useMemo(
    () => [
      { label: t('routes.dashboard', 'Início'), href: '/dashboard' },
      { label: t('routes.configuracoes', 'Configurações'), href: '/configuracoes' },
      { label: t('configuracoes.salesAssistant.title', 'Assistente de vendas IA'), href: '/configuracoes/assistente-vendas-ia' },
    ],
    [t],
  )

  const load = useCallback(async () => {
    if (!user?.id || !user.email) {
      setError(t('configuracoes.salesAssistant.feedback.loadError', 'Não foi possível abrir o assistente de vendas IA.'))
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const result = await httpClient<EmbedState>('/api/configuracoes/assistente-vendas-ia', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
        }),
        cache: 'no-store',
      })

      setEmbed(result)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : t('configuracoes.salesAssistant.feedback.loadError', 'Não foi possível abrir o assistente de vendas IA.'),
      )
    } finally {
      setLoading(false)
    }
  }, [t, user?.email, user?.id])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    function handleMessage(event: MessageEvent<{ type?: string; height?: number }>) {
      if (!embed?.origin || !iframeRef.current) {
        return
      }

      if (event.origin !== embed.origin) {
        return
      }

      if (event.data?.type === 'resize-iframe' && typeof event.data.height === 'number') {
        iframeRef.current.style.height = `${Math.max(event.data.height, 720)}px`
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [embed?.origin])

  if (!access.canOpen) {
    return <AccessDeniedState title={t('configuracoes.salesAssistant.title', 'Assistente de vendas IA')} backHref="/dashboard" />
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={breadcrumbs}
        actions={(
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-3 text-sm font-semibold text-slate-700"
            >
              <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {t('common.refresh', 'Atualizar')}
            </button>
            <Link
              href="/configuracoes"
              className="inline-flex items-center rounded-full border border-line bg-white px-4 py-3 text-sm font-semibold text-slate-700"
            >
              {t('common.back', 'Voltar')}
            </Link>
          </div>
        )}
      />

      <AsyncState isLoading={loading} error={error ?? undefined}>
        <SectionCard
          title={t('configuracoes.salesAssistant.title', 'Assistente de vendas IA')}
          description={t(
            'configuracoes.salesAssistant.description',
            'Acesse o assistente de vendas com IA sem sair do Admin v2, preservando o contexto autenticado do usuário.',
          )}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[1rem] border border-[#ebe4d8] bg-[#fcfaf5] px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-[#eefaf4] p-3 text-emerald-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  {t('configuracoes.salesAssistant.contextValue', 'Ambiente externo autenticado')}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {t(
                    'configuracoes.salesAssistant.contextDescription',
                    'O assistente é carregado em um iframe interno da plataforma, com token temporário gerado no servidor do Admin v2.',
                  )}
                </p>
              </div>
            </div>
            {embed?.embedUrl ? (
              <a
                href={embed.embedUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-3 text-sm font-semibold text-slate-700"
              >
                <ExternalLink className="h-4 w-4" />
                {t('configuracoes.salesAssistant.openExternal', 'Abrir em nova guia')}
              </a>
            ) : null}
          </div>

          {embed?.embedUrl ? (
            <div className="overflow-hidden rounded-[1.5rem] border border-[#ebe4d8] bg-[#fcfaf5]">
              <iframe
                ref={iframeRef}
                src={embed.embedUrl}
                title={t('configuracoes.salesAssistant.iframeTitle', 'Assistente de vendas IA')}
                className="min-h-[75vh] w-full border-0 bg-white"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                allow="clipboard-write"
              />
            </div>
          ) : (
            <div className="flex min-h-[28rem] items-center justify-center rounded-[1.5rem] border border-dashed border-[#d8d0c2] bg-[#fcfaf5] px-6 py-8 text-center text-sm text-slate-500">
              <div className="space-y-3">
                <LoaderCircle className="mx-auto h-6 w-6 animate-spin text-slate-400" />
                <p>{t('configuracoes.salesAssistant.loading', 'Carregando o assistente de vendas IA...')}</p>
              </div>
            </div>
          )}
        </SectionCard>
      </AsyncState>
    </div>
  )
}
