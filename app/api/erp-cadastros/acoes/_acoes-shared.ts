import { createHash } from 'crypto'
import { agileV2Fetch } from '@/app/api/consultas/_shared'
import { asArray, asRecord } from '@/src/lib/api-payload'

export function normalizeBooleanValue(value: unknown, fallback = false) {
	if (value === null || value === undefined || value === '') return fallback
	if (typeof value === 'boolean') return value
	if (typeof value === 'number') return value === 1
	const normalized = String(value).trim().toLowerCase()
	return ['1', 'true', 'on', 'sim', 'yes', 'y'].includes(normalized)
}

export function nullableInt(value: unknown) {
	if (value === null || value === undefined) return null
	const normalized = String(value).trim()
	if (!normalized) return null
	const parsed = Number(normalized)
	return Number.isFinite(parsed) ? parsed : null
}

export function nullableText(value: unknown) {
	if (value === null || value === undefined) return null
	const normalized = String(value).trim()
	return normalized ? normalized : null
}

export function md5(value: string) {
	return createHash('md5').update(value).digest('hex')
}

export function getFirstRow(payload: unknown) {
	return asArray<Record<string, unknown>>(asRecord(payload).data).at(0) || null
}

export async function fetchCatalogMap(resource: 'templates' | 'gateways' | 'gateways_endpoints' | 'empresas', labelField: string, order = labelField) {
	const result = await agileV2Fetch(resource, { method: 'GET', query: { perpage: 10000, order, sort: 'asc' } })
	const map: Record<string, string> = {}
	if (!result.ok) return map
	for (const row of asArray<Record<string, unknown>>(asRecord(result.payload).data)) {
		const id = String(row.id ?? '').trim()
		if (!id) continue
		const label = String(row[labelField] ?? row.nome ?? row.nome_fantasia ?? '').trim()
		map[id] = label || `#${id}`
	}
	return map
}

export async function enrichAcaoRows(rows: Record<string, unknown>[]): Promise<Record<string, unknown>[]> {
	const [templatesMap, gatewaysMap] = await Promise.all([
		fetchCatalogMap('templates', 'nome', 'nome'),
		fetchCatalogMap('gateways', 'nome', 'nome'),
	])
	return rows.map((row) => {
		const templateId = String(row.id_template ?? '').trim()
		const gatewayId = String(row.id_gateway ?? '').trim()
		const templateName = String(row.template_nome || row['templates.nome'] || templatesMap[templateId] || (templateId ? `#${templateId}` : '')).trim()
		const gatewayName = String(row.gateway_nome || row['gateways.nome'] || gatewaysMap[gatewayId] || (gatewayId ? `#${gatewayId}` : '')).trim()
		return {
			...row,
			template_nome: templateName,
			gateway_nome: gatewayName,
			'templates.nome': templateName,
			'gateways.nome': gatewayName,
			ativo: normalizeBooleanValue(row.ativo, true),
		}
	})
}

export async function enrichDetailRows(rows: Record<string, unknown>[]): Promise<Record<string, unknown>[]> {
	const [gatewaysMap, endpointsMap] = await Promise.all([
		fetchCatalogMap('gateways', 'nome', 'nome'),
		fetchCatalogMap('gateways_endpoints', 'endpoint', 'endpoint'),
	])
	return rows.map((row) => {
		const gatewayId = String(row.id_gateway ?? '').trim()
		const gatewayExecucaoId = String(row.id_gateway_execucao ?? '').trim()
		const endpointExecucaoId = String(row.id_gateway_endpoint_execucao ?? '').trim()
		const endpointEmbedId = String(row.id_gateway_endpoint_embed ?? '').trim()
		const endpointExecucaoNome = endpointsMap[endpointExecucaoId] || ''
		const endpointEmbedNome = endpointsMap[endpointEmbedId] || ''
		return {
			...row,
			gateway_nome: gatewayId ? gatewaysMap[gatewayId] || `#${gatewayId}` : '',
			gateway_execucao_nome: gatewayExecucaoId ? gatewaysMap[gatewayExecucaoId] || `#${gatewayExecucaoId}` : '',
			gateway_endpoint_execucao_nome: endpointExecucaoId ? endpointExecucaoNome || `#${endpointExecucaoId}` : '',
			gateway_endpoint_embed_nome: endpointEmbedId ? endpointEmbedNome || `#${endpointEmbedId}` : '',
			ativo: normalizeBooleanValue(row.ativo, true),
		}
	})
}

export async function enrichOverrideRows(rows: Record<string, unknown>[]): Promise<Record<string, unknown>[]> {
	const [empresasMap, endpointsMap] = await Promise.all([
		fetchCatalogMap('empresas', 'nome_fantasia', 'nome_fantasia'),
		fetchCatalogMap('gateways_endpoints', 'endpoint', 'endpoint'),
	])
	return rows.map((row) => {
		const empresaId = String(row.id_empresa ?? '').trim()
		const endpointEmbedId = String(row.id_gateway_endpoint_embed ?? '').trim()
		return {
			...row,
			empresa_nome: empresaId ? empresasMap[empresaId] || `Empresa #${empresaId}` : '',
			gateway_endpoint_embed_nome: endpointEmbedId ? endpointsMap[endpointEmbedId] || `#${endpointEmbedId}` : '',
			ativo: normalizeBooleanValue(row.ativo, true),
		}
	})
}

export function buildDetailPayload(body: Record<string, unknown>, idAcao: string) {
	const script = String(body.script || '').trim()
	const scriptRetorno = nullableText(body.script_retorno)
	const scriptEmbed = nullableText(body.script_embed)
	const payload: Record<string, string | number | boolean | null | undefined> = {
		id_acao: Number(idAcao),
		ordem: Number(body.ordem),
		tipo_objeto: String(body.tipo_objeto || '').trim(),
		linguagem: String(body.linguagem || '').trim(),
		tipo_execucao: String(body.tipo_execucao || '').trim(),
		script,
		script_hash: md5(script),
		script_retorno: scriptRetorno,
		script_retorno_hash: scriptRetorno ? md5(scriptRetorno) : null,
		script_embed: scriptEmbed,
		script_embed_hash: scriptEmbed ? md5(scriptEmbed) : null,
		id_gateway: nullableInt(body.id_gateway),
		id_gateway_execucao: nullableInt(body.id_gateway_execucao),
		id_gateway_endpoint_execucao: nullableInt(body.id_gateway_endpoint_execucao),
		id_gateway_endpoint_embed: nullableInt(body.id_gateway_endpoint_embed),
		nome_objeto: nullableText(body.nome_objeto),
		saida_objeto: nullableText(body.saida_objeto),
		ativo: normalizeBooleanValue(body.ativo, true),
	}
	const id = nullableInt(body.id)
	if (id) payload.id = id
	return payload
}

export function buildOverridePayload(body: Record<string, unknown>, detailId: string, fallbackUserId?: string) {
	const script = String(body.script || '').trim()
	const scriptRetorno = nullableText(body.script_retorno)
	const scriptEmbed = nullableText(body.script_embed)
	const empresaId = Number(body.id_empresa_alvo || body.id_empresa)
	const scriptHash = md5(script)
	const retornoHash = scriptRetorno ? md5(scriptRetorno) : null
	const embedHash = scriptEmbed ? md5(scriptEmbed) : null
	const payload: Record<string, string | number | boolean | null | undefined> = {
		id_acao_detalhe: Number(detailId),
		id_empresa: empresaId,
		linguagem: String(body.linguagem || '').trim(),
		id_usuario: String(body.id_usuario || fallbackUserId || '').trim() || null,
		id_gateway_endpoint_embed: nullableInt(body.id_gateway_endpoint_embed),
		script,
		script_hash: scriptHash,
		script_retorno: scriptRetorno,
		script_retorno_hash: retornoHash,
		script_embed: scriptEmbed,
		script_embed_hash: embedHash,
		hash: md5(`${empresaId}|${detailId}|${scriptHash}|${retornoHash || ''}|${embedHash || ''}`),
		observacao: String(body.observacao || ''),
		data_hora: new Date().toISOString().slice(0, 19).replace('T', ' '),
		ativo: normalizeBooleanValue(body.ativo, true),
	}
	const id = nullableInt(body.id)
	if (id) payload.id = id
	return payload
}
