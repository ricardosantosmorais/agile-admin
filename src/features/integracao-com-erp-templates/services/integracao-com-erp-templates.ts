import { loadCrudLookupOptions } from '@/src/components/crud-base/crud-client'
import type { CrudListFilters, CrudRecord } from '@/src/components/crud-base/types'
import type { LookupOption } from '@/src/components/ui/lookup-select'

function asTrimmedString(value: unknown) {
	return typeof value === 'string' ? value.trim() : String(value ?? '').trim()
}

export function normalizeTemplateRecord(record: CrudRecord): CrudRecord {
	const erpId = asTrimmedString(record.id_erp)
	const erpName = asTrimmedString(record['erps.nome'])

	return {
		...record,
		id: asTrimmedString(record.id),
		id_erp: erpId,
		codigo: asTrimmedString(record.codigo),
		nome: asTrimmedString(record.nome),
		...(erpId
			? {
					id_erp_lookup: {
						id: erpId,
						label: erpName || erpId,
					},
			  }
			: {}),
	}
}

export function buildTemplatePayload(record: CrudRecord): CrudRecord {
	const payload: CrudRecord = {
		...record,
		id_erp: asTrimmedString(record.id_erp),
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

export function buildTemplateCollectionParams(filters: CrudListFilters) {
	const params = new URLSearchParams({
		page: String(filters.page || 1),
		perpage: String(filters.perPage || 15),
		order: String(filters.orderBy || 'nome'),
		sort: String(filters.sort || 'asc'),
		join: 'erps:nome,id',
	})

	const id = asTrimmedString(filters.id)
	if (id) {
		params.set('id', id)
	}

	const erpId = asTrimmedString(filters.id_erp)
	if (erpId) {
		params.set('id_erp', erpId)
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

export async function loadTemplateErpOptions(query: string, page: number, perPage: number) {
	const options = await loadCrudLookupOptions('erps', query, page, perPage)
	return options.map((option): LookupOption => ({
		id: option.value,
		label: option.label,
	}))
}
