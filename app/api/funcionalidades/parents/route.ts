import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

type ApiRecord = Record<string, unknown>

function text(value: unknown) {
	return String(value ?? '').trim()
}

function getErrorMessage(payload: unknown, fallback: string) {
	if (typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string') {
		return payload.message
	}
	return fallback
}

function mapParentOption(record: ApiRecord) {
	const id = text(record.id)
	const nome = text(record.nome)
	const nivel = text(record.nivel)
	const parsedNivel = Number(nivel)
	const prefix = Number.isFinite(parsedNivel) && parsedNivel > 1 ? '    '.repeat(parsedNivel - 1) : ''

	return {
		id,
		label: `${prefix}${nome || id} - ${id}`,
		description: nivel ? `Nível ${nivel}` : undefined,
	}
}

export async function GET(request: NextRequest) {
	const session = await readAuthSession()
	if (!session) {
		return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
	}

	const searchParams = request.nextUrl.searchParams
	const id = text(searchParams.get('id'))
	const q = text(searchParams.get('q'))
	const currentId = text(searchParams.get('currentId'))
	const page = searchParams.get('page') || '1'
	const perPage = searchParams.get('perPage') || '20'

	const params = new URLSearchParams({
		page: id ? '1' : page,
		perpage: id ? '1' : perPage,
		order: 'nome',
		sort: 'asc',
	})

	if (id) {
		params.set('id', id)
	} else if (q) {
		params.set('nome::like', q)
	}

	const result = await serverApiFetch(`funcionalidades?${params.toString()}`, {
		method: 'GET',
		token: session.token,
		tenantId: session.currentTenantId,
	})

	if (!result.ok) {
		return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível carregar as funcionalidades.') }, { status: result.status || 400 })
	}

	const payload = result.payload
	const records: unknown[] = typeof payload === 'object' && payload !== null && 'data' in payload && Array.isArray(payload.data)
		? payload.data
		: Array.isArray(payload)
			? payload
			: []

	const options = records
		.filter((record: unknown): record is ApiRecord => typeof record === 'object' && record !== null && !Array.isArray(record))
		.filter((record) => text(record.id) && text(record.id) !== currentId)
		.map(mapParentOption)

	return NextResponse.json(options)
}
