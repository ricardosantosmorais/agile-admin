import {
	buildIntegracaoLogisticaSavePayload,
	normalizeIntegracaoLogisticaRecord,
	type IntegracaoLogisticaBranchValues,
	type IntegracaoLogisticaRecord,
	type IntegracaoLogisticaValues,
} from '@/src/features/integracoes-logistica/services/integracao-logistica-mappers';
import { httpClient } from '@/src/services/http/http-client';

export const integracaoLogisticaClient = {
	async get(): Promise<IntegracaoLogisticaRecord> {
		const payload = await httpClient<unknown>('/api/integracoes/logistica', {
			method: 'GET',
			cache: 'no-store',
		});

		return normalizeIntegracaoLogisticaRecord(payload);
	},
	async save(values: IntegracaoLogisticaValues, branchValues: IntegracaoLogisticaBranchValues, options?: { includeEncryptedKeys?: string[] }) {
		const parameters = buildIntegracaoLogisticaSavePayload(values, branchValues, options);
		return httpClient('/api/integracoes/logistica', {
			method: 'POST',
			body: JSON.stringify({ parameters }),
			cache: 'no-store',
		});
	},
};
