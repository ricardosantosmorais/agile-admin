import type { CrudListRecord, CrudRecord } from '@/src/components/crud-base/types'
import { normalizeIconPickerValue } from '@/src/components/ui/icon-picker-catalog'
import type { LookupOption } from '@/src/components/ui/lookup-select'
import type { FuncionalidadeEmpresa, FuncionalidadePayload, FuncionalidadeRecord } from '@/src/features/funcionalidades/services/funcionalidades-types'

type ApiRecord = Record<string, unknown>

export const FUNCIONALIDADE_ROOT_PARENT_OPTION: LookupOption = {
	id: '__root__',
	label: '-- Raiz --',
	description: 'Sem funcionalidade pai',
}

function text(value: unknown) {
	return String(value ?? '').trim()
}

function bool(value: unknown, fallback = false) {
	if (value === null || value === undefined || value === '') return fallback
	if (typeof value === 'boolean') return value
	if (typeof value === 'number') return value === 1
	return ['1', 'true', 'sim', 's', 'yes', 'on'].includes(text(value).toLowerCase())
}

function numberOrNull(value: unknown) {
	const normalized = text(value)
	if (!normalized) return null
	const parsed = Number(normalized)
	return Number.isFinite(parsed) ? parsed : null
}

function objectValue(value: unknown): ApiRecord | null {
	return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as ApiRecord : null
}

function relationObject(value: unknown): ApiRecord | null {
	const object = objectValue(value)
	if (object) return object
	if (Array.isArray(value)) {
		return value.find((item): item is ApiRecord => objectValue(item) !== null) ?? null
	}
	return null
}

function arrayValue(value: unknown): ApiRecord[] {
	return Array.isArray(value) ? value.filter((item): item is ApiRecord => objectValue(item) !== null) : []
}

function getParentId(record: ApiRecord) {
	const parent = relationObject(record.funcionalidade_pai)
	return text(record.id_funcionalidade_pai || record.funcionalidade_pai_id || parent?.id)
}

function getParentName(record: ApiRecord) {
	const parent = relationObject(record.funcionalidade_pai)
	return text(parent?.nome || parent?.label || record.funcionalidade_pai_nome || record['funcionalidade_pai:nome'] || record['funcionalidade_pai.nome'])
}

function normalizeUrl(value: unknown) {
	const object = objectValue(value)
	if (object) {
		return text(object.href || object.slug || object.url)
	}
	return text(value)
}

function normalizeEmpresa(record: ApiRecord): FuncionalidadeEmpresa {
	const empresa = objectValue(record.empresa) ?? record
	const id = text(empresa.id || record.id_empresa || record.id)
	const nome = text(empresa.nome_fantasia || empresa.razao_social || empresa.nome || record.nome_fantasia || record.nome || id)
	return {
		id,
		nome,
		codigo: text(empresa.codigo || record.codigo) || undefined,
		ativo: bool(record.ativo ?? empresa.ativo, true),
	}
}

export function normalizeFuncionalidadeRecord(record: CrudRecord | ApiRecord): FuncionalidadeRecord & CrudListRecord {
	const source = record as ApiRecord
	const id = text(source.id)
	const parentId = getParentId(source)
	const parentName = getParentName(source)
	const empresas = arrayValue(source.empresas).map(normalizeEmpresa).filter((empresa) => empresa.id)

	return {
		...source,
		id,
		ativo: bool(source.ativo, true),
		menu: bool(source.menu, false),
		codigo: text(source.codigo),
		nome: text(source.nome),
		posicao: text(source.posicao),
		nivel: text(source.nivel),
		icone: normalizeIconPickerValue(text(source.icone)),
		url: normalizeUrl(source.url),
		componente: text(source.componente),
		clique: text(source.clique),
		acao: text(source.acao) || null,
		descricao: text(source.descricao),
		id_funcionalidade_pai: parentId || null,
		funcionalidade_pai_nome: parentName || FUNCIONALIDADE_ROOT_PARENT_OPTION.label,
		funcionalidade_pai_lookup: parentId ? { id: parentId, label: parentName || parentId } : FUNCIONALIDADE_ROOT_PARENT_OPTION,
		empresas,
	}
}

export function buildFuncionalidadePayload(record: Partial<FuncionalidadeRecord> | CrudRecord): FuncionalidadePayload {
	return {
		...(text(record.id) ? { id: text(record.id) } : {}),
		ativo: bool(record.ativo, true),
		menu: bool(record.menu, false),
		codigo: text(record.codigo),
		nome: text(record.nome),
		posicao: numberOrNull(record.posicao),
		nivel: numberOrNull(record.nivel),
		icone: text(record.icone),
		url: text(record.url),
		componente: text(record.componente),
		clique: text(record.clique),
		acao: text(record.acao) || null,
		descricao: text(record.descricao),
		id_funcionalidade_pai: text(record.id_funcionalidade_pai) || null,
	}
}

function sortTreeRecords(left: FuncionalidadeRecord, right: FuncionalidadeRecord) {
	const leftPosition = numberOrNull(left.posicao) ?? 999999
	const rightPosition = numberOrNull(right.posicao) ?? 999999
	if (leftPosition !== rightPosition) return leftPosition - rightPosition
	return text(left.nome).localeCompare(text(right.nome), 'pt-BR')
}

function optionLabel(record: FuncionalidadeRecord, depth: number) {
	return `${'    '.repeat(Math.max(depth, 0))}${record.nome || record.id} - ${record.id}`
}

export function buildFuncionalidadeTreeOptions(records: Array<CrudRecord | ApiRecord>, currentId?: string): LookupOption[] {
	const current = text(currentId)
	const normalized = records
		.map((record) => normalizeFuncionalidadeRecord(record))
		.filter((record) => record.id && record.id !== current)

	const byParent = new Map<string, FuncionalidadeRecord[]>()
	const byId = new Set(normalized.map((record) => record.id))

	for (const record of normalized) {
		const parentId = text(record.id_funcionalidade_pai)
		const key = parentId && byId.has(parentId) ? parentId : ''
		const siblings = byParent.get(key) ?? []
		siblings.push(record)
		byParent.set(key, siblings)
	}

	for (const siblings of byParent.values()) {
		siblings.sort(sortTreeRecords)
	}

	const result: LookupOption[] = []

	function visit(record: FuncionalidadeRecord, depth: number) {
		result.push({
			id: record.id ?? '',
			label: optionLabel(record, depth),
			description: `Nível ${text(record.nivel) || '-'}`,
		})

		for (const child of byParent.get(record.id ?? '') ?? []) {
			visit(child, depth + 1)
		}
	}

	for (const root of byParent.get('') ?? []) {
		const parentId = text(root.id_funcionalidade_pai)
		const compactOrphanDepth = parentId && !byId.has(parentId)
			? Math.max((numberOrNull(root.nivel) ?? 1) - 2, 0)
			: 0
		visit(root, compactOrphanDepth)
	}

	return result
}

export function mapFuncionalidadeOptions(records: Array<CrudRecord | ApiRecord>, currentId?: string) {
	return buildFuncionalidadeTreeOptions(records, currentId)
}
