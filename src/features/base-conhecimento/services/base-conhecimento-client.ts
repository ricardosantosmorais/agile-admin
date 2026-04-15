import { httpClient } from '@/src/services/http/http-client';
import type { BaseConhecimentoFilters, BaseConhecimentoResponse } from '@/src/features/base-conhecimento/services/base-conhecimento-types';

function buildParams(filters: BaseConhecimentoFilters) {
	const params = new URLSearchParams({
		page: String(filters.page),
		perPage: String(filters.perPage),
	});

	if (filters.phrase.trim()) {
		params.set('phrase', filters.phrase.trim());
	}

	return params;
}

export const DEFAULT_BASE_CONHECIMENTO_FILTERS: BaseConhecimentoFilters = {
	page: 1,
	perPage: 15,
	phrase: '',
};

export const baseConhecimentoClient = {
	list(filters: BaseConhecimentoFilters) {
		return httpClient<BaseConhecimentoResponse>(`/api/base-conhecimento?${buildParams(filters).toString()}`, {
			method: 'GET',
			cache: 'no-store',
		});
	},
};
