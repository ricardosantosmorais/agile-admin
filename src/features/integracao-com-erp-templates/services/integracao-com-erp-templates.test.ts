import { describe, expect, it } from 'vitest'
import {
	buildTemplateCollectionParams,
	buildTemplatePayload,
	normalizeTemplateRecord,
} from '@/src/features/integracao-com-erp-templates/services/integracao-com-erp-templates'

describe('integracao-com-erp-templates', () => {
	it('normaliza o registro carregado para o formulário', () => {
		expect(
			normalizeTemplateRecord({
				id: 9 as unknown as string,
				id_erp: 2 as unknown as string,
				'erps.nome': 'APS',
				codigo: '  APS-001 ',
				nome: '  Template APS  ',
			}),
		).toMatchObject({
			id: '9',
			id_erp: '2',
			codigo: 'APS-001',
			nome: 'Template APS',
			id_erp_lookup: {
				id: '2',
				label: 'APS',
			},
		})
	})

	it('monta o payload de escrita no formato esperado', () => {
		expect(
			buildTemplatePayload({
				id: '  ',
				id_erp: ' 3 ',
				codigo: ' TMP ',
				nome: ' Template 3 ',
			}),
		).toMatchObject({
			id_erp: '3',
			codigo: 'TMP',
			nome: 'Template 3',
		})
	})

	it('traduz os filtros do v2 para o contrato do legado/API', () => {
		expect(
			buildTemplateCollectionParams({
				page: 1,
				perPage: 15,
				orderBy: 'erps.nome',
				sort: 'asc',
				id: '5',
				id_erp: '3',
				'codigo::lk': 'abc',
				'nome::lk': 'template',
			}).toString(),
		).toBe('page=1&perpage=15&order=erps.nome&sort=asc&join=erps%3Anome%2Cid&id=5&id_erp=3&codigo%3Alk=abc&nome%3Alk=template')
	})
})
