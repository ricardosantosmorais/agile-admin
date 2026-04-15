import { httpClient } from '@/src/services/http/http-client';
import type { AtualizacoesGeraisFilters, AtualizacoesGeraisResponse } from '@/src/features/atualizacoes-gerais/services/atualizacoes-gerais-types';

function buildParams(filters: AtualizacoesGeraisFilters) {
	const params = new URLSearchParams({
		limit: '200',
	});

	for (const [key, value] of Object.entries(filters)) {
		if (value.trim()) {
			params.set(key, value.trim());
		}
	}

	return params;
}

export const DEFAULT_ATUALIZACOES_GERAIS_FILTERS: AtualizacoesGeraisFilters = {
	plataforma: '',
	tipo: '',
	mesInicio: '',
	mesFim: '',
	busca: '',
};

export const atualizacoesGeraisClient = {
	list(filters: AtualizacoesGeraisFilters) {
		return httpClient<AtualizacoesGeraisResponse>(`/api/atualizacoes-gerais?${buildParams(filters).toString()}`, {
			method: 'GET',
			cache: 'no-store',
		});
	},
};
