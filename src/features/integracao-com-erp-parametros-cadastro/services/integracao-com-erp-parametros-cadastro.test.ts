import { describe, expect, it } from 'vitest'
import {
	buildParametroCadastroCollectionParams,
	buildParametroCadastroPayload,
	normalizeParametroCadastroRecord,
} from '@/src/features/integracao-com-erp-parametros-cadastro/services/integracao-com-erp-parametros-cadastro'

describe('integracao-com-erp-parametros-cadastro', () => {
	it('normaliza o registro carregado para o formulário', () => {
		expect(
			normalizeParametroCadastroRecord({
				id: 9 as unknown as string,
				id_parametro_grupo: 12 as unknown as string,
				id_template: 4 as unknown as string,
				'parametros_grupo.nome': ' Banco de dados ',
				'templates.nome': ' Winthor ',
				chave: '  token_api  ',
				nome: '  Token API  ',
				tipo_entrada: 'combo',
				tipo_valor: 'texto',
				fonte_dados: 'lista_endpoint',
				dados: '  /endpoint  ',
				ativo: 1,
				obrigatorio: '0',
				editavel: '1',
				ordem: 3 as unknown as string,
			}),
		).toMatchObject({
			id: '9',
			id_parametro_grupo: '12',
			id_template: '4',
			id_parametro_grupo_lookup: {
				id: '12',
				label: 'Banco de dados',
			},
			id_template_lookup: {
				id: '4',
				label: 'Winthor',
			},
			chave: 'token_api',
			nome: 'Token API',
			fonte_dados: 'lista_endpoint',
			dados: '/endpoint',
			ativo: true,
			obrigatorio: false,
			editavel: true,
			ordem: '3',
		})
	})

	it('monta o payload de escrita limpando campos opcionais e condicionais', () => {
		expect(
			buildParametroCadastroPayload({
				id: ' ',
				ativo: true,
				obrigatorio: false,
				editavel: true,
				id_parametro_grupo: '5',
				id_template: ' ',
				chave: ' chave ',
				nome: ' Nome parâmetro ',
				tipo_entrada: 'livre',
				tipo_valor: 'numero',
				fonte_dados: 'lista_fixa',
				dados: 'ignorar',
				ordem: '',
				descricao: ' ',
				valor_default: ' ',
			}),
		).toMatchObject({
			ativo: true,
			obrigatorio: false,
			editavel: true,
			id_parametro_grupo: 5,
			id_template: null,
			chave: 'chave',
			nome: 'Nome parâmetro',
			tipo_entrada: 'livre',
			tipo_valor: 'numero',
			fonte_dados: null,
			dados: null,
			ordem: 0,
			descricao: null,
			valor_default: null,
		})
	})

	it('traduz os filtros do v2 para o contrato do legado/API', () => {
		expect(
			buildParametroCadastroCollectionParams({
				page: 2,
				perPage: 30,
				orderBy: 'ordem',
				sort: 'desc',
				id: '7',
				id_parametro_grupo: '9',
				id_template: '4',
				'chave::lk': 'token',
				'nome::lk': 'parâmetro',
				tipo_entrada: 'combo',
				tipo_valor: 'texto',
				fonte_dados: 'lista_endpoint',
				ativo: '1',
				ordem: '11',
			}).toString(),
		).toBe('page=2&perpage=30&order=ordem&sort=desc&id=7&id_parametro_grupo=9&id_template=4&chave%3Alk=token&nome%3Alk=par%C3%A2metro&tipo_entrada=combo&tipo_valor=texto&fonte_dados=lista_endpoint&ordem=11&ativo=true')
	})
})
