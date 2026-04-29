import { createAgileCatalogRouteHandlers } from '@/app/api/erp-cadastros/_shared'
import { buildGatewayCollectionParams, buildGatewayPayload, normalizeGatewayRecord } from '@/src/features/integracao-com-erp-gateways/services/integracao-com-erp-gateways'

const handlers = createAgileCatalogRouteHandlers({
	resource: 'gateways',
	defaultOrderBy: 'nome',
	defaultSort: 'asc',
	join: 'templates:nome,id',
	buildParams: buildGatewayCollectionParams,
	buildPayload: buildGatewayPayload,
	normalizeItem: normalizeGatewayRecord,
	messages: {
		loadList: 'Não foi possível carregar os gateways.',
		loadItem: 'Não foi possível carregar o gateway.',
		notFound: 'Gateway não encontrado.',
		save: 'Não foi possível salvar o gateway.',
		deleteUnavailable: 'Exclusão não disponível para Gateways.',
	},
})

export const GET = handlers.GET
export const POST = handlers.POST
export const DELETE = handlers.DELETE
