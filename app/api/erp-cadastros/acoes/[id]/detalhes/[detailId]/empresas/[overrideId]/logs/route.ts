import { NextRequest, NextResponse } from 'next/server'
import { agileV2Fetch } from '@/app/api/consultas/_shared'
import { getAgilePayloadMessage, requireRootAgileSession } from '@/app/api/erp-cadastros/_shared'
import { asArray, asRecord } from '@/src/lib/api-payload'

export async function GET(_request: NextRequest, context: { params: Promise<{ overrideId: string }> }) {
	const sessionOrResponse = await requireRootAgileSession()
	if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
	const { overrideId } = await context.params
	const result = await agileV2Fetch('acoes_logs', { method: 'GET', query: { perpage: 1000, id_acao_detalhe_empresa: overrideId, order: 'data_hora,id', sort: 'desc,desc' } })
	if (!result.ok) return NextResponse.json({ message: getAgilePayloadMessage(result.payload, 'Não foi possível carregar os logs do override.') }, { status: result.status || 400 })
	return NextResponse.json({ data: asArray<Record<string, unknown>>(asRecord(result.payload).data) })
}
