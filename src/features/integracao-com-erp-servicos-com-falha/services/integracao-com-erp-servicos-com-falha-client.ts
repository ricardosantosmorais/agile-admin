import { httpClient } from '@/src/services/http/http-client';
import { normalizeIntegracaoComErpServicosComFalhaResponse } from '@/src/features/integracao-com-erp-servicos-com-falha/services/integracao-com-erp-servicos-com-falha-mappers';
import type {
	IntegracaoComErpServicosComFalhaCommandResult,
	IntegracaoComErpServicosComFalhaFilters,
	IntegracaoComErpServicosComFalhaResponse,
} from '@/src/features/integracao-com-erp-servicos-com-falha/services/integracao-com-erp-servicos-com-falha-types';

function buildListParams(filters: IntegracaoComErpServicosComFalhaFilters) {
	const params = new URLSearchParams({
		page: String(filters.page),
		perPage: String(filters.perPage),
		orderBy: filters.orderBy,
		sort: filters.sort,
	});

	for (const [key, value] of Object.entries(filters)) {
		if (['page', 'perPage', 'orderBy', 'sort'].includes(key)) {
			continue;
		}

		const normalized = String(value || '').trim();
		if (!normalized) {
			continue;
		}

		params.set(key, normalized);
	}

	return params;
}

export const integracaoComErpServicosComFalhaClient = {
	async list(filters: IntegracaoComErpServicosComFalhaFilters): Promise<IntegracaoComErpServicosComFalhaResponse> {
		const params = buildListParams(filters);
		const payload = await httpClient<unknown>(`/api/integracao-com-erp/servicos-com-falha?${params.toString()}`, {
			method: 'GET',
			cache: 'no-store',
		});

		return normalizeIntegracaoComErpServicosComFalhaResponse(payload, {
			page: filters.page,
			perPage: filters.perPage,
		});
	},
	async execute(ids: string[]): Promise<IntegracaoComErpServicosComFalhaCommandResult> {
		return httpClient<IntegracaoComErpServicosComFalhaCommandResult>('/api/integracao-com-erp/servicos-com-falha', {
			method: 'POST',
			cache: 'no-store',
			body: JSON.stringify({ action: 'execute', ids }),
		});
	},
	async reload(ids: string[]): Promise<IntegracaoComErpServicosComFalhaCommandResult> {
		return httpClient<IntegracaoComErpServicosComFalhaCommandResult>('/api/integracao-com-erp/servicos-com-falha', {
			method: 'POST',
			cache: 'no-store',
			body: JSON.stringify({ action: 'reload', ids }),
		});
	},
};
