import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/erp-cadastros/gateway-endpoints/test-context/route'

const { readAuthSessionMock, agileV2FetchMock, serverApiFetchMock } = vi.hoisted(() => ({
	readAuthSessionMock: vi.fn(),
	agileV2FetchMock: vi.fn(),
	serverApiFetchMock: vi.fn(),
}))

vi.mock('@/src/features/auth/services/auth-session', () => ({
	readAuthSession: readAuthSessionMock,
}))

vi.mock('@/app/api/consultas/_shared', () => ({
	agileV2Fetch: agileV2FetchMock,
}))

vi.mock('@/src/services/http/server-api', () => ({
	serverApiFetch: serverApiFetchMock,
}))

describe('gateway endpoint test context bridge', () => {
	beforeEach(() => {
		readAuthSessionMock.mockReset()
		agileV2FetchMock.mockReset()
		serverApiFetchMock.mockReset()
	})

	it('marks company-context variables as masked read-only values and ignores oauth2 cookie', async () => {
		readAuthSessionMock.mockResolvedValue({
			token: 'token',
			currentTenantId: 'agileecommerce',
			currentUserId: 'user-1',
		})
		agileV2FetchMock.mockImplementation(async (resource: string) => {
			if (resource === 'gateways') {
				return { ok: true, status: 200, payload: { data: [{ id: '8', token: '@api.key' }] } }
			}
			if (resource === 'gateways_endpoints') {
				return { ok: true, status: 200, payload: { data: [] } }
			}
			return { ok: true, status: 200, payload: { data: [] } }
		})
		serverApiFetchMock.mockResolvedValue({
			ok: true,
			status: 200,
			payload: { data: [{ chave: 'api.key', parametros: 'abcdef123456' }] },
		})

		const response = await POST(new NextRequest('http://localhost/api/erp-cadastros/gateway-endpoints/test-context', {
			method: 'POST',
			body: JSON.stringify({
				id_gateway: '8',
				endpoint: '/clientes?key=@api.key',
				body: '{"cookie":"@oauth2.cookie","client":"@client.id"}',
			}),
		}))
		const payload = await response.json()
		const tokens = payload.data.variaveis as Array<{ token: string; default_value?: string; display_value?: string; resolved_by_context?: boolean; editable?: boolean }>

		expect(response.status).toBe(200)
		expect(tokens.map((item) => item.token)).not.toContain('@oauth2.cookie')
		expect(tokens).toContainEqual(expect.objectContaining({
			token: '@api.key',
			default_value: '',
			display_value: 'ab******56',
			resolved_by_context: true,
			editable: false,
		}))
	})
})
