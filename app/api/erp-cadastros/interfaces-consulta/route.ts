import { NextRequest, NextResponse } from 'next/server'
import { agileV2Fetch } from '@/app/api/consultas/_shared'
import { getAgilePayloadMessage, requireRootAgileSession } from '@/app/api/erp-cadastros/_shared'
import { asArray, asRecord } from '@/src/lib/api-payload'
import { buildInterfaceConsultaCollectionParams, buildInterfaceConsultaPayload, normalizeInterfaceConsultaRecord } from '@/src/features/integracao-com-erp-interfaces-consulta/services/integracao-com-erp-interfaces-consulta'

export async function GET(request: NextRequest) {
	const sessionOrResponse = await requireRootAgileSession()
	if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
	const searchParams = request.nextUrl.searchParams
	const params = buildInterfaceConsultaCollectionParams({
		page: Number(searchParams.get('page') || 1),
		perPage: Number(searchParams.get('perPage') || 15),
		orderBy: searchParams.get('orderBy') || 'nome',
		sort: searchParams.get('sort') === 'desc' ? 'desc' : 'asc',
		...Object.fromEntries(searchParams.entries()),
	})
	const result = await agileV2Fetch('tabelas', { method: 'GET', query: params })
	if (!result.ok) {
		return NextResponse.json({ message: getAgilePayloadMessage(result.payload, 'Não foi possível carregar as interfaces de consulta.') }, { status: result.status || 400 })
	}
	const payload = asRecord(result.payload)
	const meta = asRecord(payload.meta)
	return NextResponse.json({
		data: asArray<Record<string, unknown>>(payload.data).map((row) => normalizeInterfaceConsultaRecord(row)),
		meta: {
			page: Number(meta.page || 1),
			pages: Number(meta.pages || 1),
			perPage: Number(meta.perpage || meta.perPage || 15),
			from: Number(meta.from || 0),
			to: Number(meta.to || 0),
			total: Number(meta.total || 0),
			order: String(meta.order || ''),
			sort: String(meta.sort || ''),
		},
	})
}

export async function POST(request: NextRequest) {
	const sessionOrResponse = await requireRootAgileSession()
	if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
	const body = buildInterfaceConsultaPayload(asRecord(await request.json()))
	const result = await agileV2Fetch('interfaces_consulta', { method: 'POST', body: body as Record<string, string | number | boolean | null | undefined> })
	if (!result.ok) {
		return NextResponse.json({ message: getAgilePayloadMessage(result.payload, 'Não foi possível salvar a interface de consulta.') }, { status: result.status || 400 })
	}
	return NextResponse.json([asRecord(result.payload)])
}

export async function DELETE() {
	return NextResponse.json({ message: 'Exclusão não disponível para Interfaces de Consulta.' }, { status: 405 })
}
