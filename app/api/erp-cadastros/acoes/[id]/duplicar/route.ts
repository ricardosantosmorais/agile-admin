import { NextRequest, NextResponse } from 'next/server'
import { agileV2Fetch } from '@/app/api/consultas/_shared'
import { getAgilePayloadMessage, requireRootAgileSession } from '@/app/api/erp-cadastros/_shared'
import { asArray, asRecord } from '@/src/lib/api-payload'
import { buildDetailPayload, getFirstRow, normalizeBooleanValue } from '@/app/api/erp-cadastros/acoes/_acoes-shared'

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
	const sessionOrResponse = await requireRootAgileSession()
	if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
	const { id } = await context.params
	const body = asRecord(await request.json())
	const nome = String(body.nome || '').trim()
	if (!nome) return NextResponse.json({ message: 'Informe o nome da nova ação.' }, { status: 400 })

	const sourceResult = await agileV2Fetch('acoes', { method: 'GET', query: { perpage: 1, id } })
	if (!sourceResult.ok) return NextResponse.json({ message: getAgilePayloadMessage(sourceResult.payload, 'Não foi possível carregar a ação de origem.') }, { status: sourceResult.status || 400 })
	const source = getFirstRow(sourceResult.payload)
	if (!source) return NextResponse.json({ message: 'Ação de origem não encontrada.' }, { status: 404 })

	const createResult = await agileV2Fetch('acoes', {
		method: 'POST',
		body: {
			nome,
			tipo: String(source.tipo || ''),
			id_template: Number(source.id_template || 0),
			id_gateway: Number(source.id_gateway || 0),
			objeto: String(source.objeto || ''),
			url_filtro: String(source.url_filtro || ''),
			ativo: normalizeBooleanValue(source.ativo, true),
		},
	})
	if (!createResult.ok) return NextResponse.json({ message: getAgilePayloadMessage(createResult.payload, 'Não foi possível duplicar a ação.') }, { status: createResult.status || 400 })

	const createdPayload = asRecord(createResult.payload)
	let createdId = String(createdPayload.id || asArray<Record<string, unknown>>(createdPayload.data).at(0)?.id || '')
	if (!createdId) {
		const fallbackResult = await agileV2Fetch('acoes', {
			method: 'GET',
			query: { perpage: 1, nome, tipo: String(source.tipo || ''), id_template: String(source.id_template || ''), id_gateway: String(source.id_gateway || ''), order: 'id', sort: 'desc' },
		})
		if (fallbackResult.ok) createdId = String(getFirstRow(fallbackResult.payload)?.id || '')
	}
	if (!createdId) return NextResponse.json({ message: 'A ação foi criada, mas não foi possível identificar o novo ID.' }, { status: 400 })

	const detailsResult = await agileV2Fetch('acoes_detalhes', { method: 'GET', query: { perpage: 1000, id_acao: id, order: 'ordem,id', sort: 'asc,asc' } })
	if (detailsResult.ok) {
		for (const detail of asArray<Record<string, unknown>>(asRecord(detailsResult.payload).data)) {
			if (!String(detail.script || '').trim()) return NextResponse.json({ message: 'Um dos detalhes da ação de origem está sem script principal.' }, { status: 400 })
			const duplicateResult = await agileV2Fetch('acoes_detalhes', {
				method: 'POST',
				body: buildDetailPayload({ ...detail, id: undefined }, createdId),
			})
			if (!duplicateResult.ok) return NextResponse.json({ message: getAgilePayloadMessage(duplicateResult.payload, 'Não foi possível duplicar um dos detalhes da ação.') }, { status: duplicateResult.status || 400 })
		}
	}

	return NextResponse.json({ success: { message: 'Ação duplicada com sucesso.' }, id: createdId })
}
