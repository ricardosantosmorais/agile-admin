import { describe, expect, it, vi } from 'vitest'

const redirectMock = vi.hoisted(() => vi.fn())
const readAuthSessionMock = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}))

vi.mock('@/src/features/auth/services/auth-session', () => ({
  readAuthSession: readAuthSessionMock,
}))

vi.mock('@/src/features/auth/components/login-page', () => ({
  LoginPage: () => null,
}))

import LoginRoutePage from '@/app/login/page'

describe('LoginRoutePage', () => {
  it('does not trust the local signed cookie as proof of a valid API session', async () => {
    readAuthSessionMock.mockResolvedValue({
      token: 'stale-token',
      currentTenantId: 'empresa-1',
      currentUserId: 'u1',
    })

    await LoginRoutePage()

    expect(readAuthSessionMock).not.toHaveBeenCalled()
    expect(redirectMock).not.toHaveBeenCalled()
  })
})
