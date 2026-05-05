import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { captureOperationalServerError } from '@/src/lib/sentry'
import { serverApiFetch } from '@/src/services/http/server-api'

export async function invalidateRemoteCacheService(apiService: string) {
  const service = apiService.trim()
  if (!service) {
    return
  }

  try {
    const session = await readAuthSession()
    if (!session) {
      return
    }

    await serverApiFetch(`cache/clear/${encodeURIComponent(service)}`, {
      method: 'GET',
      token: session.token,
      tenantId: session.currentTenantId,
    })
  } catch (error) {
    captureOperationalServerError({
      area: 'server-api',
      action: 'cache-invalidation',
      path: `cache/clear/${service}`,
      status: 0,
      payload: error instanceof Error ? { message: error.message } : { message: 'Falha inesperada ao invalidar cache.' },
    })
  }
}
