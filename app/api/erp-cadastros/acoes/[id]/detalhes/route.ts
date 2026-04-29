import { NextRequest, NextResponse } from 'next/server'
import { agileV2Fetch } from '@/app/api/consultas/_shared'
import { getAgilePayloadMessage, requireRootAgileSession } from '@/app/api/erp-cadastros/_shared'
import { asArray, asRecord } from '@/src/lib/api-payload'
import { buildDetailPayload, enrichDetailRows } from '@/app/api/erp-cadastros/acoes/_acoes-shared'

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
	const sessionOrResponse = await requireRootAgileSession()
	if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
	const { id } = await context.params
	const result = await agileV2Fetch('acoes_detalhes', { method: 'GET', query: { perpage: 1000, id_acao: id, order: 'ordem,id', sort: 'asc,asc' } })
	if (!result.ok) return NextResponse.json({ message: getAgilePayloadMessage(result.payload, 'Não foi possível carregar os detalhes da ação.') }, { status: result.status || 400 })
	return NextResponse.json({ data: await enrichDetailRows(asArray<Record<string, unknown>>(asRecord(result.payload).data)) })
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
	const sessionOrResponse = await requireRootAgileSession()
	if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
	const { id } = await context.params
	const body = asRecord(await request.json())
	if (!String(body.ordem || '').trim()) return NextResponse.json({ message: 'Informe a ordem do detalhe da ação.' }, { status: 400 })
	if (!String(body.tipo_objeto || '').trim()) return NextResponse.json({ message: 'Informe o tipo do objeto no detalhe da ação.' }, { status: 400 })
	if (!String(body.linguagem || '').trim()) return NextResponse.json({ message: 'Informe a linguagem do detalhe da ação.' }, { status: 400 })
	if (!String(body.tipo_execucao || '').trim()) return NextResponse.json({ message: 'Informe o tipo de execução do detalhe da ação.' }, { status: 400 })
	if (!String(body.script || '').trim()) return NextResponse.json({ message: 'Informe o script principal do detalhe da ação.' }, { status: 400 })
	const result = await agileV2Fetch('acoes_detalhes', {
		method: 'POST',
		body: buildDetailPayload(body, id),
	})
	if (!result.ok) return NextResponse.json({ message: getAgilePayloadMessage(result.payload, 'Não foi possível salvar o detalhe da ação.') }, { status: result.status || 400 })
	return NextResponse.json(result.payload)
}
