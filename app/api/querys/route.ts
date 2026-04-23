import { createHash } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { agileV2Fetch } from '@/app/api/consultas/_shared'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { buildSqlQueryPagination, normalizeSqlQueryRows } from '@/src/features/editor-sql/services/sql-editor-mappers'
import { buildQueryCollectionParams, buildQueryPayload } from '@/src/features/integracao-com-erp-queries/services/integracao-com-erp-queries'
import { asArray, asRecord } from '@/src/lib/api-payload'
import { isRootAgileecommerceTenant } from '@/src/lib/root-tenant'
import { externalAdminApiFetch } from '@/src/services/http/external-admin-api'

type ApiRecord = Record<string, unknown>

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

function toStringValue(value: unknown) {
	return String(value ?? '').trim()
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

function buildTemplateLookup(payload: unknown) {
	const lookup = new Map<string, string>()
	for (const record of asArray<ApiRecord>(asRecord(payload).data)) {
		const id = toStringValue(record.id)
		const nome = toStringValue(record.nome)
		if (id && nome) lookup.set(id, nome)
	}
	return lookup
}

async function loadTemplateNames() {
	const result = await agileV2Fetch('templates', {
		method: 'GET',
		query: {
			perpage: 5000,
			order: 'nome',
			sort: 'asc',
		},
	})

	return result.ok ? buildTemplateLookup(result.payload) : new Map<string, string>()
}

function normalizeExternalVariableRows(payload: unknown) {
	return asArray<ApiRecord>(asRecord(payload).data).map((row) => ({
		id: toStringValue(row.id || row.nome),
		label: toStringValue(row.nome || row.text || row.id),
		description: toStringValue(row.descricao || row.description || row.tipo || row.valor),
		parentId: toStringValue(row.parentId).toLowerCase(),
		required: ['1', 'true', 'sim'].includes(toStringValue(row.obrigatorio).toLowerCase()),
		primaryKey: ['1', 'true', 'sim'].includes(toStringValue(row.chave_primaria).toLowerCase()),
		value: toStringValue(row.valor),
	})).filter((row) => row.id && row.label)
}

function extractRows(payload: unknown) {
	const record = asRecord(payload)
	if (Array.isArray(payload)) return payload as ApiRecord[]
	if (Array.isArray(record.data)) return record.data as ApiRecord[]
	if (Array.isArray(record.aaData)) return record.aaData as ApiRecord[]
	if (Array.isArray(record.items)) return record.items as ApiRecord[]
	return []
}

function normalizeMappingRows(payload: unknown) {
	return extractRows(payload).map((row) => ({
		id: toStringValue(row.id),
		nomeAlias: toStringValue(row.nome_alias),
		campo: toStringValue(row.campo),
		titulo: toStringValue(row.titulo),
		tipo: toStringValue(row.tipo),
		ordenacao: toStringValue(row.ordenacao),
	})).filter((row) => row.id)
}

export async function GET(request: NextRequest) {
	const sessionOrResponse = await requireRootSession()
	if (sessionOrResponse instanceof NextResponse) {
		return sessionOrResponse
	}

	const searchParams = request.nextUrl.searchParams
	const mode = toStringValue(searchParams.get('mode')).toLowerCase()

	if (mode === 'templates') {
		const result = await externalAdminApiFetch('painelb2b', 'templates', {
			method: 'GET',
			query: {
				page: searchParams.get('page') || 1,
				perpage: searchParams.get('perPage') || 30,
				...(toStringValue(searchParams.get('q')) ? { 'nome:lk': toStringValue(searchParams.get('q')) } : {}),
			},
		})

		if (!result.ok) {
			return NextResponse.json({ message: getPayloadMessage(result.payload, 'Não foi possível carregar os templates.') }, { status: result.status || 400 })
		}

		return NextResponse.json({
			data: extractRows(result.payload).map((row) => ({
				id: toStringValue(row.id),
				label: toStringValue(row.nome || row.descricao || row.id),
			})).filter((row) => row.id),
		})
	}

	if (mode === 'companies') {
		const result = await externalAdminApiFetch('painelb2b', 'agilesync_empresas', {
			method: 'GET',
			query: { perpage: 5000 },
		})

		if (!result.ok) {
			return NextResponse.json({ message: getPayloadMessage(result.payload, 'Não foi possível carregar os integradores ativos.') }, { status: result.status || 400 })
		}

		return NextResponse.json({
			data: extractRows(result.payload).map((row) => ({
				id: toStringValue(row.id || row.id_empresa || row.codigo),
				nome: toStringValue(row.nome || row.razao_social || row.nome_fantasia || row.id),
			})).filter((row) => row.id),
		})
	}

	if (mode === 'variables') {
		const result = await externalAdminApiFetch('painelb2b', 'agilesync_editorsqlvariaveis', {
			method: 'GET',
			query: {
				id_empresa: toStringValue(searchParams.get('idEmpresa')) || '1',
				id_servico: 0,
				perpage: 100000,
			},
		})

		if (!result.ok) {
			return NextResponse.json({ message: getPayloadMessage(result.payload, 'Não foi possível carregar os parâmetros da query.') }, { status: result.status || 400 })
		}

		return NextResponse.json({ data: normalizeExternalVariableRows(result.payload) })
	}

	if (mode === 'mapping') {
		const idQuery = toStringValue(searchParams.get('idQuery'))
		if (!idQuery) {
			return NextResponse.json({ message: 'Informe uma query válida para carregar o mapeamento.' }, { status: 400 })
		}

		const result = await externalAdminApiFetch('painelb2b', 'query_campos', {
			method: 'GET',
			query: {
				page: searchParams.get('page') || 1,
				perpage: searchParams.get('perPage') || 100,
				id_query: idQuery,
			},
		})

		if (!result.ok) {
			return NextResponse.json({ message: getPayloadMessage(result.payload, 'Não foi possível carregar o mapeamento da query.') }, { status: result.status || 400 })
		}

		return NextResponse.json({ data: normalizeMappingRows(result.payload) })
	}

	const params = buildQueryCollectionParams({
		page: Number(searchParams.get('page') || 1),
		perPage: Number(searchParams.get('perPage') || 15),
		orderBy: searchParams.get('orderBy') || 'nome',
		sort: searchParams.get('sort') === 'desc' ? 'desc' : 'asc',
		id: searchParams.get('id') || '',
		'nome::lk': searchParams.get('nome::lk') || '',
		'template_nome::lk': searchParams.get('template_nome::lk') || '',
		id_template: searchParams.get('id_template') || '',
		ativo: searchParams.get('ativo') || '',
	})

	const result = await agileV2Fetch('querys', {
		method: 'GET',
		query: params,
	})

	if (!result.ok) {
		return NextResponse.json({ message: getPayloadMessage(result.payload, 'Não foi possível carregar as queries.') }, { status: result.status || 400 })
	}

	const payload = asRecord(result.payload)
	const meta = asRecord(payload.meta)
	const templatesById = await loadTemplateNames()
	const data = asArray<ApiRecord>(payload.data).map((record) => {
		const templateId = toStringValue(record.id_template)
		return {
			...record,
			template_nome: toStringValue(record.template_nome || record['templates.nome']) || templatesById.get(templateId) || '',
		}
	})

	return NextResponse.json({
		data,
		meta: {
			page: Number(meta.page || 1),
			pages: Number(meta.pages || 1),
			perPage: Number(meta.perpage || meta.perPage || 15),
			from: Number(meta.from || 0),
			to: Number(meta.to || 0),
			total: Number(meta.total || 0),
			order: typeof meta.order === 'string' ? meta.order : '',
			sort: typeof meta.sort === 'string' ? meta.sort : '',
		},
	})
}

export async function POST(request: NextRequest) {
	const sessionOrResponse = await requireRootSession()
	if (sessionOrResponse instanceof NextResponse) {
		return sessionOrResponse
	}

	const body = asRecord(await request.json().catch(() => null))
	const action = toStringValue(body.action)

	if (action === 'execute') {
		const sql = toStringValue(body.sql)
		if (!sql) {
			return NextResponse.json({ message: 'Informe a query antes de executar.' }, { status: 400 })
		}

		const page = Math.max(1, Number(body.page || 1))
		const perPage = Math.min(1000, Math.max(1, Number(body.perPage || 100)))
		const result = await externalAdminApiFetch('painelb2b', 'agilesync_editorsql', {
			method: 'POST',
			body: {
				id_empresa: toStringValue(body.idEmpresa) || '1',
				fonte_dados: toStringValue(body.fonteDados || body.fonte_dados || 'erp'),
				sql,
				id_usuario: '',
				page,
				perpage: perPage,
				limit: perPage,
				offset: Math.max(0, (page - 1) * perPage),
				start: Math.max(0, (page - 1) * perPage),
				length: perPage,
				include_total: 1,
			},
		})

		if (!result.ok) {
			return NextResponse.json({ message: getPayloadMessage(result.payload, 'Não foi possível executar a query.') }, { status: result.status || 400 })
		}

		const executionPayload = asRecord(result.payload)
		if (toStringValue(executionPayload.status).toLowerCase() === 'erro') {
			const exception = toStringValue(executionPayload.Exception || executionPayload.exception)
			return NextResponse.json({
				message: exception || 'A execução da query retornou erro.',
				raw: result.payload,
			}, { status: 400 })
		}

		const rows = normalizeSqlQueryRows(result.payload)
		return NextResponse.json({
			raw: result.payload,
			rows,
			pagination: buildSqlQueryPagination(result.payload, page, perPage, rows),
		})
	}

	const normalizedPayload = buildQueryPayload(body, sessionOrResponse.currentUserId)
	const payload: Record<string, string | number | boolean | null | undefined> = {
		...(normalizedPayload.id ? { id: String(normalizedPayload.id) } : {}),
		nome: String(normalizedPayload.nome ?? ''),
		id_template: Number(normalizedPayload.id_template),
		query: String(normalizedPayload.query ?? ''),
		hash: createHash('md5').update(String(normalizedPayload.query ?? '')).digest('hex'),
		ativo: Boolean(normalizedPayload.ativo),
		id_usuario: sessionOrResponse.currentUserId,
	}

	if (!String(payload.nome).trim()) {
		return NextResponse.json({ message: 'Informe o nome da query.' }, { status: 400 })
	}
	if (!Number.isFinite(payload.id_template) || Number(payload.id_template) <= 0) {
		return NextResponse.json({ message: 'Informe o template da query.' }, { status: 400 })
	}
	if (!String(payload.query).trim()) {
		return NextResponse.json({ message: 'A consulta não pode estar vazia.' }, { status: 400 })
	}

	const result = await agileV2Fetch('querys', {
		method: 'POST',
		body: payload,
	})

	if (!result.ok) {
		return NextResponse.json({ message: getPayloadMessage(result.payload, 'Não foi possível salvar a query.') }, { status: result.status || 400 })
	}

	return NextResponse.json(asArray<ApiRecord>(asRecord(result.payload).data).length ? asRecord(result.payload).data : [asRecord(result.payload)])
}

export async function DELETE() {
	return NextResponse.json({ message: 'Exclusão não disponível para Queries.' }, { status: 405 })
}
