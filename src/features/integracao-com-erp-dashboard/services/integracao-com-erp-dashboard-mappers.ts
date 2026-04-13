import { asArray, asNumber, asRecord, asString, type ApiRecord } from '@/src/lib/api-payload';
import type {
	IntegracaoComErpDashboardCompanyConnectionRow,
	IntegracaoComErpDashboardFailureDetail,
	IntegracaoComErpDashboardFailureRow,
	IntegracaoComErpDashboardOrderSummary,
	IntegracaoComErpDashboardPendingCompanyRow,
	IntegracaoComErpDashboardSnapshot,
} from '@/src/features/integracao-com-erp-dashboard/services/integracao-com-erp-dashboard-types';

type DashboardMapperInput = {
	integratorStatusPayload: unknown;
	serviceSummaryPayload: unknown;
	disconnectedCompaniesPayload: unknown;
	orderTodayPayload: unknown;
	orderLast30Payload: unknown;
	failuresPayload: unknown;
	companyCatalogPayload: unknown;
};

type CompanyCatalogRow = {
	id: string;
	code: string;
	name: string;
	logoUrl: string;
	status: string;
};

function normalizeText(value: unknown) {
	return asString(value).trim();
}

function getRows(payload: unknown) {
	const root = asRecord(payload);
	const fromData = asArray(root.data);

	if (fromData.length) {
		return fromData.map((item) => asRecord(item));
	}

	return asArray(payload).map((item) => asRecord(item));
}

function buildCompanyCatalog(payload: unknown) {
	const byId = new Map<string, CompanyCatalogRow>();

	for (const item of getRows(payload)) {
		const row: CompanyCatalogRow = {
			id: normalizeText(item.id),
			code: normalizeText(item.codigo || item.id),
			name: normalizeText(item.nome),
			logoUrl: normalizeText(item.ico),
			status: normalizeText(item.status),
		};

		if (row.id) {
			byId.set(row.id, row);
		}

		if (row.code) {
			byId.set(row.code, row);
		}
	}

	return byId;
}

function findCompany(catalog: Map<string, CompanyCatalogRow>, companyId: string) {
	return catalog.get(companyId) || null;
}

function pickStatusValue(rows: ApiRecord[], predicate: (label: string) => boolean) {
	return rows.reduce((current, row) => {
		const label = normalizeText(row.label || row.status).toLowerCase();
		if (!predicate(label)) {
			return current;
		}

		return current + asNumber(row.value ?? row.qtd, 0);
	}, 0);
}

function mapOrderSummary(payload: unknown): IntegracaoComErpDashboardOrderSummary {
	const rows = getRows(payload);

	return rows.reduce<IntegracaoComErpDashboardOrderSummary>(
		(current, row) => ({
			total: current.total + asNumber(row.total, 0),
			internalized: current.internalized + asNumber(row.internalizado, 0),
			pending: current.pending + asNumber(row.pendente, 0),
		}),
		{ total: 0, internalized: 0, pending: 0 },
	);
}

function mapPendingCompanies(todayPayload: unknown, last30Payload: unknown, catalog: Map<string, CompanyCatalogRow>) {
	const todayRows = getRows(todayPayload);
	const byTodayId = new Map(todayRows.map((row) => [normalizeText(row.id_empresa), row]));

	return getRows(last30Payload)
		.map<IntegracaoComErpDashboardPendingCompanyRow | null>((row) => {
			const companyId = normalizeText(row.id_empresa);
			if (!companyId) {
				return null;
			}

			const company = findCompany(catalog, companyId);
			const pendingLast30Days = asNumber(row.pendente, 0);
			const pendingToday = asNumber(byTodayId.get(companyId)?.pendente, 0);

			if (pendingLast30Days <= 0 && pendingToday <= 0) {
				return null;
			}

			return {
				id: companyId,
				name: company?.name || normalizeText(row.nome_empresa) || companyId,
				logoUrl: company?.logoUrl || '',
				pendingToday,
				pendingLast30Days,
				pendingAt: normalizeText(row.data_pendente),
			};
		})
		.filter((row): row is IntegracaoComErpDashboardPendingCompanyRow => Boolean(row))
		.sort((left, right) => right.pendingLast30Days - left.pendingLast30Days || right.pendingToday - left.pendingToday);
}

function mapDisconnectedCompanies(payload: unknown, catalog: Map<string, CompanyCatalogRow>) {
	return getRows(payload)
		.map<IntegracaoComErpDashboardCompanyConnectionRow | null>((row) => {
			const companyId = normalizeText(row.id);
			if (!companyId) {
				return null;
			}

			const company = findCompany(catalog, companyId);
			return {
				id: companyId,
				name: company?.name || normalizeText(row.nome) || companyId,
				logoUrl: normalizeText(row.logo) || company?.logoUrl || '',
				status: normalizeText(row.status) || company?.status || '',
				disconnectedAt: normalizeText(row.dthr_status_integracao),
			};
		})
		.filter((row): row is IntegracaoComErpDashboardCompanyConnectionRow => Boolean(row));
}

function mapMetadataDetails(rawValue: unknown): { details: IntegracaoComErpDashboardFailureDetail[]; raw: string } {
	const rawText = normalizeText(rawValue);
	if (!rawText) {
		return { details: [], raw: '' };
	}

	const tryParseObject = (value: string) => {
		try {
			const parsed = JSON.parse(value);
			return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;
		} catch {
			return null;
		}
	};

	const parsed = tryParseObject(rawText) || tryParseObject(rawText.replace(/\\/g, '\\'));
	if (!parsed) {
		return { details: [], raw: rawText };
	}

	const details = Object.entries(parsed)
		.map(([key, value]) => ({
			label: key,
			value: typeof value === 'string' ? value : JSON.stringify(value),
		}))
		.filter((entry) => entry.label.trim() || entry.value.trim());

	return {
		details,
		raw: details.length ? '' : rawText,
	};
}

function mapFailedServices(payload: unknown, catalog: Map<string, CompanyCatalogRow>) {
	return getRows(payload).map<IntegracaoComErpDashboardFailureRow>((row) => {
		const companyId = normalizeText(row.id_empresa);
		const company = findCompany(catalog, companyId);
		const metadata = mapMetadataDetails(row.metadata);

		return {
			executionId: normalizeText(row.id_servico_execucao),
			companyId,
			companyName: company?.name || normalizeText(row.nome_empresa) || companyId,
			companyLogoUrl: company?.logoUrl || normalizeText(row.logo),
			serviceName: normalizeText(row.nome_servico),
			startedAt: normalizeText(row.dthr_inicio_servico_execucao),
			metadataDetails: metadata.details,
			metadataRaw: metadata.raw,
		};
	});
}

export function mapIntegracaoComErpDashboardSnapshot({
	integratorStatusPayload,
	serviceSummaryPayload,
	disconnectedCompaniesPayload,
	orderTodayPayload,
	orderLast30Payload,
	failuresPayload,
	companyCatalogPayload,
}: DashboardMapperInput): IntegracaoComErpDashboardSnapshot {
	const companyCatalog = buildCompanyCatalog(companyCatalogPayload);
	const integratorRows = getRows(integratorStatusPayload);
	const serviceRows = getRows(serviceSummaryPayload);

	const connected = pickStatusValue(integratorRows, (label) => label.includes('conect') && !label.includes('desconect'));
	const disconnected = pickStatusValue(integratorRows, (label) => label.includes('desconect'));
	const finalized = pickStatusValue(serviceRows, (label) => label.includes('finalizado'));
	const failed = pickStatusValue(serviceRows, (label) => label.includes('falha_na_execucao') || label.includes('falha'));
	const total = serviceRows.reduce((current, row) => current + asNumber(row.qtd, 0), 0);

	return {
		integrators: {
			connected,
			disconnected,
		},
		disconnectedCompanies: mapDisconnectedCompanies(disconnectedCompaniesPayload, companyCatalog),
		orders: {
			today: mapOrderSummary(orderTodayPayload),
			last30Days: mapOrderSummary(orderLast30Payload),
			pendingCompanies: mapPendingCompanies(orderTodayPayload, orderLast30Payload, companyCatalog),
		},
		services: {
			total,
			finalized,
			failed,
		},
		failedServices: mapFailedServices(failuresPayload, companyCatalog),
		refreshedAt: new Date().toISOString(),
	};
}
