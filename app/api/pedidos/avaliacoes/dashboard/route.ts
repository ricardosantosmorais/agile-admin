import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

function messageFromPayload(payload: unknown, fallback: string) {
	if (typeof payload === 'object' && payload !== null) {
		if ('message' in payload && typeof payload.message === 'string') return payload.message
		if ('error' in payload && typeof payload.error === 'object' && payload.error !== null && 'message' in payload.error && typeof payload.error.message === 'string') {
			return payload.error.message
		}
	}
	return fallback
}

export async function GET(request: NextRequest) {
	const session = await readAuthSession()
	if (!session) {
		return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
	}

	const result = await serverApiFetch(`pedidos/avaliacoes/dashboard?${request.nextUrl.searchParams.toString()}`, {
		method: 'GET',
		token: session.token,
		tenantId: session.currentTenantId,
	})

	if (!result.ok) {
		return NextResponse.json(
			{ message: messageFromPayload(result.payload, 'Não foi possível carregar o resumo das avaliações.') },
			{ status: result.status || 400 },
		)
	}

	return NextResponse.json(result.payload)
}
