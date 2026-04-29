import { createAgileCatalogRouteHandlers } from '@/app/api/erp-cadastros/_shared'
import { buildServicoCadastroCollectionParams, buildServicoCadastroPayload, normalizeServicoCadastroRecord } from '@/src/features/integracao-com-erp-cadastro-servicos/services/integracao-com-erp-cadastro-servicos'

const handlers = createAgileCatalogRouteHandlers({
	resource: 'servicos',
	defaultOrderBy: 'nome',
	join: 'templates:nome,id',
	buildParams: buildServicoCadastroCollectionParams,
	buildPayload: buildServicoCadastroPayload,
	normalizeItem: normalizeServicoCadastroRecord,
	messages: {
		loadList: 'Não foi possível carregar os serviços.',
		loadItem: 'Não foi possível carregar o serviço.',
		notFound: 'Serviço não encontrado.',
		save: 'Não foi possível salvar o serviço.',
		deleteUnavailable: 'Exclusão não disponível para Serviços.',
	},
})

export const GET = handlers.GET
export const POST = handlers.POST
export const DELETE = handlers.DELETE
