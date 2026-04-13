import { describe, expect, it } from 'vitest';
import {
	buildDirtyIntegracaoComErpParametersPayload,
	mapIntegracaoComErpFieldsToBaseDefinitions,
	normalizeIntegracaoComErpConfigRecord,
	type IntegracaoComErpConfigFieldDefinition,
} from '@/src/lib/integracao-com-erp-parameter-form';

describe('integracao-com-erp-parameter-form', () => {
	it('normaliza schema dinâmico com campos enum, texto e secreto', () => {
		const result = normalizeIntegracaoComErpConfigRecord({
			schema: {
				data: [
					{
						chave: 'omie_codigo_app',
						nome: 'Código do app',
						descricao: 'Identificador da aplicação.',
						tipo_entrada: 'texto',
						ordem: 2,
					},
					{
						chave: 'omie_app_secret',
						nome: 'App Secret',
						descricao: 'Segredo da aplicação.',
						tipo_entrada: 'livre',
						tipo_valor: 'senha',
						ordem: 3,
					},
					{
						chave: 'erp_api_ambiente',
						nome: 'Ambiente',
						descricao: 'Ambiente de execução.',
						tipo_entrada: 'combo',
						fonte_dados: 'lista_fixa',
						dados: JSON.stringify([
							{ value: 'sandbox', text: 'Sandbox' },
							{ value: 'production', text: 'Produção' },
						]),
						ordem: 1,
					},
				],
			},
			parameters: {
				data: [
					{
						chave: 'omie_app_secret',
						parametros: 'omie-secret-mask',
						created_at: '2026-04-10 08:30:00',
						usuario: { nome: 'Administrador' },
					},
					{
						chave: 'erp_api_ambiente',
						parametros: 'sandbox',
					},
				],
			},
			company: {
				data: [
					{
						id: '77',
						codigo: '117',
						id_template: '12',
						erp: 'omie',
						token_ativacao: 'tenant-token',
					},
				],
			},
		});

		expect(result.fields.map((field) => ({ key: field.key, type: field.type }))).toEqual([
			{ key: 'erp_api_ambiente', type: 'enum' },
			{ key: 'omie_codigo_app', type: 'text' },
			{ key: 'omie_app_secret', type: 'secret' },
		]);
		expect(result.values.omie_app_secret).toBe('omie-secret-mask');
		expect(result.metadata.omie_app_secret).toEqual({ updatedAt: '2026-04-10 08:30:00', updatedBy: 'Administrador' });
		expect(result.company).toEqual({
			id: '77',
			codigo: '117',
			idTemplate: '12',
			erp: 'omie',
			tokenAtivacao: 'tenant-token',
		});
	});

	it('serializa apenas campos alterados e não reenvia segredo vazio', () => {
		const fields: IntegracaoComErpConfigFieldDefinition[] = [
			{ key: 'tipo_banco_dados', label: 'Tipo', description: '', type: 'enum', options: [], order: 1 },
			{ key: 'senha_banco_dados', label: 'Senha', description: '', type: 'secret', options: [], order: 2 },
			{ key: 'string_banco_dados', label: 'String', description: '', type: 'text', options: [], order: 3 },
		];

		const payload = buildDirtyIntegracaoComErpParametersPayload(
			fields,
			{
				tipo_banco_dados: 'oracle',
				senha_banco_dados: 'masked-secret',
				string_banco_dados: '',
			},
			{
				tipo_banco_dados: 'postgresql',
				senha_banco_dados: '',
				string_banco_dados: 'Host=erp;Port=5432;',
			},
			'2026-04-10 09:00:00',
		);

		expect(payload).toEqual([
			{ id_filial: null, chave: 'versao', parametros: '2026-04-10 09:00:00', integracao: 1, criptografado: 0 },
			{ id_filial: null, chave: 'tipo_banco_dados', parametros: 'postgresql', integracao: 1, criptografado: 0 },
			{ id_filial: null, chave: 'string_banco_dados', parametros: 'Host=erp;Port=5432;', integracao: 1, criptografado: 0 },
		]);
	});

	it('projeta campos para a base compartilhada preservando seção', () => {
		const mapped = mapIntegracaoComErpFieldsToBaseDefinitions(
			[{ key: 'tipo_banco_dados', label: 'Tipo', description: 'Tipo do banco.', type: 'enum', options: [{ value: 'mysql', label: 'MySQL' }], order: 1 }],
			'connection',
		);

		expect(mapped).toEqual([
			{
				key: 'tipo_banco_dados',
				section: 'connection',
				type: 'enum',
				label: 'Tipo',
				helper: 'Tipo do banco.',
				options: [{ value: 'mysql', label: 'MySQL' }],
				layoutClassName: undefined,
				includeEmptyOption: undefined,
				inputMode: undefined,
				placeholder: undefined,
			},
		]);
	});
});
