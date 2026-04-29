import type { CrudListFilters, CrudRecord } from '@/src/components/crud-base/types'
import { asBoolean, asTrimmedString } from '@/src/features/integracao-com-erp-gateways/services/integracao-com-erp-gateways'

export const ACAO_TYPE_OPTIONS = [
	{ value: 'padrao', label: 'Padrão' },
	{ value: 'parametros', label: 'Parâmetros' },
	{ value: 'notificacao', label: 'Notificação' },
	{ value: 'nosql', label: 'NoSql' },
] as const

export const ACAO_EXECUTION_OPTIONS = [
	{ value: 'Leitura', label: 'Leitura' },
	{ value: 'Gravacao', label: 'Gravação' },
	{ value: 'Comparacao', label: 'Comparação' },
	{ value: 'LeituraApi', label: 'LeituraApi' },
	{ value: 'GravacaoApi', label: 'GravacaoApi' },
	{ value: 'ComparacaoApi', label: 'ComparacaoApi' },
] as const

export const ACAO_DETAIL_LANGUAGE_OPTIONS = [
	{ value: 'agilescript', label: 'agilescript' },
	{ value: 'razor', label: 'razor' },
] as const

export const ACAO_DETAIL_OBJECT_OPTIONS = [
	{ value: 'query', label: 'query' },
	{ value: 'script', label: 'script' },
	{ value: 'razor', label: 'razor' },
] as const

export function normalizeAcaoRecord(record: CrudRecord): CrudRecord {
	const templateId = asTrimmedString(record.id_template)
	const gatewayId = asTrimmedString(record.id_gateway)
	return {
		...record,
		id: asTrimmedString(record.id),
		nome: asTrimmedString(record.nome),
		tipo: asTrimmedString(record.tipo),
		ativo: asBoolean(record.ativo),
		id_template: templateId,
		id_template_lookup: templateId ? { id: templateId, label: asTrimmedString(record.template_nome || record['templates.nome']) || templateId } : null,
		id_gateway: gatewayId,
		id_gateway_lookup: gatewayId ? { id: gatewayId, label: asTrimmedString(record.gateway_nome || record['gateways.nome']) || gatewayId } : null,
		objeto: asTrimmedString(record.objeto),
		url_filtro: asTrimmedString(record.url_filtro),
	}
}

export function buildAcaoPayload(record: CrudRecord): CrudRecord {
	const payload: CrudRecord = {
		nome: asTrimmedString(record.nome),
		tipo: asTrimmedString(record.tipo),
		ativo: asBoolean(record.ativo) ? 1 : 0,
		id_template: asTrimmedString(record.id_template) || null,
		id_gateway: asTrimmedString(record.id_gateway) || null,
		objeto: asTrimmedString(record.objeto),
		url_filtro: asTrimmedString(record.url_filtro),
	}
	const id = asTrimmedString(record.id)
	if (id) payload.id = id
	return payload
}

export function buildAcaoCollectionParams(filters: CrudListFilters) {
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
	const tipo = asTrimmedString(filters.tipo)
	if (tipo) params.set('tipo', tipo)
	const template = asTrimmedString(filters.id_template)
	if (template) params.set('id_template', template)
	const gateway = asTrimmedString(filters.id_gateway)
	if (gateway) params.set('id_gateway', gateway)
	const ativo = asTrimmedString(filters.ativo)
	if (ativo === '1' || ativo === '0') params.set('ativo', ativo)
	return params
}
