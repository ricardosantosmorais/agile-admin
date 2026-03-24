'use client'

import type { CrudModuleConfig, CrudRecord } from '@/src/components/crud-base/types'

type GrupoClienteRelationItem = {
  id_grupo: string
  id_cliente: string
  cliente?: {
    id: string
    codigo?: string | null
    nome_fantasia?: string | null
  } | null
}

export type GrupoClienteFormRecord = {
  id: string
  ativo: boolean
  codigo: string
  nome: string
  clientes: GrupoClienteRelationItem[]
}

export function createEmptyGrupoClienteForm(): GrupoClienteFormRecord {
  return {
    id: '',
    ativo: true,
    codigo: '',
    nome: '',
    clientes: [],
  }
}

export function mapGrupoClienteDetail(payload: unknown): GrupoClienteFormRecord {
  if (!payload || typeof payload !== 'object') {
    return createEmptyGrupoClienteForm()
  }

  const record = payload as Record<string, unknown>
  const clientes = Array.isArray(record.clientes) ? record.clientes as GrupoClienteRelationItem[] : []

  return {
    id: String(record.id || ''),
    ativo: record.ativo === true || record.ativo === 1 || record.ativo === '1',
    codigo: String(record.codigo || ''),
    nome: String(record.nome || ''),
    clientes,
  }
}

export const GRUPOS_CLIENTES_CONFIG: CrudModuleConfig = {
  key: 'grupos-clientes',
  resource: 'grupos',
  routeBase: '/grupos-clientes',
  featureKey: 'gruposClientes',
  listTitleKey: 'people.customerGroups.title',
  listTitle: 'Grupos de Cliente',
  listDescriptionKey: 'people.customerGroups.listDescription',
  listDescription: 'Listagem server-side com codigo, nome e status ativo.',
  formTitleKey: 'people.customerGroups.formTitle',
  formTitle: 'Grupo de Cliente',
  breadcrumbSectionKey: 'routes.people',
  breadcrumbSection: 'Pessoas',
  breadcrumbModuleKey: 'people.customerGroups.title',
  breadcrumbModule: 'Grupos de clientes',
  defaultFilters: { page: 1, perPage: 15, orderBy: 'nome', sort: 'asc', id: '', codigo: '', 'nome::like': '', ativo: '' },
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[180px]', filter: { kind: 'text', key: 'id' } },
    { id: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Code', sortKey: 'codigo', thClassName: 'w-[140px]', filter: { kind: 'text', key: 'codigo' } },
    { id: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Name', sortKey: 'nome', tdClassName: 'font-semibold text-slate-950', filter: { kind: 'text', key: 'nome::like' } },
    { id: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Active', sortKey: 'ativo', thClassName: 'w-[110px]', valueKey: 'ativo', filter: { kind: 'select', key: 'ativo', options: [{ value: '1', label: 'Yes' }, { value: '0', label: 'No' }] } },
  ],
  mobileTitle: (record) => String(record.nome || '-'),
  mobileSubtitle: (record) => String(record.codigo || '-'),
  mobileMeta: (record) => `ID: ${String(record.id || '-')}`,
  sections: [
    {
      id: 'general',
      titleKey: 'simpleCrud.sections.main',
      title: 'Dados principais',
      layout: 'rows',
      fields: [
        { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle' },
        { key: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', type: 'text' },
        { key: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', type: 'text', required: true },
      ],
    },
  ],
  normalizeRecord: (record: CrudRecord) => mapGrupoClienteDetail(record),
  beforeSave: (record: CrudRecord) => ({
    id: String(record.id || '') || undefined,
    ativo: record.ativo === true,
    codigo: String(record.codigo || '') || null,
    nome: String(record.nome || ''),
  }),
}
