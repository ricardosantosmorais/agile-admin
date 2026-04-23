import { describe, expect, it } from 'vitest'
import {
	buildQueryCollectionParams,
	buildQueryPayload,
	normalizeQueryRecord,
} from '@/src/features/integracao-com-erp-queries/services/integracao-com-erp-queries'

describe('integracao-com-erp-queries', () => {
	it('normaliza o registro carregado para a listagem e formulário', () => {
		expect(
			normalizeQueryRecord({
				id: 17 as unknown as string,
				nome: '  Produtos por filial  ',
				id_template: 3 as unknown as string,
				'templates.nome': ' Winthor ',
				query: ' SELECT 1 ',
				hash: ' abc ',
				ativo: '1',
			}),
		).toMatchObject({
			id: '17',
			nome: 'Produtos por filial',
			id_template: '3',
			template_nome: 'Winthor',
			query: 'SELECT 1',
			hash: 'abc',
			ativo: true,
			id_template_lookup: {
				id: '3',
				label: 'Winthor',
			},
		})
	})

	it('monta o payload de escrita preservando os campos do contrato', () => {
		expect(
			buildQueryPayload({
				id: ' ',
				nome: ' Query teste ',
				id_template: ' 4 ',
				query: ' SELECT * FROM produtos ',
				hash: 'hash-atual',
				ativo: true,
			}),
		).toMatchObject({
			nome: 'Query teste',
			id_template: '4',
			query: 'SELECT * FROM produtos',
			hash: 'hash-atual',
			ativo: true,
		})
	})

	it('traduz os filtros do v2 para o contrato da API', () => {
		expect(
			buildQueryCollectionParams({
				page: 2,
				perPage: 30,
				orderBy: 'nome',
				sort: 'desc',
				id: '9',
				'nome::lk': 'produto',
				'template_nome::lk': '',
				id_template: '3',
				ativo: '1',
			}).toString(),
		).toBe('page=2&perpage=30&order=nome&sort=desc&id=9&nome%3Alk=produto&id_template=3&ativo=true')
	})
})
