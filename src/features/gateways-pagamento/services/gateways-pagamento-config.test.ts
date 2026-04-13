import { describe, expect, it } from 'vitest';
import { normalizeGatewayPagamentoRecord, prepareGatewayPagamentoPayload } from './gateways-pagamento-config';

describe('gateways-pagamento-config', () => {
	it('normaliza gateway carregado e prepara estado virtual de segredos', () => {
		const normalized = normalizeGatewayPagamentoRecord({
			id: '10',
			tipo: 'pix',
			gateway: 'itau',
			client_secret: 'abc12345xyz',
			chave_privada: '',
		});

		expect(normalized.gateway_pix).toBe('itau');
		expect(normalized.client_secret_original).toBe('abc12345xyz');
		expect(normalized.client_secret_editable).toBe(false);
		expect(normalized.chave_privada_editable).toBe(true);
	});

	it('prepara payload final removendo flags internas e resolvendo gateway ativo', () => {
		const payload = prepareGatewayPagamentoPayload({
			id: '10',
			tipo: 'cartao_credito',
			gateway_cartao_credito: 'cielo',
			gateway_boleto_antecipado: 'bb_api',
			gateway_pix: 'itau',
			client_secret: 'secret',
			client_secret_original: 'old-secret',
			client_secret_editable: true,
			horas_cancelamento: '',
		});

		expect(payload.gateway).toBe('cielo');
		expect(payload.gateway_boleto_antecipado).toBe('');
		expect(payload.gateway_pix).toBe('');
		expect(payload.horas_cancelamento).toBe('2');
		expect(payload.client_secret_original).toBeUndefined();
		expect(payload.client_secret_editable).toBeUndefined();
	});
});
