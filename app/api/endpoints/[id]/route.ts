import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { asArray, asRecord } from '@/src/lib/api-payload'
import { isRootAgileecommerceTenant } from '@/src/lib/root-tenant'
import { externalAdminApiFetch } from '@/src/services/http/external-admin-api'

type ApiRecord = Record<string, unknown>

function toStringValue(value: unknown) {
	return String(value ?? '').trim()
}

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

function firstRow(payload: unknown) {
	return asArray<ApiRecord>(asRecord(payload).data).at(0)
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

async function loadName(path: string, id: string) {
	if (!id) return ''
	const result = await externalAdminApiFetch('painelb2b', path, {
		method: 'GET',
		query: { perpage: 1, id },
	})
	const row = result.ok ? firstRow(result.payload) : null
	return toStringValue(row?.nome || row?.descricao || row?.titulo || row?.id)
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
	const sessionOrResponse = await requireRootSession()
	if (sessionOrResponse instanceof NextResponse) {
		return sessionOrResponse
	}

	const { id } = await context.params
	const result = await externalAdminApiFetch('painelb2b', 'endpoints', {
		method: 'GET',
		query: { perpage: 1, id },
	})

	if (!result.ok) {
		return NextResponse.json({ message: getPayloadMessage(result.payload, 'Não foi possível carregar o endpoint.') }, { status: result.status || 400 })
	}

	const item = firstRow(result.payload)
	if (!item) {
		return NextResponse.json({ message: 'Endpoint não encontrado.' }, { status: 404 })
	}

	const queryId = toStringValue(item.id_query)
	const tableId = toStringValue(item.id_tabela)

	return NextResponse.json({
		...item,
		query_nome: await loadName('queries', queryId),
		tabela_nome: await loadName('tabelas', tableId),
	})
}
