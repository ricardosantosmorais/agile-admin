import { describe, expect, it } from 'vitest'
import type { CrudRecord } from '@/src/components/crud-base/types'
import { buildGatewayCollectionParams, buildGatewayPayload, GATEWAY_AUTH_OPTIONS, normalizeGatewayRecord } from './integracao-com-erp-gateways'

describe('integracao-com-erp-gateways', () => {
	it('normaliza labels do template e valores de verbo/acesso', () => {
		const record = normalizeGatewayRecord({ id: '7', nome: ' API ', tipo_verbo: 'POST', nivel_acesso: 'PUBLICO', id_template: '3', 'templates.nome': 'Base' })
		expect(record).toMatchObject({
			id: '7',
			nome: 'API',
			tipo_verbo: 'post',
			nivel_acesso: 'publico',
			id_template_lookup: { id: '3', label: 'Base' },
		})
	})

	it('monta payload compatível com o legado', () => {
		expect(buildGatewayPayload({ id: '9', nome: 'Gateway', tipo_autenticacao: 'Bearer', tipo_verbo: 'GET', nivel_acesso: 'Privado', id_template: '', url: '' } as CrudRecord)).toMatchObject({
			id: '9',
			nome: 'Gateway',
			tipo_autenticacao: 'Bearer',
			tipo_verbo: 'get',
			nivel_acesso: 'privado',
			id_template: null,
			url: null,
		})
	})

	it('usa order/sort e filtros esperados pela API Agile v2', () => {
		const params = buildGatewayCollectionParams({ page: 2, perPage: 30, orderBy: 'templates.nome', sort: 'desc', id: '', 'nome::lk': 'api' })
		expect(params.get('order')).toBe('templates.nome')
		expect(params.get('sort')).toBe('desc')
		expect(params.get('nome:lk')).toBe('api')
		expect(params.get('join')).toBe('templates:nome,id')
	})

	it('expoe OAuth2Cookie como tipo de autenticacao legado', () => {
		expect(GATEWAY_AUTH_OPTIONS).toContain('OAuth2Cookie')
	})
})
