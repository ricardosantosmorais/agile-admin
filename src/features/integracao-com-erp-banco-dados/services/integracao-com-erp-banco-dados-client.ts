import { httpClient } from '@/src/services/http/http-client';
import {
	buildDirtyIntegracaoComErpParametersPayload,
	normalizeIntegracaoComErpConfigRecord,
	type IntegracaoComErpConfigFieldDefinition,
} from '@/src/lib/integracao-com-erp-parameter-form';

export const integracaoComErpBancoDadosClient = {
	async get(fixedFields: IntegracaoComErpConfigFieldDefinition[]) {
		const payload = await httpClient<unknown>('/api/integracao-com-erp/banco-de-dados', {
			method: 'GET',
			cache: 'no-store',
		});

		return normalizeIntegracaoComErpConfigRecord(payload, fixedFields);
	},
	async save(fields: IntegracaoComErpConfigFieldDefinition[], initialValues: Record<string, string>, currentValues: Record<string, string>) {
		const parameters = buildDirtyIntegracaoComErpParametersPayload(fields, initialValues, currentValues);
		if (!parameters.length) {
			return { success: true, skipped: true } as const;
		}

		return httpClient('/api/integracao-com-erp/banco-de-dados', {
			method: 'POST',
			body: JSON.stringify({ parameters }),
			cache: 'no-store',
		});
	},
};
