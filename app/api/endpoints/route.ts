import { NextRequest, NextResponse } from 'next/server'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { buildEndpointCollectionParams, buildEndpointPayload } from '@/src/features/integracao-com-erp-endpoints/services/integracao-com-erp-endpoints'
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

function extractRows(payload: unknown) {
	const record = asRecord(payload)
	if (Array.isArray(payload)) return payload as ApiRecord[]
	if (Array.isArray(record.data)) return record.data as ApiRecord[]
	if (Array.isArray(record.aaData)) return record.aaData as ApiRecord[]
	if (Array.isArray(record.items)) return record.items as ApiRecord[]
	return []
}

function normalizeMeta(payload: unknown, fallbackPerPage: number) {
	const meta = asRecord(asRecord(payload).meta)
	return {
		page: Number(meta.page || 1),
		pages: Number(meta.pages || 1),
		perPage: Number(meta.perpage || meta.perPage || fallbackPerPage),
		from: Number(meta.from || 0),
		to: Number(meta.to || 0),
		total: Number(meta.total || extractRows(payload).length),
		order: typeof meta.order === 'string' ? meta.order : '',
		sort: typeof meta.sort === 'string' ? meta.sort : '',
	}
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

async function lookupOptions(path: string, searchParams: URLSearchParams, fallbackMessage: string) {
	const result = await externalAdminApiFetch('painelb2b', path, {
		method: 'GET',
		query: {
			page: searchParams.get('page') || 1,
			perpage: searchParams.get('perPage') || 30,
			...(toStringValue(searchParams.get('q')) ? { 'nome:lk': toStringValue(searchParams.get('q')) } : {}),
		},
	})

	if (!result.ok) {
		return NextResponse.json({ message: getPayloadMessage(result.payload, fallbackMessage) }, { status: result.status || 400 })
	}

	return NextResponse.json({
		data: extractRows(result.payload).map((row) => ({
			id: toStringValue(row.id),
			label: toStringValue(row.nome || row.descricao || row.id),
		})).filter((row) => row.id),
	})
}

function normalizeProfileRows(payload: unknown) {
	return extractRows(payload).map((row) => ({
		id: toStringValue(row.id || row.id_perfil),
		idPerfil: toStringValue(row.id_perfil || row.id),
		nomePerfil: toStringValue(row.perfil_nome || row.nome_perfil || row.perfil || row.nome),
	})).filter((row) => row.idPerfil)
}

export async function GET(request: NextRequest) {
	const sessionOrResponse = await requireRootSession()
	if (sessionOrResponse instanceof NextResponse) {
		return sessionOrResponse
	}

	const searchParams = request.nextUrl.searchParams
	const mode = toStringValue(searchParams.get('mode')).toLowerCase()

	if (mode === 'queries') {
		return lookupOptions('queries', searchParams, 'Não foi possível carregar as queries.')
	}

	if (mode === 'tables') {
		return lookupOptions('tabelas', searchParams, 'Não foi possível carregar as tabelas.')
	}

	if (mode === 'profiles') {
		const idEndpoint = toStringValue(searchParams.get('idEndpoint'))
		if (!idEndpoint) {
			return NextResponse.json({ message: 'Informe o endpoint para carregar os perfis.' }, { status: 400 })
		}

		const result = await externalAdminApiFetch('painelb2b', 'endpoint_perfis', {
			method: 'GET',
			query: { id_endpoint: idEndpoint, perpage: 5000 },
		})

		if (!result.ok) {
			return NextResponse.json({ message: getPayloadMessage(result.payload, 'Não foi possível carregar os perfis do endpoint.') }, { status: result.status || 400 })
		}

		return NextResponse.json({ data: normalizeProfileRows(result.payload) })
	}

	const perPage = Number(searchParams.get('perPage') || 15)
	const params = buildEndpointCollectionParams({
		page: Number(searchParams.get('page') || 1),
		perPage,
		orderBy: searchParams.get('orderBy') || 'id',
		sort: searchParams.get('sort') === 'desc' ? 'desc' : 'asc',
		id: searchParams.get('id') || '',
		'nome::lk': searchParams.get('nome::lk') || '',
		'tipo_retorno::lk': searchParams.get('tipo_retorno::lk') || '',
		publico: searchParams.get('publico') || '',
		ativo: searchParams.get('ativo') || '',
	})

	const result = await externalAdminApiFetch('painelb2b', 'endpoints', {
		method: 'GET',
		query: params,
	})

	if (!result.ok) {
		return NextResponse.json({ message: getPayloadMessage(result.payload, 'Não foi possível carregar os endpoints.') }, { status: result.status || 400 })
	}

	return NextResponse.json({
		data: extractRows(result.payload),
		meta: normalizeMeta(result.payload, perPage),
	})
}

export async function POST(request: NextRequest) {
	const sessionOrResponse = await requireRootSession()
	if (sessionOrResponse instanceof NextResponse) {
		return sessionOrResponse
	}

	const body = asRecord(await request.json().catch(() => null))
	const action = toStringValue(body.action)

	if (action === 'addProfile') {
		const idEndpoint = toStringValue(body.id_endpoint)
		const perfil = toStringValue(body.perfil)
		if (!idEndpoint || !perfil) {
			return NextResponse.json({ message: 'Selecione o perfil antes de incluir.' }, { status: 400 })
		}

		const result = await externalAdminApiFetch('painelb2b', 'endpoint_perfis', {
			method: 'POST',
			body: { id_endpoint: idEndpoint, perfil },
		})

		if (!result.ok) {
			return NextResponse.json({ message: getPayloadMessage(result.payload, 'Não foi possível incluir o perfil.') }, { status: result.status || 400 })
		}

		return NextResponse.json({ data: normalizeProfileRows(result.payload) })
	}

	const payload = buildEndpointPayload(body)
	if (!toStringValue(payload.nome)) {
		return NextResponse.json({ message: 'Informe o nome do endpoint.' }, { status: 400 })
	}

	const result = await externalAdminApiFetch('painelb2b', 'endpoints', {
		method: 'POST',
		body: {
			...(payload.id ? { id: toStringValue(payload.id) } : {}),
			nome: toStringValue(payload.nome),
			descricao: toStringValue(payload.descricao),
			tipo_retorno: toStringValue(payload.tipo_retorno),
			publico: payload.publico ? 1 : 0,
			ativo: payload.ativo ? 1 : 0,
			id_query: toStringValue(payload.id_query),
			fonte_dados: toStringValue(payload.fonte_dados),
			id_tabela: toStringValue(payload.id_tabela),
			implementacao_nome: toStringValue(payload.implementacao_nome),
			limite: toStringValue(payload.limite),
		},
	})

	if (!result.ok) {
		return NextResponse.json({ message: getPayloadMessage(result.payload, 'Não foi possível salvar o endpoint.') }, { status: result.status || 400 })
	}

	return NextResponse.json(asArray<ApiRecord>(asRecord(result.payload).data).length ? asRecord(result.payload).data : [asRecord(result.payload)])
}

export async function DELETE(request: NextRequest) {
	const sessionOrResponse = await requireRootSession()
	if (sessionOrResponse instanceof NextResponse) {
		return sessionOrResponse
	}

	const body = asRecord(await request.json().catch(() => null))
	const idEndpoint = toStringValue(body.id_endpoint)
	const idPerfil = toStringValue(body.id_perfil)
	if (!idEndpoint || !idPerfil) {
		return NextResponse.json({ message: 'Informe o perfil para excluir.' }, { status: 400 })
	}

	const result = await externalAdminApiFetch('painelb2b', 'endpoint_perfis', {
		method: 'DELETE',
		body: { id_endpoint: idEndpoint, id_perfil: idPerfil },
	})

	if (!result.ok) {
		return NextResponse.json({ message: getPayloadMessage(result.payload, 'Não foi possível excluir o perfil.') }, { status: result.status || 400 })
	}

	return NextResponse.json({ data: normalizeProfileRows(result.payload) })
}
