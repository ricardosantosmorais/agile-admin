import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/src/components/ui/page-header'
import { SectionCard } from '@/src/components/ui/section-card'

type AccessDeniedStateProps = {
  title: string
  backHref?: string
}

export function AccessDeniedState({
  title,
  backHref = '/dashboard',
}: AccessDeniedStateProps) {
  return (
    <div className="space-y-5">
      <PageHeader
        title={title}
        actions={(
          <Link href={backHref} className="rounded-full border border-line bg-white px-4 py-3 text-sm font-semibold text-slate-700">
            Voltar
          </Link>
        )}
      />

      <SectionCard title="Acesso negado" description="O seu perfil atual n?o possui permiss?o para abrir este recurso.">
        <div className="flex items-start gap-4 rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-4 text-rose-700">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-semibold">Voc? n?o tem acesso ao recurso solicitado.</p>
            <p className="text-sm leading-6">
              Se precisar usar esta funcionalidade, solicite a libera??o do acesso para o seu perfil.
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
