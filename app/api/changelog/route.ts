import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { isRootAgileecommerceTenant } from '@/src/features/changelog/services/changelog-admin'
import { asArray, asRecord } from '@/src/lib/api-payload'
import { sanitizeRichHtml } from '@/src/lib/html-sanitizer'
import { serverApiFetch } from '@/src/services/http/server-api'

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

	const session = sessionOrResponse
	const searchParams = request.nextUrl.searchParams
	const params = new URLSearchParams({
		page: searchParams.get('page') || '1',
		perpage: searchParams.get('perPage') || '15',
		order: searchParams.get('orderBy') || 'data',
		sort: searchParams.get('sort') || 'desc',
	})

	for (const [key, value] of searchParams.entries()) {
		if (['page', 'perPage', 'orderBy', 'sort'].includes(key) || !value.trim()) {
			continue
		}

		params.set(key, value.trim())
	}

	const result = await serverApiFetch(`changelog?${params.toString()}`, {
		method: 'GET',
		token: session.token,
		tenantId: session.currentTenantId,
	})

	if (!result.ok) {
		return NextResponse.json({ message: getPayloadMessage(result.payload, 'Não foi possível carregar os registros.') }, { status: result.status || 400 })
	}

	const payload = asRecord(result.payload)
	const meta = asRecord(payload.meta)
	const data = asArray<Record<string, unknown>>(payload.data).map((item) => ({
		...item,
		conteudo: sanitizeRichHtml(item.conteudo),
	}))

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

	const session = sessionOrResponse
	const body = await request.json()
	const result = await serverApiFetch('changelog', {
		method: 'POST',
		token: session.token,
		tenantId: session.currentTenantId,
		body: {
			...(typeof body === 'object' && body !== null && !Array.isArray(body) ? body : {}),
			id_empresa: session.currentTenantId,
			id_usuario: session.currentUserId,
		},
	})

	if (!result.ok) {
		return NextResponse.json({ message: getPayloadMessage(result.payload, 'Não foi possível salvar o registro.') }, { status: result.status || 400 })
	}

	return NextResponse.json(result.payload)
}

export async function DELETE(request: NextRequest) {
	const sessionOrResponse = await requireRootSession()
	if (sessionOrResponse instanceof NextResponse) {
		return sessionOrResponse
	}

	const session = sessionOrResponse
	const body = await request.json() as { ids?: unknown[] }
	const ids = Array.isArray(body.ids) ? body.ids.filter((id): id is string => typeof id === 'string' && id.trim().length > 0) : []

	if (!ids.length) {
		return NextResponse.json({ message: 'Selecione um ou mais registros para exclusão.' }, { status: 400 })
	}

	const result = await serverApiFetch('changelog', {
		method: 'DELETE',
		token: session.token,
		tenantId: session.currentTenantId,
		body: ids.map((id) => ({ id, id_empresa: session.currentTenantId })),
	})

	if (!result.ok) {
		return NextResponse.json({ message: getPayloadMessage(result.payload, 'Não foi possível excluir os registros.') }, { status: result.status || 400 })
	}

	return NextResponse.json({ success: true })
}
