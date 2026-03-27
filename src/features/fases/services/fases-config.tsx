'use client'

import type { CrudModuleConfig } from '@/src/components/crud-base/types'

export const FASES_CONFIG: CrudModuleConfig = {
  key: 'fases',
  resource: 'implantacao/fases',
  routeBase: '/fases',
  featureKey: 'fases',
  listTitleKey: 'registrations.phases.title',
  listTitle: 'Fases',
  listDescriptionKey: 'registrations.phases.listDescription',
  listDescription: 'Listagem com código, nome, posição e status ativo.',
  formTitleKey: 'registrations.phases.formTitle',
  formTitle: 'Fase',
  breadcrumbSectionKey: 'routes.cadastros',
  breadcrumbSection: 'Cadastros',
  breadcrumbModuleKey: 'routes.fases',
  breadcrumbModule: 'Fases',
  defaultFilters: { page: 1, perPage: 15, orderBy: 'nome', sort: 'asc', id: '', codigo: '', 'nome::like': '', posicao: '', ativo: '' },
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[180px]', filter: { kind: 'text', key: 'id' } },
    { id: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', sortKey: 'codigo', thClassName: 'w-[140px]', filter: { kind: 'text', key: 'codigo' } },
    { id: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', sortKey: 'nome', tdClassName: 'font-semibold text-slate-950', filter: { kind: 'text', key: 'nome::like' } },
    { id: 'posicao', labelKey: 'simpleCrud.fields.position', label: 'Posição', sortKey: 'posicao', thClassName: 'w-[120px]', filter: { kind: 'text', key: 'posicao', inputMode: 'numeric' } },
    { id: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', sortKey: 'ativo', thClassName: 'w-[100px]', valueKey: 'ativo', filter: { kind: 'select', key: 'ativo', options: [{ value: '1', label: 'Sim' }, { value: '0', label: 'Não' }] } },
  ],
  mobileTitle: (record) => String(record.nome || '-'),
  mobileSubtitle: (record) => String(record.codigo || '-'),
  mobileMeta: (record) => `ID: ${String(record.id || '-')}`,
  sections: [{
    id: 'main',
    titleKey: 'basicRegistrations.sections.general',
    title: 'Dados gerais',
    layout: 'rows',
    fields: [
      { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle' },
      { key: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', type: 'text' },
      { key: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', type: 'text', required: true },
      { key: 'posicao', labelKey: 'simpleCrud.fields.position', label: 'Posição', type: 'number', required: true },
      { key: 'icone', labelKey: 'registrations.phases.fields.icon', label: 'Ícone', type: 'text', helperTextKey: 'registrations.phases.fields.iconHint', helperText: 'Ex.: far fa-server' },
    ],
  }],
}
