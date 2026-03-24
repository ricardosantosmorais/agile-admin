'use client'

import type { CrudModuleConfig } from '@/src/components/crud-base/types'

export const GRADES_CONFIG: CrudModuleConfig = {
  key: 'grades',
  resource: 'grades',
  routeBase: '/grades',
  featureKey: 'grades',
  listTitleKey: 'catalog.grades.title',
  listTitle: 'Grades',
  listDescriptionKey: 'catalog.grades.description',
  listDescription: 'Listagem de grades.',
  formTitleKey: 'catalog.grades.formTitle',
  formTitle: 'Grade',
  breadcrumbSectionKey: 'simpleCrud.sections.catalog',
  breadcrumbSection: 'Catálogo',
  breadcrumbModuleKey: 'catalog.grades.title',
  breadcrumbModule: 'Grades',
  defaultFilters: { page: 1, perPage: 15, orderBy: 'nome', sort: 'asc', id: '', codigo: '', 'nome::like': '', tipo: '', ativo: '' },
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[180px]', filter: { kind: 'text', key: 'id' } },
    { id: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', sortKey: 'codigo', thClassName: 'w-[120px]', filter: { kind: 'text', key: 'codigo' } },
    { id: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', sortKey: 'nome', tdClassName: 'font-semibold text-slate-950', filter: { kind: 'text', key: 'nome::like' } },
    { id: 'tipo', labelKey: 'catalog.grades.fields.type', label: 'Tipo', sortKey: 'tipo', thClassName: 'w-[110px]', render: (record) => String(record.tipo) === 'tipo2' ? 'Tipo 2' : 'Tipo 1', filter: { kind: 'select', key: 'tipo', options: [{ value: 'tipo1', label: 'Tipo 1' }, { value: 'tipo2', label: 'Tipo 2' }] } },
    { id: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', sortKey: 'ativo', thClassName: 'w-[100px]', valueKey: 'ativo', filter: { kind: 'select', key: 'ativo', options: [{ value: '1', label: 'Sim' }, { value: '0', label: 'Não' }] } },
  ],
  mobileTitle: (record) => String(record.nome || '-'),
  mobileSubtitle: (record) => String(record.codigo || '-'),
  mobileMeta: (record) => `${String(record.tipo || '-')}`,
  sections: [
    {
      id: 'general',
      titleKey: 'catalog.sections.general',
      title: 'Dados gerais',
      layout: 'rows',
      fields: [
        { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle' },
        { key: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', type: 'text' },
        { key: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', type: 'text', required: true },
        { key: 'id_classe', labelKey: 'catalog.grades.fields.classId', label: 'ID classe', type: 'text' },
        { key: 'tipo', labelKey: 'catalog.grades.fields.type', label: 'Tipo', type: 'select', options: [{ value: 'tipo1', label: 'Tipo 1 (colunas)' }, { value: 'tipo2', label: 'Tipo 2 (linhas)' }] },
        { key: 'posicao', labelKey: 'simpleCrud.fields.position', label: 'Posição', type: 'number' },
      ],
    },
  ],
}
