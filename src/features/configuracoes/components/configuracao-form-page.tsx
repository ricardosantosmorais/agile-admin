'use client'

import Link from 'next/link'
import { AsyncState } from '@/src/components/ui/async-state'
import { PageHeader } from '@/src/components/ui/page-header'
import { SectionCard } from '@/src/components/ui/section-card'
import { useAsyncData } from '@/src/hooks/use-async-data'
import { useRouteParams } from '@/src/next/route-context'
import { appData } from '@/src/services/app-data'

export function ConfiguracaoFormPage() {
  const { slug } = useRouteParams<{ slug?: string }>()
  const moduleState = useAsyncData(() => (slug ? appData.config.getModule(slug) : Promise.resolve(null)), [slug])
  const module = moduleState.data

  if (!moduleState.isLoading && !moduleState.error && !module) {
    return (
      <SectionCard title="Módulo não encontrado">
        <p className="text-sm text-slate-600">Não encontramos o módulo solicitado.</p>
      </SectionCard>
    )
  }

  return (
    <div className="space-y-5">
      <AsyncState isLoading={moduleState.isLoading} error={moduleState.error}>
        {module ? (
          <>
            <PageHeader
              eyebrow="Formulário de configuração"
              title={module.nome}
              description={module.descricao}
              actions={<Link href="/configuracoes" className="rounded-full border border-line bg-white px-4 py-3 text-sm font-semibold text-slate-700">Voltar</Link>}
            />

            <SectionCard title="Parâmetros do módulo" description="Estrutura inicial para o formulário real desta configuração.">
              <div className="grid gap-4 md:grid-cols-2">
                {module.campos.map((field) => (
                  <label key={field.label} className="rounded-[1.25rem] border border-line bg-surface px-4 py-3">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{field.label}</span>
                    <input defaultValue={field.valor} className="w-full border-none bg-transparent text-sm outline-none" />
                  </label>
                ))}
              </div>
            </SectionCard>

            <div className="flex justify-center gap-3">
              <button type="button" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">Salvar</button>
              <Link href="/configuracoes" className="rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-slate-700">Cancelar</Link>
            </div>
          </>
        ) : null}
      </AsyncState>
    </div>
  )
}
