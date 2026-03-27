'use client'

import type { CrudModuleConfig } from '@/src/components/crud-base/types'

export const CANAIS_DISTRIBUICAO_CONFIG: CrudModuleConfig = {
  key: 'canais-distribuicao',
  resource: 'canais_distribuicao',
  routeBase: '/canais-de-distribuicao',
  featureKey: 'canaisDistribuicao',
  listTitleKey: 'basicRegistrations.channels.title',
  listTitle: 'Canais de distribuição',
  listDescriptionKey: 'basicRegistrations.channels.listDescription',
  listDescription: 'Listagem com código, nome e status ativo.',
  formTitleKey: 'basicRegistrations.channels.formTitle',
  formTitle: 'Canal de distribuição',
  breadcrumbSectionKey: 'routes.cadastrosBasicos',
  breadcrumbSection: 'Cadastros Básicos',
  breadcrumbModuleKey: 'routes.canaisDistribuicao',
  breadcrumbModule: 'Canais de distribuição',
  defaultFilters: { page: 1, perPage: 15, orderBy: 'nome', sort: 'asc', id: '', codigo: '', 'nome::like': '', ativo: '' },
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[180px]', filter: { kind: 'text', key: 'id' } },
    { id: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', sortKey: 'codigo', thClassName: 'w-[140px]', filter: { kind: 'text', key: 'codigo' } },
    { id: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', sortKey: 'nome', tdClassName: 'font-semibold text-slate-950', filter: { kind: 'text', key: 'nome::like' } },
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
    ],
  }],
}
