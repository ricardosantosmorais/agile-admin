'use client'

import type { CrudModuleConfig } from '@/src/components/crud-base/types'
import { DEFAULT_APLICATIVO_INTEGRACAO_LIST_FILTERS } from '@/src/features/integracao-aplicativos/services/integracao-aplicativos-mappers'

export const INTEGRACAO_APLICATIVOS_CONFIG: CrudModuleConfig = {
  key: 'integracao-aplicativos',
  resource: 'integracao-aplicativos',
  routeBase: '/api-de-integracao/aplicativos',
  featureKey: 'integracaoAplicativos',
  listTitleKey: 'integrationApps.title',
  listTitle: 'Aplicativos',
  listDescriptionKey: 'integrationApps.listDescription',
  listDescription: 'Gerencie os aplicativos da API de integração.',
  formTitleKey: 'integrationApps.formTitle',
  formTitle: 'Aplicativo',
  breadcrumbSectionKey: 'menuKeys.api-de-integracao',
  breadcrumbSection: 'API de Integração',
  breadcrumbModuleKey: 'integrationApps.title',
  breadcrumbModule: 'Aplicativos',
  defaultFilters: DEFAULT_APLICATIVO_INTEGRACAO_LIST_FILTERS,
  columns: [
    {
      id: 'id',
      labelKey: 'simpleCrud.fields.id',
      label: 'ID',
      sortKey: 'id',
      thClassName: 'w-[110px]',
      filter: {
        kind: 'text',
        key: 'id',
        labelKey: 'simpleCrud.fields.id',
        label: 'ID',
      },
    },
    {
      id: 'codigo',
      labelKey: 'simpleCrud.fields.code',
      label: 'Código',
      sortKey: 'codigo',
      filter: {
        kind: 'text',
        key: 'codigo::like',
        labelKey: 'simpleCrud.fields.code',
        label: 'Código',
      },
    },
    {
      id: 'nome',
      labelKey: 'simpleCrud.fields.name',
      label: 'Nome',
      sortKey: 'nome',
      filter: {
        kind: 'text',
        key: 'nome::like',
        labelKey: 'simpleCrud.fields.name',
        label: 'Nome',
      },
    },
    {
      id: 'email',
      labelKey: 'simpleCrud.fields.email',
      label: 'E-mail',
      sortKey: 'email',
      filter: {
        kind: 'text',
        key: 'email::like',
        labelKey: 'simpleCrud.fields.email',
        label: 'E-mail',
      },
    },
    {
      id: 'ativo',
      labelKey: 'simpleCrud.fields.active',
      label: 'Ativo',
      sortKey: 'ativo',
      thClassName: 'w-[120px]',
      filter: {
        kind: 'select',
        key: 'ativo',
        labelKey: 'simpleCrud.fields.active',
        label: 'Ativo',
        options: [{ value: '1', label: 'Yes' }, { value: '0', label: 'No' }],
      },
    },
  ],
  mobileTitle: (record) => String(record.nome || '-'),
  mobileSubtitle: (record) => String(record.email || '-'),
  mobileMeta: (record) => String(record.codigo || '-'),
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
        { key: 'email', labelKey: 'simpleCrud.fields.email', label: 'E-mail', type: 'email', required: true },
      ],
    },
  ],
  getSaveRedirectPath: ({ saved, form }) => {
    const savedId = String(saved[0]?.id || form.id || '')
    return savedId ? `/api-de-integracao/aplicativos/${savedId}/editar` : '/api-de-integracao/aplicativos'
  },
}

