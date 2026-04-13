import { httpClient } from '@/src/services/http/http-client';
import {
	buildIntegracaoMarketingSavePayload,
	normalizeIntegracaoMarketingRecord,
	type IntegracaoMarketingFieldKey,
	type IntegracaoMarketingRecord,
	type IntegracaoMarketingValues,
} from '@/src/features/marketing/services/integracao-marketing-mappers';

type RdEcomOauthStartResponse = {
	data?: {
		oauth_url?: string;
		callback_url?: string;
	};
	message?: string;
};

export const integracaoMarketingClient = {
	async get(): Promise<IntegracaoMarketingRecord> {
		const payload = await httpClient<unknown>('/api/integracoes/marketing', {
			method: 'GET',
			cache: 'no-store',
		});

		return normalizeIntegracaoMarketingRecord(payload);
	},
	async save(values: IntegracaoMarketingValues, options?: { includeEncryptedKeys?: IntegracaoMarketingFieldKey[] }) {
		const parameters = buildIntegracaoMarketingSavePayload(values, options);
		return httpClient('/api/integracoes/marketing', {
			method: 'POST',
			body: JSON.stringify({ parameters }),
			cache: 'no-store',
		});
	},
	async startRdEcomOauth(options: { clientId: string; clientSecret: string; useCurrentSecret: boolean }): Promise<RdEcomOauthStartResponse> {
		return httpClient<RdEcomOauthStartResponse>('/api/integracoes/marketing/rd-ecom-oauth', {
			method: 'POST',
			body: JSON.stringify(options),
			cache: 'no-store',
		});
	},
};
