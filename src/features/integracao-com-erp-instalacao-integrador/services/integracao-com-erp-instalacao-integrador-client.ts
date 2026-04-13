import { httpClient } from '@/src/services/http/http-client';

export type IntegracaoComErpInstalacaoIntegradorPayload = {
	token: string;
	downloadUrl: string;
};

export const integracaoComErpInstalacaoIntegradorClient = {
	async get() {
		return httpClient<IntegracaoComErpInstalacaoIntegradorPayload>('/api/integracao-com-erp/instalacao-do-integrador', {
			method: 'GET',
			cache: 'no-store',
		});
	},
};
