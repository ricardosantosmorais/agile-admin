import { describe, expect, it } from 'vitest'
import {
	buildParametroGrupoCollectionParams,
	buildParametroGrupoPayload,
	normalizeParametroGrupoRecord,
} from '@/src/features/integracao-com-erp-parametros-grupo/services/integracao-com-erp-parametros-grupo'

describe('integracao-com-erp-parametros-grupo', () => {
	it('normaliza o registro carregado para o formulário', () => {
		expect(
			normalizeParametroGrupoRecord({
				id: 5 as unknown as string,
				nome: '  Grupo principal  ',
				ordem: 10 as unknown as string,
			}),
		).toMatchObject({
			id: '5',
			nome: 'Grupo principal',
			ordem: '10',
		})
	})

	it('monta o payload de escrita no formato esperado', () => {
		expect(
			buildParametroGrupoPayload({
				id: ' ',
				nome: ' Grupo novo ',
				ordem: ' 7 ',
			}),
		).toMatchObject({
			nome: 'Grupo novo',
			ordem: '7',
		})
	})

	it('traduz os filtros do v2 para o contrato do legado/API', () => {
		expect(
			buildParametroGrupoCollectionParams({
				page: 2,
				perPage: 30,
				orderBy: 'ordem',
				sort: 'desc',
				id: '9',
				'nome::lk': 'grupo',
				ordem: '12',
			}).toString(),
		).toBe('page=2&perpage=30&order=ordem&sort=desc&id=9&nome%3Alk=grupo&ordem=12')
	})
})
