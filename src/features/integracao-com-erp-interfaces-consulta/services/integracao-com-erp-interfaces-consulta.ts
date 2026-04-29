import type { CrudListFilters, CrudRecord } from '@/src/components/crud-base/types'
import { asTrimmedString } from '@/src/features/integracao-com-erp-gateways/services/integracao-com-erp-gateways'

export const INTERFACE_SOURCE_TYPE_OPTIONS = [
	{ value: 'query', label: 'Query' },
	{ value: 'endpoint_gateway', label: 'Endpoint Gateway' },
] as const

export function normalizeInterfaceConsultaRecord(record: CrudRecord): CrudRecord {
	const tableId = asTrimmedString(record.id_tabela || record.id)
	const templateId = asTrimmedString(record.id_template)
	const queryId = asTrimmedString(record.id_query)
	const gatewayEndpointId = asTrimmedString(record.id_gateway_endpoint)
	return {
		...record,
		id: tableId,
		id_tabela: tableId,
		nome: asTrimmedString(record.nome || record.interface || record.tabela_nome),
		tipo_fonte: asTrimmedString(record.tipo_fonte),
		id_template: templateId,
		id_template_lookup: templateId ? { id: templateId, label: asTrimmedString(record.template_nome || record['templates.nome']) || templateId } : null,
		id_query: queryId,
		id_query_lookup: queryId ? { id: queryId, label: asTrimmedString(record.query_nome || record['querys.nome']) || queryId } : null,
		id_gateway_endpoint: gatewayEndpointId,
		id_gateway_endpoint_lookup: gatewayEndpointId ? { id: gatewayEndpointId, label: asTrimmedString(record.gateway_endpoint_nome || record['gateways_endpoints.endpoint']) || gatewayEndpointId } : null,
		observacao: asTrimmedString(record.observacao),
	}
}

export function buildInterfaceConsultaPayload(record: CrudRecord): CrudRecord {
	return {
		id_tabela: asTrimmedString(record.id_tabela || record.id),
		id_template: asTrimmedString(record.id_template) || null,
		tipo_fonte: asTrimmedString(record.tipo_fonte),
		id_query: asTrimmedString(record.id_query) || null,
		id_gateway_endpoint: asTrimmedString(record.id_gateway_endpoint) || null,
		observacao: asTrimmedString(record.observacao) || null,
	}
}

export function buildInterfaceConsultaCollectionParams(filters: CrudListFilters) {
	const params = new URLSearchParams({
		page: String(filters.page || 1),
		perpage: String(filters.perPage || 15),
		order: asTrimmedString(filters.orderBy || 'nome'),
		sort: asTrimmedString(filters.sort || 'asc'),
	})
	const id = asTrimmedString(filters.id)
	if (id) params.set('id', id)
	const nome = asTrimmedString(filters['nome::lk'])
	if (nome) params.set('nome:lk', nome)
	return params
}
