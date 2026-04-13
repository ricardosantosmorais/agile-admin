/**
 * HTTP Client para Integrações > Financeiro
 *
 * Responsável por fazer requisições à bridge em app/api/integracoes/financeiro
 */

import type { ClearSaleConfig, FinanceiroGatewayBranchRow, IntegracaoFinanceiroRecord, KondutoConfig } from '../types/integracao-financeiro.types';
import { buildIntegracaoFinanceiroSavePayload, normalizeIntegracaoFinanceiroRecord } from './integracao-financeiro-mappers';
import { httpClient } from '@/src/services/http/http-client';

/**
 * Cliente HTTP para o módulo de integrações financeiras
 */
export const integracaoFinanceiroClient = {
	/**
	 * Carrega as configurações atuais (GET)
	 */
	async get(): Promise<IntegracaoFinanceiroRecord> {
		const payload = await httpClient<unknown>('/api/integracoes/financeiro', {
			method: 'GET',
			cache: 'no-store',
		});
		return normalizeIntegracaoFinanceiroRecord(payload);
	},

	/**
	 * Salva as configurações (POST)
	 *
	 * @param branches - Configurações de gateways por filial
	 * @param clearSale - Configurações do ClearSale
	 * @param konduto - Configurações do Konduto
	 * @param options - Opções de validação de campos sensíveis
	 */
	async save(
		branches: FinanceiroGatewayBranchRow[],
		clearSale: ClearSaleConfig,
		konduto: KondutoConfig,
		options?: {
			includeClearSaleSenha?: boolean;
			includeKondutoChavePrivada?: boolean;
		},
	): Promise<unknown> {
		const parameters = buildIntegracaoFinanceiroSavePayload(branches, clearSale, konduto, options);

		return httpClient('/api/integracoes/financeiro', {
			method: 'POST',
			body: JSON.stringify({ parameters }),
			cache: 'no-store',
		});
	},
};
