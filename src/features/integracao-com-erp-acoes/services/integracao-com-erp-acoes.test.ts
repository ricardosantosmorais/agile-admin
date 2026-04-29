import { describe, expect, it } from 'vitest'
import { buildAcaoPayload, normalizeAcaoRecord } from './integracao-com-erp-acoes'

describe('integracao-com-erp-acoes', () => {
	it('normaliza lookups principais', () => {
		const record = normalizeAcaoRecord({ id: '5', nome: 'Atualizar', ativo: '1', id_template: '1', 'templates.nome': 'Base', id_gateway: '9', 'gateways.nome': 'ERP' })
		expect(record).toMatchObject({
			ativo: true,
			id_template_lookup: { id: '1', label: 'Base' },
			id_gateway_lookup: { id: '9', label: 'ERP' },
		})
	})

	it('monta payload limpo para salvar', () => {
		expect(buildAcaoPayload({ nome: 'Ação', tipo: 'script', ativo: true, id_gateway: '', script: '' })).toMatchObject({
			nome: 'Ação',
			tipo: 'script',
			ativo: 1,
			id_gateway: null,
			script: null,
		})
	})
})
