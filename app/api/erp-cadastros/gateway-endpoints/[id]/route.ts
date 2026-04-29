import { createAgileCatalogItemGetHandler } from '@/app/api/erp-cadastros/_shared'
import { buildGatewayEndpointCollectionParams, buildGatewayEndpointPayload, normalizeGatewayEndpointRecord } from '@/src/features/integracao-com-erp-gateway-endpoints/services/integracao-com-erp-gateway-endpoints'

export const GET = createAgileCatalogItemGetHandler({
	resource: 'gateways_endpoints',
	defaultOrderBy: 'endpoint',
	join: 'gateways:nome,id',
	tenantScoped: true,
	buildParams: buildGatewayEndpointCollectionParams,
	buildPayload: buildGatewayEndpointPayload,
	normalizeItem: normalizeGatewayEndpointRecord,
	messages: {
		loadList: 'Não foi possível carregar os gateway endpoints.',
		loadItem: 'Não foi possível carregar o gateway endpoint.',
		notFound: 'Gateway endpoint não encontrado.',
		save: 'Não foi possível salvar o gateway endpoint.',
	},
})
