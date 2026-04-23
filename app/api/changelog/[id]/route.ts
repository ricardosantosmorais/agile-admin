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

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
	const session = await readAuthSession()
	if (!session) {
		return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
	}

	if (!isRootAgileecommerceTenant(session.currentTenantId)) {
		return NextResponse.json({ message: 'Você não tem acesso ao recurso solicitado.' }, { status: 403 })
	}

	const { id } = await context.params
	const result = await serverApiFetch(`changelog?page=1&perpage=1&id=${encodeURIComponent(id)}`, {
		method: 'GET',
		token: session.token,
		tenantId: session.currentTenantId,
	})

	if (!result.ok) {
		return NextResponse.json({ message: getPayloadMessage(result.payload, 'Não foi possível carregar o registro.') }, { status: result.status || 400 })
	}

	const payload = asRecord(result.payload)
	const row = asArray<Record<string, unknown>>(payload.data)[0]

	if (!row) {
		return NextResponse.json({ message: 'Registro não encontrado.' }, { status: 404 })
	}

	return NextResponse.json({
		...row,
		conteudo: sanitizeRichHtml(row.conteudo),
	})
}
