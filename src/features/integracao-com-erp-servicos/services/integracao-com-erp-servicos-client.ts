import { httpClient } from '@/src/services/http/http-client';
import {
	normalizeIntegracaoComErpServicoConfigHistory,
	normalizeIntegracaoComErpServicoExecutionDetails,
	normalizeIntegracaoComErpServicoExecutionFailure,
	normalizeIntegracaoComErpServicoExecutionLogContent,
	normalizeIntegracaoComErpServicoExecutions,
	normalizeIntegracaoComErpServicoHistory,
	normalizeIntegracaoComErpServicoQuerySupport,
	normalizeIntegracaoComErpServicoWizardCatalog,
	normalizeIntegracaoComErpServicoWizardContext,
	normalizeIntegracaoComErpServicosResponse,
} from '@/src/features/integracao-com-erp-servicos/services/integracao-com-erp-servicos-mappers';
import type {
	IntegracaoComErpServicoRecord,
	IntegracaoComErpServicoConfigHistoryResponse,
	IntegracaoComErpServicoExecutionDetailResponse,
	IntegracaoComErpServicoExecutionFailure,
	IntegracaoComErpServicoExecutionFilters,
	IntegracaoComErpServicoExecutionLogContent,
	IntegracaoComErpServicoExecutionResponse,
	IntegracaoComErpServicoHistoryResponse,
	IntegracaoComErpServicoQuerySupportResponse,
	IntegracaoComErpServicoUpdatePayload,
	IntegracaoComErpServicoWizardCatalog,
	IntegracaoComErpServicoWizardContext,
	IntegracaoComErpServicoWizardPayload,
	IntegracaoComErpServicoWizardQueryContext,
	IntegracaoComErpServicoWizardResult,
	IntegracaoComErpServicosCommandResult,
	IntegracaoComErpServicosFilters,
	IntegracaoComErpServicosResponse,
} from '@/src/features/integracao-com-erp-servicos/services/integracao-com-erp-servicos-types';

function buildListParams(filters: IntegracaoComErpServicosFilters, scope: 'active' | 'inactive') {
	const params = new URLSearchParams({
		page: String(filters.page),
		perPage: String(filters.perPage),
		orderBy: filters.orderBy,
		sort: filters.sort,
		scope,
	});

	for (const [key, value] of Object.entries(filters)) {
		if (['page', 'perPage', 'orderBy', 'sort'].includes(key)) {
			continue;
		}

		const normalized = String(value || '').trim();
		if (!normalized) {
			continue;
		}

		params.set(key, normalized);
	}

	return params;
}

function buildExecutionParams(serviceId: string, filters: IntegracaoComErpServicoExecutionFilters) {
	const params = new URLSearchParams({
		mode: 'executions',
		serviceId,
		page: String(filters.page),
		perPage: String(filters.perPage),
	});

	if (filters.id.trim()) params.set('executionId', filters.id.trim());
	if (filters.status.trim()) params.set('status', filters.status.trim());
	if (filters.abortar.trim()) params.set('abortar', filters.abortar.trim());

	return params;
}

export const integracaoComErpServicosClient = {
	async list(filters: IntegracaoComErpServicosFilters): Promise<IntegracaoComErpServicosResponse> {
		const params = buildListParams(filters, 'active');
		const payload = await httpClient<unknown>(`/api/integracao-com-erp/servicos?${params.toString()}`, {
			method: 'GET',
			cache: 'no-store',
		});

		return normalizeIntegracaoComErpServicosResponse(payload, {
			page: filters.page,
			perPage: filters.perPage,
		});
	},
	async listInactive(filters: IntegracaoComErpServicosFilters): Promise<IntegracaoComErpServicosResponse> {
		const params = buildListParams(filters, 'inactive');
		const payload = await httpClient<unknown>(`/api/integracao-com-erp/servicos?${params.toString()}`, {
			method: 'GET',
			cache: 'no-store',
		});

		return normalizeIntegracaoComErpServicosResponse(payload, {
			page: filters.page,
			perPage: filters.perPage,
		});
	},
	async getById(id: string): Promise<IntegracaoComErpServicoRecord> {
		const payload = await httpClient<unknown>(`/api/integracao-com-erp/servicos?mode=detail&serviceId=${encodeURIComponent(id)}`, {
			method: 'GET',
			cache: 'no-store',
		});
		const response = normalizeIntegracaoComErpServicosResponse(payload, {
			page: 1,
			perPage: 1,
		});

		const record = response.data[0];
		if (!record) {
			throw new Error('Serviço ERP não encontrado.');
		}

		return record;
	},
	async getWizardContext(): Promise<IntegracaoComErpServicoWizardContext> {
		const payload = await httpClient<unknown>('/api/integracao-com-erp/servicos?mode=wizard-context', {
			method: 'GET',
			cache: 'no-store',
		});

		return normalizeIntegracaoComErpServicoWizardContext(payload);
	},
	async getWizardCatalog(templateId?: string): Promise<IntegracaoComErpServicoWizardCatalog> {
		const params = new URLSearchParams({ mode: 'wizard-catalog' });
		if (String(templateId || '').trim()) {
			params.set('templateId', String(templateId).trim());
		}

		const payload = await httpClient<unknown>(`/api/integracao-com-erp/servicos?${params.toString()}`, {
			method: 'GET',
			cache: 'no-store',
		});

		return normalizeIntegracaoComErpServicoWizardCatalog(payload);
	},
	async getWizardQueryContext(tableName?: string): Promise<IntegracaoComErpServicoWizardQueryContext> {
		const params = new URLSearchParams({ mode: 'wizard-query-context' });
		if (String(tableName || '').trim()) {
			params.set('tableName', String(tableName).trim());
		}

		return httpClient<IntegracaoComErpServicoWizardQueryContext>(`/api/integracao-com-erp/servicos?${params.toString()}`, {
			method: 'GET',
			cache: 'no-store',
		});
	},
	async createWizard(payload: IntegracaoComErpServicoWizardPayload): Promise<IntegracaoComErpServicoWizardResult> {
		return httpClient<IntegracaoComErpServicoWizardResult>('/api/integracao-com-erp/servicos', {
			method: 'POST',
			cache: 'no-store',
			body: JSON.stringify({ action: 'create-wizard', payload }),
		});
	},
	async listConfigHistory(serviceId: string): Promise<IntegracaoComErpServicoConfigHistoryResponse> {
		const payload = await httpClient<unknown>(`/api/integracao-com-erp/servicos?mode=config-history&serviceId=${encodeURIComponent(serviceId)}&page=1&perPage=20`, {
			method: 'GET',
			cache: 'no-store',
		});

		return normalizeIntegracaoComErpServicoConfigHistory(payload, { page: 1, perPage: 20 });
	},
	async getQuerySupport(serviceId: string): Promise<IntegracaoComErpServicoQuerySupportResponse> {
		const payload = await httpClient<unknown>(`/api/integracao-com-erp/servicos?mode=query-support&serviceId=${encodeURIComponent(serviceId)}`, {
			method: 'GET',
			cache: 'no-store',
		});

		return normalizeIntegracaoComErpServicoQuerySupport(payload);
	},
	async listHistory(serviceId: string): Promise<IntegracaoComErpServicoHistoryResponse> {
		const payload = await httpClient<unknown>(`/api/integracao-com-erp/servicos?mode=query-history&serviceId=${encodeURIComponent(serviceId)}&page=1&perPage=20`, {
			method: 'GET',
			cache: 'no-store',
		});

		return normalizeIntegracaoComErpServicoHistory(payload, { page: 1, perPage: 20 });
	},
	async saveQuery(serviceId: string, hash: string, sql: string, motivo: string): Promise<IntegracaoComErpServicosCommandResult> {
		return httpClient<IntegracaoComErpServicosCommandResult>('/api/integracao-com-erp/servicos', {
			method: 'POST',
			cache: 'no-store',
			body: JSON.stringify({ action: 'save-query', id: serviceId, hash, sql, motivo }),
		});
	},
	async rollbackQuery(historyId: string): Promise<{ sql: string }> {
		return httpClient<{ sql: string }>('/api/integracao-com-erp/servicos', {
			method: 'POST',
			cache: 'no-store',
			body: JSON.stringify({ action: 'rollback-query', historyId }),
		});
	},
	async listExecutions(serviceId: string, filters: IntegracaoComErpServicoExecutionFilters): Promise<IntegracaoComErpServicoExecutionResponse> {
		const payload = await httpClient<unknown>(`/api/integracao-com-erp/servicos?${buildExecutionParams(serviceId, filters).toString()}`, {
			method: 'GET',
			cache: 'no-store',
		});

		return normalizeIntegracaoComErpServicoExecutions(payload, { page: filters.page, perPage: filters.perPage });
	},
	async getExecutionFailure(executionId: string): Promise<IntegracaoComErpServicoExecutionFailure> {
		const payload = await httpClient<unknown>(`/api/integracao-com-erp/servicos?mode=execution-failure&executionId=${encodeURIComponent(executionId)}`, {
			method: 'GET',
			cache: 'no-store',
		});

		return normalizeIntegracaoComErpServicoExecutionFailure(payload);
	},
	async listExecutionDetails(executionId: string, pagination?: { page?: number; perPage?: number }): Promise<IntegracaoComErpServicoExecutionDetailResponse> {
		const page = pagination?.page ?? 1;
		const perPage = pagination?.perPage ?? 10;
		const payload = await httpClient<unknown>(
			`/api/integracao-com-erp/servicos?mode=execution-details&executionId=${encodeURIComponent(executionId)}&page=${page}&perPage=${perPage}`,
			{
				method: 'GET',
				cache: 'no-store',
			},
		);

		return normalizeIntegracaoComErpServicoExecutionDetails(payload, { page, perPage });
	},
	async getExecutionDetailContent(detailId: string, kind: 'detail' | 'metadata'): Promise<IntegracaoComErpServicoExecutionLogContent> {
		const payload = await httpClient<unknown>(
			`/api/integracao-com-erp/servicos?mode=execution-detail-content&detailId=${encodeURIComponent(detailId)}&kind=${encodeURIComponent(kind)}`,
			{
				method: 'GET',
				cache: 'no-store',
			},
		);

		return normalizeIntegracaoComErpServicoExecutionLogContent(payload);
	},
	async abortExecution(executionId: string): Promise<IntegracaoComErpServicosCommandResult> {
		return httpClient<IntegracaoComErpServicosCommandResult>('/api/integracao-com-erp/servicos', {
			method: 'POST',
			cache: 'no-store',
			body: JSON.stringify({ action: 'abort-execution', executionId }),
		});
	},
	async execute(ids: string[]): Promise<IntegracaoComErpServicosCommandResult> {
		return httpClient<IntegracaoComErpServicosCommandResult>('/api/integracao-com-erp/servicos', {
			method: 'POST',
			cache: 'no-store',
			body: JSON.stringify({ action: 'execute', ids }),
		});
	},
	async reload(ids: string[]): Promise<IntegracaoComErpServicosCommandResult> {
		return httpClient<IntegracaoComErpServicosCommandResult>('/api/integracao-com-erp/servicos', {
			method: 'POST',
			cache: 'no-store',
			body: JSON.stringify({ action: 'reload', ids }),
		});
	},
	async activate(id: string, reason: string): Promise<IntegracaoComErpServicosCommandResult> {
		return httpClient<IntegracaoComErpServicosCommandResult>('/api/integracao-com-erp/servicos', {
			method: 'POST',
			cache: 'no-store',
			body: JSON.stringify({ action: 'activate', id, reason }),
		});
	},
	async update(id: string, payload: IntegracaoComErpServicoUpdatePayload): Promise<IntegracaoComErpServicosCommandResult> {
		return httpClient<IntegracaoComErpServicosCommandResult>('/api/integracao-com-erp/servicos', {
			method: 'POST',
			cache: 'no-store',
			body: JSON.stringify({
				action: 'update',
				id,
				ativo: payload.ativo,
				intervaloExecucao: payload.intervaloExecucao,
				urlFiltro: payload.urlFiltro,
				motivo: payload.motivo,
			}),
		});
	},
};
