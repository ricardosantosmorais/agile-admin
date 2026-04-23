import type { CrudListFilters, CrudRecord } from '@/src/components/crud-base/types'
import { loadCrudLookupOptions } from '@/src/components/crud-base/crud-client'

function asTrimmedString(value: unknown) {
	return typeof value === 'string' ? value.trim() : String(value ?? '').trim()
}

function asNullableString(value: unknown) {
	const normalized = asTrimmedString(value)
	return normalized || null
}

function asBooleanValue(value: unknown) {
	if (typeof value === 'boolean') {
		return value
	}
	if (typeof value === 'number') {
		return value !== 0
	}
	const normalized = asTrimmedString(value).toLowerCase()
	return normalized === '1' || normalized === 'true' || normalized === 'sim' || normalized === 'yes' || normalized === 'on'
}

function asIntegerString(value: unknown) {
	const normalized = asTrimmedString(value)
	if (!normalized) {
		return ''
	}
	const parsed = Number.parseInt(normalized, 10)
	return Number.isFinite(parsed) ? String(parsed) : ''
}

export function normalizeParametroCadastroRecord(record: CrudRecord): CrudRecord {
	const tipoEntrada = asTrimmedString(record.tipo_entrada) || 'livre'
	const grupoId = asIntegerString(record.id_parametro_grupo)
	const grupoNome = asTrimmedString(record['parametros_grupo.nome'])
	const templateId = asIntegerString(record.id_template)
	const templateNome = asTrimmedString(record['templates.nome'])

	return {
		...record,
		id: asTrimmedString(record.id),
		id_parametro_grupo: grupoId,
		id_template: templateId,
		chave: asTrimmedString(record.chave),
		nome: asTrimmedString(record.nome),
		tipo_entrada: tipoEntrada,
		tipo_valor: asTrimmedString(record.tipo_valor) || 'texto',
		fonte_dados: tipoEntrada === 'combo' ? asTrimmedString(record.fonte_dados) : '',
		dados: tipoEntrada === 'combo' ? asTrimmedString(record.dados) : '',
		ativo: asBooleanValue(record.ativo ?? true),
		obrigatorio: asBooleanValue(record.obrigatorio),
		editavel: asBooleanValue(record.editavel),
		dono: asTrimmedString(record.dono),
		nivel_acesso: asTrimmedString(record.nivel_acesso),
		chave_plataforma: asTrimmedString(record.chave_plataforma),
		descricao: asTrimmedString(record.descricao),
		ordem: asIntegerString(record.ordem),
		valor_default: asTrimmedString(record.valor_default),
		id_parametro_ativacao: asIntegerString(record.id_parametro_ativacao),
		valor_ativacao: asTrimmedString(record.valor_ativacao),
		...(grupoId
			? {
					id_parametro_grupo_lookup: {
						id: grupoId,
						label: grupoNome || grupoId,
					},
			  }
			: {}),
		...(templateId
			? {
					id_template_lookup: {
						id: templateId,
						label: templateNome || templateId,
					},
			  }
			: {}),
	}
}

export function buildParametroCadastroPayload(record: CrudRecord): CrudRecord {
	const tipoEntrada = asTrimmedString(record.tipo_entrada)
	const tipoValor = asTrimmedString(record.tipo_valor)
	const idParametroGrupo = asIntegerString(record.id_parametro_grupo)
	const fonteDados = asTrimmedString(record.fonte_dados)
	const dados = asTrimmedString(record.dados)

	if (!idParametroGrupo) {
		throw new Error('Selecione o grupo do parâmetro.')
	}
	if (!asTrimmedString(record.chave)) {
		throw new Error('Informe a chave do parâmetro.')
	}
	if (!asTrimmedString(record.nome)) {
		throw new Error('Informe o nome do parâmetro.')
	}
	if (tipoEntrada !== 'livre' && tipoEntrada !== 'combo') {
		throw new Error('Selecione o tipo de entrada.')
	}
	if (!['texto', 'senha', 'numero'].includes(tipoValor)) {
		throw new Error('Selecione o tipo de valor.')
	}
	if (tipoEntrada === 'combo') {
		if (!['lista_fixa', 'lista_endpoint'].includes(fonteDados)) {
			throw new Error('Selecione a fonte de dados.')
		}
		if (!dados) {
			throw new Error('Informe os dados da lista.')
		}
	}

	const payload: CrudRecord = {
		...(asTrimmedString(record.id) ? { id: asTrimmedString(record.id) } : {}),
		ativo: asBooleanValue(record.ativo),
		obrigatorio: asBooleanValue(record.obrigatorio),
		editavel: asBooleanValue(record.editavel),
		id_parametro_grupo: Number(idParametroGrupo),
		chave: asTrimmedString(record.chave),
		nome: asTrimmedString(record.nome),
		tipo_entrada: tipoEntrada,
		tipo_valor: tipoValor,
		ordem: Number.parseInt(asIntegerString(record.ordem) || '0', 10),
		dono: asNullableString(record.dono),
		nivel_acesso: asNullableString(record.nivel_acesso),
		chave_plataforma: asNullableString(record.chave_plataforma),
		descricao: asNullableString(record.descricao),
		valor_default: asNullableString(record.valor_default),
		valor_ativacao: asNullableString(record.valor_ativacao),
		fonte_dados: tipoEntrada === 'combo' ? fonteDados : null,
		dados: tipoEntrada === 'combo' ? dados : null,
	}

	const idTemplate = asIntegerString(record.id_template)
	payload.id_template = idTemplate ? Number(idTemplate) : null

	const idParametroAtivacao = asIntegerString(record.id_parametro_ativacao)
	payload.id_parametro_ativacao = idParametroAtivacao ? Number(idParametroAtivacao) : null

	return payload
}

export function buildParametroCadastroCollectionParams(filters: CrudListFilters) {
	const params = new URLSearchParams({
		page: String(filters.page || 1),
		perpage: String(filters.perPage || 15),
		order: String(filters.orderBy || 'nome'),
		sort: String(filters.sort || 'asc'),
	})

	const id = asTrimmedString(filters.id)
	if (id) params.set('id', id)

	const idParametroGrupo = asTrimmedString(filters.id_parametro_grupo)
	if (idParametroGrupo) params.set('id_parametro_grupo', idParametroGrupo)

	const idTemplate = asTrimmedString(filters.id_template)
	if (idTemplate) params.set('id_template', idTemplate)

	const chave = asTrimmedString(filters['chave::lk'])
	if (chave) params.set('chave:lk', chave)

	const nome = asTrimmedString(filters['nome::lk'])
	if (nome) params.set('nome:lk', nome)

	for (const key of ['tipo_entrada', 'tipo_valor', 'fonte_dados', 'ordem']) {
		const value = asTrimmedString(filters[key])
		if (value) params.set(key, value)
	}

	const ativo = asTrimmedString(filters.ativo)
	if (ativo === '1') params.set('ativo', 'true')
	if (ativo === '0') params.set('ativo', 'false')

	return params
}

export function loadParametroCadastroGrupoOptions(query: string, page: number, perPage: number) {
	return loadCrudLookupOptions('parametros_grupo', query, page, perPage).then((options) =>
		options.map((option) => ({
			id: option.value,
			label: option.label,
		})),
	)
}

export function loadParametroCadastroTemplateOptions(query: string, page: number, perPage: number) {
	return loadCrudLookupOptions('templates', query, page, perPage).then((options) =>
		options.map((option) => ({
			id: option.value,
			label: option.label,
		})),
	)
}
