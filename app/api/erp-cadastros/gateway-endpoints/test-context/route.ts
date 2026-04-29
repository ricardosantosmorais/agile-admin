import { NextRequest, NextResponse } from 'next/server'
import { agileV2Fetch } from '@/app/api/consultas/_shared'
import { requireRootAgileSession } from '@/app/api/erp-cadastros/_shared'
import { serverApiFetch } from '@/src/services/http/server-api'
import { asArray, asRecord } from '@/src/lib/api-payload'

type TestVariable = {
	token: string
	description: string
	default_value: string
}

function extractRows(response: unknown) {
	const payload = asRecord(response)
	if (Array.isArray(response)) return response as Record<string, unknown>[]
	const data = payload.data
	if (Array.isArray(data)) return data as Record<string, unknown>[]
	if (typeof data === 'object' && data !== null) return [data as Record<string, unknown>]
	if ('id' in payload) return [payload]
	return []
}

function extractTokensFromText(value: unknown) {
	if (typeof value !== 'string' || !value.trim()) return []
	const matches = value.match(/@[A-Za-z0-9_.-]+/g) || []
	return Array.from(new Set(matches.map((token) => token.trim()).filter(Boolean)))
}

function boolFromRequest(value: unknown) {
	if (typeof value === 'boolean') return value
	if (typeof value === 'number') return value === 1
	if (typeof value === 'string') return ['1', 'true', 'sim', 'yes', 'y'].includes(value.trim().toLowerCase())
	return false
}

export async function POST(request: NextRequest) {
	const sessionOrResponse = await requireRootAgileSession()
	if (sessionOrResponse instanceof NextResponse) return sessionOrResponse

	const body = asRecord(await request.json())
	const idGateway = String(body.id_gateway || '').trim()
	if (!idGateway) {
		return NextResponse.json({ message: 'Gateway não informado.' }, { status: 400 })
	}

	if (boolFromRequest(body.hide_all_vars)) {
		return NextResponse.json({ data: { variaveis: [] } })
	}

	const gatewayResult = await agileV2Fetch('gateways', { method: 'GET', query: { perpage: 1, id: idGateway } })
	const gatewayData = gatewayResult.ok ? extractRows(gatewayResult.payload).at(0) || {} : {}

	const endpointsResult = await agileV2Fetch('gateways_endpoints', { method: 'GET', query: { perpage: 1000, id_gateway: idGateway } })
	const authEndpoints = endpointsResult.ok
		? extractRows(endpointsResult.payload).filter((row) => String(row.tipo || '').trim().toLowerCase() === 'autenticacao')
		: []

	const sourceKeys = [
		'endpoint',
		'parametros',
		'body',
		'url_filtro',
		'tipo',
		'token_campo',
		'expiracao_campo',
		'expiracao_formato',
		'expiracao_tempo',
		'tipo_paginacao',
		'nome_propriedade_por_pagina',
		'quantidade_por_pagina',
		'nome_propriedade_pagina',
		'nome_retorno_pagina_atual',
		'nome_retorno_total_paginas',
		'data_array',
	]
	const gatewayKeys = ['url', 'token', 'usuario', 'senha', 'awsaccesskey', 'awssecretkey', 'awsregion', 'awsservicename']
	const authKeys = ['endpoint', 'parametros', 'body', 'url_filtro', 'token_campo', 'expiracao_campo', 'expiracao_formato', 'expiracao_tempo']

	const sources = [
		...sourceKeys.map((key) => body[key]),
		...gatewayKeys.map((key) => gatewayData[key]),
		...authEndpoints.flatMap((endpoint) => authKeys.map((key) => endpoint[key])),
	]

	const ignored = new Set([
		'@pagina',
		'@nome_propriedade_pagina',
		'@nome_propriedade_por_pagina',
		'@quantidade_por_pagina',
		'@empresa.id',
		'@empresa.codigo',
		'@oauth2.token',
	])

	const variables = new Map<string, TestVariable>()
	for (const source of sources) {
		for (const token of extractTokensFromText(source)) {
			const key = token.toLowerCase()
			if (ignored.has(key) || variables.has(key)) continue
			variables.set(key, {
				token,
				description: 'Valor necessário para executar o endpoint.',
				default_value: '',
			})
		}
	}

	const gatewayDefaults: Record<string, unknown> = {
		'@token': gatewayData.token,
		'@usuario': gatewayData.usuario,
		'@senha': gatewayData.senha,
		'@awsaccesskey': gatewayData.awsaccesskey,
		'@awssecretkey': gatewayData.awssecretkey,
		'@awsregion': gatewayData.awsregion,
		'@awsservicename': gatewayData.awsservicename,
	}
	for (const [key, item] of variables.entries()) {
		const value = gatewayDefaults[key]
		if (typeof value !== 'string') continue
		const trimmed = value.trim()
		if (!trimmed || trimmed.includes('@')) continue
		variables.set(key, { ...item, default_value: trimmed })
	}

	let result = Array.from(variables.values()).sort((a, b) => a.token.toLowerCase().localeCompare(b.token.toLowerCase()))

	if (boolFromRequest(body.hide_context_vars)) {
		const paramsResponse = await serverApiFetch(
			`empresas/parametros?id_empresa=${encodeURIComponent(String(body.id_empresa || sessionOrResponse.currentTenantId || ''))}&order=chave,posicao&perpage=1000`,
			{
				method: 'GET',
				token: sessionOrResponse.token,
				tenantId: sessionOrResponse.currentTenantId,
			},
		)
		if (paramsResponse.ok) {
			const prefilled = new Set(
				asArray<Record<string, unknown>>(asRecord(paramsResponse.payload).data)
					.map((row) => String(row.chave || '').trim())
					.filter(Boolean)
					.map((key) => `@${key.replace(/^@+/, '')}`.toLowerCase()),
			)
			result = result.filter((item) => !prefilled.has(item.token.toLowerCase()))
		}
	}

	return NextResponse.json({ data: { variaveis: result } })
}
