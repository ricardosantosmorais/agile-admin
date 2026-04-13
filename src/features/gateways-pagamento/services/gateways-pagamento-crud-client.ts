import type { CrudDataClient, CrudListFilters, CrudRecord } from '@/src/components/crud-base/types';
import { gatewaysPagamentoClient } from './gateways-pagamento-client';

function asStringRecord(filters: CrudListFilters) {
	return Object.fromEntries(
		Object.entries(filters)
			.filter(([, value]) => value !== '' && value !== null && value !== undefined)
			.map(([key, value]) => [key === 'orderBy' ? 'order' : key, String(value)]),
	);
}

function extractSavedId(payload: unknown) {
	const source = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
	const candidates = [
		source.id,
		Array.isArray(source.data) ? (source.data[0] as Record<string, unknown> | undefined)?.id : undefined,
		source.data && typeof source.data === 'object' && !Array.isArray(source.data) ? (source.data as Record<string, unknown>).id : undefined,
		Array.isArray(payload) ? (payload[0] as Record<string, unknown> | undefined)?.id : undefined,
	];
	const id = candidates.find((value) => value !== null && value !== undefined && String(value).trim());
	return id ? String(id) : '';
}

export const gatewaysPagamentoCrudClient: CrudDataClient = {
	async list(filters) {
		const { rows, meta } = await gatewaysPagamentoClient.list(asStringRecord(filters));
		return {
			data: rows.map((row) => ({ ...row, id: String(row.id || '') })),
			meta: {
				page: Number(meta?.current_page ?? filters.page ?? 1),
				pages: Math.max(1, Number(meta?.last_page ?? 1)),
				perPage: Number(meta?.per_page ?? filters.perPage ?? 15),
				from: Number(meta?.from ?? 0),
				to: Number(meta?.to ?? 0),
				total: Number(meta?.total ?? 0),
				order: String(filters.orderBy || 'id'),
				sort: String(filters.sort || 'desc'),
			},
		};
	},
	async getById(id) {
		return (await gatewaysPagamentoClient.getById(id)) as CrudRecord;
	},
	async save(payload) {
		const response = await gatewaysPagamentoClient.save(payload as never);
		const id = extractSavedId(response) || String(payload.id || '');
		return id ? [{ id }] : [];
	},
	async delete(ids) {
		await gatewaysPagamentoClient.delete(ids);
		return { success: true };
	},
	async listOptions() {
		return [];
	},
};
