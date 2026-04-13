import { asArray, asNumber, asRecord } from '@/src/lib/api-payload';
import type {
	IntegracaoComErpRotinaIntegradaRecord,
	IntegracaoComErpRotinasIntegradasResponse,
} from '@/src/features/integracao-com-erp-rotinas-integradas/services/integracao-com-erp-rotinas-integradas-types';

function toStringValue(value: unknown) {
	return String(value ?? '').trim();
}

function toBooleanValue(value: unknown) {
	const normalized = toStringValue(value).toLowerCase();
	return ['1', 'true', 'sim', 'yes', 'ativo'].includes(normalized);
}

function mapRow(value: unknown): IntegracaoComErpRotinaIntegradaRecord {
	const row = asRecord(value);

	return {
		id: toStringValue(row.id || row.codigo),
		codigo: toStringValue(row.codigo),
		modulo: toStringValue(row.modulo),
		nome: toStringValue(row.nome),
		integrado: toBooleanValue(row.integrado),
		ativo: toBooleanValue(row.ativo),
	};
}

export function normalizeIntegracaoComErpRotinasIntegradasResponse(payload: unknown, fallback: { page: number; perPage: number }): IntegracaoComErpRotinasIntegradasResponse {
	const root = asRecord(payload);
	const data = asArray(root.data).map(mapRow);
	const meta = asRecord(root.meta);
	const total = Math.max(0, asNumber(meta.total, data.length));
	const page = Math.max(1, asNumber(meta.page, fallback.page));
	const perPage = Math.max(1, asNumber(meta.perpage ?? meta.perPage, fallback.perPage));
	const from = total === 0 ? 0 : (page - 1) * perPage + 1;
	const to = total === 0 || data.length === 0 ? 0 : from + data.length - 1;
	const pages = Math.max(1, asNumber(meta.pages, Math.ceil(total / perPage) || 1));

	return {
		data,
		meta: {
			total,
			from,
			to,
			page,
			pages,
			perPage,
		},
	};
}
