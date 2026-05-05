import { NextRequest, NextResponse } from 'next/server'
import { requireRootAgileSession } from '@/app/api/erp-cadastros/_shared'
import { asArray, asRecord } from '@/src/lib/api-payload'
import {
	buildTemplateLinks,
	fetchFirst,
	jsonError,
	loadCampos,
	loadConsultaMaps,
	loadEndpointsLookup,
	loadGatewaysLookup,
	loadQueriesLookup,
	loadRetornoMaps,
	loadTabela,
	loadTemplatesLookup,
	postResource,
	toBool,
	toStringValue,
} from '@/app/api/erp-cadastros/interfaces-consulta/_interface-consulta-shared'

async function loadPadrao(idTemplate: string, idTabela: string) {
	const query = await fetchFirst('querys', { id_template: idTemplate, id_tabela: idTabela, ativo: true, order: 'id', sort: 'desc' })
	const endpoint = await fetchFirst('gateways_endpoints', { id_tabela: idTabela, join: 'gateways:id_template,nome', 'gateways.id_template': idTemplate, 'tipo:ne': 'autenticacao', order: 'id', sort: 'desc' })
	if (toStringValue(query.id)) return { effective_source: 'query', query }
	if (toStringValue(endpoint.id)) {
		return {
			effective_source: 'endpoint_gateway',
			gateway_endpoint: endpoint,
			consulta_maps: await loadConsultaMaps(toStringValue(endpoint.id), idTabela),
			retorno_maps: await loadRetornoMaps(toStringValue(endpoint.id), idTabela),
		}
	}
	return {}
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
	const sessionOrResponse = await requireRootAgileSession()
	if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
	const { id } = await context.params
	const idTemplate = toStringValue(request.nextUrl.searchParams.get('id_template'))
	try {
		const tabela = await loadTabela(id)
		const padrao = idTemplate ? await loadPadrao(idTemplate, id) : {}
		const gatewayEndpoint = asRecord(padrao.gateway_endpoint)
		return NextResponse.json({
			tabela,
			templates: await loadTemplatesLookup(),
			template_links: await buildTemplateLinks(id),
			id_template: idTemplate,
			tipo_fonte: toStringValue(padrao.effective_source),
			query: asRecord(padrao.query),
			gateway_endpoint: gatewayEndpoint,
			consulta_maps: asArray(padrao.consulta_maps),
			retorno_maps: asArray(padrao.retorno_maps),
			campos: await loadCampos(id),
			queries: await loadQueriesLookup(idTemplate),
			gateways: await loadGatewaysLookup(idTemplate),
			endpoints: await loadEndpointsLookup(idTemplate, id),
			template_locked: Boolean(idTemplate),
		})
	} catch (error) {
		return jsonError(error, 'Não foi possível carregar o formulário do template.')
	}
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
	const sessionOrResponse = await requireRootAgileSession()
	if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
	const { id } = await context.params
	const body = asRecord(await request.json())
	const idTemplate = toStringValue(body.id_template)
	const tipoFonte = toStringValue(body.tipo_fonte)
	try {
		if (!idTemplate || !tipoFonte) throw new Error('Informe template e tipo da fonte.')
		if (tipoFonte === 'query') {
			const idQuery = toStringValue(body.id_query)
			if (!idQuery) throw new Error('Selecione a query da configuração.')
			await postResource('querys', { id: idQuery, id_template: idTemplate, id_tabela: id, ativo: true }, 'Falha ao salvar vínculo da query.')
		} else if (tipoFonte === 'endpoint_gateway') {
			const endpoint = asRecord(body.gateway_endpoint)
			const saved = await postResource('gateways_endpoints', {
				...endpoint,
				id: toStringValue(endpoint.id) || undefined,
				id_gateway: toStringValue(endpoint.id_gateway),
				id_tabela: id,
				verbo: toStringValue(endpoint.verbo || 'get').toLowerCase(),
				tipo: toStringValue(endpoint.tipo || 'consulta'),
				ativo: toBool(endpoint.ativo, true),
			}, 'Falha ao salvar endpoint gateway.')
			const endpointId = toStringValue(saved.id || endpoint.id)
			for (const map of asArray<Record<string, unknown>>(body.consulta_maps)) {
				if (!toStringValue(map.id_tabela_campo)) continue
				await postResource('gateways_endpoints_campos_consulta', { ...map, id_gateway_endpoint: endpointId }, 'Falha ao salvar mapeamento de consulta.')
			}
			for (const map of asArray<Record<string, unknown>>(body.retorno_maps)) {
				if (!toStringValue(map.id_tabela_campo)) continue
				await postResource('gateways_endpoints_campos_retorno', { ...map, id_gateway_endpoint: endpointId }, 'Falha ao salvar mapeamento de retorno.')
			}
		} else {
			throw new Error('Selecione o tipo da fonte.')
		}
		return NextResponse.json({ success: { message: 'Configuração da interface por template salva com sucesso.' } })
	} catch (error) {
		return jsonError(error, 'Não foi possível salvar a configuração por template.')
	}
}
