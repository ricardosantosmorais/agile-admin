import { normalizeRenewCacheResponse } from '@/src/features/renovar-cache/services/renovar-cache-mappers'
import { httpClient } from '@/src/services/http/http-client'

export const renovarCacheClient = {
  async renew() {
    const payload = await httpClient<unknown>('/api/renovar-cache', {
      method: 'POST',
      cache: 'no-store',
      body: JSON.stringify({}),
    })

    return normalizeRenewCacheResponse(payload)
  },
}
