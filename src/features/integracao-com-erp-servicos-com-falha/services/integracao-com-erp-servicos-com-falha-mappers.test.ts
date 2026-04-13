import { describe, expect, it } from 'vitest';
import { normalizeIntegracaoComErpServicosComFalhaResponse } from '@/src/features/integracao-com-erp-servicos-com-falha/services/integracao-com-erp-servicos-com-falha-mappers';

describe('normalizeIntegracaoComErpServicosComFalhaResponse', () => {
	it('normaliza a fila de falhas com metadata estruturada', () => {
		const result = normalizeIntegracaoComErpServicosComFalhaResponse(
			{
				data: [
					{
						id_empresa: '20',
						id_servico: '18',
						id_servico_execucao: '99',
						nome_servico: 'Atualização de estoque',
						nome_fantasia: 'Empresa XPTO',
						intervalo_execucao: '5',
						data_hora: '2025-02-03 10:00:00',
						tentativas: '3',
						metadata: '{"motivo":"Timeout na API","arquivo":"lote-18.json"}',
					},
				],
				meta: {
					total: 1,
					page: 2,
					perpage: 15,
					from: 16,
					to: 16,
					pages: 3,
				},
			},
			{ page: 1, perPage: 15 },
		);

		expect(result.meta).toEqual({
			total: 1,
			from: 16,
			to: 16,
			page: 2,
			pages: 3,
			perPage: 15,
		});
		expect(result.data[0]).toMatchObject({
			id: '20_18',
			companyId: '20',
			serviceId: '18',
			executionId: '99',
			serviceName: 'Atualização de estoque',
			companyName: 'Empresa XPTO',
			intervaloExecucao: '5',
			attempts: 3,
		});
		expect(result.data[0].metadataEntries).toEqual([
			{ label: 'motivo', value: 'Timeout na API' },
			{ label: 'arquivo', value: 'lote-18.json' },
		]);
	});

	it('mantem metadata textual e usa fallback de paginação', () => {
		const result = normalizeIntegracaoComErpServicosComFalhaResponse(
			{
				data: [
					{
						id_empresa: '10',
						id_servico: '7',
						nome_servico: 'Envio de pedidos',
						nome_fantasia: 'Empresa Demo',
						metadata: 'Falha ao conectar no integrador',
					},
				],
			},
			{ page: 3, perPage: 10 },
		);

		expect(result.meta).toEqual({
			total: 1,
			from: 21,
			to: 21,
			page: 3,
			pages: 1,
			perPage: 10,
		});
		expect(result.data[0].metadataEntries).toEqual([{ label: 'Detalhe', value: 'Falha ao conectar no integrador' }]);
		expect(result.data[0].metadataRaw).toBe('Falha ao conectar no integrador');
	});
});
