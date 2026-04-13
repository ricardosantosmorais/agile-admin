import { httpClient } from '@/src/services/http/http-client';
import { normalizeIntegracaoComErpRotinasIntegradasResponse } from '@/src/features/integracao-com-erp-rotinas-integradas/services/integracao-com-erp-rotinas-integradas-mappers';
import type {
	IntegracaoComErpRotinasIntegradasFilters,
	IntegracaoComErpRotinasIntegradasResponse,
} from '@/src/features/integracao-com-erp-rotinas-integradas/services/integracao-com-erp-rotinas-integradas-types';

function buildListParams(filters: IntegracaoComErpRotinasIntegradasFilters) {
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

export const integracaoComErpRotinasIntegradasClient = {
	async list(filters: IntegracaoComErpRotinasIntegradasFilters): Promise<IntegracaoComErpRotinasIntegradasResponse> {
		const params = buildListParams(filters);
		const payload = await httpClient<unknown>(`/api/integracao-com-erp/rotinas-integradas?${params.toString()}`, {
			method: 'GET',
			cache: 'no-store',
		});

		return normalizeIntegracaoComErpRotinasIntegradasResponse(payload, {
			page: filters.page,
			perPage: filters.perPage,
		});
	},
};
