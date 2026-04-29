import { describe, expect, it } from 'vitest'
import { buildInterfaceConsultaCollectionParams, normalizeInterfaceConsultaRecord } from './integracao-com-erp-interfaces-consulta'

describe('integracao-com-erp-interfaces-consulta', () => {
	it('usa a tabela como interface de consulta', () => {
		const record = normalizeInterfaceConsultaRecord({ id: '10', nome: 'clientes' })
		expect(record).toMatchObject({ id: '10', id_tabela: '10', nome: 'clientes' })
	})

	it('mantém order/sort para listagem de tabelas', () => {
		const params = buildInterfaceConsultaCollectionParams({ page: 1, perPage: 15, orderBy: 'nome', sort: 'asc', id: '', 'nome::lk': 'cli' })
		expect(params.get('order')).toBe('nome')
		expect(params.get('sort')).toBe('asc')
		expect(params.get('nome:lk')).toBe('cli')
	})
})
