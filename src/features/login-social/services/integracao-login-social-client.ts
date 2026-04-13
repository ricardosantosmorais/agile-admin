import { httpClient } from '@/src/services/http/http-client';
import {
	buildIntegracaoLoginSocialSavePayload,
	normalizeIntegracaoLoginSocialRecord,
	type IntegracaoLoginSocialEncryptedKey,
	type IntegracaoLoginSocialRecord,
	type IntegracaoLoginSocialValues,
} from '@/src/features/login-social/services/integracao-login-social-mappers';

export const integracaoLoginSocialClient = {
	async get(): Promise<IntegracaoLoginSocialRecord> {
		const payload = await httpClient<unknown>('/api/integracoes/login-social', {
			method: 'GET',
			cache: 'no-store',
		});

		return normalizeIntegracaoLoginSocialRecord(payload);
	},
	async save(values: IntegracaoLoginSocialValues, options?: { includeEncryptedKeys?: IntegracaoLoginSocialEncryptedKey[] }) {
		const parameters = buildIntegracaoLoginSocialSavePayload(values, options);
		return httpClient('/api/integracoes/login-social', {
			method: 'POST',
			body: JSON.stringify({ parameters }),
			cache: 'no-store',
		});
	},
};
