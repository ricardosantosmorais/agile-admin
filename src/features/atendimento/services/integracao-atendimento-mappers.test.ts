import { describe, expect, it } from 'vitest';
import {
	buildIntegracaoAtendimentoSavePayload,
	createEmptyIntegracaoAtendimentoRecord,
	normalizeIntegracaoAtendimentoRecord,
} from '@/src/features/atendimento/services/integracao-atendimento-mappers';

describe('integracao-atendimento-mappers', () => {
	it('normalizes company parameters and branches', () => {
		const result = normalizeIntegracaoAtendimentoRecord({
			parameters: {
				data: [
					{ chave: 'whatsapp_exibicao', parametros: 'lado_direito', created_at: '2026-04-09 09:50:00', usuario: { nome: 'Admin' } },
					{ chave: 'whatsapp_gateway', parametros: 'meta', created_at: '2026-04-09 09:51:00', usuario: { nome: 'Admin' } },
					{ chave: 'whatsapp_api_token', parametros: 'token-123', created_at: '2026-04-09 09:52:00', usuario: { nome: 'Admin' } },
					{ chave: 'jivo_js', parametros: '//code.jivosite.com/widget/abc', created_at: '2026-04-09 09:53:00', usuario: { nome: 'Admin' } },
					{ chave: 'ebit_codigo', parametros: 'EBIT-01', created_at: '2026-04-09 09:54:00', usuario: { nome: 'Admin' } },
					{ chave: 'whatsapp_numero', id_filial: '10', parametros: '(11) 99999-0000', created_at: '2026-04-09 10:00:00', usuario: { nome: 'Admin' } },
					{ chave: 'whatsapp_id_numero', id_filial: '10', parametros: '000111' },
				],
			},
			branches: {
				data: [
					{ id: '10', nome_fantasia: 'Matriz' },
					{ id: '11', nome_fantasia: 'Filial 2' },
				],
			},
		});

		expect(result.values.whatsappExibicao).toBe('lado_direito');
		expect(result.values.whatsappGateway).toBe('meta');
		expect(result.values.whatsappApiToken).toBe('token-123');
		expect(result.values.jivoJs).toBe('//code.jivosite.com/widget/abc');
		expect(result.values.ebitCodigo).toBe('EBIT-01');
		expect(result.metadata).toMatchObject({
			whatsappExibicao: { updatedAt: '2026-04-09 09:50:00', updatedBy: 'Admin' },
			whatsappGateway: { updatedAt: '2026-04-09 09:51:00', updatedBy: 'Admin' },
			whatsappApiToken: { updatedAt: '2026-04-09 09:52:00', updatedBy: 'Admin' },
			jivoJs: { updatedAt: '2026-04-09 09:53:00', updatedBy: 'Admin' },
			ebitCodigo: { updatedAt: '2026-04-09 09:54:00', updatedBy: 'Admin' },
		});
		expect(result.branches).toHaveLength(2);
		expect(result.branches[0]).toMatchObject({
			id: '10',
			nome: 'Matriz',
			whatsappNumero: '(11) 99999-0000',
			whatsappIdNumero: '000111',
			whatsappNumeroMeta: {
				updatedAt: '2026-04-09 10:00:00',
				updatedBy: 'Admin',
			},
		});
		expect(result.branches[1].whatsappNumero).toBe('');
	});

	it('builds save payload with optional encrypted token', () => {
		const payload = buildIntegracaoAtendimentoSavePayload(
			{
				whatsappExibicao: 'lado_esquerdo',
				whatsappGateway: 'meta',
				whatsappApiToken: 'my-token',
				jivoJs: 'abc',
				ebitCodigo: 'ebit',
			},
			[
				{
					id: '10',
					nome: 'Matriz',
					whatsappNumero: '(11) 99999-9999',
					whatsappIdNumero: '123',
					whatsappNumeroMeta: { updatedAt: '', updatedBy: '' },
				},
			],
			{ includeWhatsappToken: true },
		);

		expect(payload.find((item) => item.chave === 'versao')).toBeTruthy();
		expect(payload.find((item) => item.chave === 'whatsapp_api_token')).toMatchObject({
			parametros: 'my-token',
			criptografado: 1,
		});
		expect(payload.filter((item) => item.id_filial === '10')).toHaveLength(2);

		const withoutToken = buildIntegracaoAtendimentoSavePayload(
			{
				whatsappExibicao: '',
				whatsappGateway: '',
				whatsappApiToken: 'ignored',
				jivoJs: '',
				ebitCodigo: '',
			},
			[],
			{ includeWhatsappToken: false },
		);

		expect(withoutToken.some((item) => item.chave === 'whatsapp_api_token')).toBe(false);
	});

	it('creates empty default record', () => {
		const empty = createEmptyIntegracaoAtendimentoRecord();
		expect(empty.values).toEqual({
			whatsappExibicao: '',
			whatsappGateway: '',
			whatsappApiToken: '',
			jivoJs: '',
			ebitCodigo: '',
		});
		expect(empty.metadata).toEqual({
			whatsappExibicao: { updatedAt: '', updatedBy: '' },
			whatsappGateway: { updatedAt: '', updatedBy: '' },
			whatsappApiToken: { updatedAt: '', updatedBy: '' },
			jivoJs: { updatedAt: '', updatedBy: '' },
			ebitCodigo: { updatedAt: '', updatedBy: '' },
		});
		expect(empty.branches).toEqual([]);
	});
});
