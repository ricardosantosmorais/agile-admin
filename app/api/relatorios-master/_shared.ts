import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { asArray, asRecord } from '@/src/lib/api-payload'
import { externalAdminApiFetch } from '@/src/services/http/external-admin-api'

export type ApiRecord = Record<string, unknown>

export function toStringValue(value: unknown) {
  return String(value ?? '').trim()
}

export function toBool(value: unknown, fallback = false) {
  const normalized = toStringValue(value).toLowerCase()
  if (!normalized) return fallback
  return ['1', 'true', 'sim', 'yes'].includes(normalized)
}

export function getPayloadMessage(payload: unknown, fallback: string) {
  const record = asRecord(payload)
  const error = asRecord(record.error)
  return toStringValue(error.message || record.message || payload) || fallback
}

export async function requireSession() {
  const session = await readAuthSession()
  if (!session) {
    return NextResponse.json({ message: 'Sessao expirada.' }, { status: 401 })
  }
  return session
}

export function normalizeApiList(payload: unknown, fallback: { page: number; perPage: number }) {
  const record = asRecord(payload)
  const meta = asRecord(record.meta)
  return {
    data: asArray<ApiRecord>(record.data),
    meta: {
      page: Number(meta.page || fallback.page),
      pages: Number(meta.pages || 1),
      perPage: Number(meta.perpage || meta.perPage || fallback.perPage),
      from: Number(meta.from || 0),
      to: Number(meta.to || 0),
      total: Number(meta.total || 0),
      order: toStringValue(meta.order),
      sort: toStringValue(meta.sort),
    },
  }
}

export async function fetchPainelFirst(path: string, query: Record<string, string | number | boolean | null | undefined>) {
  const result = await externalAdminApiFetch('painelb2b', path, { method: 'GET', query: { perpage: 1, ...query } })
  if (!result.ok) return {}
  return asArray<ApiRecord>(asRecord(result.payload).data).at(0) || {}
}

export async function postPainel(path: string, body: Record<string, string | number | boolean | null | undefined>, fallback: string) {
  const result = await externalAdminApiFetch('painelb2b', path, { method: 'POST', body })
  if (!result.ok) throw new Error(getPayloadMessage(result.payload, fallback))
  const payload = asRecord(result.payload)
  return asArray<ApiRecord>(payload.data).at(0) || payload
}

function slugBase(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export function buildQueryName(text: string) {
  return `Q_${slugBase(text)}`
}

export function buildEndpointName(text: string) {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`.replace(/\D/g, '')
  return `ecom_${slugBase(text)}_${suffix}`.toLowerCase()
}

export function normalizeRelatorioPayload(body: ApiRecord, tenantId: string): ApiRecord {
  return {
    ...body,
    id_empresa: tenantId,
    ativo: toBool(body.ativo, true),
  }
}

export async function saveQueryAndEndpoint(body: ApiRecord, currentUserId: string) {
  const reportName = toStringValue(body.nome)
  const idQuery = toStringValue(body.id_query || body.idQuery || '0') || '0'
  const sql = toStringValue(body.query || body.sql)
  const ativo = toBool(body.ativo, true)

  const queryPayload: Record<string, string | number | boolean | null | undefined> = idQuery === '0'
    ? {
        id: 0,
        id_template: 11,
        query: sql,
        id_usuario: currentUserId,
        ativo: ativo ? 1 : 0,
        nome: buildQueryName(reportName),
        observacao: toStringValue(body.observacao) || 'Query cadastrada no admin v2',
      }
    : {
        id: idQuery,
        id_usuario: currentUserId,
        query: sql,
        hash: toStringValue(body.hash) || createHash('md5').update(sql).digest('hex'),
        observacao: toStringValue(body.observacao) || 'Alterado no admin v2',
      }

  const query = await postPainel('querys', queryPayload, 'Nao foi possivel salvar a query do relatorio.')
  const queryId = toStringValue(query.id)
  if (!queryId) throw new Error('A API nao retornou o identificador da query.')

  const isNewReport = !toStringValue(body.id)
  const idEndpoint = toStringValue(body.id_endpoint || body.idEndpoint || '0') || '0'
  let api = toStringValue(body.api)
  let endpointId = idEndpoint

  if (isNewReport && idEndpoint === '0') {
    api = buildEndpointName(reportName)
    const endpoint = await postPainel('endpoints', {
      id: 0,
      id_query: queryId,
      fonte_dados: 'agileecommerce',
      tipo_retorno: 'view',
      nome: api,
      descricao: api,
      ativo: ativo ? 1 : 0,
    }, 'Nao foi possivel criar o endpoint do relatorio.')
    endpointId = toStringValue(endpoint.id)

    if (endpointId) {
      await postPainel('endpoint_perfis', {
        id_endpoint: endpointId,
        id_perfil: '2',
        perfil: 'empresa',
      }, 'Nao foi possivel vincular o endpoint ao perfil.')
    }
  }

  return { query, api, endpointId }
}
