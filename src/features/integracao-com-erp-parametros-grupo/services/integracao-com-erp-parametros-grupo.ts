import type { CrudListFilters, CrudRecord } from '@/src/components/crud-base/types'

function asTrimmedString(value: unknown) {
	return typeof value === 'string' ? value.trim() : String(value ?? '').trim()
}

export function normalizeParametroGrupoRecord(record: CrudRecord): CrudRecord {
	return {
		...record,
		id: asTrimmedString(record.id),
		nome: asTrimmedString(record.nome),
		ordem: asTrimmedString(record.ordem),
	}
}

export function buildParametroGrupoPayload(record: CrudRecord): CrudRecord {
	const payload: CrudRecord = {
		...record,
		nome: asTrimmedString(record.nome),
		ordem: asTrimmedString(record.ordem),
	}

	const id = asTrimmedString(record.id)
	if (id) {
		payload.id = id
	} else {
		delete payload.id
	}

	return payload
}

export function buildParametroGrupoCollectionParams(filters: CrudListFilters) {
	const params = new URLSearchParams({
		page: String(filters.page || 1),
		perpage: String(filters.perPage || 15),
		order: String(filters.orderBy || 'nome'),
		sort: String(filters.sort || 'asc'),
	})

	const id = asTrimmedString(filters.id)
	if (id) {
		params.set('id', id)
	}

	const nome = asTrimmedString(filters['nome::lk'])
	if (nome) {
		params.set('nome:lk', nome)
	}

	const ordem = asTrimmedString(filters.ordem)
	if (ordem) {
		params.set('ordem', ordem)
	}

	return params
}
