import { NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

function getErrorMessage(payload: unknown, fallback: string) {
	if (typeof payload === 'object' && payload !== null) {
		if ('message' in payload && typeof payload.message === 'string') return payload.message
		if ('error' in payload && typeof payload.error === 'object' && payload.error !== null && 'message' in payload.error && typeof payload.error.message === 'string') {
			return payload.error.message
		}
	}

	return fallback
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
	const session = await readAuthSession()
	if (!session) {
		return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
	}

	const { id } = await params
	const result = await serverApiFetch(`pedidos/avaliacoes?id=${encodeURIComponent(id)}&embed=cliente,usuario,pedido&perpage=1`, {
		method: 'GET',
		token: session.token,
		tenantId: session.currentTenantId,
	})

	if (!result.ok) {
		return NextResponse.json(
			{ message: getErrorMessage(result.payload, 'Não foi possível carregar os detalhes da avaliação.') },
			{ status: result.status || 400 },
		)
	}

	return NextResponse.json(result.payload)
}
