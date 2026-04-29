import { createAgileCatalogItemGetHandler } from '@/app/api/erp-cadastros/_shared'
import { buildAcaoCollectionParams, buildAcaoPayload, normalizeAcaoRecord } from '@/src/features/integracao-com-erp-acoes/services/integracao-com-erp-acoes'

export const GET = createAgileCatalogItemGetHandler({
	resource: 'acoes',
	defaultOrderBy: 'nome',
	join: 'templates:nome,id|gateways:nome,id',
	buildParams: buildAcaoCollectionParams,
	buildPayload: buildAcaoPayload,
	normalizeItem: normalizeAcaoRecord,
	messages: {
		loadList: 'Não foi possível carregar as ações.',
		loadItem: 'Não foi possível carregar a ação.',
		notFound: 'Ação não encontrada.',
		save: 'Não foi possível salvar a ação.',
	},
})
