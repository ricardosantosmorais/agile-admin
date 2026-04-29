import { NextRequest, NextResponse } from 'next/server'
import { requireRootAgileSession } from '@/app/api/erp-cadastros/_shared'
import { asArray, asRecord } from '@/src/lib/api-payload'
import {
	fetchFirst,
	jsonError,
	loadCampos,
	loadConsultaMaps,
	loadEmpresa,
	loadEndpoint,
	loadEndpointEmpresa,
	loadEndpointsLookup,
	loadGatewaysLookup,
	loadQueriesLookup,
	loadRetornoMaps,
	loadTabela,
	mergeEndpoint,
	postResource,
	toBool,
	toStringValue,
} from '@/app/api/erp-cadastros/interfaces-consulta/_interface-consulta-shared'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
	const sessionOrResponse = await requireRootAgileSession()
	if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
	const { id } = await context.params
	const idEmpresa = toStringValue(request.nextUrl.searchParams.get('id_empresa_alvo') || request.nextUrl.searchParams.get('empresa_id'))
	try {
		const tabela = await loadTabela(id)
		const empresa = idEmpresa ? await loadEmpresa(idEmpresa) : {}
		const idTemplate = toStringValue(empresa.id_template)
		const [queryOverride, gatewayOverride] = idEmpresa ? await Promise.all([
			fetchFirst('querys_tabelas_empresas', { id_empresa: idEmpresa, id_tabela: id }),
			fetchFirst('gateways_endpoints_tabelas_empresas', { id_empresa: idEmpresa, id_tabela: id }),
		]) : [{}, {}]
		let gatewayEndpoint = {}
		if (toStringValue(gatewayOverride.id_gateway_endpoint)) {
			const base = await loadEndpoint(toStringValue(gatewayOverride.id_gateway_endpoint))
			gatewayEndpoint = mergeEndpoint(base, await loadEndpointEmpresa(idEmpresa, toStringValue(base.id)))
		}
		return NextResponse.json({
			tabela,
			empresa,
			id_template: idTemplate,
			tipo_fonte: toStringValue(queryOverride.id_query) ? 'query' : toStringValue(gatewayOverride.id_gateway_endpoint) ? 'endpoint_gateway' : '',
			query_override: queryOverride,
			gateway_override: gatewayOverride,
			gateway_endpoint: gatewayEndpoint,
			consulta_maps: toStringValue(asRecord(gatewayEndpoint).id) ? await loadConsultaMaps(toStringValue(asRecord(gatewayEndpoint).id), id) : [],
			retorno_maps: toStringValue(asRecord(gatewayEndpoint).id) ? await loadRetornoMaps(toStringValue(asRecord(gatewayEndpoint).id), id) : [],
			campos: await loadCampos(id),
			queries: await loadQueriesLookup(idTemplate),
			gateways: await loadGatewaysLookup(idTemplate),
			endpoints: await loadEndpointsLookup(idTemplate, id),
		})
	} catch (error) {
		return jsonError(error, 'Não foi possível carregar o formulário do override.')
	}
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
	const sessionOrResponse = await requireRootAgileSession()
	if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
	const { id } = await context.params
	const body = asRecord(await request.json())
	const idEmpresa = toStringValue(body.id_empresa_alvo || body.empresa_id)
	const tipoFonte = toStringValue(body.tipo_fonte)
	try {
		if (!idEmpresa || !tipoFonte) throw new Error('Informe empresa e tipo da fonte.')
		const empresa = await loadEmpresa(idEmpresa)
		const idTemplate = toStringValue(empresa.id_template)
		if (tipoFonte === 'query') {
			const idQuery = toStringValue(body.id_query)
			if (!idQuery) throw new Error('Selecione a query do override.')
			await postResource('querys_tabelas_empresas', { id_query: idQuery, id_tabela: id, id_empresa: idEmpresa }, 'Falha ao salvar override de query.')
		} else if (tipoFonte === 'endpoint_gateway') {
			const endpoint = asRecord(body.gateway_endpoint)
			const saved = await postResource('gateways_endpoints', {
				...endpoint,
				id: toStringValue(endpoint.id) || undefined,
				id_gateway: toStringValue(endpoint.id_gateway),
				verbo: toStringValue(endpoint.verbo || 'get').toLowerCase(),
				tipo: toStringValue(endpoint.tipo || 'consulta'),
				ativo: toBool(endpoint.ativo, true),
			}, 'Falha ao salvar endpoint gateway do override.')
			const endpointId = toStringValue(saved.id || endpoint.id)
			await postResource('gateways_endpoints_tabelas_empresas', {
				id_empresa: idEmpresa,
				id_tabela: id,
				id_gateway_endpoint: endpointId,
				ativo: toBool(body.ativo, true),
				observacao: toStringValue(body.observacao),
			}, 'Falha ao salvar override de endpoint gateway.')
			await postResource('gateways_endpoints_empresas', {
				id_empresa: idEmpresa,
				id_gateway_endpoint: endpointId,
				parametros: toStringValue(endpoint.parametros),
				url_filtro: toStringValue(endpoint.url_filtro),
				tipo: toStringValue(endpoint.tipo),
				ativo: toBool(body.ativo, true),
				body: toStringValue(endpoint.body),
				data_array: toStringValue(endpoint.data_array),
				tipo_paginacao: toStringValue(endpoint.tipo_paginacao),
				nome_propriedade_por_pagina: toStringValue(endpoint.nome_propriedade_por_pagina),
				quantidade_por_pagina: toStringValue(endpoint.quantidade_por_pagina) ? Number(endpoint.quantidade_por_pagina) : null,
				nome_propriedade_pagina: toStringValue(endpoint.nome_propriedade_pagina),
				nome_retorno_pagina_atual: toStringValue(endpoint.nome_retorno_pagina_atual),
				nome_retorno_total_paginas: toStringValue(endpoint.nome_retorno_total_paginas),
			}, 'Falha ao salvar configuração de endpoint da empresa.')
			for (const map of asArray<Record<string, unknown>>(body.consulta_maps)) {
				if (!toStringValue(map.id_tabela_campo)) continue
				await postResource('gateways_endpoints_campos_consulta', { ...map, id_gateway_endpoint: endpointId }, 'Falha ao salvar mapeamento de consulta.')
			}
			for (const map of asArray<Record<string, unknown>>(body.retorno_maps)) {
				if (!toStringValue(map.id_tabela_campo)) continue
				await postResource('gateways_endpoints_campos_retorno', { ...map, id_gateway_endpoint: endpointId }, 'Falha ao salvar mapeamento de retorno.')
			}
		} else {
			throw new Error('Selecione o tipo da fonte do override.')
		}
		return NextResponse.json({ success: { message: 'Override por empresa salvo com sucesso.' }, id_template: idTemplate })
	} catch (error) {
		return jsonError(error, 'Não foi possível salvar o override por empresa.')
	}
}
