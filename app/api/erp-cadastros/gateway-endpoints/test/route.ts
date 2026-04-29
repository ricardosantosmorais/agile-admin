import { NextRequest, NextResponse } from 'next/server'
import { painelb2bFetch } from '@/app/api/consultas/_shared'
import { getAgilePayloadMessage, requireRootAgileSession } from '@/app/api/erp-cadastros/_shared'
import { asRecord } from '@/src/lib/api-payload'

export async function POST(request: NextRequest) {
	const sessionOrResponse = await requireRootAgileSession()
	if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
	const body = asRecord(await request.json())
	const endpoint = String(body.endpoint || '').trim()
	const verbo = String(body.verbo || '').trim()
	const idGateway = String(body.id_gateway || '').trim()
	if (!idGateway || !endpoint || !verbo) {
		return NextResponse.json({ message: 'Informe gateway, endpoint e verbo para executar o teste.' }, { status: 400 })
	}
	const result = await painelb2bFetch('agilesync_rest_consultas', {
		method: 'POST',
		body: {
			modo: 'gateway_endpoint_preview_form',
			id_gateway: idGateway,
			endpoint,
			verbo,
			parametros: String(body.parametros || ''),
			url_filtro: String(body.url_filtro || ''),
			body: String(body.body || ''),
			data_array: String(body.data_array || ''),
			tipo_paginacao: String(body.tipo_paginacao || ''),
			nome_propriedade_por_pagina: String(body.nome_propriedade_por_pagina || ''),
			quantidade_por_pagina: String(body.quantidade_por_pagina || ''),
			nome_propriedade_pagina: String(body.nome_propriedade_pagina || ''),
			nome_retorno_pagina_atual: String(body.nome_retorno_pagina_atual || ''),
			nome_retorno_total_paginas: String(body.nome_retorno_total_paginas || ''),
			variaveis_json: JSON.stringify(body.variaveis || {}),
		},
	})
	if (!result.ok) {
		return NextResponse.json({ message: getAgilePayloadMessage(result.payload, 'Não foi possível executar o teste do endpoint.') }, { status: result.status || 400 })
	}
	return NextResponse.json(result.payload)
}
