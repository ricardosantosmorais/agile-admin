import type { CrudListFilters, CrudRecord } from '@/src/components/crud-base/types'

export const SCRIPT_LANGUAGE_OPTIONS = ['c#', 'plsql', 'javascript', 'json', 'razor', 'mysql', 'sqlserver'] as const

export type ScriptLanguage = typeof SCRIPT_LANGUAGE_OPTIONS[number]

function asTrimmedString(value: unknown) {
	return typeof value === 'string' ? value.trim() : String(value ?? '').trim()
}

export function normalizeScriptLanguage(value: unknown): ScriptLanguage {
	const normalized = asTrimmedString(value).toLowerCase()
	if (SCRIPT_LANGUAGE_OPTIONS.includes(normalized as ScriptLanguage)) {
		return normalized as ScriptLanguage
	}
	return 'javascript'
}

export function normalizeScriptRecord(record: CrudRecord): CrudRecord {
	return {
		...record,
		id: asTrimmedString(record.id),
		nome: asTrimmedString(record.nome),
		linguagem: normalizeScriptLanguage(record.linguagem),
		script: asTrimmedString(record.script),
		SourceExpressionKey: asTrimmedString(record.SourceExpressionKey),
	}
}

export function buildScriptPayload(record: CrudRecord): CrudRecord {
	const id = asTrimmedString(record.id)
	const sourceExpressionKey = asTrimmedString(record.SourceExpressionKey)
	const payload: CrudRecord = {
		nome: asTrimmedString(record.nome),
		linguagem: normalizeScriptLanguage(record.linguagem),
		script: asTrimmedString(record.script),
	}

	if (id) {
		payload.id = id
	}

	if (sourceExpressionKey) {
		payload.SourceExpressionKey = sourceExpressionKey
	}

	return payload
}

export function buildScriptCollectionParams(filters: CrudListFilters) {
	const params = new URLSearchParams({
		page: String(filters.page || 1),
		perpage: String(filters.perPage || 15),
		order: String(filters.orderBy || 'id'),
		sort: String(filters.sort || 'desc'),
	})

	const id = asTrimmedString(filters.id)
	if (id) params.set('id', id)

	const nome = asTrimmedString(filters['nome::lk'])
	if (nome) params.set('nome:lk', nome)

	const linguagem = asTrimmedString(filters['linguagem::lk'])
	if (linguagem) params.set('linguagem:lk', linguagem)

	return params
}
