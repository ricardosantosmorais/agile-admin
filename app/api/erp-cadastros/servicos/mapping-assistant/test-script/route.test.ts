import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'

const { readAuthSessionMock, painelb2bFetchMock } = vi.hoisted(() => ({
	readAuthSessionMock: vi.fn(),
	painelb2bFetchMock: vi.fn(),
}))

vi.mock('@/src/features/auth/services/auth-session', () => ({
	readAuthSession: readAuthSessionMock,
}))

vi.mock('@/app/api/consultas/_shared', () => ({
	painelb2bFetch: painelb2bFetchMock,
}))

describe('servicos mapping assistant script bridge', () => {
	beforeEach(() => {
		readAuthSessionMock.mockReset()
		painelb2bFetchMock.mockReset()
	})

	it('envia script e payload de teste para o preview de mapeamento', async () => {
		readAuthSessionMock.mockResolvedValue({
			token: 'token',
			currentTenantId: 'agileecommerce',
			currentUserId: 'user-1',
		})
		painelb2bFetchMock.mockResolvedValue({
			ok: true,
			status: 200,
			payload: { data: { script_decodificao: '{"id":10}' } },
		})

		const response = await POST(new NextRequest('http://localhost/api/erp-cadastros/servicos/mapping-assistant/test-script', {
			method: 'POST',
			body: JSON.stringify({
				script: '@Model.data[0].id',
				payload_teste: { data: [{ id: 10 }] },
				modo_transformacao_gateway: 'registro',
			}),
		}))
		const payload = await response.json()

		expect(response.status).toBe(200)
		expect(painelb2bFetchMock).toHaveBeenCalledWith('agilesync_build_script', expect.objectContaining({
			method: 'POST',
			body: expect.objectContaining({
				modo: 'gateway_mapeamento_preview',
				id_empresa: 'agileecommerce',
				script: '@Model.data[0].id',
				modo_transformacao_gateway: 'registro',
				payload: JSON.stringify({ data: [{ id: 10 }] }),
			}),
		}))
		expect(payload.data.resultado).toBe('{"id":10}')
	})

	it('recusa teste sem payload selecionado', async () => {
		readAuthSessionMock.mockResolvedValue({
			token: 'token',
			currentTenantId: 'agileecommerce',
			currentUserId: 'user-1',
		})

		const response = await POST(new NextRequest('http://localhost/api/erp-cadastros/servicos/mapping-assistant/test-script', {
			method: 'POST',
			body: JSON.stringify({ script: '@Model.id', payload_teste: null }),
		}))

		expect(response.status).toBe(400)
		expect(painelb2bFetchMock).not.toHaveBeenCalled()
	})
})
