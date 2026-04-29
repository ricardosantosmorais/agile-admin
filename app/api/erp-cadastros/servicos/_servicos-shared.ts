import { agileV2Fetch, painelb2bFetch } from '@/app/api/consultas/_shared'
import { asArray, asRecord } from '@/src/lib/api-payload'

type ApiRow = Record<string, unknown>

export function toStringValue(value: unknown) {
	return String(value ?? '').trim()
}

export function toBool(value: unknown, fallback = false) {
	if (value === null || value === undefined || value === '') return fallback
	if (typeof value === 'boolean') return value
	if (typeof value === 'number') return value === 1
	return ['1', 'true', 'sim', 'on', 'yes'].includes(String(value).trim().toLowerCase())
}

export async function fetchRows(resource: string, query: Record<string, string | number | boolean | null | undefined>) {
	const result = await agileV2Fetch(resource, { method: 'GET', query })
	if (!result.ok) return []
	return asArray<ApiRow>(asRecord(result.payload).data)
}

export async function fetchFirst(resource: string, query: Record<string, string | number | boolean | null | undefined>) {
	return fetchRows(resource, { perpage: 1, ...query }).then((rows) => rows[0] || {})
}

function optionLabel(row: ApiRow, primary: string, fallback = 'nome') {
	const id = toStringValue(row.id)
	const label = toStringValue(row[primary] || row[fallback] || id)
	return { id, label }
}

export async function resolveServicoLabels(row: ApiRow) {
	const normalized = { ...row }
	const tipoObjeto = toStringValue(row.tipo_objeto)
	const idObjeto = toStringValue(row.id_objeto)
	const idGatewayEndpoint = toStringValue(row.id_gateway_endpoint || row.id_gateway_endpoint_fallback)

	if (idObjeto) {
		if (tipoObjeto === 'query') {
			const query = await fetchFirst('querys', { id: idObjeto })
			normalized.objeto_nome = toStringValue(query.nome) || idObjeto
		} else if (tipoObjeto === 'acao') {
			const acao = await fetchFirst('acoes', { id: idObjeto })
			normalized.objeto_nome = toStringValue(acao.nome) || idObjeto
		} else if (tipoObjeto === 'endpoint_gateway') {
			const endpoint = await fetchFirst('gateways_endpoints', { id: idObjeto, join: 'gateways:nome,id_template,id' })
			const gatewayNome = toStringValue(endpoint['gateways.nome'])
			const endpointNome = toStringValue(endpoint.endpoint) || idObjeto
			normalized.objeto_nome = gatewayNome ? `${endpointNome} (${gatewayNome})` : endpointNome
		}
	}

	if (idGatewayEndpoint) {
		const endpoint = await fetchFirst('gateways_endpoints', { id: idGatewayEndpoint, join: 'gateways:nome,id_template,id' })
		const gatewayNome = toStringValue(endpoint['gateways.nome'])
		const endpointNome = toStringValue(endpoint.endpoint) || idGatewayEndpoint
		normalized.gateway_endpoint_nome = gatewayNome ? `${endpointNome} (${gatewayNome})` : endpointNome
	}

	return normalized
}

export async function loadServicoObjectOptions(tipoObjeto: string, idTemplate: string, q: string, page: string, perPage: string) {
	const query: Record<string, string> = { page, perpage: perPage, sort: 'asc' }
	let resource = ''
	let labelField = 'nome'

	if (tipoObjeto === 'query') {
		resource = 'querys'
		query.order = 'nome'
		if (idTemplate) query.id_template = idTemplate
		if (q) query['nome:lk'] = q
	} else if (tipoObjeto === 'acao') {
		resource = 'acoes'
		query.order = 'nome'
		if (idTemplate) query.id_template = idTemplate
		if (q) query['nome:lk'] = q
	} else if (tipoObjeto === 'endpoint_gateway') {
		resource = 'gateways_endpoints'
		labelField = 'endpoint'
		query.order = 'endpoint'
		query.join = 'gateways:id,id_template,nome'
		if (idTemplate) query['gateways.id_template'] = idTemplate
		if (q) query['endpoint:lk'] = q
	}

	if (!resource) return []
	const rows = await fetchRows(resource, query)
	return rows.map((row) => {
		const option = optionLabel(row, labelField)
		const gatewayNome = toStringValue(row['gateways.nome'])
		return gatewayNome ? { ...option, label: `${option.label} (${gatewayNome})` } : option
	}).filter((option) => option.id)
}

export async function loadServicoGatewayEndpointOptions(idTemplate: string, q: string, page: string, perPage: string) {
	const baseQuery: Record<string, string> = {
		page,
		perpage: perPage,
		order: 'endpoint',
		sort: 'asc',
		join: 'gateways:id,id_template,nome',
	}
	if (q) baseQuery['endpoint:lk'] = q

	const rows: ApiRow[] = []
	const seen = new Set<string>()
	const merge = (nextRows: ApiRow[]) => {
		for (const row of nextRows) {
			const id = toStringValue(row.id)
			if (!id || seen.has(id)) continue
			seen.add(id)
			rows.push(row)
		}
	}

	if (idTemplate) {
		merge(await fetchRows('gateways_endpoints', { ...baseQuery, 'gateways.id_template': idTemplate }))
		merge(await fetchRows('gateways_endpoints', { ...baseQuery, 'gateways.id_template:null': '' }))
	} else {
		merge(await fetchRows('gateways_endpoints', { ...baseQuery, 'gateways.id_template:null': '' }))
	}

	if (!rows.length) {
		const allRows = await fetchRows('gateways_endpoints', baseQuery)
		for (const row of allRows) {
			const rowTemplate = toStringValue(row['gateways.id_template'])
			const allowed = idTemplate ? rowTemplate === '' || rowTemplate === idTemplate : rowTemplate === ''
			if (allowed) merge([row])
		}
	}

	return rows.map((row) => {
		const option = optionLabel(row, 'endpoint')
		const gatewayNome = toStringValue(row['gateways.nome'])
		return gatewayNome ? { ...option, label: `${option.label} (${gatewayNome})` } : option
	}).filter((option) => option.id)
}

export async function loadServicoTableOptions(q: string, page: string, perPage: string) {
	const result = await painelb2bFetch('ecom_tabelas', { method: 'GET', query: { perpage: 10000 } })
	if (!result.ok) return []
	const query = q.trim().toLowerCase()
	const rows = asArray<ApiRow>(asRecord(result.payload).data)
	const filtered = rows
		.map((row) => toStringValue(row.nome))
		.filter(Boolean)
		.filter((nome) => !query || nome.toLowerCase().includes(query))
	const currentPage = Math.max(Number(page) || 1, 1)
	const currentPerPage = Math.max(Number(perPage) || 20, 1)
	return filtered.slice((currentPage - 1) * currentPerPage, currentPage * currentPerPage).map((nome) => ({ id: nome, label: nome }))
}

