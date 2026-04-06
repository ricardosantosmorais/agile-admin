import { notFound, redirect } from 'next/navigation'

const IMPLEMENTED_LEGACY_REDIRECTS: Record<string, string> = {
  'relatorios-v2-list': '/relatorios',
  'configuracoes-ia-form': '/configuracoes/assistente-virtual',
  'chatbot-empresa-form': '/configuracoes/assistente-vendas-ia',
  'cadastro-parametros-list': '/configuracoes/parametros',
  'cadastro-parametros-form': '/configuracoes/parametros',
  'parametros-empresa-list': '/configuracoes/parametros',
  'chatbot-empresas-list': '/configuracoes/assistente-vendas-ia',
}

type LegacyModuleFallbackPageProps = {
  params: Promise<{ segments?: string[] }>
}

export default async function LegacyModuleFallbackPage({ params }: LegacyModuleFallbackPageProps) {
  const { segments = [] } = await params
  const normalizedPath = segments.join('/').toLowerCase()

  if (normalizedPath && IMPLEMENTED_LEGACY_REDIRECTS[normalizedPath]) {
    redirect(IMPLEMENTED_LEGACY_REDIRECTS[normalizedPath])
  }

  notFound()
}
