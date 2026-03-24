import type { Locale } from '@/src/i18n/types'
import { translate } from '@/src/i18n/utils'

const MENU_KEY_ALIASES: Record<string, string> = {
  inicio: 'dashboard',
  home: 'dashboard',
  tools: 'ferramentas',
  catalogo: 'catalogo',
  conteudo: 'conteudo',
  content: 'conteudo',
  produtos: 'produtos',
  pedidos: 'pedidos',
  consultas: 'consultas',
  queries: 'consultas',
  analises: 'analises',
  analytics: 'analises',
  configuracoes: 'configuracoes',
  settings: 'configuracoes',
  integracoes: 'integracoes',
  integracao: 'integracoes',
  integrations: 'integracoes',
  pessoas: 'pessoas',
  people: 'pessoas',
  logistica: 'logistica',
  logistics: 'logistica',
  'precos e estoques': 'precos-e-estoques',
  'preços e estoques': 'precos-e-estoques',
  'prices-inventory': 'precos-e-estoques',
  'cadastros basicos': 'cadastros-basicos',
  'cadastros básicos': 'cadastros-basicos',
  'basic-records': 'cadastros-basicos',
  clientes: 'clientes-list',
  administradores: 'administradores-list',
  relatorios: 'relatorios-list',
  notificacoes: 'notificacoes-painel-list',
  financeiro: 'financeiro',
  marketing: 'marketing',
  campanhas: 'campanhas',
  cupons: 'cupons',
  promocoes: 'promocoes',
  promotions: 'promocoes',
  usuarios: 'usuarios',
  users: 'usuarios',
}

function normalizeMenuKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
}

export function translateMenuLabel(locale: Locale, key: string, fallback: string) {
  const normalizedKey = normalizeMenuKey(key)
  const resolvedKey = MENU_KEY_ALIASES[normalizedKey] ?? normalizedKey
  return translate(locale, `menuKeys.${resolvedKey}`, fallback)
}

export function translateMenuFromCandidates(locale: Locale, candidates: Array<string | undefined>, fallback: string) {
  for (const candidate of [...candidates, fallback]) {
    if (!candidate) {
      continue
    }

    const translated = translateMenuLabel(locale, candidate, fallback)
    if (translated !== fallback || normalizeMenuKey(candidate) === normalizeMenuKey(fallback)) {
      return translated
    }
  }

  return fallback
}
