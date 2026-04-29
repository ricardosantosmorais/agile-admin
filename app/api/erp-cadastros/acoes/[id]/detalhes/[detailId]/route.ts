import { NextRequest, NextResponse } from 'next/server'
import { agileV2Fetch } from '@/app/api/consultas/_shared'
import { getAgilePayloadMessage, requireRootAgileSession } from '@/app/api/erp-cadastros/_shared'
import { asArray, asRecord } from '@/src/lib/api-payload'
import { enrichDetailRows } from '@/app/api/erp-cadastros/acoes/_acoes-shared'

export async function GET(_request: NextRequest, context: { params: Promise<{ detailId: string }> }) {
	const sessionOrResponse = await requireRootAgileSession()
	if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
	const { detailId } = await context.params
	const result = await agileV2Fetch('acoes_detalhes', { method: 'GET', query: { perpage: 1, id: detailId } })
	if (!result.ok) return NextResponse.json({ message: getAgilePayloadMessage(result.payload, 'Não foi possível carregar o detalhe da ação.') }, { status: result.status || 400 })
	const item = asArray<Record<string, unknown>>(asRecord(result.payload).data).at(0)
	if (!item) return NextResponse.json({ message: 'Detalhe da ação não encontrado.' }, { status: 404 })
	const [enriched] = await enrichDetailRows([item])
	return NextResponse.json(enriched)
}
