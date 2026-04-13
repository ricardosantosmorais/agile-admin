import {
	buildIntegracaoPromocoesSavePayload,
	normalizeIntegracaoPromocoesRecord,
	type IntegracaoPromocoesEncryptedKey,
	type IntegracaoPromocoesRecord,
	type IntegracaoPromocoesValues,
} from '@/src/features/promocoes/services/integracao-promocoes-mappers';
import { httpClient } from '@/src/services/http/http-client';

export const integracaoPromocoesClient = {
	async get(): Promise<IntegracaoPromocoesRecord> {
		const payload = await httpClient<unknown>('/api/integracoes/promocoes', {
			method: 'GET',
			cache: 'no-store',
		});

		return normalizeIntegracaoPromocoesRecord(payload);
	},
	async save(values: IntegracaoPromocoesValues, options?: { includeEncryptedKeys?: IntegracaoPromocoesEncryptedKey[] }) {
		const parameters = buildIntegracaoPromocoesSavePayload(values, options);
		return httpClient('/api/integracoes/promocoes', {
			method: 'POST',
			body: JSON.stringify({ parameters }),
			cache: 'no-store',
		});
	},
};
