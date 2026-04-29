import { createAgileCatalogRouteHandlers } from '@/app/api/erp-cadastros/_shared'
import { buildGatewayEndpointCollectionParams, buildGatewayEndpointPayload, normalizeGatewayEndpointRecord } from '@/src/features/integracao-com-erp-gateway-endpoints/services/integracao-com-erp-gateway-endpoints'

const handlers = createAgileCatalogRouteHandlers({
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
		deleteUnavailable: 'Exclusão não disponível para Gateway Endpoints.',
	},
})

export const GET = handlers.GET
export const POST = handlers.POST
export const DELETE = handlers.DELETE
