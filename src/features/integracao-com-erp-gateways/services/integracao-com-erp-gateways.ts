import type { CrudListFilters, CrudRecord } from '@/src/components/crud-base/types'

export const GATEWAY_AUTH_OPTIONS = ['NoAuth', 'Basic', 'Bearer', 'AWSSignature', 'Token', 'OAuth2', 'OAuth2Winthor', 'None'] as const
export const GATEWAY_VERB_OPTIONS = ['get', 'post', 'put', 'patch', 'delete'] as const
export const GATEWAY_ACCESS_OPTIONS = [
	{ value: 'privado', label: 'Privado' },
	{ value: 'publico', label: 'Público' },
] as const

export function asTrimmedString(value: unknown) {
	return typeof value === 'string' ? value.trim() : String(value ?? '').trim()
}

export function asBoolean(value: unknown) {
	if (typeof value === 'boolean') return value
	const normalized = asTrimmedString(value).toLowerCase()
	return ['1', 'true', 'sim', 'yes', 'on'].includes(normalized)
}

export function normalizeGatewayRecord(record: CrudRecord): CrudRecord {
	const templateId = asTrimmedString(record.id_template)
	const templateName = asTrimmedString(record.template_nome || record['templates.nome'])
	const normalized = {
		...record,
		id: asTrimmedString(record.id),
		nome: asTrimmedString(record.nome),
		tipo_autenticacao: asTrimmedString(record.tipo_autenticacao),
		tipo_verbo: asTrimmedString(record.tipo_verbo).toLowerCase(),
		nivel_acesso: asTrimmedString(record.nivel_acesso).toLowerCase(),
		id_template: templateId,
		id_template_lookup: templateId ? { id: templateId, label: templateName || templateId } : null,
		token: asTrimmedString(record.token),
		usuario: asTrimmedString(record.usuario),
		senha: asTrimmedString(record.senha),
		awsaccesskey: asTrimmedString(record.awsaccesskey),
		awssecretkey: asTrimmedString(record.awssecretkey),
		awsregion: asTrimmedString(record.awsregion),
		awsservicename: asTrimmedString(record.awsservicename),
		json_exemplo: asTrimmedString(record.json_exemplo),
	}
	;(normalized as Record<string, unknown>).url = asTrimmedString(record.url)
	return normalized
}

export function buildGatewayPayload(record: CrudRecord): CrudRecord {
	const payload: CrudRecord = {
		nome: asTrimmedString(record.nome),
		tipo_autenticacao: asTrimmedString(record.tipo_autenticacao),
		tipo_verbo: asTrimmedString(record.tipo_verbo).toLowerCase() || null,
		nivel_acesso: asTrimmedString(record.nivel_acesso).toLowerCase(),
		id_template: asTrimmedString(record.id_template) || null,
		token: asTrimmedString(record.token) || null,
		usuario: asTrimmedString(record.usuario) || null,
		senha: asTrimmedString(record.senha) || null,
		awsaccesskey: asTrimmedString(record.awsaccesskey) || null,
		awssecretkey: asTrimmedString(record.awssecretkey) || null,
		awsregion: asTrimmedString(record.awsregion) || null,
		awsservicename: asTrimmedString(record.awsservicename) || null,
		json_exemplo: asTrimmedString(record.json_exemplo) || null,
	}
	;(payload as Record<string, unknown>).url = asTrimmedString(record.url) || null
	const id = asTrimmedString(record.id)
	if (id) payload.id = id
	return payload
}

export function buildGatewayCollectionParams(filters: CrudListFilters) {
	const params = new URLSearchParams({
		page: String(filters.page || 1),
		perpage: String(filters.perPage || 15),
		order: asTrimmedString(filters.orderBy || 'nome'),
		sort: asTrimmedString(filters.sort || 'asc'),
		join: 'templates:nome,id',
	})

	const id = asTrimmedString(filters.id)
	if (id) params.set('id', id)
	const nome = asTrimmedString(filters['nome::lk'])
	if (nome) params.set('nome:lk', nome)
	const auth = asTrimmedString(filters.tipo_autenticacao)
	if (auth) params.set('tipo_autenticacao', auth)
	const verbo = asTrimmedString(filters.tipo_verbo).toLowerCase()
	if (verbo) params.set('tipo_verbo', verbo)
	const acesso = asTrimmedString(filters.nivel_acesso).toLowerCase()
	if (acesso) params.set('nivel_acesso', acesso)
	const template = asTrimmedString(filters.id_template)
	if (template) params.set('id_template', template)
	return params
}
