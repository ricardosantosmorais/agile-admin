import { NextRequest, NextResponse } from 'next/server'
import { agileV2Fetch } from '@/app/api/consultas/_shared'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { buildErpCollectionParams, buildErpPayload } from '@/src/features/integracao-com-erp-erps/services/integracao-com-erp-erps'
import { isRootAgileecommerceTenant } from '@/src/lib/root-tenant'
import { asArray, asRecord } from '@/src/lib/api-payload'

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
	const params = buildErpCollectionParams({
		page: Number(searchParams.get('page') || 1),
		perPage: Number(searchParams.get('perPage') || 15),
		orderBy: searchParams.get('orderBy') || 'nome',
		sort: searchParams.get('sort') === 'desc' ? 'desc' : 'asc',
		id: searchParams.get('id') || '',
		'codigo::lk': searchParams.get('codigo::lk') || '',
		'nome::lk': searchParams.get('nome::lk') || '',
	})

	const result = await agileV2Fetch('erps', {
		method: 'GET',
		query: params,
	})

	if (!result.ok) {
		return NextResponse.json({ message: getPayloadMessage(result.payload, 'Não foi possível carregar os ERPs.') }, { status: result.status || 400 })
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

	const body = buildErpPayload(asRecord(await request.json()))
	const payload = {
		...(body.id ? { id: String(body.id) } : {}),
		codigo: String(body.codigo ?? ''),
		nome: String(body.nome ?? ''),
	}

	if (!payload.codigo.trim()) {
		return NextResponse.json({ message: 'Informe o código do ERP.' }, { status: 400 })
	}

	if (!payload.nome.trim()) {
		return NextResponse.json({ message: 'Informe o nome do ERP.' }, { status: 400 })
	}

	const result = await agileV2Fetch('erps', {
		method: 'POST',
		body: payload,
	})

	if (!result.ok) {
		return NextResponse.json({ message: getPayloadMessage(result.payload, 'Não foi possível salvar o ERP.') }, { status: result.status || 400 })
	}

	return NextResponse.json(result.payload)
}

export async function DELETE() {
	return NextResponse.json({ message: 'Exclusão não disponível para ERPs.' }, { status: 405 })
}
