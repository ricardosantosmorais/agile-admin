import { NextRequest, NextResponse } from 'next/server'
import { agileV2Fetch } from '@/app/api/consultas/_shared'
import { readAuthSession } from '@/src/features/auth/services/auth-session'
import { asArray, asRecord } from '@/src/lib/api-payload'
import { isRootAgileecommerceTenant } from '@/src/lib/root-tenant'
import { buildParametroCadastroCollectionParams, buildParametroCadastroPayload } from '@/src/features/integracao-com-erp-parametros-cadastro/services/integracao-com-erp-parametros-cadastro'

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

function buildNameLookup(payload: unknown) {
	const records = asArray<Record<string, unknown>>(asRecord(payload).data)
	const lookup = new Map<string, string>()

	for (const record of records) {
		const id = String(record.id ?? '').trim()
		const nome = String(record.nome ?? '').trim()
		if (id && nome) {
			lookup.set(id, nome)
		}
	}

	return lookup
}

async function loadAuxiliaryLookups() {
	const [gruposResult, templatesResult] = await Promise.all([
		agileV2Fetch('parametros_grupo', {
			method: 'GET',
			query: {
				perpage: 1000,
				order: 'ordem,nome',
				sort: 'asc,asc',
			},
		}),
		agileV2Fetch('templates', {
			method: 'GET',
			query: {
				perpage: 1000,
				order: 'nome',
				sort: 'asc',
			},
		}),
	])

	return {
		gruposById: gruposResult.ok ? buildNameLookup(gruposResult.payload) : new Map<string, string>(),
		templatesById: templatesResult.ok ? buildNameLookup(templatesResult.payload) : new Map<string, string>(),
	}
}

export async function GET(request: NextRequest) {
	const sessionOrResponse = await requireRootSession()
	if (sessionOrResponse instanceof NextResponse) {
		return sessionOrResponse
	}

	const searchParams = request.nextUrl.searchParams
	const params = buildParametroCadastroCollectionParams({
		page: Number(searchParams.get('page') || 1),
		perPage: Number(searchParams.get('perPage') || 15),
		orderBy: searchParams.get('orderBy') || 'nome',
		sort: searchParams.get('sort') === 'desc' ? 'desc' : 'asc',
		id: searchParams.get('id') || '',
		id_parametro_grupo: searchParams.get('id_parametro_grupo') || '',
		id_template: searchParams.get('id_template') || '',
		'chave::lk': searchParams.get('chave::lk') || '',
		'nome::lk': searchParams.get('nome::lk') || '',
		tipo_entrada: searchParams.get('tipo_entrada') || '',
		tipo_valor: searchParams.get('tipo_valor') || '',
		fonte_dados: searchParams.get('fonte_dados') || '',
		ativo: searchParams.get('ativo') || '',
		ordem: searchParams.get('ordem') || '',
	})

	const result = await agileV2Fetch('parametros_cadastro', {
		method: 'GET',
		query: params,
	})

	if (!result.ok) {
		return NextResponse.json({ message: getPayloadMessage(result.payload, 'Não foi possível carregar os parâmetros.') }, { status: result.status || 400 })
	}

	const payload = asRecord(result.payload)
	const meta = asRecord(payload.meta)
	const data = asArray<Record<string, unknown>>(payload.data)
	const { gruposById, templatesById } = await loadAuxiliaryLookups()
	const enrichedData = data.map((record) => {
		const grupoId = String(record.id_parametro_grupo ?? '').trim()
		const templateId = String(record.id_template ?? '').trim()

		return {
			...record,
			...(grupoId && gruposById.has(grupoId) ? { 'parametros_grupo.nome': gruposById.get(grupoId) } : {}),
			...(templateId && templatesById.has(templateId) ? { 'templates.nome': templatesById.get(templateId) } : {}),
		}
	})

	return NextResponse.json({
		data: enrichedData,
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

	try {
		const normalizedPayload = buildParametroCadastroPayload(asRecord(await request.json()))
		const payload: Record<string, string | number | boolean | null | undefined> = {
			...(normalizedPayload.id ? { id: String(normalizedPayload.id) } : {}),
			ativo: Boolean(normalizedPayload.ativo),
			obrigatorio: Boolean(normalizedPayload.obrigatorio),
			editavel: Boolean(normalizedPayload.editavel),
			id_parametro_grupo: Number(normalizedPayload.id_parametro_grupo),
			id_template: normalizedPayload.id_template === null ? null : Number(normalizedPayload.id_template),
			chave: String(normalizedPayload.chave ?? ''),
			nome: String(normalizedPayload.nome ?? ''),
			tipo_entrada: String(normalizedPayload.tipo_entrada ?? ''),
			tipo_valor: String(normalizedPayload.tipo_valor ?? ''),
			dono: typeof normalizedPayload.dono === 'string' ? normalizedPayload.dono : null,
			nivel_acesso: typeof normalizedPayload.nivel_acesso === 'string' ? normalizedPayload.nivel_acesso : null,
			chave_plataforma: typeof normalizedPayload.chave_plataforma === 'string' ? normalizedPayload.chave_plataforma : null,
			descricao: typeof normalizedPayload.descricao === 'string' ? normalizedPayload.descricao : null,
			ordem: Number(normalizedPayload.ordem ?? 0),
			valor_default: typeof normalizedPayload.valor_default === 'string' ? normalizedPayload.valor_default : null,
			fonte_dados: typeof normalizedPayload.fonte_dados === 'string' ? normalizedPayload.fonte_dados : null,
			dados: typeof normalizedPayload.dados === 'string' ? normalizedPayload.dados : null,
			id_parametro_ativacao: normalizedPayload.id_parametro_ativacao === null ? null : Number(normalizedPayload.id_parametro_ativacao),
			valor_ativacao: typeof normalizedPayload.valor_ativacao === 'string' ? normalizedPayload.valor_ativacao : null,
		}
		const result = await agileV2Fetch('parametros_cadastro', {
			method: 'POST',
			body: payload,
		})

		if (!result.ok) {
			return NextResponse.json({ message: getPayloadMessage(result.payload, 'Não foi possível salvar o parâmetro.') }, { status: result.status || 400 })
		}

		return NextResponse.json(result.payload)
	} catch (error) {
		return NextResponse.json({ message: error instanceof Error ? error.message : 'Não foi possível salvar o parâmetro.' }, { status: 400 })
	}
}

export async function DELETE() {
	return NextResponse.json({ message: 'Exclusão não disponível para Parâmetros Cadastro.' }, { status: 405 })
}
