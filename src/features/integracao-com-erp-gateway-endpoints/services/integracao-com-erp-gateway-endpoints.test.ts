import { describe, expect, it } from 'vitest'
import { buildGatewayEndpointCollectionParams, buildGatewayEndpointPayload, normalizeGatewayEndpointRecord } from './integracao-com-erp-gateway-endpoints'

describe('integracao-com-erp-gateway-endpoints', () => {
	it('normaliza gateway e verbo', () => {
		const record = normalizeGatewayEndpointRecord({ id: '1', id_gateway: '2', 'gateways.nome': 'Auth', endpoint: '/token', verbo: 'POST', ativo: '1' })
		expect(record).toMatchObject({
			id: '1',
			id_gateway_lookup: { id: '2', label: 'Auth' },
			verbo: 'post',
			ativo: true,
		})
	})

	it('envia boolean como 1/0 e mantém campos opcionais nulos', () => {
		expect(buildGatewayEndpointPayload({ id_gateway: '2', endpoint: '/x', verbo: 'GET', ativo: false, body: '' })).toMatchObject({
			id_gateway: '2',
			endpoint: '/x',
			verbo: 'get',
			ativo: 0,
			body: null,
		})
	})

	it('monta filtros de listagem com join de gateway', () => {
		const params = buildGatewayEndpointCollectionParams({ page: 1, perPage: 15, orderBy: 'endpoint', sort: 'asc', id_gateway: '4', 'endpoint::lk': 'pedido' })
		expect(params.get('join')).toBe('gateways:nome,id')
		expect(params.get('id_gateway')).toBe('4')
		expect(params.get('endpoint:lk')).toBe('pedido')
	})
})
