import { describe, expect, it } from 'vitest'
import {
	buildErpCollectionParams,
	buildErpPayload,
	normalizeErpRecord,
} from '@/src/features/integracao-com-erp-erps/services/integracao-com-erp-erps'

describe('integracao-com-erp-erps', () => {
	it('normaliza o registro carregado do legado para o formulário', () => {
		expect(
			normalizeErpRecord({
				id: 12 as unknown as string,
				codigo: '  TOTVS  ',
				nome: '  Totvs Protheus  ',
			}),
		).toMatchObject({
			id: '12',
			codigo: 'TOTVS',
			nome: 'Totvs Protheus',
		})
	})

	it('monta o payload de escrita sem id vazio e com strings aparadas', () => {
		expect(
			buildErpPayload({
				id: '   ',
				codigo: '  WINTHOR ',
				nome: '  WMS  ',
			}),
		).toMatchObject({
			codigo: 'WINTHOR',
			nome: 'WMS',
		})

		expect(buildErpPayload({ id: '7', codigo: 'SAP', nome: 'SAP B1' })).toMatchObject({
			id: '7',
			codigo: 'SAP',
			nome: 'SAP B1',
		})
	})

	it('traduz os filtros do v2 para o contrato do legado/API', () => {
		expect(
			buildErpCollectionParams({
				page: 2,
				perPage: 30,
				orderBy: 'codigo',
				sort: 'desc',
				id: '10',
				'codigo::lk': 'pro',
				'nome::lk': 'totvs',
			}).toString(),
		).toBe('page=2&perpage=30&order=codigo&sort=desc&id=10&codigo%3Alk=pro&nome%3Alk=totvs')
	})
})
