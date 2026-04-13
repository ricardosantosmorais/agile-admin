import { describe, expect, it } from 'vitest';
import { normalizeIntegracaoComErpRotinasIntegradasResponse } from '@/src/features/integracao-com-erp-rotinas-integradas/services/integracao-com-erp-rotinas-integradas-mappers';

describe('integracao-com-erp-rotinas-integradas-mappers', () => {
	it('normalizes rows and meta from the legacy ERP routines payload', () => {
		const result = normalizeIntegracaoComErpRotinasIntegradasResponse(
			{
				data: [
					{ id: 7, codigo: 'CLI-001', modulo: 'Clientes', nome: 'Clientes sincronizados', integrado: '1', ativo: '1' },
					{ id: 9, codigo: 'PED-002', modulo: 'Pedidos', nome: 'Pedidos pendentes', integrado: 'true', ativo: '0' },
				],
				meta: { total: 22, page: 2, perpage: 15, pages: 2 },
			},
			{ page: 1, perPage: 15 },
		);

		expect(result.data).toEqual([
			{ id: '7', codigo: 'CLI-001', modulo: 'Clientes', nome: 'Clientes sincronizados', integrado: true, ativo: true },
			{ id: '9', codigo: 'PED-002', modulo: 'Pedidos', nome: 'Pedidos pendentes', integrado: true, ativo: false },
		]);
		expect(result.meta).toEqual({ total: 22, from: 16, to: 17, page: 2, pages: 2, perPage: 15 });
	});

	it('falls back to the requested pagination when meta is incomplete', () => {
		const result = normalizeIntegracaoComErpRotinasIntegradasResponse(
			{
				data: [{ codigo: 'EST-001', modulo: 'Estoque', nome: 'Estoque base' }],
			},
			{ page: 3, perPage: 30 },
		);

		expect(result.meta).toEqual({ total: 1, from: 61, to: 61, page: 3, pages: 1, perPage: 30 });
	});
});
