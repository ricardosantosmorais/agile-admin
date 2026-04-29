import { NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'
import type { CrudRecord } from '@/src/components/crud-base/types'

export function getErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string') {
    return payload.message
  }
  if (
    typeof payload === 'object'
    && payload !== null
    && 'error' in payload
    && typeof payload.error === 'object'
    && payload.error !== null
    && 'message' in payload.error
    && typeof payload.error.message === 'string'
  ) {
    return payload.error.message
  }
  return fallback
}

export function normalizeSavedPayload(payload: unknown): CrudRecord[] {
  if (Array.isArray(payload)) return payload as CrudRecord[]
  if (typeof payload === 'object' && payload !== null && 'data' in payload && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: CrudRecord[] }).data
  }
  if (typeof payload === 'object' && payload !== null) return [payload as CrudRecord]
  return []
}

export async function requireNotificationSession() {
  const session = await readAuthSession()
  if (!session) {
    return {
      session: null,
      response: NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 }),
    }
  }
  return { session, response: null }
}

export async function loadNotification(id: string, token: string, tenantId: string) {
  const result = await serverApiFetch(`notificacoes_painel?id=${encodeURIComponent(id)}&perpage=1`, {
    method: 'GET',
    token,
    tenantId,
  })

  if (!result.ok) {
    return { ok: false as const, status: result.status || 400, payload: result.payload, record: null }
  }

  const payload = result.payload
  const rows = typeof payload === 'object' && payload !== null && 'data' in payload && Array.isArray(payload.data)
    ? payload.data as CrudRecord[]
    : []

  return { ok: true as const, status: 200, payload, record: rows[0] ?? null }
}

function readRows(payload: unknown): CrudRecord[] {
  if (typeof payload === 'object' && payload !== null && 'data' in payload && Array.isArray(payload.data)) {
    return payload.data as CrudRecord[]
  }
  return []
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

function hasCompanyName(value: unknown) {
  const empresa = asRecord(value)
  return Boolean(empresa.nome_fantasia || empresa.razao_social || empresa.nome)
}

async function loadCompanyById(id: string, token: string, tenantId: string) {
  const params = new URLSearchParams({
    id,
    perpage: '1',
    fields: 'id,codigo,nome_fantasia,razao_social,nome',
  })
  const result = await serverApiFetch(`empresas?${params.toString()}`, {
    method: 'GET',
    token,
    tenantId,
  })

  if (!result.ok) {
    return null
  }

  return readRows(result.payload)[0] ?? null
}

export async function hydrateNotificationCompanies(record: unknown, token: string, tenantId: string) {
  const notification = asRecord(record)
  const empresas = Array.isArray(notification.empresas) ? notification.empresas : []
  const missingCompanyIds = Array.from(new Set(empresas.map((item) => {
    const row = asRecord(item)
    const empresa = asRecord(row.empresa)
    const idEmpresa = String(row.id_empresa ?? empresa.id ?? '').trim()
    return idEmpresa && !hasCompanyName(row.empresa) && !hasCompanyName(row) ? idEmpresa : ''
  }).filter(Boolean)))

  if (!missingCompanyIds.length) {
    return notification
  }

  const loadedCompanies = await Promise.all(missingCompanyIds.map((id) => loadCompanyById(id, token, tenantId).then((empresa) => [id, empresa] as const)))
  const companyMap = new Map(loadedCompanies.filter((entry): entry is readonly [string, CrudRecord] => Boolean(entry[1])))

  return {
    ...notification,
    empresas: empresas.map((item) => {
      const row = asRecord(item)
      const empresa = asRecord(row.empresa)
      const idEmpresa = String(row.id_empresa ?? empresa.id ?? '').trim()
      const loaded = companyMap.get(idEmpresa)
      return loaded ? { ...row, empresa: { ...empresa, ...loaded } } : row
    }),
  }
}
