import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HttpError } from '@/src/services/http/http-client'
import { authService } from '@/src/features/auth/services/auth-service'

const { httpClientMock } = vi.hoisted(() => ({
  httpClientMock: vi.fn(),
}))

vi.mock('@/src/services/http/http-client', async () => {
  const actual = await vi.importActual<typeof import('@/src/services/http/http-client')>('@/src/services/http/http-client')
  return {
    ...actual,
    httpClient: httpClientMock,
  }
})

describe('authService.probeSession', () => {
  beforeEach(() => {
    httpClientMock.mockReset()
  })

  it('returns unauthenticated for a real 401', async () => {
    httpClientMock.mockRejectedValueOnce(new HttpError('Sessao expirada.', 401, { message: 'Sessao expirada.' }))

    await expect(authService.probeSession()).resolves.toEqual({ kind: 'unauthenticated' })
  })

  it('returns transient_error for fetch failures while the dev server is unstable', async () => {
    httpClientMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    const result = await authService.probeSession()
    expect(result.kind).toBe('transient_error')
  })

  it('returns transient_error for temporary 503 responses', async () => {
    httpClientMock.mockRejectedValueOnce(new HttpError('Service Unavailable', 503, null))

    const result = await authService.probeSession()
    expect(result.kind).toBe('transient_error')
  })
})
