'use client'

import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/src/components/ui/page-header'
import { SectionCard } from '@/src/components/ui/section-card'
import { useI18n } from '@/src/i18n/use-i18n'

type AccessDeniedStateProps = {
  title: string
  backHref?: string
}

export function AccessDeniedState({
  title,
  backHref = '/dashboard',
}: AccessDeniedStateProps) {
  const { t } = useI18n()

  return (
    <div className="space-y-5">
      <PageHeader
        title={title}
        actions={(
          <Link href={backHref} className="rounded-full border border-line bg-white px-4 py-3 text-sm font-semibold text-slate-700">
            {t('common.back', 'Voltar')}
          </Link>
        )}
      />

      <SectionCard title={t('accessDenied.title', 'Acesso negado')} description={t('accessDenied.description', 'O seu perfil atual não possui permissão para abrir este recurso.') }>
        <div className="flex items-start gap-4 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-4 text-rose-700">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-semibold">{t('accessDenied.message', 'Você não tem acesso ao recurso solicitado.')}</p>
            <p className="text-sm leading-6">
              {t('accessDenied.help', 'Se precisar usar esta funcionalidade, solicite a liberação do acesso para o seu perfil.')}
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
