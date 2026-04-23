import { describe, expect, it } from 'vitest'
import {
	buildScriptCollectionParams,
	buildScriptPayload,
	normalizeScriptLanguage,
	normalizeScriptRecord,
} from '@/src/features/integracao-com-erp-scripts/services/integracao-com-erp-scripts'

describe('integracao-com-erp-scripts', () => {
	it('normaliza o registro carregado para o formulário', () => {
		expect(
			normalizeScriptRecord({
				id: 5 as unknown as string,
				nome: ' Script pedido ',
				linguagem: ' SQLSERVER ',
				script: ' SELECT 1 ',
				SourceExpressionKey: ' abc ',
			}),
		).toMatchObject({
			id: '5',
			nome: 'Script pedido',
			linguagem: 'sqlserver',
			script: 'SELECT 1',
			SourceExpressionKey: 'abc',
		})
	})

	it('mantém fallback de linguagem conhecido', () => {
		expect(normalizeScriptLanguage('desconhecido')).toBe('javascript')
		expect(normalizeScriptLanguage('c#')).toBe('c#')
	})

	it('monta payload de escrita sem campos vazios opcionais', () => {
		expect(
			buildScriptPayload({
				id: '',
				nome: ' Script ',
				linguagem: 'json',
				script: ' { "ok": true } ',
				SourceExpressionKey: '',
			}),
		).toMatchObject({
			nome: 'Script',
			linguagem: 'json',
			script: '{ "ok": true }',
		})
	})

	it('traduz filtros do v2 para o contrato da API', () => {
		expect(
			buildScriptCollectionParams({
				page: 2,
				perPage: 30,
				orderBy: 'linguagem',
				sort: 'asc',
				id: '7',
				'nome::lk': 'pedido',
				'linguagem::lk': 'sql',
			}).toString(),
		).toBe('page=2&perpage=30&order=linguagem&sort=asc&id=7&nome%3Alk=pedido&linguagem%3Alk=sql')
	})
})
