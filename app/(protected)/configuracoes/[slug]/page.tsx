'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AsyncState } from '@/src/components/ui/async-state'
import { PageHeader } from '@/src/components/ui/page-header'
import { SectionCard } from '@/src/components/ui/section-card'
import { ConfiguracoesAssistenteVendasIaPage } from '@/src/features/configuracoes-assistente-vendas-ia/components/configuracoes-assistente-vendas-ia-page'
import { ConfiguracoesAssistenteVirtualPage } from '@/src/features/configuracoes-assistente-virtual/components/configuracoes-assistente-virtual-page'
import { ConfiguracoesClientesPage } from '@/src/features/configuracoes-clientes/components/configuracoes-clientes-page'
import { ConfiguracoesEntregasPage } from '@/src/features/configuracoes-entregas/components/configuracoes-entregas-page'
import { ConfiguracoesGeralPage } from '@/src/features/configuracoes-geral/components/configuracoes-geral-page'
import { ConfiguracoesInicioPage } from '@/src/features/configuracoes-inicio/components/configuracoes-inicio-page'
import { ConfiguracoesLayoutPage } from '@/src/features/configuracoes-layout/components/configuracoes-layout-page'
import { ConfiguracoesPedidosPage } from '@/src/features/configuracoes-pedidos/components/configuracoes-pedidos-page'
import { ConfiguracoesPrecosPage } from '@/src/features/configuracoes-precos/components/configuracoes-precos-page'
import { ConfiguracoesProdutosPage } from '@/src/features/configuracoes-produtos/components/configuracoes-produtos-page'
import { ConfiguracoesVendedoresPage } from '@/src/features/configuracoes-vendedores/components/configuracoes-vendedores-page'
import { ParametrosListPage } from '@/src/features/parametros/components/parametros-list-page'
import { useAsyncData } from '@/src/hooks/use-async-data'
import { useI18n } from '@/src/i18n/use-i18n'
import { appData } from '@/src/services/app-data'

const modulePageRegistry = {
  clientes: ConfiguracoesClientesPage,
  entregas: ConfiguracoesEntregasPage,
  geral: ConfiguracoesGeralPage,
  inicio: ConfiguracoesInicioPage,
  layout: ConfiguracoesLayoutPage,
  parametros: ParametrosListPage,
  pedidos: ConfiguracoesPedidosPage,
  precos: ConfiguracoesPrecosPage,
  produtos: ConfiguracoesProdutosPage,
  'assistente-vendas-ia': ConfiguracoesAssistenteVendasIaPage,
  'assistente-virtual': ConfiguracoesAssistenteVirtualPage,
  vendedores: ConfiguracoesVendedoresPage,
} as const

export default function ConfiguracaoRoutePage() {
  const { t } = useI18n()
  const params = useParams<{ slug?: string | string[] }>()
  const slugParam = params.slug
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam
  const DirectModuleComponent = slug ? modulePageRegistry[slug as keyof typeof modulePageRegistry] : null
  const moduleState = useAsyncData(
    () => (!DirectModuleComponent && slug ? appData.config.getModule(slug) : Promise.resolve(null)),
    [DirectModuleComponent, slug],
  )
  const module = moduleState.data

  if (DirectModuleComponent) {
    return <DirectModuleComponent />
  }

  if (!moduleState.isLoading && !moduleState.error && !module) {
    return (
      <SectionCard title={t('configuracoes.moduleNotFoundTitle', 'Módulo não encontrado')}>
        <p className="text-sm text-slate-600">
          {t('configuracoes.moduleNotFoundDescription', 'Não encontramos o módulo solicitado.')}
        </p>
      </SectionCard>
    )
  }

  return (
    <div className="space-y-5">
      <AsyncState isLoading={moduleState.isLoading} error={moduleState.error}>
        {module ? (
          <>
            <PageHeader
              breadcrumbs={[
                { label: t('routes.dashboard', 'Início'), href: '/dashboard' },
                { label: t('routes.configuracoes', 'Configurações'), href: '/configuracoes' },
                { label: module.nome, href: `/configuracoes/${module.slug}` },
              ]}
              actions={(
                <Link
                  href="/configuracoes"
                  className="rounded-full border border-line bg-white px-4 py-3 text-sm font-semibold text-slate-700"
                >
                  {t('common.back', 'Voltar')}
                </Link>
              )}
            />

            <SectionCard
              title={t('configuracoes.parametersTitle', 'Parâmetros do módulo')}
              description={t(
                'configuracoes.parametersDescription',
                'Estrutura temporária até a migração completa desta configuração.',
              )}
            >
              <div className="grid gap-4 md:grid-cols-2">
                {module.campos.map((field) => (
                  <label key={field.label} className="rounded-[1.25rem] border border-line bg-surface px-4 py-3">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {field.label}
                    </span>
                    <input defaultValue={field.valor} className="w-full border-none bg-transparent text-sm outline-none" />
                  </label>
                ))}
              </div>
            </SectionCard>

            <div className="flex justify-center gap-3">
              <button type="button" className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
                {t('common.save', 'Salvar')}
              </button>
              <Link
                href="/configuracoes"
                className="rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-slate-700"
              >
                {t('common.cancel', 'Cancelar')}
              </Link>
            </div>
          </>
        ) : null}
      </AsyncState>
    </div>
  )
}
