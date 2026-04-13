import { formatDateTime } from '@/src/lib/date-time';
import { asArray, asNumber, asRecord } from '@/src/lib/api-payload';
import type {
	IntegracaoComErpServicoComFalhaMetadataEntry,
	IntegracaoComErpServicoComFalhaRecord,
	IntegracaoComErpServicosComFalhaResponse,
} from '@/src/features/integracao-com-erp-servicos-com-falha/services/integracao-com-erp-servicos-com-falha-types';

function toStringValue(value: unknown) {
	return String(value ?? '').trim();
}

function decodeLegacySlashes(value: string) {
	return value.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
}

function normalizeMetadataEntries(value: unknown): { entries: IntegracaoComErpServicoComFalhaMetadataEntry[]; raw: string } {
	if (Array.isArray(value)) {
		const entries = value
			.map((entry) => {
				const record = asRecord(entry);
				const label = toStringValue(record.label || record.key || record.titulo || record.title);
				const content = toStringValue(record.value || record.valor || record.content);
				if (!label && !content) {
					return null;
				}

				return {
					label: label || 'Detalhe',
					value: content || '-',
				};
			})
			.filter((entry): entry is IntegracaoComErpServicoComFalhaMetadataEntry => Boolean(entry));

		return { entries, raw: '' };
	}

	if (typeof value === 'object' && value !== null) {
		const entries = Object.entries(value).map(([label, content]) => ({
			label: toStringValue(label) || 'Detalhe',
			value: toStringValue(content) || '-',
		}));

		return { entries, raw: '' };
	}

	const raw = decodeLegacySlashes(toStringValue(value));
	if (!raw) {
		return { entries: [], raw: '' };
	}

	try {
		const parsed = JSON.parse(raw);
		if (typeof parsed === 'string' && parsed.trim() && parsed !== raw) {
			return normalizeMetadataEntries(parsed);
		}

		return normalizeMetadataEntries(parsed);
	} catch {
		return {
			entries: [{ label: 'Detalhe', value: raw }],
			raw,
		};
	}
}

function mapRow(value: unknown): IntegracaoComErpServicoComFalhaRecord {
	const row = asRecord(value);
	const companyId = toStringValue(row.id_empresa);
	const serviceId = toStringValue(row.id_servico);
	const metadata = normalizeMetadataEntries(row.metadata);

	return {
		id: `${companyId}_${serviceId}`,
		companyId,
		serviceId,
		executionId: toStringValue(row.id_servico_execucao),
		serviceName: toStringValue(row.nome_servico) || '-',
		companyName: toStringValue(row.nome_fantasia) || companyId || '-',
		intervaloExecucao: toStringValue(row.intervalo_execucao) || '-',
		firstFailureAt: formatDateTime(toStringValue(row.data_hora)) || '-',
		attempts: asNumber(row.tentativas, 0),
		metadataEntries: metadata.entries,
		metadataRaw: metadata.raw,
	};
}

export function normalizeIntegracaoComErpServicosComFalhaResponse(payload: unknown, fallback: { page: number; perPage: number }): IntegracaoComErpServicosComFalhaResponse {
	const root = asRecord(payload);
	const data = asArray(root.data).map(mapRow);
	const meta = asRecord(root.meta);
	const total = Math.max(0, asNumber(meta.total, data.length));
	const page = Math.max(1, asNumber(meta.page ?? meta.current_page, fallback.page));
	const perPage = Math.max(1, asNumber(meta.perpage ?? meta.perPage ?? meta.per_page, fallback.perPage));
	const from = total === 0 ? 0 : asNumber(meta.from, (page - 1) * perPage + 1);
	const to = total === 0 || data.length === 0 ? 0 : asNumber(meta.to, from + data.length - 1);
	const pages = Math.max(1, asNumber(meta.pages ?? meta.last_page, Math.ceil(total / perPage) || 1));

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
