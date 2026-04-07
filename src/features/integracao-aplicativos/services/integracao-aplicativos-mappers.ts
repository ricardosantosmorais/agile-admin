'use client'

import { asArray, asBoolean, asNumber, asRecord, asString } from '@/src/lib/api-payload'

export type AplicativoIntegracaoListFilters = {
  page: number
  perPage: number
  orderBy: 'id' | 'codigo' | 'nome' | 'email' | 'ativo'
  sort: 'asc' | 'desc'
  id: string
  'codigo::like': string
  'nome::like': string
  'email::like': string
  ativo: string
}

export type AplicativoIntegracaoListItem = {
  id: string
  codigo: string
  nome: string
  email: string
  ativo: boolean
  login: string
  senha: string
}

export type AplicativoIntegracaoListResponse = {
  data: AplicativoIntegracaoListItem[]
  meta: {
    page: number
    pages: number
    perPage: number
    from: number
    to: number
    total: number
  }
}

export type AplicativoIntegracaoFormRecord = {
  id: string
  codigo: string
  nome: string
  email: string
  ativo: boolean
}

export type AplicativoIntegracaoPermissaoRecord = {
  tabelaNome: string
  verboGet: boolean
  verboPost: boolean
  verboPut: boolean
  verboDelete: boolean
}

export type AplicativoIntegracaoPermissoesResponse = {
  usuario: {
    id: string
    nome: string
    email: string
  }
  rows: AplicativoIntegracaoPermissaoRecord[]
}

export const DEFAULT_APLICATIVO_INTEGRACAO_LIST_FILTERS: AplicativoIntegracaoListFilters = {
  page: 1,
  perPage: 15,
  orderBy: 'nome',
  sort: 'asc',
  id: '',
  'codigo::like': '',
  'nome::like': '',
  'email::like': '',
  ativo: '',
}

export function createEmptyAplicativoIntegracaoForm(): AplicativoIntegracaoFormRecord {
  return {
    id: '',
    codigo: '',
    nome: '',
    email: '',
    ativo: true,
  }
}

export function mapAplicativoIntegracaoListResponse(payload: unknown): AplicativoIntegracaoListResponse {
  const record = asRecord(payload)
  const meta = asRecord(record.meta)

  return {
    data: asArray<Record<string, unknown>>(record.data).map((item) => ({
      id: asString(item.id || item.codigo || item.login),
      codigo: asString(item.codigo || item.login || item.id),
      nome: asString(item.nome, '-'),
      email: asString(item.email),
      ativo: asBoolean(item.ativo),
      login: asString(item.login),
      senha: asString(item.senha),
    })),
    meta: {
      page: asNumber(meta.page, 1),
      pages: asNumber(meta.pages, 1),
      perPage: asNumber(meta.perPage ?? meta.perpage, 15),
      from: asNumber(meta.from, 0),
      to: asNumber(meta.to, 0),
      total: asNumber(meta.total, 0),
    },
  }
}

export function mapAplicativoIntegracaoDetail(payload: unknown): AplicativoIntegracaoFormRecord {
  const record = asRecord(payload)

  return {
    id: asString(record.id),
    codigo: asString(record.codigo),
    nome: asString(record.nome),
    email: asString(record.email),
    ativo: record.ativo === undefined ? true : asBoolean(record.ativo),
  }
}

export function mapAplicativoIntegracaoPermissoesResponse(payload: unknown): AplicativoIntegracaoPermissoesResponse {
  const record = asRecord(payload)
  const usuario = asRecord(record.usuario)

  return {
    usuario: {
      id: asString(usuario.id),
      nome: asString(usuario.nome),
      email: asString(usuario.email),
    },
    rows: asArray<Record<string, unknown>>(record.rows).map((row) => ({
      tabelaNome: asString(row.tabelaNome),
      verboGet: asBoolean(row.verboGet),
      verboPost: asBoolean(row.verboPost),
      verboPut: asBoolean(row.verboPut),
      verboDelete: asBoolean(row.verboDelete),
    })),
  }
}

export function toAplicativoIntegracaoPayload(form: AplicativoIntegracaoFormRecord) {
  return {
    id: form.id || undefined,
    ativo: form.ativo,
    codigo: form.codigo.trim() || null,
    nome: form.nome.trim() || null,
    email: form.email.trim() || null,
  }
}
