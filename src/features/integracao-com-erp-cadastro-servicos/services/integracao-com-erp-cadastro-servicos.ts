import type { CrudListFilters, CrudRecord } from '@/src/components/crud-base/types'
import { asBoolean, asTrimmedString } from '@/src/features/integracao-com-erp-gateways/services/integracao-com-erp-gateways'

export const SERVICO_OBJECT_TYPE_OPTIONS = [
	{ value: 'query', label: 'Query' },
	{ value: 'script', label: 'Script' },
	{ value: 'acao', label: 'Ação' },
	{ value: 'implementacao', label: 'Implementação' },
	{ value: 'endpoint_gateway', label: 'Endpoint Gateway' },
	{ value: 'imagensdatabase', label: 'Imagens Database' },
	{ value: 'imagenslista', label: 'Imagens Lista' },
	{ value: 'imagenssftp', label: 'Imagens SFTP' },
	{ value: 'imagens', label: 'Imagens' },
] as const

export const SERVICO_DATA_SOURCE_OPTIONS = [
	{ value: 'agileecommerce', label: 'Agile E-commerce' },
	{ value: 'agilesync', label: 'AgileSync' },
	{ value: 'erp', label: 'ERP' },
] as const

export const SERVICO_OUTPUT_OPTIONS = [
	{ value: 'InsertOnDuplicateUpdate', label: 'Insert On Duplicate Update' },
	{ value: 'SQliteDataBase', label: 'SQLite Database' },
	{ value: 'Json', label: 'Json' },
] as const

export const SERVICO_EXECUTION_TYPE_OPTIONS = [
	{ value: 'gravacao', label: 'Gravação' },
	{ value: 'implementacao', label: 'Implementação' },
	{ value: 'leitura', label: 'Leitura' },
	{ value: 'configuracao', label: 'Configuração' },
	{ value: 'comparacao', label: 'Comparação' },
] as const

export const SERVICO_CHANNEL_OPTIONS = [
	{ value: 'agilesync', label: 'AgileSync' },
	{ value: 'agileapi', label: 'Agile API' },
] as const

export const SERVICO_INTERVAL_OPTIONS = [
	'2', '5', '10', '15', '20', '30', '45', '60', '120', '180', '240', '300', '360', '720', '1440',
].map((value) => ({ value, label: Number(value) < 60 ? `${value} Minutos` : value === '60' ? '1 Hora' : value === '1440' ? '1 Dia' : `${Number(value) / 60} Horas` }))

export function normalizeServicoCadastroRecord(record: CrudRecord): CrudRecord {
	const templateId = asTrimmedString(record.id_template)
	const objectId = asTrimmedString(record.id_objeto)
	const gatewayEndpointId = asTrimmedString(record.id_gateway_endpoint || record.id_gateway_endpoint_fallback)
	return {
		...record,
		id: asTrimmedString(record.id),
		nome: asTrimmedString(record.nome),
		tipo_objeto: asTrimmedString(record.tipo_objeto),
		id_template: templateId,
		id_template_lookup: templateId ? { id: templateId, label: asTrimmedString(record.template_nome || record['templates.nome']) || templateId } : null,
		id_objeto: objectId,
		id_objeto_lookup: objectId ? { id: objectId, label: asTrimmedString(record.objeto_nome) || objectId } : null,
		nome_objeto: asTrimmedString(record.nome_objeto),
		fonte_dados: asTrimmedString(record.fonte_dados),
		saida_objeto: asTrimmedString(record.saida_objeto),
		tipo_execucao: asTrimmedString(record.tipo_execucao),
		canal_execucao: asTrimmedString(record.canal_execucao),
		intervalo_execucao: asTrimmedString(record.intervalo_execucao),
		filtro_sql: asTrimmedString(record.filtro_sql),
		id_gateway_endpoint: gatewayEndpointId,
		id_gateway_endpoint_lookup: gatewayEndpointId ? { id: gatewayEndpointId, label: asTrimmedString(record.gateway_endpoint_nome || record['gateways_endpoints.endpoint']) || gatewayEndpointId } : null,
		modo_transformacao_gateway: asTrimmedString(record.modo_transformacao_gateway) || 'registro',
		dataset_source_path: asTrimmedString(record.dataset_source_path),
		mapeamento: asTrimmedString(record.mapeamento),
		ativo: asBoolean(record.ativo),
		compara_delecao: asBoolean(record.compara_delecao),
		carga_geral: asBoolean(record.carga_geral),
		utiliza_sync_id: asBoolean(record.utiliza_sync_id),
		especifico: asBoolean(record.especifico),
		obrigatorio: asBoolean(record.obrigatorio),
	}
}

export function buildServicoCadastroPayload(record: CrudRecord): CrudRecord {
	const tipoObjeto = asTrimmedString(record.tipo_objeto)
	const gatewayTransformationMode = tipoObjeto === 'endpoint_gateway' && asTrimmedString(record.modo_transformacao_gateway) === 'dataset_consolidado'
		? 'dataset_consolidado'
		: 'registro'
	const datasetSourcePath = gatewayTransformationMode === 'dataset_consolidado'
		? asTrimmedString(record.dataset_source_path) || null
		: null
	const payload: CrudRecord = {
		nome: asTrimmedString(record.nome),
		id_template: asTrimmedString(record.id_template) || null,
		tipo_objeto: tipoObjeto,
		id_objeto: asTrimmedString(record.id_objeto) || null,
		nome_objeto: asTrimmedString(record.nome_objeto) || null,
		fonte_dados: asTrimmedString(record.fonte_dados) || null,
		saida_objeto: asTrimmedString(record.saida_objeto) || null,
		tipo_execucao: asTrimmedString(record.tipo_execucao) || null,
		canal_execucao: asTrimmedString(record.canal_execucao) || null,
		intervalo_execucao: asTrimmedString(record.intervalo_execucao) || null,
		filtro_sql: asTrimmedString(record.filtro_sql) || null,
		id_gateway_endpoint: asTrimmedString(record.id_gateway_endpoint) || null,
		modo_transformacao_gateway: gatewayTransformationMode,
		dataset_source_path: datasetSourcePath,
		mapeamento: asTrimmedString(record.mapeamento) || null,
		ativo: asBoolean(record.ativo) ? 1 : 0,
		compara_delecao: asBoolean(record.compara_delecao) ? 1 : 0,
		carga_geral: asBoolean(record.carga_geral) ? 1 : 0,
		utiliza_sync_id: asBoolean(record.utiliza_sync_id) ? 1 : 0,
		especifico: asBoolean(record.especifico) ? 1 : 0,
		obrigatorio: asBoolean(record.obrigatorio) ? 1 : 0,
	}
	const id = asTrimmedString(record.id)
	if (id) payload.id = id
	return payload
}

export function buildServicoCadastroCollectionParams(filters: CrudListFilters) {
	const params = new URLSearchParams({
		page: String(filters.page || 1),
		perpage: String(filters.perPage || 15),
		order: asTrimmedString(filters.orderBy || 'nome'),
		sort: asTrimmedString(filters.sort || 'asc'),
		join: 'templates:nome,id',
	})
	const id = asTrimmedString(filters.id)
	if (id) params.set('id', id)
	const nome = asTrimmedString(filters['nome::lk'])
	if (nome) params.set('nome:lk', nome)
	const tipo = asTrimmedString(filters.tipo_objeto)
	if (tipo) params.set('tipo_objeto', tipo)
	const template = asTrimmedString(filters.id_template)
	if (template) params.set('id_template', template)
	return params
}
