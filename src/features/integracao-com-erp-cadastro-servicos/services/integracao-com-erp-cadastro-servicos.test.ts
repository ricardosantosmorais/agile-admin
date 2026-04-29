import { describe, expect, it } from 'vitest'
import { buildServicoCadastroPayload, normalizeServicoCadastroRecord } from './integracao-com-erp-cadastro-servicos'

describe('integracao-com-erp-cadastro-servicos', () => {
	it('normaliza template, endpoint e flags', () => {
		const record = normalizeServicoCadastroRecord({ id: '8', nome: 'Pedidos', ativo: '1', id_template: '1', 'templates.nome': 'Base', id_gateway_endpoint: '7', 'gateways_endpoints.endpoint': '/pedidos' })
		expect(record).toMatchObject({
			ativo: true,
			id_template_lookup: { id: '1', label: 'Base' },
			id_gateway_endpoint_lookup: { id: '7', label: '/pedidos' },
			modo_transformacao_gateway: 'registro',
		})
	})

	it('converte toggles para contrato legado', () => {
		expect(buildServicoCadastroPayload({ nome: 'Pedidos', tipo_objeto: 'query', ativo: true, carga_geral: true, obrigatorio: false })).toMatchObject({
			nome: 'Pedidos',
			tipo_objeto: 'query',
			ativo: 1,
			carga_geral: 1,
			obrigatorio: 0,
		})
	})
})
