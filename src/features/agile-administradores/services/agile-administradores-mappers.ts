import { phoneMask } from '@/src/lib/input-masks'
import type { CrudListFilters, CrudListResponse, CrudRecord } from '@/src/components/crud-base/types'

export type AgileAdministradorListFilters = CrudListFilters & {
  orderBy: 'nome' | 'email' | 'id_empresa' | 'ultimo_acesso' | 'ativo'
  'nome::like': string
  'email::like': string
  idEmpresa: string
  idEmpresa_label: string
  'ultimo_acesso::ge': string
  'ultimo_acesso::le': string
  ativo: string
}

export type AgileAdministradorEmpresaLink = {
  id: string
  idUsuario: string
  idEmpresa: string
  idPerfil: string
  empresaNome: string
  perfilNome: string
  empresaAtiva: boolean
  atual: boolean
}

export type AgileAdministradorRecord = CrudRecord & {
  id: string
  ativo: boolean
  codigo: string
  nome: string
  email: string
  celular: string
  senha: string
  confirmacao: string
  empresasVinculadas: AgileAdministradorEmpresaLink[]
}

export type AgileAdministradorPasswordRecord = {
  id: string
  nome?: string
  perfil: string
  email: string
  senha: string
  confirmacao: string
}

export const DEFAULT_AGILE_ADMINISTRADORES_FILTERS: AgileAdministradorListFilters = {
  page: 1,
  perPage: 15,
  orderBy: 'nome',
  sort: 'asc',
  'nome::like': '',
  'email::like': '',
  idEmpresa: '',
  idEmpresa_label: '',
  'ultimo_acesso::ge': '',
  'ultimo_acesso::le': '',
  ativo: '',
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function asString(value: unknown) {
  return String(value ?? '').trim()
}

function asBoolean(value: unknown) {
  return value === true || value === 1 || value === '1' || value === 'true'
}

function formatDateTime(value: unknown) {
  const source = asString(value)
  if (!source) return '-'

  const date = new Date(source.includes('T') ? source : source.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) {
    return source
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

function getCompanyName(value: unknown) {
  const company = asRecord(value)
  return asString(company.nome_fantasia || company.razao_social || company.nome || company.id)
}

function mapCurrentCompany(item: Record<string, unknown>) {
  const direct = getCompanyName(item.empresa)
  if (direct) return direct

  const firstLink = asRecord(asArray(item.empresas)[0])
  return getCompanyName(firstLink.empresa) || '-'
}

function mapCompanyLink(value: unknown, userId: string, currentCompanyId: string): AgileAdministradorEmpresaLink {
  const link = asRecord(value)
  const empresa = asRecord(link.empresa)
  const perfil = asRecord(link.perfil)
  const idEmpresa = asString(link.id_empresa || empresa.id)
  const idPerfil = asString(link.id_perfil || perfil.id)

  return {
    id: `${idEmpresa}:${idPerfil || 'sem-perfil'}`,
    idUsuario: asString(link.id_usuario || userId),
    idEmpresa,
    idPerfil,
    empresaNome: getCompanyName(empresa) || idEmpresa || '-',
    perfilNome: asString(perfil.nome) || '-',
    empresaAtiva: asBoolean(empresa.ativo),
    atual: Boolean(currentCompanyId && currentCompanyId === idEmpresa),
  }
}

export function createEmptyAgileAdministradorForm(): AgileAdministradorRecord {
  return {
    id: '',
    ativo: true,
    codigo: '',
    nome: '',
    email: '',
    celular: '',
    senha: '',
    confirmacao: '',
    empresasVinculadas: [],
  }
}

export function createEmptyAgileAdministradorPassword(record?: Partial<AgileAdministradorPasswordRecord>): AgileAdministradorPasswordRecord {
  return {
    id: asString(record?.id),
    nome: asString(record?.nome),
    perfil: asString(record?.perfil),
    email: asString(record?.email),
    senha: '',
    confirmacao: '',
  }
}

export function mapAgileAdministradorListResponse(payload: unknown): CrudListResponse {
  const source = asRecord(payload)
  const meta = asRecord(source.meta)

  return {
    data: asArray(source.data).map((raw) => {
      const item = asRecord(raw)
      return {
        id: asString(item.id),
        nome: asString(item.nome) || '-',
        email: asString(item.email) || '-',
        empresaAtual: mapCurrentCompany(item),
        ultimoAcesso: formatDateTime(item.ultimo_acesso),
        ipUltimoAcesso: asString(item.ip_ultimo_acesso),
        ativo: asBoolean(item.ativo),
      }
    }),
    meta: {
      page: Number(meta.page || 1),
      pages: Number(meta.pages || 1),
      perPage: Number(meta.perpage || meta.perPage || 15),
      from: Number(meta.from || 0),
      to: Number(meta.to || 0),
      total: Number(meta.total || 0),
      order: asString(meta.order),
      sort: asString(meta.sort),
    },
  }
}

export function mapAgileAdministradorDetail(payload: unknown): AgileAdministradorRecord {
  const item = asRecord(payload)
  const userId = asString(item.id)
  const currentCompanyId = asString(item.id_empresa)

  return {
    ...createEmptyAgileAdministradorForm(),
    id: userId,
    ativo: asBoolean(item.ativo),
    codigo: asString(item.codigo),
    nome: asString(item.nome),
    email: asString(item.email),
    celular: phoneMask(`${asString(item.ddd_celular)}${asString(item.celular)}`, true),
    empresasVinculadas: asArray(item.usuarios_empresas || item.empresas)
      .map((link) => mapCompanyLink(link, userId, currentCompanyId))
      .filter((link) => link.idEmpresa),
  }
}

export function mapAgileAdministradorPasswordDetail(payload: unknown): AgileAdministradorPasswordRecord {
  const item = asRecord(payload)
  const perfil = asRecord(item.perfil)

  return createEmptyAgileAdministradorPassword({
    id: asString(item.id),
    nome: asString(item.nome),
    perfil: asString(perfil.nome),
    email: asString(item.email),
  })
}

export function toAgileAdministradorPayload(form: CrudRecord) {
  const celular = asString(form.celular).replace(/\D/g, '')
  return {
    id: asString(form.id) || undefined,
    ativo: asBoolean(form.ativo),
    codigo: asString(form.codigo) || null,
    nome: asString(form.nome) || null,
    email: asString(form.email).toLowerCase(),
    ddd_celular: celular ? celular.slice(0, 2) : null,
    celular: celular ? celular.slice(2) : null,
    senha: asString(form.senha) || undefined,
  }
}
