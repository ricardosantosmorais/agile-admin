import { describe, expect, it } from 'vitest';
import { mapIntegracaoComErpDashboardSnapshot } from '@/src/features/integracao-com-erp-dashboard/services/integracao-com-erp-dashboard-mappers';

describe('integracao-com-erp-dashboard-mappers', () => {
	it('maps summary metrics and enriches company dependent sections', () => {
		const snapshot = mapIntegracaoComErpDashboardSnapshot({
			integratorStatusPayload: {
				data: [
					{ label: 'Conectados', value: 5 },
					{ label: 'Desconectados', value: 2 },
				],
			},
			serviceSummaryPayload: {
				data: [
					{ status: 'finalizado', qtd: 12 },
					{ status: 'falha_na_execucao', qtd: 3 },
					{ status: 'recebido_no_servico', qtd: 4 },
				],
			},
			disconnectedCompaniesPayload: {
				data: [{ id: '10', dthr_status_integracao: '2026-04-12 10:15:00' }],
			},
			orderTodayPayload: {
				data: [{ id_empresa: '10', total: 8, internalizado: 5, pendente: 3 }],
			},
			orderLast30Payload: {
				data: [{ id_empresa: '10', total: 100, internalizado: 94, pendente: 6, data_pendente: '2026-04-12 08:45:00' }],
			},
			failuresPayload: {
				data: [{ id_servico_execucao: '99', id_empresa: '10', nome_servico: 'Pedidos', dthr_inicio_servico_execucao: '2026-04-12 09:00:00', metadata: '{"erro":"Timeout"}' }],
			},
			companyCatalogPayload: {
				data: [{ id: '10', codigo: '10', nome: 'Empresa XPTO', ico: 'https://cdn/logo.png', status: 'ativo' }],
			},
		});

		expect(snapshot.integrators).toEqual({ connected: 5, disconnected: 2 });
		expect(snapshot.services).toEqual({ total: 19, finalized: 12, failed: 3 });
		expect(snapshot.disconnectedCompanies[0]).toMatchObject({ name: 'Empresa XPTO', logoUrl: 'https://cdn/logo.png' });
		expect(snapshot.orders.today).toEqual({ total: 8, internalized: 5, pending: 3 });
		expect(snapshot.orders.pendingCompanies[0]).toMatchObject({ name: 'Empresa XPTO', pendingToday: 3, pendingLast30Days: 6 });
		expect(snapshot.failedServices[0].metadataDetails).toEqual([{ label: 'erro', value: 'Timeout' }]);
	});

	it('keeps raw metadata when payload is not valid json', () => {
		const snapshot = mapIntegracaoComErpDashboardSnapshot({
			integratorStatusPayload: { data: [] },
			serviceSummaryPayload: { data: [] },
			disconnectedCompaniesPayload: { data: [] },
			orderTodayPayload: { data: [] },
			orderLast30Payload: { data: [] },
			failuresPayload: {
				data: [{ id_servico_execucao: '7', id_empresa: '33', nome_servico: 'Produtos', metadata: 'Falha ao conectar no integrador' }],
			},
			companyCatalogPayload: { data: [] },
		});

		expect(snapshot.failedServices[0].metadataDetails).toEqual([]);
		expect(snapshot.failedServices[0].metadataRaw).toBe('Falha ao conectar no integrador');
	});
});
