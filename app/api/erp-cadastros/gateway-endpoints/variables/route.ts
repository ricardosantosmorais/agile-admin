import { NextRequest, NextResponse } from 'next/server'
import { agileV2Fetch } from '@/app/api/consultas/_shared'
import { requireRootAgileSession } from '@/app/api/erp-cadastros/_shared'
import { asArray, asRecord } from '@/src/lib/api-payload'

function addToken(tokens: Map<string, { token: string; description: string; origin: string }>, token: string, description: string, origin: string) {
	const normalized = token.trim().startsWith('@') ? token.trim() : `@${token.trim()}`
	if (!normalized || normalized === '@') return
	tokens.set(normalized.toLowerCase(), { token: normalized, description, origin })
}

export async function POST(request: NextRequest) {
	const sessionOrResponse = await requireRootAgileSession()
	if (sessionOrResponse instanceof NextResponse) return sessionOrResponse
	const body = asRecord(await request.json())
	const idGateway = String(body.id_gateway || '').trim()
	const tokens = new Map<string, { token: string; description: string; origin: string }>()

	for (const item of [
		['@pagina', 'Página atual utilizada na paginação da API.'],
		['@empresa.id', 'Identificador da empresa no contexto da execução.'],
		['@empresa.codigo', 'Código da empresa no contexto da execução.'],
		['@oauth2.token', 'Token OAuth2 obtido na autenticação do gateway.'],
		['@oauth2.cookie', 'Cookie capturado na autenticação OAuth2Cookie do gateway.'],
	]) {
		addToken(tokens, item[0], item[1], 'fixa')
	}

	if (idGateway) {
		const gatewayResult = await agileV2Fetch('gateways', { method: 'GET', query: { perpage: 1, id: idGateway } })
		if (gatewayResult.ok) {
			const gateway = asArray<Record<string, unknown>>(asRecord(gatewayResult.payload).data).at(0) || {}
			const templateId = String(gateway.id_template || '').trim()
			for (const key of ['url', 'token', 'usuario', 'senha', 'awsaccesskey', 'awssecretkey', 'awsregion', 'awsservicename', 'json_exemplo']) {
				const value = String(gateway[key] || '')
				for (const match of value.matchAll(/@[A-Za-z0-9_.-]+/g)) {
					addToken(tokens, match[0], 'Parâmetro já utilizado neste gateway.', 'gateway')
				}
			}
			const paramsResult = await agileV2Fetch('parametros_cadastro', { method: 'GET', query: { perpage: 1000, order: 'chave', ...(templateId ? { id_template: templateId } : {}) } })
			if (paramsResult.ok) {
				for (const row of asArray<Record<string, unknown>>(asRecord(paramsResult.payload).data)) {
					if (String(row.ativo ?? '1') === '0') continue
					const key = String(row.chave || row.chave_plataforma || '').trim()
					if (key) addToken(tokens, key, String(row.descricao || row.nome || 'Parâmetro do template disponível no parser da API.'), 'template')
				}
			}
		}
	}

	return NextResponse.json({ data: { variaveis: Array.from(tokens.values()) } })
}
