import type { CrudListFilters, CrudRecord } from '@/src/components/crud-base/types'
import { asBoolean, asTrimmedString } from '@/src/features/integracao-com-erp-gateways/services/integracao-com-erp-gateways'

export const GATEWAY_ENDPOINT_VERB_OPTIONS = ['get', 'post', 'put', 'patch', 'delete'] as const
export const GATEWAY_ENDPOINT_TYPE_OPTIONS = [
	{ value: 'autenticacao', label: 'Autenticação' },
	{ value: 'consulta', label: 'Consulta' },
	{ value: 'envio', label: 'Envio' },
	{ value: 'outro', label: 'Outro' },
] as const
export const GATEWAY_ENDPOINT_PAGINATION_OPTIONS = [
	{ value: 'SemPaginacao', label: 'Sem paginação' },
	{ value: 'QueryString', label: 'Query string' },
	{ value: 'Body', label: 'Body' },
	{ value: 'Header', label: 'Header' },
] as const

export function normalizeGatewayEndpointRecord(record: CrudRecord): CrudRecord {
	const gatewayId = asTrimmedString(record.id_gateway)
	const gatewayName = asTrimmedString(record.gateway_nome || record['gateways.nome'])
	return {
		...record,
		id: asTrimmedString(record.id),
		id_gateway: gatewayId,
		id_gateway_lookup: gatewayId ? { id: gatewayId, label: gatewayName || gatewayId } : null,
		endpoint: asTrimmedString(record.endpoint),
		verbo: asTrimmedString(record.verbo).toLowerCase(),
		tipo: asTrimmedString(record.tipo),
		ativo: asBoolean(record.ativo),
		body: asTrimmedString(record.body),
		parametros: asTrimmedString(record.parametros),
		url_filtro: asTrimmedString(record.url_filtro),
		data_array: asTrimmedString(record.data_array),
		tipo_paginacao: asTrimmedString(record.tipo_paginacao),
		nome_propriedade_pagina: asTrimmedString(record.nome_propriedade_pagina),
		nome_propriedade_por_pagina: asTrimmedString(record.nome_propriedade_por_pagina),
		quantidade_por_pagina: asTrimmedString(record.quantidade_por_pagina),
		nome_retorno_pagina_atual: asTrimmedString(record.nome_retorno_pagina_atual),
		nome_retorno_total_paginas: asTrimmedString(record.nome_retorno_total_paginas),
		expiracao_campo: asTrimmedString(record.expiracao_campo),
		expiracao_tempo: asTrimmedString(record.expiracao_tempo),
		expiracao_formato: asTrimmedString(record.expiracao_formato),
		token_campo: asTrimmedString(record.token_campo),
	}
}

export function buildGatewayEndpointPayload(record: CrudRecord): CrudRecord {
	const payload: CrudRecord = {
		id_gateway: asTrimmedString(record.id_gateway),
		endpoint: asTrimmedString(record.endpoint),
		verbo: asTrimmedString(record.verbo).toLowerCase(),
		tipo: asTrimmedString(record.tipo) || null,
		ativo: asBoolean(record.ativo) ? 1 : 0,
		body: asTrimmedString(record.body) || null,
		parametros: asTrimmedString(record.parametros) || null,
		url_filtro: asTrimmedString(record.url_filtro) || null,
		data_array: asTrimmedString(record.data_array) || null,
		tipo_paginacao: asTrimmedString(record.tipo_paginacao) || null,
		nome_propriedade_pagina: asTrimmedString(record.nome_propriedade_pagina) || null,
		nome_propriedade_por_pagina: asTrimmedString(record.nome_propriedade_por_pagina) || null,
		quantidade_por_pagina: asTrimmedString(record.quantidade_por_pagina) || null,
		nome_retorno_pagina_atual: asTrimmedString(record.nome_retorno_pagina_atual) || null,
		nome_retorno_total_paginas: asTrimmedString(record.nome_retorno_total_paginas) || null,
		expiracao_campo: asTrimmedString(record.expiracao_campo) || null,
		expiracao_tempo: asTrimmedString(record.expiracao_tempo) || null,
		expiracao_formato: asTrimmedString(record.expiracao_formato) || null,
		token_campo: asTrimmedString(record.token_campo) || null,
	}
	const id = asTrimmedString(record.id)
	if (id) payload.id = id
	return payload
}

export function buildGatewayEndpointCollectionParams(filters: CrudListFilters) {
	const params = new URLSearchParams({
		page: String(filters.page || 1),
		perpage: String(filters.perPage || 15),
		order: asTrimmedString(filters.orderBy || 'endpoint'),
		sort: asTrimmedString(filters.sort || 'asc'),
		join: 'gateways:nome,id',
	})
	const id = asTrimmedString(filters.id)
	if (id) params.set('id', id)
	const gateway = asTrimmedString(filters.id_gateway)
	if (gateway) params.set('id_gateway', gateway)
	const endpoint = asTrimmedString(filters['endpoint::lk'])
	if (endpoint) params.set('endpoint:lk', endpoint)
	const verbo = asTrimmedString(filters.verbo).toLowerCase()
	if (verbo) params.set('verbo', verbo)
	return params
}
