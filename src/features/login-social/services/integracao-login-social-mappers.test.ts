import { describe, expect, it } from 'vitest';
import {
	buildIntegracaoLoginSocialRedirectUrl,
	buildIntegracaoLoginSocialSavePayload,
	createEmptyIntegracaoLoginSocialRecord,
	normalizeIntegracaoLoginSocialRecord,
} from '@/src/features/login-social/services/integracao-login-social-mappers';

describe('integracao-login-social-mappers', () => {
	it('normalizes company parameters and metadata', () => {
		const result = normalizeIntegracaoLoginSocialRecord({
			parameters: {
				data: [
					{ chave: 'url_site', parametros: 'https://loja.test/' },
					{ chave: 'g_id_aplicacao', parametros: 'google-id', created_at: '2026-04-11 09:00:00', usuario: { nome: 'Admin' } },
					{ chave: 'g_senha_aplicacao', parametros: '***google-secret***' },
					{ chave: 'fb_id_aplicacao', parametros: 'facebook-id' },
				],
			},
		});

		expect(result.values.url_site).toBe('https://loja.test/');
		expect(result.values.g_id_aplicacao).toBe('google-id');
		expect(result.values.g_senha_aplicacao).toBe('***google-secret***');
		expect(result.values.fb_id_aplicacao).toBe('facebook-id');
		expect(result.metadata.g_id_aplicacao).toEqual({
			updatedAt: '2026-04-11 09:00:00',
			updatedBy: 'Admin',
		});
	});

	it('builds save payload with optional encrypted application secrets', () => {
		const values = createEmptyIntegracaoLoginSocialRecord().values;
		values.g_id_aplicacao = ' google-id ';
		values.g_senha_aplicacao = 'google-secret';
		values.fb_id_aplicacao = 'facebook-id';
		values.fb_senha_aplicacao = 'facebook-secret';

		const payload = buildIntegracaoLoginSocialSavePayload(values, { includeEncryptedKeys: ['g_senha_aplicacao'] });

		expect(payload.find((item) => item.chave === 'versao')).toBeTruthy();
		expect(payload.find((item) => item.chave === 'g_id_aplicacao')).toMatchObject({ parametros: 'google-id', criptografado: 0 });
		expect(payload.find((item) => item.chave === 'g_senha_aplicacao')).toMatchObject({ parametros: 'google-secret', criptografado: 1 });
		expect(payload.find((item) => item.chave === 'fb_id_aplicacao')).toMatchObject({ parametros: 'facebook-id', criptografado: 0 });
		expect(payload.some((item) => item.chave === 'fb_senha_aplicacao')).toBe(false);
		expect(payload.some((item) => item.chave === 'url_site')).toBe(false);
	});

	it('builds redirect URL from url_site', () => {
		expect(buildIntegracaoLoginSocialRedirectUrl('https://loja.test')).toBe('https://loja.test/components/social-login.php');
		expect(buildIntegracaoLoginSocialRedirectUrl('')).toBe('components/social-login.php');
	});
});
