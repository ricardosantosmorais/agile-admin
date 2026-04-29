import { describe, expect, it } from 'vitest'
import { buildFuncionalidadePayload, buildFuncionalidadeTreeOptions, normalizeFuncionalidadeRecord } from '@/src/features/funcionalidades/services/funcionalidades-mappers'

describe('funcionalidades mappers', () => {
	it('normalizes legacy flags and parent label from api-v3 payload', () => {
		expect(normalizeFuncionalidadeRecord({
			id: 10,
			nome: 'Pedidos',
			ativo: 1,
			menu: 0,
			funcionalidade_pai: { id: 1, nome: 'Cadastros' },
		})).toMatchObject({
			id: '10',
			nome: 'Pedidos',
			ativo: true,
			menu: false,
			funcionalidade_pai_nome: 'Cadastros',
		})
	})

	it('normalizes parent label when api-v3 returns relation arrays or dotted fields', () => {
		expect(normalizeFuncionalidadeRecord({
			id: 11,
			nome: 'Submenu',
			id_funcionalidade_pai: 10,
			funcionalidade_pai: [{ id: 10, nome: 'Cadastros' }],
		})).toMatchObject({
			id_funcionalidade_pai: '10',
			funcionalidade_pai_nome: 'Cadastros',
			funcionalidade_pai_lookup: { id: '10', label: 'Cadastros' },
		})

		expect(normalizeFuncionalidadeRecord({
			id: 12,
			nome: 'Detalhe',
			funcionalidade_pai_id: 11,
			'funcionalidade_pai:nome': 'Submenu',
		})).toMatchObject({
			id_funcionalidade_pai: '11',
			funcionalidade_pai_nome: 'Submenu',
		})
	})

	it('keeps root parent as a visible lookup option', () => {
		expect(normalizeFuncionalidadeRecord({
			id: 1,
			nome: 'Cadastros',
			id_funcionalidade_pai: null,
		})).toMatchObject({
			id_funcionalidade_pai: null,
			funcionalidade_pai_lookup: {
				id: '__root__',
				label: '-- Raiz --',
			},
		})
	})

	it('maps legacy FontAwesome icon markup to the current icon key', () => {
		expect(normalizeFuncionalidadeRecord({
			id: 61,
			nome: 'Administração',
			icone: '<i class="far fa-users-crown"></i>',
		})).toMatchObject({
			icone: 'crown',
		})
	})

	it('keeps the legacy save payload semantics', () => {
		expect(buildFuncionalidadePayload({
			id: '3',
			nome: 'Editar',
			ativo: true,
			menu: false,
			acao: '',
			id_funcionalidade_pai: '',
			posicao: '2',
			nivel: '1',
		})).toMatchObject({
			id: '3',
			nome: 'Editar',
			ativo: true,
			menu: false,
			acao: null,
			id_funcionalidade_pai: null,
			posicao: 2,
			nivel: 1,
		})
	})

	it('builds indented parent options excluding the current record', () => {
		const options = buildFuncionalidadeTreeOptions([
			{ id: '1', nome: 'Cadastros', nivel: 1, posicao: 1 },
			{ id: '2', nome: 'Funcionalidades', nivel: 2, posicao: 1, id_funcionalidade_pai: '1' },
			{ id: '3', nome: 'Campos', nivel: 3, posicao: 1, id_funcionalidade_pai: '2' },
		], '2')

		expect(options).toEqual([
			{ id: '1', label: 'Cadastros - 1', description: 'Nível 1' },
			{ id: '3', label: '    Campos - 3', description: 'Nível 3' },
		])
	})
})
