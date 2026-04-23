import type { CrudListFilters, CrudRecord } from '@/src/components/crud-base/types'
import type { LookupOption } from '@/src/components/ui/lookup-select'
import { httpClient } from '@/src/services/http/http-client'

function asTrimmedString(value: unknown) {
	return typeof value === 'string' ? value.trim() : String(value ?? '').trim()
}

function asBoolean(value: unknown) {
	if (typeof value === 'boolean') return value
	const normalized = asTrimmedString(value).toLowerCase()
	return ['1', 'true', 'sim', 'yes'].includes(normalized)
}

export function normalizeQueryRecord(record: CrudRecord): CrudRecord {
	const templateId = asTrimmedString(record.id_template)
	const templateName = asTrimmedString(record.template_nome || record['templates.nome'])

	return {
		...record,
		id: asTrimmedString(record.id),
		nome: asTrimmedString(record.nome),
		id_template: templateId,
		query: asTrimmedString(record.query),
		hash: asTrimmedString(record.hash),
		ativo: asBoolean(record.ativo),
		template_nome: templateName,
		...(templateId
			? {
					id_template_lookup: {
						id: templateId,
						label: templateName || templateId,
					},
				}
			: {}),
	}
}

export function buildQueryPayload(record: CrudRecord, userId?: string): CrudRecord {
	const sql = asTrimmedString(record.query)
	const id = asTrimmedString(record.id)
	const payload: CrudRecord = {
		nome: asTrimmedString(record.nome),
		id_template: asTrimmedString(record.id_template),
		query: sql,
		hash: asTrimmedString(record.hash),
		ativo: asBoolean(record.ativo),
		...(userId ? { id_usuario: userId } : {}),
	}

	if (id) {
		payload.id = id
	}

	return payload
}

export function buildQueryCollectionParams(filters: CrudListFilters) {
	const params = new URLSearchParams({
		page: String(filters.page || 1),
		perpage: String(filters.perPage || 15),
		order: String(filters.orderBy || 'nome'),
		sort: String(filters.sort || 'asc'),
	})

	const id = asTrimmedString(filters.id)
	if (id) params.set('id', id)

	const nome = asTrimmedString(filters['nome::lk'])
	if (nome) params.set('nome:lk', nome)

	const templateName = asTrimmedString(filters['template_nome::lk'])
	if (templateName) params.set('template_nome:lk', templateName)

	const templateId = asTrimmedString(filters.id_template)
	if (templateId) params.set('id_template', templateId)

	const ativo = asTrimmedString(filters.ativo)
	if (ativo === '1') params.set('ativo', 'true')
	if (ativo === '0') params.set('ativo', 'false')

	return params
}

export async function loadQueryTemplateOptions(query: string, page: number, perPage: number) {
	const params = new URLSearchParams({
		mode: 'templates',
		page: String(page),
		perPage: String(perPage),
		q: query,
	})
	const response = await httpClient<{ data: LookupOption[] }>(`/api/querys?${params.toString()}`, {
		method: 'GET',
		cache: 'no-store',
	})
	return response.data
}
