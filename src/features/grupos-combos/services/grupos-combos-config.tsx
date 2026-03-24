'use client'

import type { CrudModuleConfig } from '@/src/components/crud-base/types'
import { normalizeGrupoComboRecord, toGrupoComboPayload } from '@/src/features/grupos-combos/services/grupos-combos-mappers'

export const GRUPOS_COMBOS_CONFIG: CrudModuleConfig = {
  key: 'grupos-combos',
  resource: 'grupos_promocao',
  routeBase: '/grupos-de-combos',
  featureKey: 'gruposCombos',
  listTitleKey: 'marketing.comboGroups.title',
  listTitle: 'Grupos de Combos',
  listDescriptionKey: 'marketing.comboGroups.listDescription',
  listDescription: 'Listagem com código, nome e status ativo.',
  formTitleKey: 'marketing.comboGroups.formTitle',
  formTitle: 'Grupo de Combos',
  breadcrumbSectionKey: 'menuKeys.promocoes',
  breadcrumbSection: 'Promoções',
  breadcrumbModuleKey: 'menuKeys.grupos-de-combos',
  breadcrumbModule: 'Grupos de Combos',
  defaultFilters: {
    page: 1,
    perPage: 15,
    orderBy: 'id',
    sort: 'desc',
    id: '',
    codigo: '',
    'nome::like': '',
    ativo: '',
  },
  columns: [
    {
      id: 'id',
      labelKey: 'simpleCrud.fields.id',
      label: 'ID',
      sortKey: 'id',
      thClassName: 'w-[140px]',
      filter: { kind: 'text', key: 'id', inputMode: 'numeric' },
    },
    {
      id: 'codigo',
      labelKey: 'simpleCrud.fields.code',
      label: 'Código',
      sortKey: 'codigo',
      tdClassName: 'font-semibold text-slate-950',
      filter: { kind: 'text', key: 'codigo' },
    },
    {
      id: 'nome',
      labelKey: 'simpleCrud.fields.name',
      label: 'Nome',
      sortKey: 'nome',
      tdClassName: 'font-semibold text-slate-950',
      filter: { kind: 'text', key: 'nome::like' },
    },
    {
      id: 'ativo',
      labelKey: 'simpleCrud.fields.active',
      label: 'Ativo',
      sortKey: 'ativo',
      thClassName: 'w-[120px]',
      valueKey: 'ativo',
      filter: {
        kind: 'select',
        key: 'ativo',
        options: [
          { value: '1', labelKey: 'common.yes', label: 'Sim' },
          { value: '0', labelKey: 'common.no', label: 'Não' },
        ],
      },
    },
  ],
  mobileTitle: (record) => String(record.nome || record.codigo || '-'),
  mobileMeta: (record) => `ID: ${String(record.id || '-')}`,
  sections: [
    {
      id: 'general',
      titleKey: 'marketing.comboGroups.tabs.general',
      title: 'Dados gerais',
      layout: 'rows',
      fields: [
        { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle' },
        { key: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', type: 'text', layoutClassName: 'max-w-[320px]', maxLength: 32 },
        { key: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', type: 'text', required: true, layoutClassName: 'max-w-[720px]', maxLength: 255 },
        { key: 'imagem', labelKey: 'marketing.comboGroups.fields.image', label: 'Imagem', type: 'image' },
        { key: 'descricao', labelKey: 'marketing.comboGroups.fields.description', label: 'Descrição', type: 'textarea', rows: 5, layoutClassName: 'max-w-[720px]' },
      ],
    },
  ],
  normalizeRecord: normalizeGrupoComboRecord,
  beforeSave: toGrupoComboPayload,
}
