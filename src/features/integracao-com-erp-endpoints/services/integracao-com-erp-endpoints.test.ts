import { describe, expect, it } from 'vitest'
import {
	buildEndpointCollectionParams,
	buildEndpointPayload,
	getEndpointReturnTypeLabel,
	normalizeEndpointRecord,
} from '@/src/features/integracao-com-erp-endpoints/services/integracao-com-erp-endpoints'

describe('integracao-com-erp-endpoints', () => {
	it('normaliza booleans e campos de exibição do endpoint', () => {
		expect(
			normalizeEndpointRecord({
				id: 12 as unknown as string,
				nome: ' Pedidos ',
				descricao: ' Consulta de pedidos ',
				tipo_retorno: ' view ',
				publico: '1',
				ativo: 'true',
				id_query: 7,
				'queries.nome': ' Q_Pedidos ',
			}),
		).toMatchObject({
			id: '12',
			nome: 'Pedidos',
			descricao: 'Consulta de pedidos',
			tipo_retorno: 'view',
			publico: true,
			ativo: true,
			id_query: '7',
			query_nome: 'Q_Pedidos',
		})
	})

	it('monta payload limpando campos que não pertencem ao tipo de retorno', () => {
		expect(
			buildEndpointPayload({
				id: '9',
				nome: ' Produtos ',
				descricao: ' Produtos ERP ',
				tipo_retorno: 'tabela',
				id_query: '55',
				fonte_dados: 'agilesync',
				id_tabela: '3',
				implementacao_nome: 'LegacyEndpoint',
				publico: true,
				ativo: false,
				limite: '10',
			}),
		).toMatchObject({
			id: '9',
			nome: 'Produtos',
			descricao: 'Produtos ERP',
			tipo_retorno: 'tabela',
			id_query: '',
			fonte_dados: '',
			id_tabela: '3',
			implementacao_nome: '',
			publico: true,
			ativo: false,
			limite: '10',
		})
	})

	it('traduz filtros do v2 para o contrato legado', () => {
		expect(
			buildEndpointCollectionParams({
				page: 2,
				perPage: 30,
				orderBy: 'nome',
				sort: 'desc',
				id: '8',
				'nome::lk': 'pedido',
				'tipo_retorno::lk': 'view',
				publico: '1',
				ativo: '0',
			}).toString(),
		).toBe('page=2&perpage=30&order=nome&sort=desc&id=8&nome%3Alk=pedido&tipo_retorno%3Alk=view&publico=1&ativo=0')
	})

	it('resolve labels dos tipos de retorno conhecidos', () => {
		expect(getEndpointReturnTypeLabel('implementacao')).toBe('Implementação')
		expect(getEndpointReturnTypeLabel('custom')).toBe('custom')
	})
})
