import { asArray, asBoolean, asNumber, asRecord, asString } from '@/src/lib/api-payload'
import { serializeTreeSelection, type TreeSelectionNode } from '@/src/lib/tree-selection'

export type PerfilListFilters = {
  page: number
  perPage: number
  orderBy: 'id' | 'codigo' | 'nome' | 'ativo'
  sort: 'asc' | 'desc'
  id: string
  codigo: string
  'nome::like': string
  ativo: string
}

export type PerfilListItem = {
  id: string
  codigo: string
  nome: string
  ativo: boolean
}

export type PerfilListResponse = {
  data: PerfilListItem[]
  meta: {
    page: number
    pages: number
    perPage: number
    from: number
    to: number
    total: number
  }
}

export type PerfilPermissionNode = Omit<TreeSelectionNode, 'children'> & {
  label: string
  description?: string
  children?: PerfilPermissionNode[]
}

export type PerfilFormRecord = {
  id: string
  ativo: boolean
  codigo: string
  nome: string
  selectedPermissionIds: string[]
}

export const DEFAULT_PERFIL_LIST_FILTERS: PerfilListFilters = {
  page: 1,
  perPage: 15,
  orderBy: 'nome',
  sort: 'asc',
  id: '',
  codigo: '',
  'nome::like': '',
  ativo: '',
}

export function createEmptyPerfilForm(): PerfilFormRecord {
  return {
    id: '',
    ativo: true,
    codigo: '',
    nome: '',
    selectedPermissionIds: [],
  }
}

export function mapPerfilListResponse(payload: unknown): PerfilListResponse {
  const record = asRecord(payload)

  return {
    data: asArray<Record<string, unknown>>(record.data).map((item) => ({
      id: asString(item.id),
      codigo: asString(item.codigo),
      nome: asString(item.nome, '-'),
      ativo: asBoolean(item.ativo),
    })),
    meta: {
      page: asNumber(asRecord(record.meta).page, 1),
      pages: asNumber(asRecord(record.meta).pages, 1),
      perPage: asNumber(asRecord(record.meta).perPage ?? asRecord(record.meta).perpage, 15),
      from: asNumber(asRecord(record.meta).from, 0),
      to: asNumber(asRecord(record.meta).to, 0),
      total: asNumber(asRecord(record.meta).total, 0),
    },
  }
}

export function mapPerfilDetail(payload: unknown): PerfilFormRecord {
  const record = asRecord(payload)

  return {
    id: asString(record.id),
    ativo: asBoolean(record.ativo),
    codigo: asString(record.codigo),
    nome: asString(record.nome),
    selectedPermissionIds: [],
  }
}

export function mapPerfilPermissionTree(payload: unknown) {
  const record = asRecord(payload)
  return {
    nodes: asArray<PerfilPermissionNode>(record.nodes),
    selectedIds: asArray(record.selectedIds).map((value) => String(value)),
  }
}

export function toPerfilPayload(form: PerfilFormRecord, nodes: PerfilPermissionNode[]) {
  const permissionIds = serializeTreeSelection(nodes, form.selectedPermissionIds)

  return {
    id: form.id || undefined,
    ativo: form.ativo,
    codigo: form.codigo.trim() || null,
    nome: form.nome.trim() || null,
    id_funcionalidades: permissionIds.join(','),
  }
}
