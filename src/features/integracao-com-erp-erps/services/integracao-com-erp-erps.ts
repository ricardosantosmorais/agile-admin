import type { CrudListFilters, CrudRecord } from '@/src/components/crud-base/types'

function asTrimmedString(value: unknown) {
	return typeof value === 'string' ? value.trim() : String(value ?? '').trim()
}

export function normalizeErpRecord(record: CrudRecord): CrudRecord {
	return {
		...record,
		id: asTrimmedString(record.id),
		codigo: asTrimmedString(record.codigo),
		nome: asTrimmedString(record.nome),
	}
}

export function buildErpPayload(record: CrudRecord): CrudRecord {
	const payload: CrudRecord = {
		...record,
		codigo: asTrimmedString(record.codigo),
		nome: asTrimmedString(record.nome),
	}

	const id = asTrimmedString(record.id)
	if (id) {
		payload.id = id
	} else {
		delete payload.id
	}

	return payload
}

export function buildErpCollectionParams(filters: CrudListFilters) {
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

	const codigo = asTrimmedString(filters['codigo::lk'])
	if (codigo) {
		params.set('codigo:lk', codigo)
	}

	const nome = asTrimmedString(filters['nome::lk'])
	if (nome) {
		params.set('nome:lk', nome)
	}

	return params
}
