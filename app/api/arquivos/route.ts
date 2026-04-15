import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

function getErrorMessage(payload: unknown, fallback: string) {
	if (typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string') {
		return payload.message
	}

	if (
		typeof payload === 'object'
		&& payload !== null
		&& 'error' in payload
		&& typeof payload.error === 'object'
		&& payload.error !== null
		&& 'message' in payload.error
		&& typeof payload.error.message === 'string'
	) {
		return payload.error.message
	}

	return fallback
}

function mapListPayload(payload: unknown) {
	if (
		typeof payload !== 'object'
		|| payload === null
		|| !('meta' in payload)
		|| typeof payload.meta !== 'object'
		|| payload.meta === null
		|| !('data' in payload)
		|| !Array.isArray(payload.data)
	) {
		return payload
	}

	const meta = payload.meta as Record<string, unknown>
	return {
		...payload,
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
	}
}

export async function GET(request: NextRequest) {
	const session = await readAuthSession()
	if (!session) {
		return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
	}

	const search = request.nextUrl.searchParams
	const params = new URLSearchParams()
	params.set('page', search.get('page') || '1')
	params.set('perpage', search.get('perPage') || '15')
	params.set('order', search.get('orderBy') || 'data_envio')
	params.set('sort', search.get('sort') || 'desc')
	params.set('id_empresa', session.currentTenantId)

	const id = String(search.get('id') || '').trim()
	const arquivo = String(search.get('arquivo') || '').trim()
	const dataInicio = String(search.get('data_inicio') || '').trim()
	const dataFim = String(search.get('data_fim') || '').trim()

	if (id) {
		params.set('id', id)
	}

	if (arquivo) {
		params.set('arquivo::like', arquivo)
	}

	if (dataInicio) {
		params.set('data_envio::ge', `${dataInicio} 00:00:00`)
	}

	if (dataFim) {
		params.set('data_envio::le', `${dataFim} 23:59:59`)
	}

	const result = await serverApiFetch(`arquivos?${params.toString()}`, {
		method: 'GET',
		token: session.token,
		tenantId: session.currentTenantId,
	})

	if (!result.ok) {
		return NextResponse.json(
			{ message: getErrorMessage(result.payload, 'Não foi possível carregar os arquivos.') },
			{ status: result.status || 400 },
		)
	}

	return NextResponse.json(mapListPayload(result.payload))
}

export async function POST(request: NextRequest) {
	const session = await readAuthSession()
	if (!session) {
		return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
	}

	const payload = await request.json().catch(() => null)
	const arquivo = typeof payload === 'object' && payload !== null && 'arquivo' in payload ? String(payload.arquivo || '').trim() : ''

	if (!arquivo) {
		return NextResponse.json({ message: 'Informe o arquivo enviado antes de salvar.' }, { status: 400 })
	}

	const result = await serverApiFetch('arquivos', {
		method: 'POST',
		token: session.token,
		tenantId: session.currentTenantId,
		body: { arquivo },
	})

	if (!result.ok) {
		return NextResponse.json(
			{ message: getErrorMessage(result.payload, 'Não foi possível salvar o arquivo.') },
			{ status: result.status || 400 },
		)
	}

	return NextResponse.json(result.payload)
}

export async function DELETE(request: NextRequest) {
	const session = await readAuthSession()
	if (!session) {
		return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
	}

	const payload = await request.json().catch(() => null)
	const ids = Array.isArray(payload?.ids)
		? (payload.ids as unknown[]).map((value: unknown) => String(value || '').trim()).filter(Boolean)
		: []

	if (!ids.length) {
		return NextResponse.json({ message: 'Selecione ao menos um arquivo para excluir.' }, { status: 400 })
	}

	const result = await serverApiFetch('arquivos', {
		method: 'DELETE',
		token: session.token,
		tenantId: session.currentTenantId,
		body: ids.map((id) => ({ id })),
	})

	if (!result.ok) {
		return NextResponse.json(
			{ message: getErrorMessage(result.payload, 'Não foi possível excluir os arquivos selecionados.') },
			{ status: result.status || 400 },
		)
	}

	return NextResponse.json(result.payload)
}
