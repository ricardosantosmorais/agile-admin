export type AuthTenant = {
  id: string
  nome: string
  codigo: string
  status: string
  url?: string
  mondayUrl?: string
  iconeUrl?: string
  clusterHost?: string
  clusterApi?: string
}

export type AuthPermission = {
  id: string
  nome: string
  chave: string
  slug: string
  componente: string
  acao?: string
  ativo?: boolean
  idFuncionalidadePai?: string
  nivel?: number
  posicao?: number
  menu?: boolean
  url?: string
  clique?: string
  icone?: string
}

export type AuthUser = {
  id: string
  nome: string
  email: string
  cargo: string
  avatarFallback: string
  ultimoAcesso: string
  master: boolean
  funcionalidades: AuthPermission[]
}

export type AuthSession = {
  token: string
  user: AuthUser
  tenants: AuthTenant[]
  currentTenant: AuthTenant
  sessionIdleTimeoutSeconds?: number
  sessionWarningTimeoutSeconds?: number
}

export type LoginCredentials = {
  email: string
  senha: string
  codigoAutenticacao?: string
  tenantId?: string
}

export type PendingLogin = {
  email: string
  senha: string
  tenantId: string
}

export type LoginResult =
  | {
      requiresTwoFactor: true
      message: string
    }
  | {
      requiresTwoFactor: false
      session: AuthSession
    }
