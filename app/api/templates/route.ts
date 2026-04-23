import { NextRequest, NextResponse } from 'next/server'
import { agileV2Fetch } from '@/app/api/consultas/_shared'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { asArray, asRecord } from '@/src/lib/api-payload'
import { isRootAgileecommerceTenant } from '@/src/lib/root-tenant'
import { buildTemplateCollectionParams, buildTemplatePayload } from '@/src/features/integracao-com-erp-templates/services/integracao-com-erp-templates'

function getPayloadMessage(payload: unknown, fallback: string) {
	if (typeof payload === 'object' && payload !== null) {
		if ('error' in payload && typeof payload.error === 'object' && payload.error !== null && 'message' in payload.error && typeof payload.error.message === 'string') {
			return payload.error.message
		}

		if ('message' in payload && typeof payload.message === 'string') {
			return payload.message
		}
	}

	return fallback
}

async function requireRootSession() {
	const session = await readAuthSession()
	if (!session) {
		return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
	}

	if (!isRootAgileecommerceTenant(session.currentTenantId)) {
		return NextResponse.json({ message: 'Você não tem acesso ao recurso solicitado.' }, { status: 403 })
	}

	return session
}

export async function GET(request: NextRequest) {
	const sessionOrResponse = await requireRootSession()
	if (sessionOrResponse instanceof NextResponse) {
		return sessionOrResponse
	}

	const searchParams = request.nextUrl.searchParams
	const params = buildTemplateCollectionParams({
		page: Number(searchParams.get('page') || 1),
		perPage: Number(searchParams.get('perPage') || 15),
		orderBy: searchParams.get('orderBy') || 'erps.nome',
		sort: searchParams.get('sort') === 'desc' ? 'desc' : 'asc',
		id: searchParams.get('id') || '',
		id_erp: searchParams.get('id_erp') || '',
		'codigo::lk': searchParams.get('codigo::lk') || '',
		'nome::lk': searchParams.get('nome::lk') || '',
	})

	const result = await agileV2Fetch('templates', {
		method: 'GET',
		query: params,
	})

	if (!result.ok) {
		return NextResponse.json({ message: getPayloadMessage(result.payload, 'Não foi possível carregar os templates.') }, { status: result.status || 400 })
	}

	const payload = asRecord(result.payload)
	const meta = asRecord(payload.meta)
	const data = asArray<Record<string, unknown>>(payload.data)

	return NextResponse.json({
		data,
		meta: {
			page: Number(meta.page || 1),
			pages: Number(meta.pages || 1),
			perPage: Number(meta.perpage || meta.perPage || 15),
			from: Number(meta.from || 0),
			to: Number(meta.to || 0),
			total: Number(meta.total || 0),
			order: typeof meta.order === 'string' ? meta.order : '',
			sort: typeof meta.sort === 'string' ? meta.sort : '',
		},
	})
}

export async function POST(request: NextRequest) {
	const sessionOrResponse = await requireRootSession()
	if (sessionOrResponse instanceof NextResponse) {
		return sessionOrResponse
	}

	const body = buildTemplatePayload(asRecord(await request.json()))
	const payload = {
		...(body.id ? { id: String(body.id) } : {}),
		id_erp: String(body.id_erp ?? ''),
		codigo: String(body.codigo ?? ''),
		nome: String(body.nome ?? ''),
	}

	if (!payload.id_erp.trim()) {
		return NextResponse.json({ message: 'Informe o ERP do template.' }, { status: 400 })
	}

	if (!payload.codigo.trim()) {
		return NextResponse.json({ message: 'Informe o código do template.' }, { status: 400 })
	}

	if (!payload.nome.trim()) {
		return NextResponse.json({ message: 'Informe o nome do template.' }, { status: 400 })
	}

	const result = await agileV2Fetch('templates', {
		method: 'POST',
		body: payload,
	})

	if (!result.ok) {
		return NextResponse.json({ message: getPayloadMessage(result.payload, 'Não foi possível salvar o template.') }, { status: result.status || 400 })
	}

	return NextResponse.json(result.payload)
}

export async function DELETE() {
	return NextResponse.json({ message: 'Exclusão não disponível para Templates.' }, { status: 405 })
}
