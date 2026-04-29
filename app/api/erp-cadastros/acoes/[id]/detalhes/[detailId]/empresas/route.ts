import { NextRequest, NextResponse } from 'next/server'
import { agileV2Fetch } from '@/app/api/consultas/_shared'
import { getAgilePayloadMessage, requireRootAgileSession } from '@/app/api/erp-cadastros/_shared'
import { asArray, asRecord } from '@/src/lib/api-payload'
import { buildOverridePayload, enrichOverrideRows } from '@/app/api/erp-cadastros/acoes/_acoes-shared'

export async function GET(_request: NextRequest, context: { params: Promise<{ detailId: string }> }) {
	const sessionOrResponse = await requireRootAgileSession()
	if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
	const { detailId } = await context.params
	const result = await agileV2Fetch('acoes_detalhes_empresas', { method: 'GET', query: { perpage: 1000, id_acao_detalhe: detailId, order: 'data_hora,id', sort: 'desc,desc' } })
	if (!result.ok) return NextResponse.json({ message: getAgilePayloadMessage(result.payload, 'Não foi possível carregar os overrides por empresa.') }, { status: result.status || 400 })
	return NextResponse.json({ data: await enrichOverrideRows(asArray<Record<string, unknown>>(asRecord(result.payload).data)) })
}

export async function POST(request: NextRequest, context: { params: Promise<{ detailId: string }> }) {
	const sessionOrResponse = await requireRootAgileSession()
	if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
	const { detailId } = await context.params
	const body = asRecord(await request.json())
	if (!String(body.id_empresa_alvo || body.id_empresa || '').trim()) return NextResponse.json({ message: 'Informe a empresa do override.' }, { status: 400 })
	if (!String(body.linguagem || '').trim()) return NextResponse.json({ message: 'Informe a linguagem do override.' }, { status: 400 })
	if (!String(body.script || '').trim()) return NextResponse.json({ message: 'Informe o script principal do override.' }, { status: 400 })
	const result = await agileV2Fetch('acoes_detalhes_empresas', {
		method: 'POST',
		body: buildOverridePayload(body, detailId, sessionOrResponse.currentUserId),
	})
	if (!result.ok) return NextResponse.json({ message: getAgilePayloadMessage(result.payload, 'Não foi possível salvar o override por empresa.') }, { status: result.status || 400 })
	return NextResponse.json(result.payload)
}
