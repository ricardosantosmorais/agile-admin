import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createAuthSessionCookieValue, readAuthSession } from '@/src/features/auth/services/auth-session'

const { cookiesMock, headersMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  headersMock: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: cookiesMock,
  headers: headersMock,
}))

describe('readAuthSession', () => {
  beforeEach(() => {
    cookiesMock.mockReset()
    headersMock.mockReset()
    headersMock.mockResolvedValue(new Headers())
  })

  it('keeps the cookie tenant when there is no active tab tenant header', async () => {
    const cookieValue = createAuthSessionCookieValue({
      token: 'token',
      currentTenantId: '1698203521854804',
      currentUserId: '18',
    })
    cookiesMock.mockResolvedValue({
      get: () => ({ value: cookieValue }),
    })

    await expect(readAuthSession()).resolves.toMatchObject({
      currentTenantId: '1698203521854804',
    })
  })

  it('uses the active tab tenant header before the shared cookie tenant', async () => {
    const cookieValue = createAuthSessionCookieValue({
      token: 'token',
      currentTenantId: 'ac-araujo',
      currentUserId: '18',
    })
    cookiesMock.mockResolvedValue({
      get: () => ({ value: cookieValue }),
    })
    headersMock.mockResolvedValue(new Headers({
      'X-Admin-V2-Tenant-Id': 'cescom',
    }))

    await expect(readAuthSession()).resolves.toMatchObject({
      currentTenantId: 'cescom',
    })
  })
})
