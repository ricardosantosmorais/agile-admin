import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { POST } from '@/app/api/erp-cadastros/interfaces-consulta/[id]/template-form/route'

const { requireRootAgileSessionMock, postResourceMock } = vi.hoisted(() => ({
	requireRootAgileSessionMock: vi.fn(),
	postResourceMock: vi.fn(),
}))

vi.mock('@/app/api/erp-cadastros/_shared', () => ({
	requireRootAgileSession: requireRootAgileSessionMock,
}))

vi.mock('@/app/api/erp-cadastros/interfaces-consulta/_interface-consulta-shared', () => ({
	buildTemplateLinks: vi.fn(),
	fetchFirst: vi.fn(),
	jsonError: (payload: unknown, fallback: string, status = 400) => NextResponse.json({ message: payload instanceof Error ? payload.message : fallback }, { status }),
	loadCampos: vi.fn(),
	loadConsultaMaps: vi.fn(),
	loadEndpointsLookup: vi.fn(),
	loadGatewaysLookup: vi.fn(),
	loadQueriesLookup: vi.fn(),
	loadRetornoMaps: vi.fn(),
	loadTabela: vi.fn(),
	loadTemplatesLookup: vi.fn(),
	normalizeGatewayConsultaMap: (map: Record<string, unknown>, endpointId: string) => ({
		...map,
		id_gateway_endpoint: endpointId,
		modo_aplicacao_filtro: String(map.modo_aplicacao_filtro || 'remoto').trim(),
		modo_aplicacao_ordenacao: String(map.modo_aplicacao_ordenacao || 'remoto').trim(),
		resolucao_valor_config: String(map.resolucao_valor_config || '').trim(),
	}),
	postResource: postResourceMock,
	toBool: (value: unknown, fallback = false) => {
		const normalized = String(value ?? '').trim().toLowerCase()
		return normalized ? ['1', 'true', 'sim', 'yes'].includes(normalized) : fallback
	},
	toStringValue: (value: unknown) => String(value ?? '').trim(),
}))

describe('interface consulta template form bridge', () => {
	beforeEach(() => {
		requireRootAgileSessionMock.mockReset()
		postResourceMock.mockReset()
	})

	it('normalizes legacy consulta map fields before saving endpoint mappings', async () => {
		requireRootAgileSessionMock.mockResolvedValue({ token: 'token', currentTenantId: 'agileecommerce', currentUserId: 'user-1' })
		postResourceMock.mockImplementation(async (resource: string) => resource === 'gateways_endpoints' ? { id: '900' } : { id: '1' })

		const response = await POST(new NextRequest('http://localhost/api/erp-cadastros/interfaces-consulta/44/template-form', {
			method: 'POST',
			body: JSON.stringify({
				id_template: '7',
				tipo_fonte: 'endpoint_gateway',
				gateway_endpoint: { id_gateway: '3', endpoint: '/clientes', verbo: 'GET' },
				consulta_maps: [{ id_tabela_campo: '55', permite_filtro: true, permite_ordenacao: true }],
				retorno_maps: [],
			}),
		}), { params: Promise.resolve({ id: '44' }) })

		expect(response.status).toBe(200)
		expect(postResourceMock).toHaveBeenCalledWith(
			'gateways_endpoints_campos_consulta',
			expect.objectContaining({
				id_gateway_endpoint: '900',
				id_tabela_campo: '55',
				modo_aplicacao_filtro: 'remoto',
				modo_aplicacao_ordenacao: 'remoto',
				resolucao_valor_config: '',
			}),
			'Falha ao salvar mapeamento de consulta.',
		)
	})
})
