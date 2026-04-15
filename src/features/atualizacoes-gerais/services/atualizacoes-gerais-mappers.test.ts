import { describe, expect, it } from 'vitest';
import { filterVisibleUpdates, groupUpdatesByMonth } from '@/src/features/atualizacoes-gerais/services/atualizacoes-gerais-mappers';

const sample = [
	{
		id: '1',
		titulo: 'Release 1',
		data: '2026-04-10 00:00:00',
		plataforma: 'admin',
		tipo: 'melhoria',
		apenasMaster: false,
		conteudo: '<p>Primeira</p>',
	},
	{
		id: '2',
		titulo: 'Release 2',
		data: '2026-04-01 00:00:00',
		plataforma: 'ecommerce',
		tipo: 'correcao',
		apenasMaster: true,
		conteudo: '<p>Segunda</p>',
	},
	{
		id: '3',
		titulo: 'Release 3',
		data: '2026-03-15 00:00:00',
		plataforma: 'integracao',
		tipo: 'geral',
		apenasMaster: false,
		conteudo: '<p>Terceira</p>',
	},
];

describe('atualizacoes-gerais-mappers', () => {
	it('filters internal updates for non master users', () => {
		expect(filterVisibleUpdates(sample, false).map((item) => item.id)).toEqual(['1', '3']);
		expect(filterVisibleUpdates(sample, true).map((item) => item.id)).toEqual(['1', '2', '3']);
	});

	it('groups updates by month preserving order', () => {
		const grouped = groupUpdatesByMonth(sample, 'pt-BR');

		expect(grouped).toHaveLength(2);
		expect(grouped[0].key).toBe('2026-04');
		expect(grouped[0].items.map((item) => item.id)).toEqual(['1', '2']);
		expect(grouped[1].key).toBe('2026-03');
		expect(grouped[1].items.map((item) => item.id)).toEqual(['3']);
	});
});
