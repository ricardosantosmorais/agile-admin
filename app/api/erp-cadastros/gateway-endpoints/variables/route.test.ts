import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/erp-cadastros/gateway-endpoints/variables/route'

const { readAuthSessionMock, agileV2FetchMock } = vi.hoisted(() => ({
	readAuthSessionMock: vi.fn(),
	agileV2FetchMock: vi.fn(),
}))

vi.mock('@/src/features/auth/services/auth-session', () => ({
	readAuthSession: readAuthSessionMock,
}))

vi.mock('@/app/api/consultas/_shared', () => ({
	agileV2Fetch: agileV2FetchMock,
}))

describe('gateway endpoint variables bridge', () => {
	beforeEach(() => {
		readAuthSessionMock.mockReset()
		agileV2FetchMock.mockReset()
	})

	it('exposes oauth2 cookie as a fixed gateway variable', async () => {
		readAuthSessionMock.mockResolvedValue({
			token: 'token',
			currentTenantId: 'agileecommerce',
			currentUserId: 'user-1',
		})

		const response = await POST(new NextRequest('http://localhost/api/erp-cadastros/gateway-endpoints/variables', {
			method: 'POST',
			body: JSON.stringify({}),
		}))
		const payload = await response.json()

		expect(response.status).toBe(200)
		expect(payload.data.variaveis.map((item: { token: string }) => item.token)).toContain('@oauth2.cookie')
	})
})
