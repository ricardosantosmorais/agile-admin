import { serverApiFetch } from '@/src/services/http/server-api'
import type { CrudRecord } from '@/src/components/crud-base/types'

export function getApiErrorMessage(payload: unknown, fallback: string) {
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

export async function fetchAppById(id: string, token: string, tenantId: string) {
  const result = await serverApiFetch(`apps?id=${encodeURIComponent(id)}&perpage=1`, {
    method: 'GET',
    token,
    tenantId,
  })

  if (!result.ok) {
    throw new Error(getApiErrorMessage(result.payload, 'Não foi possível carregar o app.'))
  }

  const payload = result.payload as { data?: CrudRecord[] }
  const [app] = Array.isArray(payload.data) ? payload.data : []
  if (!app) {
    throw new Error('App não encontrado.')
  }

  return app
}
