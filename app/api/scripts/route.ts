import { NextRequest, NextResponse } from 'next/server'
import { agileV2Fetch } from '@/app/api/consultas/_shared'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { buildScriptCollectionParams, buildScriptPayload } from '@/src/features/integracao-com-erp-scripts/services/integracao-com-erp-scripts'
import { asArray, asRecord } from '@/src/lib/api-payload'
import { isRootAgileecommerceTenant } from '@/src/lib/root-tenant'

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
	const params = buildScriptCollectionParams({
		page: Number(searchParams.get('page') || 1),
		perPage: Number(searchParams.get('perPage') || 15),
		orderBy: searchParams.get('orderBy') || 'id',
		sort: searchParams.get('sort') === 'asc' ? 'asc' : 'desc',
		id: searchParams.get('id') || '',
		'nome::lk': searchParams.get('nome::lk') || '',
		'linguagem::lk': searchParams.get('linguagem::lk') || '',
	})

	const result = await agileV2Fetch('scripts', {
		method: 'GET',
		query: params,
	})

	if (!result.ok) {
		return NextResponse.json({ message: getPayloadMessage(result.payload, 'Não foi possível carregar os scripts.') }, { status: result.status || 400 })
	}

	const payload = asRecord(result.payload)
	const meta = asRecord(payload.meta)

	return NextResponse.json({
		data: asArray<Record<string, unknown>>(payload.data),
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

	try {
		const payload = buildScriptPayload(asRecord(await request.json()))

		if (!String(payload.nome ?? '').trim()) {
			return NextResponse.json({ message: 'Informe o nome do script.' }, { status: 400 })
		}
		if (!String(payload.linguagem ?? '').trim()) {
			return NextResponse.json({ message: 'Informe a linguagem do script.' }, { status: 400 })
		}
		if (!String(payload.script ?? '').trim()) {
			return NextResponse.json({ message: 'Informe o conteúdo do script.' }, { status: 400 })
		}

		const result = await agileV2Fetch('scripts', {
			method: 'POST',
			body: {
				...(payload.id ? { id: Number(payload.id) } : {}),
				nome: String(payload.nome ?? ''),
				linguagem: String(payload.linguagem ?? ''),
				script: String(payload.script ?? ''),
				...(payload.SourceExpressionKey ? { SourceExpressionKey: String(payload.SourceExpressionKey) } : {}),
			},
		})

		if (!result.ok) {
			return NextResponse.json({ message: getPayloadMessage(result.payload, 'Não foi possível salvar o script.') }, { status: result.status || 400 })
		}

		return NextResponse.json(asArray<Record<string, unknown>>(asRecord(result.payload).data).length ? asRecord(result.payload).data : [asRecord(result.payload)])
	} catch (error) {
		return NextResponse.json({ message: error instanceof Error ? error.message : 'Não foi possível salvar o script.' }, { status: 400 })
	}
}

export async function DELETE() {
	return NextResponse.json({ message: 'Exclusão não disponível para Scripts.' }, { status: 405 })
}
