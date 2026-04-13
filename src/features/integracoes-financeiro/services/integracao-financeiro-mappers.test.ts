/**
 * Testes unitários para mappers de Integrações > Financeiro
 */

import { describe, it, expect } from 'vitest';
import { normalizeIntegracaoFinanceiroRecord, buildIntegracaoFinanceiroSavePayload } from './integracao-financeiro-mappers';
import type { ClearSaleConfig, FinanceiroGatewayBranchRow, KondutoConfig } from '../types/integracao-financeiro.types';

describe('integracao-financeiro-mappers', () => {
	describe('normalizeIntegracaoFinanceiroRecord', () => {
		it('deve normalizar um payload vazio corretamente', () => {
			const payload = {
				parameters: { data: [] },
				branches: { data: [] },
				gateways: { data: [] },
			};

			const result = normalizeIntegracaoFinanceiroRecord(payload);

			expect(result.gateways).toEqual([]);
			expect(result.branches).toEqual([]);
			expect(result.clearSale).toEqual({
				ambiente: '',
				login: '',
				senha: '',
				fingerprint: '',
				modoBb2B2c: '',
				customSla: '',
				enviaPix: '',
			});
			expect(result.konduto).toEqual({
				ambiente: '',
				chavePublica: '',
				chavePrivada: '',
			});
		});

		it('deve normalizar parâmetros de ClearSale corretamente', () => {
			const payload = {
				parameters: {
					data: [
						{ chave: 'clearsale_ambiente', parametros: 'producao', id_filial: null, usuario: { nome: 'João' }, created_at: '2025-01-01 10:00:00' },
						{ chave: 'clearsale_login', parametros: 'meu_login', id_filial: null, usuario: { nome: 'João' }, created_at: '2025-01-01 10:00:00' },
						{ chave: 'clearsale_b2b_b2c', parametros: 'B2C', id_filial: null, usuario: { nome: 'João' }, created_at: '2025-01-01 10:00:00' },
					],
				},
				branches: { data: [] },
				gateways: { data: [] },
			};

			const result = normalizeIntegracaoFinanceiroRecord(payload);

			expect(result.clearSale.ambiente).toBe('producao');
			expect(result.clearSale.login).toBe('meu_login');
			expect(result.clearSale.modoBb2B2c).toBe('B2C');
			expect(result.clearSaleMetadata.ambiente?.updatedAt).toBe('2025-01-01 10:00:00');
			expect(result.clearSaleMetadata.ambiente?.updatedBy).toBe('João');
		});

		it('deve normalizar gateways de pagamento corretamente', () => {
			const payload = {
				parameters: { data: [] },
				branches: {
					data: [{ id: 'filial-1', nome_fantasia: 'Filial Centro' }],
				},
				gateways: {
					data: [
						{ id: 'gw-1', nome: 'Pagar.me', tipo: 'cartao_credito', created_at: '2025-01-01 10:00:00' },
						{ id: 'gw-2', nome: 'Stone', tipo: 'boleto_antecipado', created_at: '2025-01-01 10:00:00' },
					],
				},
			};

			const result = normalizeIntegracaoFinanceiroRecord(payload);

			expect(result.gateways).toHaveLength(2);
			expect(result.gateways[0]).toEqual({
				id: 'gw-1',
				nome: 'Pagar.me',
				tipo: 'cartao_credito',
				createdAt: '2025-01-01 10:00:00',
			});
		});

		it('deve normalizar gateways por filial corretamente', () => {
			const payload = {
				parameters: {
					data: [
						{ chave: 'id_gateway_pagamento_boleto_antecipado', parametros: 'gw-1', id_filial: 'filial-1', usuario: { nome: 'João' }, created_at: '2025-01-01 10:00:00' },
						{ chave: 'id_gateway_pagamento_cartao_credito', parametros: 'gw-2', id_filial: 'filial-1', usuario: { nome: 'João' }, created_at: '2025-01-01 10:00:00' },
					],
				},
				branches: {
					data: [{ id: 'filial-1', nome_fantasia: 'Filial Centro' }],
				},
				gateways: { data: [] },
			};

			const result = normalizeIntegracaoFinanceiroRecord(payload);

			expect(result.branches).toHaveLength(1);
			expect(result.branches[0]).toEqual({
				id: 'filial-1',
				nome: 'Filial Centro',
				gatewayBoleto: 'gw-1',
				gatewayCartao: 'gw-2',
				gatewayPix: '',
				updatedAtBoleto: expect.objectContaining({ updatedAt: '2025-01-01 10:00:00', updatedBy: 'João' }),
				updatedAtCartao: expect.objectContaining({ updatedAt: '2025-01-01 10:00:00', updatedBy: 'João' }),
				updatedAtPix: expect.objectContaining({ updatedAt: '', updatedBy: '' }),
			});
		});
	});

	describe('buildIntegracaoFinanceiroSavePayload', () => {
		it('deve construir payload com versão e parâmetros globais', () => {
			const branches: FinanceiroGatewayBranchRow[] = [];
			const clearSale: ClearSaleConfig = {
				ambiente: 'producao',
				login: 'test_login',
				senha: '',
				fingerprint: 'test_fp',
				modoBb2B2c: 'B2C',
				customSla: '30',
				enviaPix: 'N',
			};
			const konduto: KondutoConfig = {
				ambiente: 'teste',
				chavePublica: 'pub_key',
				chavePrivada: '',
			};

			const result = buildIntegracaoFinanceiroSavePayload(branches, clearSale, konduto);

			// Deve incluir versão
			expect(result.some((p) => p.chave === 'versao')).toBe(true);

			// Deve incluir ClearSale
			expect(result.some((p) => p.chave === 'clearsale_ambiente' && p.parametros === 'producao')).toBe(true);
			expect(result.some((p) => p.chave === 'clearsale_login' && p.parametros === 'test_login')).toBe(true);
			expect(result.some((p) => p.chave === 'clearsale_fingerprint' && p.parametros === 'test_fp')).toBe(true);

			// Deve incluir Konduto
			expect(result.some((p) => p.chave === 'konduto_ambiente' && p.parametros === 'teste')).toBe(true);
			expect(result.some((p) => p.chave === 'konduto_chave_publica' && p.parametros === 'pub_key')).toBe(true);
		});

		it('deve encriptar senha de ClearSale quando includeSelected', () => {
			const branches: FinanceiroGatewayBranchRow[] = [];
			const clearSale: ClearSaleConfig = {
				ambiente: '',
				login: '',
				senha: 'minha_senha',
				fingerprint: '',
				modoBb2B2c: '',
				customSla: '',
				enviaPix: '',
			};
			const konduto: KondutoConfig = {
				ambiente: '',
				chavePublica: '',
				chavePrivada: '',
			};

			const result = buildIntegracaoFinanceiroSavePayload(branches, clearSale, konduto, {
				includeClearSaleSenha: true,
			});

			// Deve incluir senha com flag de criptografia
			const senhaParam = result.find((p) => p.chave === 'clearsale_senha');
			expect(senhaParam).toEqual({
				id_filial: null,
				chave: 'clearsale_senha',
				parametros: 'minha_senha',
				integracao: 0,
				criptografado: 1,
			});
		});

		it('deve não incluir senha se não solicitado', () => {
			const branches: FinanceiroGatewayBranchRow[] = [];
			const clearSale: ClearSaleConfig = {
				ambiente: '',
				login: '',
				senha: 'minha_senha',
				fingerprint: '',
				modoBb2B2c: '',
				customSla: '',
				enviaPix: '',
			};
			const konduto: KondutoConfig = {
				ambiente: '',
				chavePublica: '',
				chavePrivada: '',
			};

			const result = buildIntegracaoFinanceiroSavePayload(branches, clearSale, konduto, {
				includeClearSaleSenha: false,
			});

			// Não deve incluir senha
			expect(result.find((p) => p.chave === 'clearsale_senha')).toBeUndefined();
		});

		it('deve construir payload com gateways por filial', () => {
			const branches: FinanceiroGatewayBranchRow[] = [
				{ id: 'filial-1', nome: 'Centro', gatewayBoleto: 'gw-1', gatewayCartao: 'gw-2', gatewayPix: 'gw-3' },
				{ id: 'filial-2', nome: 'Zona Leste', gatewayBoleto: '', gatewayCartao: 'gw-4', gatewayPix: '' },
			];
			const clearSale: ClearSaleConfig = {
				ambiente: '',
				login: '',
				senha: '',
				fingerprint: '',
				modoBb2B2c: '',
				customSla: '',
				enviaPix: '',
			};
			const konduto: KondutoConfig = {
				ambiente: '',
				chavePublica: '',
				chavePrivada: '',
			};

			const result = buildIntegracaoFinanceiroSavePayload(branches, clearSale, konduto);

			// Filial 1
			expect(result).toContainEqual({
				id_filial: 'filial-1',
				chave: 'id_gateway_pagamento_boleto_antecipado',
				parametros: 'gw-1',
				integracao: 0,
				criptografado: 0,
			});
			expect(result).toContainEqual({
				id_filial: 'filial-1',
				chave: 'id_gateway_pagamento_cartao_credito',
				parametros: 'gw-2',
				integracao: 0,
				criptografado: 0,
			});

			// Filial 2
			expect(result).toContainEqual({
				id_filial: 'filial-2',
				chave: 'id_gateway_pagamento_boleto_antecipado',
				parametros: '',
				integracao: 0,
				criptografado: 0,
			});
		});
	});
});
