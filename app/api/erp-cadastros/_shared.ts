import { NextRequest, NextResponse } from 'next/server'
import { agileV2Fetch } from '@/app/api/consultas/_shared'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import type { CrudListFilters, CrudRecord } from '@/src/components/crud-base/types'
import { asArray, asRecord } from '@/src/lib/api-payload'
import { isRootAgileecommerceTenant } from '@/src/lib/root-tenant'

export type AgileCatalogResource =
	| 'gateways'
	| 'gateways_endpoints'
	| 'interfaces_consulta'
	| 'acoes'
	| 'servicos'

export type AgileCatalogRouteConfig = {
	resource: AgileCatalogResource
	defaultOrderBy: string
	defaultSort?: 'asc' | 'desc'
	join?: string
	tenantScoped?: boolean
	buildParams: (filters: CrudListFilters) => URLSearchParams
	buildPayload: (record: CrudRecord) => CrudRecord
	normalizeItem?: (record: CrudRecord) => CrudRecord
	messages: {
		loadList: string
		loadItem: string
		notFound: string
		save: string
		deleteUnavailable?: string
	}
}

export function getAgilePayloadMessage(payload: unknown, fallback: string) {
	if (typeof payload === 'object' && payload !== null) {
		const error = 'error' in payload ? payload.error : null
		if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
			return error.message
		}
		if ('message' in payload && typeof payload.message === 'string') {
			return payload.message
		}
	}
	return fallback
}

export async function requireRootAgileSession() {
	const session = await readAuthSession()
	if (!session) {
		return NextResponse.json({ message: 'Sessão expirada.' }, { status: 401 })
	}
	if (!isRootAgileecommerceTenant(session.currentTenantId)) {
		return NextResponse.json({ message: 'Você não tem acesso ao recurso solicitado.' }, { status: 403 })
	}
	return session
}

function normalizeMeta(payload: Record<string, unknown>) {
	const meta = asRecord(payload.meta)
	return {
		page: Number(meta.page || 1),
		pages: Number(meta.pages || 1),
		perPage: Number(meta.perpage || meta.perPage || 15),
		from: Number(meta.from || 0),
		to: Number(meta.to || 0),
		total: Number(meta.total || 0),
		order: typeof meta.order === 'string' ? meta.order : '',
		sort: typeof meta.sort === 'string' ? meta.sort : '',
	}
}

export function createAgileCatalogRouteHandlers(config: AgileCatalogRouteConfig) {
	return {
		async GET(request: NextRequest) {
			const sessionOrResponse = await requireRootAgileSession()
			if (sessionOrResponse instanceof NextResponse) return sessionOrResponse

			const searchParams = request.nextUrl.searchParams
			const params = config.buildParams({
				page: Number(searchParams.get('page') || 1),
				perPage: Number(searchParams.get('perPage') || 15),
				orderBy: searchParams.get('orderBy') || config.defaultOrderBy,
				sort: searchParams.get('sort') === 'desc' ? 'desc' : 'asc',
				...Object.fromEntries(searchParams.entries()),
			})

			if (config.join && !params.has('join')) {
				params.set('join', config.join)
			}
			if (config.tenantScoped && sessionOrResponse.currentTenantId && !params.has('id_empresa')) {
				params.set('id_empresa', sessionOrResponse.currentTenantId)
			}

			const result = await agileV2Fetch(config.resource, { method: 'GET', query: params })
			if (!result.ok) {
				return NextResponse.json({ message: getAgilePayloadMessage(result.payload, config.messages.loadList) }, { status: result.status || 400 })
			}

			const payload = asRecord(result.payload)
			const rows = asArray<Record<string, unknown>>(payload.data).map((row) => {
				const normalized = config.normalizeItem ? config.normalizeItem(row) : row
				return { ...normalized, id: String(normalized.id ?? row.id ?? '') }
			})

			return NextResponse.json({ data: rows, meta: normalizeMeta(payload) })
		},

		async POST(request: NextRequest) {
			const sessionOrResponse = await requireRootAgileSession()
			if (sessionOrResponse instanceof NextResponse) return sessionOrResponse

			const payload = config.buildPayload(asRecord(await request.json()))
			if (config.tenantScoped && sessionOrResponse.currentTenantId && !payload.id_empresa) {
				payload.id_empresa = sessionOrResponse.currentTenantId
			}

			const result = await agileV2Fetch(config.resource, { method: 'POST', body: payload as Record<string, string | number | boolean | null | undefined> })
			if (!result.ok) {
				return NextResponse.json({ message: getAgilePayloadMessage(result.payload, config.messages.save) }, { status: result.status || 400 })
			}

			const responsePayload = asRecord(result.payload)
			const rows = asArray<Record<string, unknown>>(responsePayload.data)
			return NextResponse.json(rows.length ? rows : [responsePayload])
		},

		async DELETE() {
			return NextResponse.json({ message: config.messages.deleteUnavailable || 'Exclusão não disponível para este cadastro.' }, { status: 405 })
		},
	}
}

export function createAgileCatalogItemGetHandler(config: AgileCatalogRouteConfig) {
	return async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
		const sessionOrResponse = await requireRootAgileSession()
		if (sessionOrResponse instanceof NextResponse) return sessionOrResponse

		const { id } = await context.params
		const query = new URLSearchParams({ perpage: '1', id })
		if (config.join) query.set('join', config.join)
		if (config.tenantScoped && sessionOrResponse.currentTenantId) query.set('id_empresa', sessionOrResponse.currentTenantId)

		const result = await agileV2Fetch(config.resource, { method: 'GET', query })
		if (!result.ok) {
			return NextResponse.json({ message: getAgilePayloadMessage(result.payload, config.messages.loadItem) }, { status: result.status || 400 })
		}

		const item = asArray<Record<string, unknown>>(asRecord(result.payload).data).at(0)
		if (!item) {
			return NextResponse.json({ message: config.messages.notFound }, { status: 404 })
		}

		return NextResponse.json(config.normalizeItem ? config.normalizeItem(item) : item)
	}
}
