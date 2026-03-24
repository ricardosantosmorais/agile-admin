'use client'

import { phoneMask } from '@/src/lib/input-masks'

export type AdminListFilters = {
  page: number
  perPage: number
  orderBy: 'nome' | 'email' | 'perfil:nome' | 'ultimo_acesso' | 'ativo'
  sort: 'asc' | 'desc'
  'nome::like': string
  'email::like': string
  'perfil:nome::like': string
  'ultimo_acesso::ge': string
  'ultimo_acesso::le': string
  ativo: string
}

export type AdminListItem = {
  id: string
  nome: string
  email: string
  perfil: string
  ultimoAcesso: string
  ipUltimoAcesso: string
  ativo: boolean
}

export type AdminListResponse = {
  data: AdminListItem[]
  meta: {
    page: number
    pages: number
    perPage: number
    from: number
    to: number
    total: number
  }
}

export type AdminFormRecord = {
  id: string
  ativo: boolean
  codigo: string
  idPerfil: string
  nome: string
  email: string
  celular: string
  senha: string
  confirmacao: string
}

export type AdminPasswordRecord = {
  id: string
  perfil: string
  email: string
  senha: string
  confirmacao: string
}

export type AdminProfileOption = {
  id: string
  nome: string
}

export const DEFAULT_ADMIN_LIST_FILTERS: AdminListFilters = {
  page: 1,
  perPage: 15,
  orderBy: 'nome',
  sort: 'asc',
  'nome::like': '',
  'email::like': '',
  'perfil:nome::like': '',
  'ultimo_acesso::ge': '',
  'ultimo_acesso::le': '',
  ativo: '',
}

function formatDateTime(value: unknown) {
  const source = String(value || '').trim()
  if (!source) {
    return '-'
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

export function createEmptyAdminForm(): AdminFormRecord {
  return {
    id: '',
    ativo: true,
    codigo: '',
    idPerfil: '',
    nome: '',
    email: '',
    celular: '',
    senha: '',
    confirmacao: '',
  }
}

export function createEmptyAdminPassword(record?: Partial<AdminPasswordRecord>): AdminPasswordRecord {
  return {
    id: String(record?.id || ''),
    perfil: String(record?.perfil || ''),
    email: String(record?.email || ''),
    senha: '',
    confirmacao: '',
  }
}

export function mapAdminListResponse(payload: unknown): AdminListResponse {
  const response = payload as {
    data?: Array<Record<string, unknown>>
    meta?: Record<string, unknown>
  }

  return {
    data: Array.isArray(response?.data)
      ? response.data.map((item) => ({
          id: String(item.id || ''),
          nome: String(item.nome || '-'),
          email: String(item.email || '-'),
          perfil: String(((item.perfil as Record<string, unknown> | null)?.nome) || '-'),
          ultimoAcesso: formatDateTime(item.ultimo_acesso),
          ipUltimoAcesso: String(item.ip_ultimo_acesso || ''),
          ativo: item.ativo === true || item.ativo === 1 || item.ativo === '1',
        }))
      : [],
    meta: {
      page: Number(response?.meta?.page || 1),
      pages: Number(response?.meta?.pages || 1),
      perPage: Number(response?.meta?.perPage || 15),
      from: Number(response?.meta?.from || 0),
      to: Number(response?.meta?.to || 0),
      total: Number(response?.meta?.total || 0),
    },
  }
}

export function mapAdminDetail(payload: unknown): AdminFormRecord {
  const item = payload as Record<string, unknown>

  return {
    id: String(item.id || ''),
    ativo: item.ativo === true || item.ativo === 1 || item.ativo === '1',
    codigo: String(item.codigo || ''),
    idPerfil: String(item.id_perfil || ''),
    nome: String(item.nome || ''),
    email: String(item.email || ''),
    celular: phoneMask(`${String(item.ddd_celular || '')}${String(item.celular || '')}`, true),
    senha: '',
    confirmacao: '',
  }
}

export function mapAdminPasswordDetail(payload: unknown): AdminPasswordRecord {
  const item = payload as Record<string, unknown>
  const perfil = item.perfil as Record<string, unknown> | null

  return createEmptyAdminPassword({
    id: String(item.id || ''),
    perfil: String(perfil?.nome || ''),
    email: String(item.email || ''),
  })
}

export function toAdminPayload(form: AdminFormRecord) {
  const celular = form.celular.replace(/\D/g, '')

  return {
    id: form.id || undefined,
    ativo: form.ativo,
    codigo: form.codigo.trim() || null,
    id_perfil: form.idPerfil || null,
    nome: form.nome.trim() || null,
    email: form.email.trim().toLowerCase(),
    ddd_celular: celular ? celular.slice(0, 2) : null,
    celular: celular ? celular.slice(2) : null,
    senha: form.senha || undefined,
  }
}
