import type { CrudListFilters, CrudRecord } from '@/src/components/crud-base/types'

function asTrimmedString(value: unknown) {
	return typeof value === 'string' ? value.trim() : String(value ?? '').trim()
}

function asBoolean(value: unknown) {
	if (typeof value === 'boolean') return value
	const normalized = asTrimmedString(value).toLowerCase()
	return ['1', 'true', 'sim', 'yes'].includes(normalized)
}

export const ENDPOINT_RETURN_TYPE_OPTIONS = [
	{ value: 'implementacao', label: 'Implementação' },
	{ value: 'script', label: 'Script' },
	{ value: 'tabela', label: 'Tabela' },
	{ value: 'view', label: 'View' },
] as const

export const ENDPOINT_DATA_SOURCE_OPTIONS = [
	{ value: 'agilesync', label: 'AgileSync' },
	{ value: 'agileecommerce', label: 'AgileEcommerce' },
] as const

export const ENDPOINT_PROFILE_OPTIONS = [
	{ value: 'administrador', label: 'Administrador' },
	{ value: 'empresa', label: 'Empresa' },
	{ value: 'cliente', label: 'Cliente' },
] as const

export function getEndpointReturnTypeLabel(value: unknown) {
	const normalized = asTrimmedString(value)
	return ENDPOINT_RETURN_TYPE_OPTIONS.find((option) => option.value === normalized)?.label || normalized || '-'
}

export function normalizeEndpointRecord(record: CrudRecord): CrudRecord {
	return {
		...record,
		id: asTrimmedString(record.id),
		nome: asTrimmedString(record.nome),
		descricao: asTrimmedString(record.descricao),
		tipo_retorno: asTrimmedString(record.tipo_retorno),
		id_query: asTrimmedString(record.id_query),
		query_nome: asTrimmedString(record.query_nome || record['queries.nome']),
		fonte_dados: asTrimmedString(record.fonte_dados),
		id_tabela: asTrimmedString(record.id_tabela),
		tabela_nome: asTrimmedString(record.tabela_nome || record['tabelas.nome']),
		implementacao_nome: asTrimmedString(record.implementacao_nome),
		limite: asTrimmedString(record.limite),
		publico: asBoolean(record.publico),
		ativo: asBoolean(record.ativo),
	}
}

export function buildEndpointPayload(record: CrudRecord): CrudRecord {
	const id = asTrimmedString(record.id)
	const tipoRetorno = asTrimmedString(record.tipo_retorno)
	const payload: CrudRecord = {
		nome: asTrimmedString(record.nome),
		descricao: asTrimmedString(record.descricao),
		tipo_retorno: tipoRetorno,
		publico: asBoolean(record.publico),
		ativo: asBoolean(record.ativo),
		limite: asTrimmedString(record.limite),
		id_query: tipoRetorno === 'view' ? asTrimmedString(record.id_query) : '',
		fonte_dados: tipoRetorno === 'view' ? asTrimmedString(record.fonte_dados) : '',
		id_tabela: tipoRetorno === 'tabela' ? asTrimmedString(record.id_tabela) : '',
		implementacao_nome: tipoRetorno === 'implementacao' ? asTrimmedString(record.implementacao_nome) : '',
	}

	if (id) {
		payload.id = id
	}

	return payload
}

export function buildEndpointCollectionParams(filters: CrudListFilters) {
	const params = new URLSearchParams({
		page: String(filters.page || 1),
		perpage: String(filters.perPage || 15),
		order: String(filters.orderBy || 'id'),
		sort: String(filters.sort || 'asc'),
	})

	const id = asTrimmedString(filters.id)
	if (id) params.set('id', id)

	const nome = asTrimmedString(filters['nome::lk'])
	if (nome) params.set('nome:lk', nome)

	const tipoRetorno = asTrimmedString(filters['tipo_retorno::lk'] || filters.tipo_retorno)
	if (tipoRetorno) params.set('tipo_retorno:lk', tipoRetorno)

	const publico = asTrimmedString(filters.publico)
	if (publico === '1') params.set('publico', '1')
	if (publico === '0') params.set('publico', '0')

	const ativo = asTrimmedString(filters.ativo)
	if (ativo === '1') params.set('ativo', '1')
	if (ativo === '0') params.set('ativo', '0')

	return params
}
