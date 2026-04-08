import { describe, expect, it } from 'vitest'
import { normalizeRenewCacheResponse } from '@/src/features/renovar-cache/services/renovar-cache-mappers'

describe('renovar-cache-mappers', () => {
  it('uses API message when present', () => {
    const response = normalizeRenewCacheResponse({ message: 'Cache renovado com sucesso.' })

    expect(response.message).toBe('Cache renovado com sucesso.')
  })

  it('falls back to default message when payload is invalid', () => {
    const response = normalizeRenewCacheResponse({})

    expect(response.message).toBe('Cache renovado com sucesso.')
  })
})
