import { describe, expect, it } from 'vitest';
import {
	buildIntegracaoPromocoesSavePayload,
	createEmptyIntegracaoPromocoesRecord,
	normalizeIntegracaoPromocoesRecord,
} from '@/src/features/promocoes/services/integracao-promocoes-mappers';

describe('integracao-promocoes-mappers', () => {
	it('normalizes IdEver parameters and metadata', () => {
		const result = normalizeIntegracaoPromocoesRecord({
			parameters: {
				data: [
					{ chave: 'idever_client_id', parametros: 'client-id', created_at: '2026-04-11 09:00:00', usuario: { nome: 'Admin' } },
					{ chave: 'idever_client_secret', parametros: '***client-secret***' },
					{ chave: 'idever_app_id', parametros: 'app-id' },
					{ chave: 'idever_app_secret', parametros: '***app-secret***' },
					{ chave: 'idever_rule_id', parametros: 'rule-id' },
				],
			},
		});

		expect(result.values.idever_client_id).toBe('client-id');
		expect(result.values.idever_client_secret).toBe('***client-secret***');
		expect(result.values.idever_app_id).toBe('app-id');
		expect(result.values.idever_app_secret).toBe('***app-secret***');
		expect(result.values.idever_rule_id).toBe('rule-id');
		expect(result.metadata.idever_client_id).toEqual({
			updatedAt: '2026-04-11 09:00:00',
			updatedBy: 'Admin',
		});
	});

	it('builds save payload without untouched encrypted secrets', () => {
		const values = createEmptyIntegracaoPromocoesRecord().values;
		values.idever_client_id = ' client-id ';
		values.idever_client_secret = 'client-secret';
		values.idever_app_id = 'app-id';
		values.idever_app_secret = 'app-secret';
		values.idever_rule_id = ' rule-id ';

		const payload = buildIntegracaoPromocoesSavePayload(values, { includeEncryptedKeys: ['idever_app_secret'] });

		expect(payload.find((item) => item.chave === 'versao')).toBeTruthy();
		expect(payload.find((item) => item.chave === 'idever_client_id')).toMatchObject({ parametros: 'client-id', criptografado: 0 });
		expect(payload.some((item) => item.chave === 'idever_client_secret')).toBe(false);
		expect(payload.find((item) => item.chave === 'idever_app_id')).toMatchObject({ parametros: 'app-id', criptografado: 0 });
		expect(payload.find((item) => item.chave === 'idever_app_secret')).toMatchObject({ parametros: 'app-secret', criptografado: 1 });
		expect(payload.find((item) => item.chave === 'idever_rule_id')).toMatchObject({ parametros: 'rule-id', criptografado: 0 });
	});
});
