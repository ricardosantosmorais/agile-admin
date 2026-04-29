import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { serverApiFetch } from '@/src/services/http/server-api'

function getErrorMessage(payload: unknown, fallback: string) {
	if (typeof payload === 'object' && payload !== null && 'message' in payload && typeof payload.message === 'string') {
		return payload.message
	}
	return fallback
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
	const session = await readAuthSession()
	if (!session) {
		return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
	}

	const { id } = await context.params
	const body = await request.json() as { id_empresa?: unknown }
	const idEmpresa = String(body.id_empresa ?? '').trim()
	if (!idEmpresa) {
		return NextResponse.json({ message: 'Selecione uma empresa.' }, { status: 400 })
	}

	const result = await serverApiFetch('funcionalidades/empresas', {
		method: 'POST',
		token: session.token,
		tenantId: session.currentTenantId,
		body: {
			id_funcionalidade: id,
			id_empresa: idEmpresa,
		},
	})

	if (!result.ok) {
		return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível vincular a empresa.') }, { status: result.status || 400 })
	}

	return NextResponse.json(result.payload)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
	const session = await readAuthSession()
	if (!session) {
		return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
	}

	const { id } = await context.params
	const body = await request.json() as { ids?: unknown[] }
	const ids = Array.isArray(body.ids)
		? body.ids.map((item) => String(item ?? '').trim()).filter(Boolean)
		: []

	if (!ids.length) {
		return NextResponse.json({ message: 'Selecione ao menos uma empresa.' }, { status: 400 })
	}

	const result = await serverApiFetch('funcionalidades/empresas', {
		method: 'DELETE',
		token: session.token,
		tenantId: session.currentTenantId,
		body: ids.map((idEmpresa) => ({
			id_funcionalidade: id,
			id_empresa: idEmpresa,
		})),
	})

	if (!result.ok) {
		return NextResponse.json({ message: getErrorMessage(result.payload, 'Não foi possível desvincular as empresas.') }, { status: result.status || 400 })
	}

	return NextResponse.json({ success: true })
}
