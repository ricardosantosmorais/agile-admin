import { serverApiFetch } from '@/src/services/http/server-api'

type ApiRecord = Record<string, unknown>

function asRecord(value: unknown): ApiRecord {
  return typeof value === 'object' && value !== null ? (value as ApiRecord) : {}
}

function normalizeMasterFuncionalidades(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload
  }

  const source = asRecord(payload)
  return Array.isArray(source.data) ? source.data : []
}

function isTruthyMasterFlag(value: unknown) {
  return value === true || value === 1 || value === '1'
}

export async function enrichMasterPayload(payload: unknown, token: string, tenantId: string) {
  const source = asRecord(payload)

  if (!isTruthyMasterFlag(source.master)) {
    return payload
  }

  const funcionalidadesResponse = await serverApiFetch('funcionalidades?perpage=10000', {
    method: 'GET',
    token,
    tenantId,
  })

  if (!funcionalidadesResponse.ok) {
    return payload
  }

  return {
    ...source,
    funcionalidades: normalizeMasterFuncionalidades(funcionalidadesResponse.payload),
  }
}
