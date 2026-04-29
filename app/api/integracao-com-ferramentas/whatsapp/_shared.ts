import { NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { isRootAgileecommerceTenant } from '@/src/lib/root-tenant'
import { serverApiFetch } from '@/src/services/http/server-api'

export type WhatsappContext = {
	token: string
	tenantId: string
	userId: string
}

export function asRecord(value: unknown): Record<string, unknown> {
	return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

export function asArray<T = unknown>(value: unknown): T[] {
	return Array.isArray(value) ? value as T[] : []
}

export function apiMessage(payload: unknown, fallback: string) {
	const record = asRecord(payload)
	const error = asRecord(record.error)
	if (typeof error.message === 'string' && error.message.trim()) return error.message.trim()
	if (typeof record.message === 'string' && record.message.trim()) return record.message.trim()
	if (typeof payload === 'string' && payload.trim()) return payload.trim()
	return fallback
}

export async function resolveWhatsappContext() {
	const session = await readAuthSession()
	if (!session?.token || !session.currentTenantId || !session.currentUserId) {
		return { error: NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 }) }
	}
	if (!isRootAgileecommerceTenant(session.currentTenantId)) {
		return { error: NextResponse.json({ message: 'Esta funcionalidade está disponível apenas na área da Agile Ecommerce.' }, { status: 403 }) }
	}
	return {
		context: {
			token: session.token,
			tenantId: session.currentTenantId,
			userId: session.currentUserId,
		} satisfies WhatsappContext,
	}
}

export async function whatsappApiFetch(
	context: WhatsappContext,
	path: string,
	options: { method?: 'GET' | 'POST' | 'DELETE'; body?: unknown } = {},
) {
	return serverApiFetch(path, {
		method: options.method ?? 'GET',
		token: context.token,
		tenantId: context.tenantId,
		body: options.body,
	})
}

export function withTenant(context: WhatsappContext, body: Record<string, unknown>) {
	return {
		...body,
		id_empresa: context.tenantId,
	}
}

export function decodeJsonArray(value: unknown, label: string) {
	if (Array.isArray(value)) return value
	if (typeof value !== 'string') return []
	const normalized = value
		.trim()
		.replace(/^\s*```(?:json)?\s*/i, '')
		.replace(/\s*```\s*$/i, '')
		.replace(/[“”]/g, '"')
		.replace(/[‘’]/g, "'")
		.replace(/\u00a0/g, ' ')
	if (!normalized) return []
	try {
		const parsed = JSON.parse(normalized)
		if (Array.isArray(parsed)) return parsed
		throw new Error('Payload precisa ser um array.')
	} catch (error) {
		throw new Error(`${label} inválido. ${error instanceof Error ? error.message : ''}`.trim())
	}
}

export function apiV3BaseUrl() {
	return (
		process.env.ADMIN_URL_API_V3
		|| process.env.NEXT_PUBLIC_API_V3_URL
		|| 'http://localhost:9001/'
	).replace(/\/+$/, '')
}
