import type { AuthPermission, AuthSession, AuthTenant, AuthUser } from '@/src/features/auth/types/auth'

type ApiRecord = Record<string, unknown>

function asRecord(value: unknown): ApiRecord {
  return typeof value === 'object' && value !== null ? (value as ApiRecord) : {}
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function isTruthyBoolean(value: unknown) {
  return value === true || value === 1 || value === '1'
}

function asNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function getOptionalBoolean(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'boolean') {
      return value
    }

    if (value === 0 || value === 1 || value === '0' || value === '1') {
      return isTruthyBoolean(value)
    }
  }

  return undefined
}

function buildAvatarFallback(nome: string, email: string) {
  const source = nome || email
  const parts = source
    .split(' ')
    .map((item) => item.trim())
    .filter(Boolean)

  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
  }

  return source.slice(0, 2).toUpperCase() || 'AD'
}

function mapTenant(value: unknown): AuthTenant {
  const tenant = asRecord(value)
  const cluster = asRecord(tenant.cluster)
  return {
    id: asString(tenant.id),
    nome: asString(tenant.nome_fantasia || tenant.nome),
    codigo: asString(tenant.codigo || tenant.sigla || tenant.id),
    status: asString(tenant.status || 'Operando'),
    url: asString(tenant.url) || undefined,
    mondayUrl: asString(tenant.monday_url || tenant.mondayUrl) || undefined,
    iconeUrl: asString(tenant.ico || tenant.icone || tenant.logo),
    clusterHost: asString(cluster.host),
    clusterApi: asString(cluster.api),
  }
}

function mapPermission(value: unknown): AuthPermission {
  const item = asRecord(value)
  const funcionalidade = asRecord(item.funcionalidade)

  return {
    id: asString(funcionalidade.id || item.id),
    nome: asString(funcionalidade.nome || item.nome),
    chave: asString(funcionalidade.chave || funcionalidade.slug || item.chave || item.slug || item.id),
    slug: asString(funcionalidade.slug || item.slug || funcionalidade.chave || item.chave),
    componente: asString(funcionalidade.componente || item.componente),
    acao: asString(funcionalidade.acao || item.acao) || undefined,
    ativo: getOptionalBoolean(funcionalidade.ativo, item.ativo),
    idFuncionalidadePai: asString(funcionalidade.id_funcionalidade_pai || item.id_funcionalidade_pai) || undefined,
    nivel: Number(funcionalidade.nivel || item.nivel || 0) || undefined,
    posicao: Number(funcionalidade.posicao || item.posicao || 0) || undefined,
    menu: getOptionalBoolean(funcionalidade.menu, item.menu),
    url: asString(funcionalidade.url || item.url) || undefined,
    clique: asString(funcionalidade.clique || item.clique) || undefined,
    icone: asString(funcionalidade.icone || item.icone) || undefined,
  }
}

function mapPermissions(value: unknown): AuthPermission[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map(mapPermission)
    .filter((item) => item.id || item.nome || item.chave)
}

function formatLastAccess(value: unknown) {
  const source = asString(value)
  if (!source) {
    return ''
  }

  const date = new Date(source)
  if (Number.isNaN(date.getTime())) {
    return source
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function mapUser(source: ApiRecord, permissions: AuthPermission[]): AuthUser {
  const perfil = asRecord(source.perfil)
  const nome = asString(source.nome)
  const email = asString(source.email)

  return {
    id: asString(source.id),
    nome,
    email,
    cargo: asString(perfil.nome || source.cargo || (isTruthyBoolean(source.master) ? 'Master' : 'Administrador')),
    avatarFallback: buildAvatarFallback(nome, email),
    ultimoAcesso: formatLastAccess(source.ultimo_acesso || source.ultimoAcesso),
    master: isTruthyBoolean(source.master),
    funcionalidades: permissions,
  }
}

export function mapAuthSession(payload: unknown): AuthSession {
  const source = asRecord(payload)
  const tenants = Array.isArray(source.empresas)
    ? source.empresas.map(mapTenant).filter((item) => item.id)
    : []
  const currentTenant = mapTenant(source.empresa)
  const normalizedCurrentTenant =
    tenants.find((item) => item.id === currentTenant.id)
    ?? currentTenant
    ?? tenants[0]

  const perfil = asRecord(source.perfil)
  const permissions = mapPermissions(source.funcionalidades || perfil.funcionalidades)

  return {
    token: asString(source.token),
    user: mapUser(source, permissions),
    tenants: normalizedCurrentTenant.id && !tenants.some((item) => item.id === normalizedCurrentTenant.id)
      ? [normalizedCurrentTenant, ...tenants]
      : tenants,
    currentTenant: normalizedCurrentTenant,
    sessionIdleTimeoutSeconds: asNumber(source.session_idle_timeout_seconds || source.sessionIdleTimeoutSeconds),
    sessionWarningTimeoutSeconds: asNumber(source.session_warning_timeout_seconds || source.sessionWarningTimeoutSeconds),
  }
}

export function extractApiErrorMessage(payload: unknown, fallbackMessage: string) {
  const source = asRecord(payload)
  const error = asRecord(source.error)
  return asString(error.message) || fallbackMessage
}
