import { describe, expect, it } from 'vitest';
import { normalizeIntegracaoComErpServicosResponse } from '@/src/features/integracao-com-erp-servicos/services/integracao-com-erp-servicos-mappers';

describe('normalizeIntegracaoComErpServicosResponse', () => {
	it('normaliza a listagem principal com status, metadata e caracteristicas', () => {
		const result = normalizeIntegracaoComErpServicosResponse(
			{
				data: [
					{
						id_servico: 18,
						servico: { nome: 'Atualização de estoque' },
						intervalo_execucao: '5',
						dthr_ultima_execucao: '2025-02-03 10:00:00',
						dthr_proxima_execucao: '2025-02-03 10:05:00',
						status: 'bad',
						ativo: 1,
						metadata: '{"motivo":"Timeout na API","arquivo":"lote-18.json"}',
						caracteristicas: {
							natureza: { chave: 'extracao', label: 'Extração' },
							motor_execucao: { chave: 'api', label: 'API', inferido: true },
							tipo_servico: { chave: 'query', label: 'Query' },
							modo_execucao: { chave: 'comparacao', label: 'Comparação' },
							objeto: { label: 'produtos' },
						},
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
			id: '18',
			idServico: '18',
			nome: 'Atualização de estoque',
			intervaloExecucao: '5',
			status: 'bad',
			statusLabel: 'Falha',
			statusTone: 'danger',
			ativo: true,
		});
		expect(result.data[0].metadataEntries).toEqual([
			{ label: 'motivo', value: 'Timeout na API' },
			{ label: 'arquivo', value: 'lote-18.json' },
		]);
		expect(result.data[0].caracteristicas.motorExecucao).toEqual({ key: 'api', label: 'API', inferred: true });
	});

	it('trata metadata textual simples e fallback de meta', () => {
		const result = normalizeIntegracaoComErpServicosResponse(
			{
				data: [
					{
						id_servico: '9',
						servico: { nome: 'Envio de pedidos' },
						intervalo_execucao: '30',
						status: 'working',
						ativo: '0',
						metadata: 'Fila em processamento',
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
		expect(result.data[0].statusLabel).toBe('Em Execução');
		expect(result.data[0].metadataEntries).toEqual([{ label: 'Detalhe', value: 'Fila em processamento' }]);
		expect(result.data[0].ativo).toBe(false);
	});

	it('mantem campos extras usados pela tela tabulada de edicao', () => {
		const result = normalizeIntegracaoComErpServicosResponse(
			{
				data: [
					{
						id: 71,
						id_servico: 33,
						id_servico_empresa: 71,
						servico: { nome: 'Servico de clientes' },
						customizado: 1,
						ativo: 1,
						intervalo_execucao: '15',
						url_filtro: 'status = 1',
						nome_gateway: 'gateway-clientes',
						url: 'https://api.exemplo.com/clientes',
						query: { hash: 'abc123' },
					},
				],
			},
			{ page: 1, perPage: 10 },
		);

		expect(result.data[0]).toMatchObject({
			idServicoEmpresa: '71',
			customizado: true,
			urlFiltro: 'status = 1',
			gatewayName: 'gateway-clientes',
			endpointUrl: 'https://api.exemplo.com/clientes',
			hash: 'abc123',
		});
	});
});
