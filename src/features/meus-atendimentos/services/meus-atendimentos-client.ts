import { httpClient } from '@/src/services/http/http-client';
import type {
	AtendimentoDetail,
	IntercomBindingRecord,
	MeusAtendimentosFilters,
	MeusAtendimentosListResponse,
} from '@/src/features/meus-atendimentos/services/meus-atendimentos-types';

function toUnixTimestamp(date: string, endOfDay = false) {
	if (!date) {
		return '';
	}

	const parsed = new Date(`${date}T${endOfDay ? '23:59:59' : '00:00:00'}`);
	return Number.isNaN(parsed.getTime()) ? '' : String(Math.floor(parsed.getTime() / 1000));
}

function buildListParams(filters: MeusAtendimentosFilters, startingAfter: string) {
	const params = new URLSearchParams({
		page: String(filters.page),
		perPage: String(filters.perPage),
	});

	if (filters.protocolo.trim()) {
		params.set('protocolo', filters.protocolo.trim());
	}
	if (filters.status.trim()) {
		params.set('status', filters.status.trim());
	}

	const dataInicio = toUnixTimestamp(filters.dataInicio);
	const dataFim = toUnixTimestamp(filters.dataFim, true);
	if (dataInicio) {
		params.set('dataInicio', dataInicio);
	}
	if (dataFim) {
		params.set('dataFim', dataFim);
	}
	if (startingAfter) {
		params.set('startingAfter', startingAfter);
	}

	return params;
}

export const DEFAULT_MEUS_ATENDIMENTOS_FILTERS: MeusAtendimentosFilters = {
	page: 1,
	perPage: 5,
	protocolo: '',
	status: '',
	dataInicio: '',
	dataFim: '',
};

export const meusAtendimentosClient = {
	list(filters: MeusAtendimentosFilters, startingAfter = '') {
		return httpClient<MeusAtendimentosListResponse>(`/api/meus-atendimentos?${buildListParams(filters, startingAfter).toString()}`, {
			method: 'GET',
			cache: 'no-store',
		});
	},
	getById(id: string) {
		return httpClient<AtendimentoDetail>(`/api/meus-atendimentos/${id}`, {
			method: 'GET',
			cache: 'no-store',
		});
	},
	getIntercomBinding() {
		return httpClient<IntercomBindingRecord>(`/api/meus-atendimentos/intercom-binding`, {
			method: 'GET',
			cache: 'no-store',
		});
	},
	saveIntercomBinding(payload: Omit<IntercomBindingRecord, 'accounts'>) {
		return httpClient<{ message: string }>(`/api/meus-atendimentos/intercom-binding`, {
			method: 'POST',
			body: JSON.stringify(payload),
			cache: 'no-store',
		});
	},
};
