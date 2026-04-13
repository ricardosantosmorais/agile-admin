import { describe, expect, it } from 'vitest';
import {
	buildIntegracaoMarketingSavePayload,
	createEmptyIntegracaoMarketingRecord,
	hasIntegracaoMarketingRdEcomEvents,
	normalizeIntegracaoMarketingRecord,
} from '@/src/features/marketing/services/integracao-marketing-mappers';

describe('integracao-marketing-mappers', () => {
	it('normalizes company parameters with defaults and metadata', () => {
		const result = normalizeIntegracaoMarketingRecord({
			parameters: {
				data: [
					{ chave: 'ga4', parametros: 'G-123', created_at: '2026-04-10 09:00:00', usuario: { nome: 'Admin' } },
					{ chave: 'fb_token', parametros: '***token***', created_at: '2026-04-10 09:01:00', usuario: { nome: 'Admin' } },
					{ chave: 'rd_ecom_checkout_started', parametros: 'true' },
					{ chave: 'egoi_ativacao', parametros: '' },
				],
			},
		});

		expect(result.values.ga4).toBe('G-123');
		expect(result.values.fb_token).toBe('***token***');
		expect(result.values.rd_ecom_checkout_started).toBe('true');
		expect(result.values.egoi_ativacao).toBe('false');
		expect(result.values.versao_datalayer).toBe('GA4');
		expect(result.metadata.ga4).toEqual({
			updatedAt: '2026-04-10 09:00:00',
			updatedBy: 'Admin',
		});
	});

	it('builds save payload preserving booleans and optional encrypted fields', () => {
		const values = createEmptyIntegracaoMarketingRecord().values;
		values.ga4 = ' G-999 ';
		values.fb_token = 'secret-token';
		values.rd_ecom_checkout_started = 'true';

		const payload = buildIntegracaoMarketingSavePayload(values, { includeEncryptedKeys: ['fb_token'] });

		expect(payload.find((item) => item.chave === 'versao')).toBeTruthy();
		expect(payload.find((item) => item.chave === 'ga4')).toMatchObject({ parametros: 'G-999', criptografado: 0 });
		expect(payload.find((item) => item.chave === 'fb_token')).toMatchObject({ parametros: 'secret-token', criptografado: 1 });
		expect(payload.find((item) => item.chave === 'rd_ecom_checkout_started')).toMatchObject({ parametros: 'true' });
		expect(payload.some((item) => item.chave === 'rd_client_secret')).toBe(false);
	});

	it('detects active RD Station E-Commerce events', () => {
		const values = createEmptyIntegracaoMarketingRecord().values;
		expect(hasIntegracaoMarketingRdEcomEvents(values)).toBe(false);

		values.rd_ecom_order_paid = 'true';
		expect(hasIntegracaoMarketingRdEcomEvents(values)).toBe(true);
	});
});
