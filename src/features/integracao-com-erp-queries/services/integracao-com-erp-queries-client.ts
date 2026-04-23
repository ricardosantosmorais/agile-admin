import { httpClient } from '@/src/services/http/http-client'
import { normalizeSqlQueryRows, buildSqlQueryPagination } from '@/src/features/editor-sql/services/sql-editor-mappers'
import type { SqlDataSource, SqlEditorExecuteResponse } from '@/src/features/editor-sql/services/sql-editor-types'
import type { CrudListFilters, CrudListResponse, CrudRecord } from '@/src/components/crud-base/types'

export type QuerySupportItem = {
	id: string
	label: string
	description: string
	parentId: string
	required: boolean
	primaryKey: boolean
	value?: string
}

export type QueryCompanyOption = {
	id: string
	nome: string
}

export type QueryMappingRecord = {
	id: string
	nomeAlias: string
	campo: string
	titulo: string
	tipo: string
	ordenacao: string
}

function asRecord(value: unknown) {
	return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

function asArray(value: unknown) {
	return Array.isArray(value) ? value : []
}

function asString(value: unknown) {
	return String(value ?? '').trim()
}

function asBool(value: unknown) {
	const normalized = asString(value).toLowerCase()
	return ['1', 'true', 'sim', 'yes'].includes(normalized)
}

function normalizeListPayload(payload: unknown, fallback: { page: number; perPage: number }): CrudListResponse {
	const record = asRecord(payload)
	const meta = asRecord(record.meta)
	return {
		data: asArray(record.data).map((entry) => {
			const row = asRecord(entry)
			return {
				...row,
				id: asString(row.id),
				nome: asString(row.nome),
				id_template: asString(row.id_template),
				template_nome: asString(row.template_nome || row['templates.nome']),
				ativo: asBool(row.ativo),
			}
		}) as CrudListResponse['data'],
		meta: {
			page: Number(meta.page || fallback.page),
			pages: Number(meta.pages || 1),
			perPage: Number(meta.perPage || meta.perpage || fallback.perPage),
			from: Number(meta.from || 0),
			to: Number(meta.to || 0),
			total: Number(meta.total || 0),
			order: asString(meta.order),
			sort: asString(meta.sort),
		},
	}
}

function buildParams(filters: CrudListFilters) {
	const params = new URLSearchParams({
		page: String(filters.page),
		perPage: String(filters.perPage),
		orderBy: filters.orderBy,
		sort: filters.sort,
	})

	for (const [key, value] of Object.entries(filters)) {
		if (['page', 'perPage', 'orderBy', 'sort'].includes(key)) continue
		const normalized = String(value ?? '').trim()
		if (normalized) params.set(key, normalized)
	}

	return params
}

export const integracaoComErpQueriesClient = {
	async list(filters: CrudListFilters): Promise<CrudListResponse> {
		const payload = await httpClient<unknown>(`/api/querys?${buildParams(filters).toString()}`, {
			method: 'GET',
			cache: 'no-store',
		})
		return normalizeListPayload(payload, { page: filters.page, perPage: filters.perPage })
	},
	async getById(id: string): Promise<CrudRecord> {
		return httpClient<CrudRecord>(`/api/querys/${encodeURIComponent(id)}`, {
			method: 'GET',
			cache: 'no-store',
		})
	},
	async save(payload: CrudRecord): Promise<CrudRecord[]> {
		return httpClient<CrudRecord[]>('/api/querys', {
			method: 'POST',
			cache: 'no-store',
			body: JSON.stringify(payload),
		})
	},
	async delete() {
		throw new Error('Exclusão não disponível para Queries.')
	},
	async listOptions() {
		return []
	},
	async listCompanies(): Promise<QueryCompanyOption[]> {
		const payload = await httpClient<{ data: QueryCompanyOption[] }>('/api/querys?mode=companies', {
			method: 'GET',
			cache: 'no-store',
		})
		return payload.data
	},
	async listSupport(companyId: string): Promise<QuerySupportItem[]> {
		const payload = await httpClient<{ data: QuerySupportItem[] }>(`/api/querys?mode=variables&idEmpresa=${encodeURIComponent(companyId || '1')}`, {
			method: 'GET',
			cache: 'no-store',
		})
		return payload.data
	},
	async listMapping(queryId: string): Promise<QueryMappingRecord[]> {
		const payload = await httpClient<{ data: QueryMappingRecord[] }>(`/api/querys?mode=mapping&idQuery=${encodeURIComponent(queryId)}`, {
			method: 'GET',
			cache: 'no-store',
		})
		return payload.data
	},
	async execute(input: { fonteDados: SqlDataSource; sql: string; idEmpresa: string; page?: number; perPage?: number }): Promise<SqlEditorExecuteResponse> {
		const page = input.page ?? 1
		const perPage = input.perPage ?? 100
		const payload = await httpClient<unknown>('/api/querys', {
			method: 'POST',
			cache: 'no-store',
			body: JSON.stringify({ action: 'execute', ...input, page, perPage }),
		})

		const record = asRecord(payload)
		const raw = record.raw ?? payload
		const rows = Array.isArray(record.rows) ? record.rows as SqlEditorExecuteResponse['rows'] : normalizeSqlQueryRows(raw)
		return {
			raw,
			rows,
			pagination: 'pagination' in record ? record.pagination as SqlEditorExecuteResponse['pagination'] : buildSqlQueryPagination(raw, page, perPage, rows),
		}
	},
}
