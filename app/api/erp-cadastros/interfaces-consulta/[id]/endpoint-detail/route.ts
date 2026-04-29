import { NextRequest, NextResponse } from 'next/server'
import { requireRootAgileSession } from '@/app/api/erp-cadastros/_shared'
import { asRecord } from '@/src/lib/api-payload'
import {
	jsonError,
	loadConsultaMaps,
	loadEndpoint,
	loadEndpointEmpresa,
	loadRetornoMaps,
	mergeEndpoint,
	toStringValue,
} from '@/app/api/erp-cadastros/interfaces-consulta/_interface-consulta-shared'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
	const sessionOrResponse = await requireRootAgileSession()
	if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
	const { id } = await context.params
	const endpointId = toStringValue(request.nextUrl.searchParams.get('id_gateway_endpoint') || request.nextUrl.searchParams.get('endpoint_id'))
	const empresaId = toStringValue(request.nextUrl.searchParams.get('id_empresa_alvo') || request.nextUrl.searchParams.get('empresa_id'))
	try {
		if (!endpointId) throw new Error('Informe o endpoint gateway.')
		const base = await loadEndpoint(endpointId)
		const endpoint = empresaId ? mergeEndpoint(base, await loadEndpointEmpresa(empresaId, toStringValue(base.id))) : base
		const normalized = asRecord(endpoint)
		return NextResponse.json({
			gateway_endpoint: normalized,
			consulta_maps: await loadConsultaMaps(toStringValue(normalized.id), id),
			retorno_maps: await loadRetornoMaps(toStringValue(normalized.id), id),
		})
	} catch (error) {
		return jsonError(error, 'Não foi possível carregar o endpoint gateway.')
	}
}
