import { describe, expect, it } from 'vitest';
import {
	buildIntegracaoLogisticaSavePayload,
	createEmptyIntegracaoLogisticaRecord,
	normalizeIntegracaoLogisticaRecord,
} from '@/src/features/integracoes-logistica/services/integracao-logistica-mappers';

describe('integracao-logistica-mappers', () => {
	it('normalizes global and branch parameters', () => {
		const result = normalizeIntegracaoLogisticaRecord({
			parameters: {
				data: [
					{ chave: 'link_rastreamento', parametros: 'https://tracking.test', created_at: '2026-04-11 09:00:00', usuario: { nome: 'Admin' } },
					{ chave: 'frenet_token', parametros: '***frenet***' },
					{ chave: 'frenet_ambiente', parametros: 'producao' },
					{ chave: 'iboltt_company_id', id_filial: '10', parametros: 'company-10', created_at: '2026-04-11 10:00:00', usuario: { nome: 'Lucas' } },
					{ chave: 'iboltt_token', id_filial: '10', parametros: '***iboltt***' },
				],
			},
			branches: {
				data: [{ id: '10', nome_fantasia: 'Filial Centro' }],
			},
		});

		expect(result.values.link_rastreamento).toBe('https://tracking.test');
		expect(result.values.frenet_token).toBe('***frenet***');
		expect(result.values.frenet_ambiente).toBe('producao');
		expect(result.branchValues['10']).toEqual({ companyId: 'company-10', token: '***iboltt***' });
		expect(result.branchMetadata['10'].companyId).toEqual({ updatedAt: '2026-04-11 10:00:00', updatedBy: 'Lucas' });
	});

	it('builds save payload without untouched encrypted secrets', () => {
		const record = createEmptyIntegracaoLogisticaRecord();
		record.values.link_rastreamento = ' https://tracking.test ';
		record.values.frenet_token = 'frenet-secret';
		record.values.frenet_ambiente = 'producao';
		record.values.frenet_nota_fiscal = '1';
		record.values.iboltt_status = 'faturado';
		record.branchValues = {
			'10': { companyId: ' company-10 ', token: 'iboltt-secret' },
		};

		const payload = buildIntegracaoLogisticaSavePayload(record.values, record.branchValues, { includeEncryptedKeys: ['iboltt_token__10'] });

		expect(payload.find((item) => item.chave === 'versao')).toBeTruthy();
		expect(payload.find((item) => item.chave === 'link_rastreamento')).toMatchObject({ parametros: 'https://tracking.test', criptografado: 0 });
		expect(payload.some((item) => item.chave === 'frenet_token')).toBe(false);
		expect(payload.find((item) => item.chave === 'frenet_ambiente')).toMatchObject({ parametros: 'producao' });
		expect(payload.find((item) => item.chave === 'iboltt_company_id' && item.id_filial === '10')).toMatchObject({ parametros: 'company-10', criptografado: 0 });
		expect(payload.find((item) => item.chave === 'iboltt_token' && item.id_filial === '10')).toMatchObject({ parametros: 'iboltt-secret', criptografado: 1 });
	});
});
