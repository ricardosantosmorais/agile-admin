import { NextRequest, NextResponse } from 'next/server'
import { agileV2Fetch } from '@/app/api/consultas/_shared'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { isRootAgileecommerceTenant } from '@/src/lib/root-tenant'
import { asArray } from '@/src/lib/api-payload'

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

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
	const session = await readAuthSession()
	if (!session) {
		return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
	}

	if (!isRootAgileecommerceTenant(session.currentTenantId)) {
		return NextResponse.json({ message: 'Você não tem acesso ao recurso solicitado.' }, { status: 403 })
	}

	const { id } = await context.params
	const params = new URLSearchParams({ perpage: '1', id })
	const result = await agileV2Fetch('erps', {
		method: 'GET',
		query: params,
	})

	if (!result.ok) {
		return NextResponse.json({ message: getPayloadMessage(result.payload, 'Não foi possível carregar o ERP.') }, { status: result.status || 400 })
	}

	const item = asArray<Record<string, unknown>>((typeof result.payload === 'object' && result.payload !== null && 'data' in result.payload ? result.payload.data : [])).at(0)
	if (!item) {
		return NextResponse.json({ message: 'ERP não encontrado.' }, { status: 404 })
	}

	return NextResponse.json(item)
}
