import { createAgileCatalogItemGetHandler } from '@/app/api/erp-cadastros/_shared'
import { buildGatewayCollectionParams, buildGatewayPayload, normalizeGatewayRecord } from '@/src/features/integracao-com-erp-gateways/services/integracao-com-erp-gateways'

export const GET = createAgileCatalogItemGetHandler({
	resource: 'gateways',
	defaultOrderBy: 'nome',
	join: 'templates:nome,id',
	buildParams: buildGatewayCollectionParams,
	buildPayload: buildGatewayPayload,
	normalizeItem: normalizeGatewayRecord,
	messages: {
		loadList: 'Não foi possível carregar os gateways.',
		loadItem: 'Não foi possível carregar o gateway.',
		notFound: 'Gateway não encontrado.',
		save: 'Não foi possível salvar o gateway.',
	},
})
