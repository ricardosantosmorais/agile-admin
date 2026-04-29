import { createAgileCatalogRouteHandlers } from '@/app/api/erp-cadastros/_shared'
import { buildAcaoCollectionParams, buildAcaoPayload, normalizeAcaoRecord } from '@/src/features/integracao-com-erp-acoes/services/integracao-com-erp-acoes'
import { agileV2Fetch } from '@/app/api/consultas/_shared'
import { getAgilePayloadMessage, requireRootAgileSession } from '@/app/api/erp-cadastros/_shared'
import { asArray, asRecord } from '@/src/lib/api-payload'
import { enrichAcaoRows } from '@/app/api/erp-cadastros/acoes/_acoes-shared'
import { NextRequest, NextResponse } from 'next/server'

const handlers = createAgileCatalogRouteHandlers({
	resource: 'acoes',
	defaultOrderBy: 'nome',
	join: 'templates:nome,id|gateways:nome,id',
	buildParams: buildAcaoCollectionParams,
	buildPayload: buildAcaoPayload,
	normalizeItem: normalizeAcaoRecord,
	messages: {
		loadList: 'Não foi possível carregar as ações.',
		loadItem: 'Não foi possível carregar a ação.',
		notFound: 'Ação não encontrada.',
		save: 'Não foi possível salvar a ação.',
		deleteUnavailable: 'Exclusão não disponível para Ações.',
	},
})

export const POST = handlers.POST
export const DELETE = handlers.DELETE

function normalizeMeta(payload: Record<string, unknown>) {
	const meta = asRecord(payload.meta)
	return {
		page: Number(meta.page || 1),
		pages: Number(meta.pages || 1),
		perPage: Number(meta.perpage || meta.perPage || 15),
		from: Number(meta.from || 0),
		to: Number(meta.to || 0),
		total: Number(meta.total || 0),
		order: typeof meta.order === 'string' ? meta.order : '',
		sort: typeof meta.sort === 'string' ? meta.sort : '',
	}
}

export async function GET(request: NextRequest) {
	const sessionOrResponse = await requireRootAgileSession()
	if (sessionOrResponse instanceof NextResponse) return sessionOrResponse

	const searchParams = request.nextUrl.searchParams
	const params = buildAcaoCollectionParams({
		page: Number(searchParams.get('page') || 1),
		perPage: Number(searchParams.get('perPage') || 15),
		orderBy: searchParams.get('orderBy') || 'nome',
		sort: searchParams.get('sort') === 'desc' ? 'desc' : 'asc',
		...Object.fromEntries(searchParams.entries()),
	})

	const result = await agileV2Fetch('acoes', { method: 'GET', query: params })
	if (!result.ok) {
		return NextResponse.json({ message: getAgilePayloadMessage(result.payload, 'Não foi possível carregar as ações.') }, { status: result.status || 400 })
	}

	const payload = asRecord(result.payload)
	const rows = await enrichAcaoRows(asArray<Record<string, unknown>>(payload.data))
	return NextResponse.json({ data: rows.map((row) => ({ ...normalizeAcaoRecord(row), id: String(row.id ?? '') })), meta: normalizeMeta(payload) })
}
