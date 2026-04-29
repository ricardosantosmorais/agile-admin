import { NextResponse } from 'next/server'
import { agileV2Fetch, painelb2bFetch } from '@/app/api/consultas/_shared'
import { getAgilePayloadMessage } from '@/app/api/erp-cadastros/_shared'
import { buildSqlQueryPagination, normalizeSqlQueryRows } from '@/src/features/editor-sql/services/sql-editor-mappers'
import { asArray, asRecord } from '@/src/lib/api-payload'

type ApiRow = Record<string, unknown>

export function toStringValue(value: unknown) {
	return String(value ?? '').trim()
}

export function toBool(value: unknown, fallback = false) {
	const normalized = toStringValue(value).toLowerCase()
	if (!normalized) return fallback
	return ['1', 'true', 'sim', 'yes'].includes(normalized)
}

export function jsonError(payload: unknown, fallback: string, status = 400) {
	return NextResponse.json({ message: getAgilePayloadMessage(payload, fallback) }, { status })
}

export async function fetchRows(resource: string, query: Record<string, string | number | boolean | null | undefined>) {
	const result = await agileV2Fetch(resource, { method: 'GET', query })
	if (!result.ok) {
		throw new Error(getAgilePayloadMessage(result.payload, `Não foi possível carregar ${resource}.`))
	}
	return asArray<ApiRow>(asRecord(result.payload).data)
}

export async function fetchFirst(resource: string, query: Record<string, string | number | boolean | null | undefined>) {
	return (await fetchRows(resource, { perpage: 1, ...query })).at(0) || {}
}

export async function postResource(resource: string, body: ApiRow, fallback: string) {
	const result = await agileV2Fetch(resource, { method: 'POST', body: body as Record<string, string | number | boolean | null | undefined> })
	if (!result.ok) {
		throw new Error(getAgilePayloadMessage(result.payload, fallback))
	}
	const payload = asRecord(result.payload)
	return asArray<ApiRow>(payload.data).at(0) || payload
}

function extractRows(payload: unknown) {
	const record = asRecord(payload)
	if (Array.isArray(payload)) return payload as ApiRow[]
	if (Array.isArray(record.data)) return record.data as ApiRow[]
	if (Array.isArray(record.aaData)) return record.aaData as ApiRow[]
	if (Array.isArray(record.items)) return record.items as ApiRow[]
	return []
}

export async function loadTabela(idTabela: string) {
	const tabela = await fetchFirst('tabelas', { id: idTabela })
	if (!Object.keys(tabela).length) throw new Error('Interface de consulta não encontrada.')
	return tabela
}

export async function loadEmpresa(idEmpresa: string) {
	const empresa = await fetchFirst('empresas', { id: idEmpresa })
	if (!Object.keys(empresa).length) throw new Error('Empresa não encontrada.')
	return empresa
}

export async function loadEmpresasExecucaoLookup(idTemplate: string, idEmpresaPreferida = '') {
	if (idEmpresaPreferida) {
		const empresa = await loadEmpresa(idEmpresaPreferida)
		return [{ value: toStringValue(empresa.id), text: toStringValue(empresa.nome_fantasia || empresa.razao_social || empresa.id) }]
	}
	if (!idTemplate) return []
	const rows = await fetchRows('empresas', { perpage: 1000, id_template: idTemplate, order: 'nome_fantasia,razao_social', sort: 'asc,asc' })
	return rows.map((row) => ({
		value: toStringValue(row.id),
		text: toStringValue(row.nome_fantasia || row.razao_social || row.id),
	})).filter((row) => row.value)
}

export async function loadTemplatesLookup() {
	return (await fetchRows('templates', { perpage: 1000, order: 'nome', sort: 'asc' })).map((row) => ({
		value: toStringValue(row.id),
		label: toStringValue(row.nome || row.descricao || row.id),
	}))
}

export async function loadQueriesLookup(idTemplate: string) {
	if (!idTemplate) return []
	return (await fetchRows('querys', { perpage: 1000, id_template: idTemplate, order: 'nome', sort: 'asc' })).map((row) => ({
		value: toStringValue(row.id),
		label: queryLabel(row),
		id_tabela: toStringValue(row.id_tabela),
	}))
}

export async function loadQueryRow(idQuery: string) {
	if (!idQuery) return {}
	return fetchFirst('querys', { id: idQuery })
}

export async function loadQueryAliases(idQuery: string) {
	if (!idQuery) return []
	const result = await painelb2bFetch('query_campos', { method: 'GET', query: { perpage: 1000, id_query: idQuery } })
	if (!result.ok) return []
	const aliases: string[] = []
	const seen = new Set<string>()
	for (const row of extractRows(result.payload)) {
		const alias = [row.nome_alias, row.alias, row.campo, row.nome].map(toStringValue).find(Boolean) || ''
		const normalized = alias.toLowerCase()
		if (!alias || seen.has(normalized)) continue
		seen.add(normalized)
		aliases.push(alias)
	}
	return aliases
}

export async function loadEditorSqlVariaveis(idEmpresa: string) {
	if (!idEmpresa) return { raw: [], tabelas: [], parametros: [] }
	const result = await painelb2bFetch('agilesync_editorsqlvariaveis', {
		method: 'GET',
		query: { id_empresa: idEmpresa, id_servico: 0, perpage: 100000 },
	})
	if (!result.ok) return { raw: [], tabelas: [], parametros: [] }
	const raw = extractRows(result.payload)
	const tabelas: ApiRow[] = []
	const parametros: ApiRow[] = []
	for (const row of raw) {
		const parentId = toStringValue(row.parentId).toLowerCase()
		if (parentId === 'tabela') {
			tabelas.push({ nome: toStringValue(row.nome) })
		}
		if (parentId === 'parametro') {
			parametros.push({
				nome: toStringValue(row.nome),
				descricao: toStringValue(row.descricao),
				valor: toStringValue(row.valor),
				obrigatorio: toBool(row.obrigatorio),
				chave_primaria: toBool(row.chave_primaria),
			})
		}
	}
	return { raw, tabelas, parametros }
}

function normalizeAliasName(aliasRaw: unknown) {
	let alias = toStringValue(aliasRaw)
	if (!alias) return ''
	const first = alias.at(0)
	const last = alias.at(-1)
	if ((first === '"' && last === '"') || (first === "'" && last === "'") || (first === '`' && last === '`') || (first === '[' && last === ']')) {
		alias = alias.slice(1, -1)
	}
	return alias.trim()
}

function splitSqlExpressions(text: string, separator: 'comma' | 'space') {
	const parts: string[] = []
	let buffer = ''
	let depth = 0
	let inSingleQuote = false
	let inDoubleQuote = false
	for (let index = 0; index < text.length; index += 1) {
		const char = text[index]
		const previous = index > 0 ? text[index - 1] : ''
		if (char === "'" && !inDoubleQuote && previous !== '\\') {
			inSingleQuote = !inSingleQuote
			buffer += char
			continue
		}
		if (char === '"' && !inSingleQuote && previous !== '\\') {
			inDoubleQuote = !inDoubleQuote
			buffer += char
			continue
		}
		if (!inSingleQuote && !inDoubleQuote) {
			if (char === '(') depth += 1
			else if (char === ')' && depth > 0) depth -= 1
			else if (separator === 'comma' && char === ',' && depth === 0) {
				if (buffer.trim()) parts.push(buffer.trim())
				buffer = ''
				continue
			} else if (separator === 'space' && /\s/.test(char) && depth === 0) {
				if (buffer.trim()) parts.push(buffer.trim())
				buffer = ''
				continue
			}
		}
		buffer += char
	}
	if (buffer.trim()) parts.push(buffer.trim())
	return parts
}

function extractAliasFromExpression(expressionRaw: string) {
	const expression = expressionRaw.trim()
	if (!expression) return ''
	const explicitMatch = expression.match(/\s+AS\s+("([^"]+)"|`([^`]+)`|\[([^\]]+)\]|'([^']+)'|([a-zA-Z_][a-zA-Z0-9_$.]*))\s*$/i)
	if (explicitMatch) {
		return normalizeAliasName(explicitMatch.slice(2).find(Boolean) || '')
	}
	const tokens = splitSqlExpressions(expression, 'space')
	if (tokens.length < 2) return ''
	const candidate = normalizeAliasName(tokens.at(-1))
	if (!candidate) return ''
	const reservedWords = new Set(['all', 'and', 'asc', 'between', 'by', 'case', 'decode', 'desc', 'distinct', 'else', 'end', 'false', 'from', 'group', 'having', 'in', 'is', 'join', 'like', 'not', 'null', 'on', 'or', 'order', 'over', 'partition', 'rownum', 'select', 'then', 'true', 'when', 'where'])
	if (reservedWords.has(candidate.toLowerCase())) return ''
	const prefixTokens = tokens.slice(0, -1)
	if (prefixTokens.length === 1 && prefixTokens[0].toLowerCase() === 'distinct') return ''
	return candidate
}

export function extractAliasesFromQuerySql(sql: string) {
	const selectMatch = sql.match(/\bSELECT\b([\s\S]*?)\bFROM\b/i)
	const selectClause = selectMatch?.[1] || ''
	if (!selectClause.trim()) return []
	const aliases: string[] = []
	const seen = new Set<string>()
	for (const expression of splitSqlExpressions(selectClause, 'comma')) {
		const alias = extractAliasFromExpression(expression)
		const normalized = alias.toLowerCase()
		if (!alias || seen.has(normalized)) continue
		seen.add(normalized)
		aliases.push(alias)
	}
	return aliases
}

async function collectQueryAliases(idQuery: string, sql: string) {
	if (sql.trim()) return extractAliasesFromQuerySql(sql)
	if (idQuery) {
		const aliases = await loadQueryAliases(idQuery)
		if (aliases.length) return aliases
		const query = await loadQueryRow(idQuery)
		return extractAliasesFromQuerySql(toStringValue(query.query))
	}
	return []
}

export async function buildAliasValidation(idTabela: string, idQuery = '', sql = '') {
	const [campos, aliases] = await Promise.all([loadCampos(idTabela), collectQueryAliases(idQuery, sql)])
	const aliasMap = new Map<string, string>()
	for (const alias of aliases) {
		const normalized = normalizeAliasName(alias).toLowerCase()
		if (!normalized || aliasMap.has(normalized)) continue
		aliasMap.set(normalized, alias)
	}
	const fieldMap = new Map<string, string>()
	for (const campo of campos) {
		const name = toStringValue(campo.nome)
		if (name) fieldMap.set(name.toLowerCase(), name)
	}
	const matchedFields: string[] = []
	const missingFields: string[] = []
	const extraAliases: string[] = []
	for (const [normalized, name] of fieldMap) {
		if (aliasMap.has(normalized)) matchedFields.push(name)
		else missingFields.push(name)
	}
	for (const [normalized, alias] of aliasMap) {
		if (!fieldMap.has(normalized)) extraAliases.push(alias)
	}
	const sorter = (left: string, right: string) => left.localeCompare(right, undefined, { sensitivity: 'base', numeric: true })
	return {
		ok: aliases.length > 0 && missingFields.length === 0,
		aliases: Array.from(aliasMap.values()),
		campos_interface: Array.from(fieldMap.values()),
		matched_fields: matchedFields.sort(sorter),
		missing_fields: missingFields.sort(sorter),
		extra_aliases: extraAliases.sort(sorter),
		query_id: Number(idQuery || 0),
	}
}

export async function buildQueryEditorPayload(idTemplate: string, idEmpresaAlvo = '', idEmpresaExecucao = '', idQuery = '') {
	const empresasExecucao = await loadEmpresasExecucaoLookup(idTemplate, idEmpresaAlvo)
	const selectedEmpresaExecucao = idEmpresaExecucao || toStringValue(empresasExecucao.at(0)?.value)
	const [query, aliases, variaveis, queries] = await Promise.all([
		loadQueryRow(idQuery),
		loadQueryAliases(idQuery),
		loadEditorSqlVariaveis(selectedEmpresaExecucao),
		loadQueriesLookup(idTemplate),
	])
	return {
		fonte_dados: 'erp',
		empresa_execucao_id: selectedEmpresaExecucao,
		empresas_execucao: empresasExecucao,
		query,
		aliases,
		variaveis,
		queries,
		id_template: idTemplate,
	}
}

export async function executeQueryEditor(idEmpresaExecucao: string, fonteDados: string, sql: string) {
	if (!idEmpresaExecucao) throw new Error('Selecione a empresa para executar a query.')
	if (!sql.trim()) throw new Error('Informe a query SQL para executar.')
	const result = await painelb2bFetch('agilesync_editorsql', {
		method: 'POST',
		body: {
			id_empresa: idEmpresaExecucao,
			fonte_dados: fonteDados || 'erp',
			sql,
			id_usuario: '',
			page: 1,
			perpage: 100,
			limit: 100,
			offset: 0,
			start: 0,
			length: 100,
			include_total: 1,
		},
	})
	if (!result.ok) throw new Error(getAgilePayloadMessage(result.payload, 'Não foi possível executar a query.'))
	const executionPayload = asRecord(result.payload)
	if (toStringValue(executionPayload.status).toLowerCase() === 'erro') {
		throw new Error(toStringValue(executionPayload.Exception || executionPayload.exception) || 'A execução da query retornou erro.')
	}
	const rows = normalizeSqlQueryRows(result.payload)
	return { raw: result.payload, rows, pagination: buildSqlQueryPagination(result.payload, 1, 100, rows) }
}

export async function loadGatewaysLookup(idTemplate: string) {
	if (!idTemplate) return []
	return (await fetchRows('gateways', { perpage: 1000, id_template: idTemplate, order: 'nome', sort: 'asc' })).map((row) => ({
		value: toStringValue(row.id),
		label: toStringValue(row.nome || row.id),
	}))
}

export async function loadEndpointsLookup(idTemplate: string, idTabela?: string) {
	if (!idTemplate) return []
	const rows = await fetchRows('gateways_endpoints', {
		perpage: 1000,
		join: 'gateways:id_template,nome',
		'gateways.id_template': idTemplate,
		'tipo:ne': 'autenticacao',
		...(idTabela ? { id_tabela: idTabela } : {}),
		order: 'id',
		sort: 'desc',
	})
	return rows.map((row) => ({ value: toStringValue(row.id), label: endpointLabel(row) }))
}

export async function loadCampos(idTabela: string) {
	return (await fetchRows('tabelas_campos', { perpage: 1000, id_tabela: idTabela, order: 'nome', sort: 'asc' })).map((row) => ({
		id_tabela_campo: toStringValue(row.id),
		nome: toStringValue(row.nome),
		tipo: toStringValue(row.tipo),
	}))
}

export async function loadEndpoint(idEndpoint: string) {
	if (!idEndpoint) return {}
	return fetchFirst('gateways_endpoints', { id: idEndpoint, join: 'gateways:id_template,nome' })
}

export async function loadEndpointEmpresa(idEmpresa: string, idEndpoint: string) {
	if (!idEmpresa || !idEndpoint) return {}
	return fetchFirst('gateways_endpoints_empresas', { id_empresa: idEmpresa, id_gateway_endpoint: idEndpoint })
}

export function mergeEndpoint(base: ApiRow, company: ApiRow) {
	return { ...base, ...Object.fromEntries(Object.entries(company).filter(([, value]) => value !== undefined && value !== null && value !== '')) }
}

export async function loadConsultaMaps(idEndpoint: string, idTabela: string) {
	if (!idEndpoint) return []
	const campos = new Map((await loadCampos(idTabela)).map((row) => [row.id_tabela_campo, row]))
	return (await fetchRows('gateways_endpoints_campos_consulta', { perpage: 1000, id_gateway_endpoint: idEndpoint, order: 'id', sort: 'asc' })).map((row) => {
		const campo = campos.get(toStringValue(row.id_tabela_campo))
		return { ...row, campo_nome: campo?.nome || '', campo_tipo: campo?.tipo || '' }
	})
}

export async function loadRetornoMaps(idEndpoint: string, idTabela: string) {
	if (!idEndpoint) return []
	const campos = new Map((await loadCampos(idTabela)).map((row) => [row.id_tabela_campo, row]))
	return (await fetchRows('gateways_endpoints_campos_retorno', { perpage: 1000, id_gateway_endpoint: idEndpoint, order: 'id', sort: 'asc' })).map((row) => {
		const campo = campos.get(toStringValue(row.id_tabela_campo))
		return { ...row, campo_nome: campo?.nome || '', campo_tipo: campo?.tipo || '' }
	})
}

export function queryLabel(row: ApiRow) {
	const id = toStringValue(row.id || row.id_query)
	const nome = toStringValue(row.nome || row.query_nome)
	return id ? `#${id}${nome ? ` - ${nome}` : ''}` : nome || '-'
}

export function endpointLabel(row: ApiRow) {
	const id = toStringValue(row.id || row.id_gateway_endpoint)
	const endpoint = toStringValue(row.endpoint || row['gateways_endpoints.endpoint'])
	return id ? `#${id}${endpoint ? ` - ${endpoint}` : ''}` : endpoint || '-'
}

export async function buildTemplateLinks(idTabela: string) {
	const [templates, queryRows, endpointRows] = await Promise.all([
		loadTemplatesLookup(),
		fetchRows('querys', { perpage: 1000, id_tabela: idTabela, ativo: true, order: 'id', sort: 'desc' }),
		fetchRows('gateways_endpoints', { perpage: 1000, id_tabela: idTabela, join: 'gateways:id_template,nome', 'tipo:ne': 'autenticacao', order: 'id', sort: 'desc' }),
	])
	const templateNames = new Map(templates.map((item) => [item.value, item.label]))
	const byTemplate = new Map<string, ApiRow>()

	for (const row of queryRows) {
		const templateId = toStringValue(row.id_template)
		if (!templateId || byTemplate.get(templateId)?.id_query) continue
		byTemplate.set(templateId, {
			id_template: templateId,
			template: templateNames.get(templateId) || `Template #${templateId}`,
			effective_source: 'query',
			id_query: toStringValue(row.id),
			query_label: queryLabel(row),
			id_gateway_endpoint: '',
			endpoint_label: '',
		})
	}
	for (const row of endpointRows) {
		const templateId = toStringValue(row['gateways.id_template'] || row.id_template)
		if (!templateId || byTemplate.get(templateId)?.id_gateway_endpoint) continue
		const current = byTemplate.get(templateId)
		byTemplate.set(templateId, {
			id_template: templateId,
			template: templateNames.get(templateId) || `Template #${templateId}`,
			effective_source: current?.effective_source || 'endpoint_gateway',
			id_query: current?.id_query || '',
			query_label: current?.query_label || '',
			id_gateway_endpoint: toStringValue(row.id),
			endpoint_label: endpointLabel(row),
		})
	}
	return Array.from(byTemplate.values()).sort((a, b) => toStringValue(a.template).localeCompare(toStringValue(b.template)))
}

export async function buildOverrideLinks(idTabela: string) {
	const [queryRows, endpointRows] = await Promise.all([
		fetchRows('querys_tabelas_empresas', { perpage: 1000, id_tabela: idTabela, join: 'empresas:nome_fantasia,razao_social,id_template' }),
		fetchRows('gateways_endpoints_tabelas_empresas', { perpage: 1000, id_tabela: idTabela, join: 'empresas:nome_fantasia,razao_social,id_template|gateways_endpoints:endpoint,id' }),
	])
	const byEmpresa = new Map<string, ApiRow>()
	for (const row of queryRows) {
		const idEmpresa = toStringValue(row.id_empresa)
		if (!idEmpresa) continue
		byEmpresa.set(idEmpresa, {
			id_empresa: idEmpresa,
			empresa: toStringValue(row['empresas.nome_fantasia'] || row['empresas.razao_social'] || row.nome_fantasia || idEmpresa),
			template: row['empresas.id_template'] ? `#${toStringValue(row['empresas.id_template'])}` : '',
			id_template: toStringValue(row['empresas.id_template']),
			effective_source: 'query',
			query_label: `#${toStringValue(row.id_query)}`,
			endpoint_label: '',
			ativo: true,
			observacao: '',
		})
	}
	for (const row of endpointRows) {
		const idEmpresa = toStringValue(row.id_empresa)
		if (!idEmpresa) continue
		const current = byEmpresa.get(idEmpresa)
		byEmpresa.set(idEmpresa, {
			id_empresa: idEmpresa,
			empresa: toStringValue(row['empresas.nome_fantasia'] || row['empresas.razao_social'] || row.nome_fantasia || idEmpresa),
			template: row['empresas.id_template'] ? `#${toStringValue(row['empresas.id_template'])}` : current?.template || '',
			id_template: toStringValue(row['empresas.id_template'] || current?.id_template),
			effective_source: current?.effective_source || 'endpoint_gateway',
			query_label: current?.query_label || '',
			endpoint_label: endpointLabel({ id: row.id_gateway_endpoint, endpoint: row['gateways_endpoints.endpoint'] }),
			ativo: toBool(row.ativo, true),
			observacao: toStringValue(row.observacao),
		})
	}
	return Array.from(byEmpresa.values()).sort((a, b) => toStringValue(a.empresa).localeCompare(toStringValue(b.empresa)))
}

export async function resolveConfiguration(idTabela: string, idEmpresa: string) {
	const empresa = await loadEmpresa(idEmpresa)
	const idTemplate = toStringValue(empresa.id_template)
	const templateName = toStringValue(empresa.nome_template || empresa['templates.nome'])
	const [queryOverride, queryPadrao, gatewayOverride, gatewayPadrao] = await Promise.all([
		fetchFirst('querys_tabelas_empresas', { id_empresa: idEmpresa, id_tabela: idTabela, order: 'id', sort: 'desc' }),
		fetchFirst('querys', { id_template: idTemplate, id_tabela: idTabela, ativo: true, order: 'id', sort: 'desc' }),
		fetchFirst('gateways_endpoints_tabelas_empresas', { id_empresa: idEmpresa, id_tabela: idTabela, order: 'id', sort: 'desc' }),
		fetchFirst('gateways_endpoints', { id_tabela: idTabela, join: 'gateways:id_template,nome', 'gateways.id_template': idTemplate, 'tipo:ne': 'autenticacao', order: 'id', sort: 'desc' }),
	])

	let tipoFonte = ''
	let camadaResolucao = ''
	let gatewayResolvido: ApiRow = {}
	let queryResolvida: ApiRow = {}
	if (toStringValue(queryOverride.id_query)) {
		tipoFonte = 'query'
		camadaResolucao = 'querys_tabelas_empresas'
		queryResolvida = await fetchFirst('querys', { id: toStringValue(queryOverride.id_query) })
	} else if (toStringValue(gatewayOverride.id_gateway_endpoint) && toBool(gatewayOverride.ativo, true)) {
		tipoFonte = 'endpoint_gateway'
		camadaResolucao = 'gateways_endpoints_tabelas_empresas'
		const base = await loadEndpoint(toStringValue(gatewayOverride.id_gateway_endpoint))
		gatewayResolvido = mergeEndpoint(base, await loadEndpointEmpresa(idEmpresa, toStringValue(base.id)))
	} else if (toStringValue(queryPadrao.id)) {
		tipoFonte = 'query'
		camadaResolucao = 'querys'
		queryResolvida = queryPadrao
	} else if (toStringValue(gatewayPadrao.id)) {
		tipoFonte = 'endpoint_gateway'
		camadaResolucao = 'gateways_endpoints'
		gatewayResolvido = mergeEndpoint(gatewayPadrao, await loadEndpointEmpresa(idEmpresa, toStringValue(gatewayPadrao.id)))
	}

	const consultaMaps = tipoFonte === 'endpoint_gateway' ? await loadConsultaMaps(toStringValue(gatewayResolvido.id), idTabela) : []
	const retornoMaps = tipoFonte === 'endpoint_gateway' ? await loadRetornoMaps(toStringValue(gatewayResolvido.id), idTabela) : []

	return {
		empresa,
		template: { id: idTemplate, text: templateName || `#${idTemplate}` },
		query_padrao: Object.keys(queryPadrao).length ? { ...queryPadrao, label: queryLabel(queryPadrao) } : {},
		query_override: Object.keys(queryOverride).length ? { ...queryOverride, query: queryResolvida, label: queryLabel(queryResolvida || queryOverride) } : {},
		gateway_padrao: Object.keys(gatewayPadrao).length ? { ...gatewayPadrao, gateway_endpoint: gatewayPadrao, label: endpointLabel(gatewayPadrao) } : {},
		gateway_override: Object.keys(gatewayOverride).length ? { ...gatewayOverride, gateway_endpoint: gatewayResolvido, label: endpointLabel(gatewayResolvido), observacao: toStringValue(gatewayOverride.observacao) } : {},
		resolucao: {
			tipo_fonte: tipoFonte,
			camada_resolucao: camadaResolucao,
			query: queryResolvida,
			gateway_endpoint: gatewayResolvido,
			consulta_maps: consultaMaps,
			retorno_maps: retornoMaps,
		},
	}
}

export async function runPreview(resolvedConfig: ApiRow, queryString: string) {
	const resolucao = asRecord(resolvedConfig.resolucao)
	const endpoint = asRecord(resolucao.gateway_endpoint)
	if (!toStringValue(endpoint.id_gateway)) {
		throw new Error('Endpoint gateway não encontrado para o preview.')
	}
	const previewBody = {
		modo: 'gateway_endpoint_preview_form',
		id_empresa: toStringValue(asRecord(resolvedConfig.empresa).codigo || asRecord(resolvedConfig.empresa).id),
		variaveis: [],
		query_string: queryString,
		gateway_endpoint: {
			id_gateway: Number(endpoint.id_gateway || 0),
			endpoint: toStringValue(endpoint.endpoint),
			verbo: toStringValue(endpoint.verbo),
			parametros: toStringValue(endpoint.parametros),
			url_filtro: toStringValue(endpoint.url_filtro),
			body: toStringValue(endpoint.body),
			data_array: toStringValue(endpoint.data_array),
			tipo_paginacao: toStringValue(endpoint.tipo_paginacao),
			nome_propriedade_por_pagina: toStringValue(endpoint.nome_propriedade_por_pagina),
			quantidade_por_pagina: Number(endpoint.quantidade_por_pagina || 0),
			nome_propriedade_pagina: toStringValue(endpoint.nome_propriedade_pagina),
			nome_retorno_pagina_atual: toStringValue(endpoint.nome_retorno_pagina_atual),
			nome_retorno_total_paginas: toStringValue(endpoint.nome_retorno_total_paginas),
		},
	}
	const result = await painelb2bFetch('agilesync_rest_consultas', {
		method: 'POST',
		body: previewBody as unknown as Record<string, string | number | boolean | null | undefined>,
	})
	if (!result.ok) throw new Error(getAgilePayloadMessage(result.payload, 'Falha ao executar o preview.'))
	return result.payload
}
