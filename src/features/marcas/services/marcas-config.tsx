'use client'

import type { CrudModuleConfig } from '@/src/components/crud-base/types'

export const MARCAS_CONFIG: CrudModuleConfig = {
  key: 'marcas',
  resource: 'marcas',
  routeBase: '/marcas',
  featureKey: 'marcas',
  listTitleKey: 'catalog.marcas.title',
  listTitle: 'Marcas',
  listDescriptionKey: 'catalog.marcas.description',
  listDescription: 'Listagem de marcas.',
  formTitleKey: 'catalog.marcas.formTitle',
  formTitle: 'Marca',
  breadcrumbSectionKey: 'simpleCrud.sections.catalog',
  breadcrumbSection: 'Catálogo',
  breadcrumbModuleKey: 'catalog.marcas.title',
  breadcrumbModule: 'Marcas',
  defaultFilters: { page: 1, perPage: 15, orderBy: 'nome', sort: 'asc', id: '', codigo: '', 'nome::like': '', ativo: '' },
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[180px]', filter: { kind: 'text', key: 'id' } },
    { id: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', sortKey: 'codigo', thClassName: 'w-[130px]', filter: { kind: 'text', key: 'codigo' } },
    { id: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', sortKey: 'nome', tdClassName: 'font-semibold text-slate-950', filter: { kind: 'text', key: 'nome::like' } },
    { id: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', sortKey: 'ativo', thClassName: 'w-[100px]', valueKey: 'ativo', filter: { kind: 'select', key: 'ativo', options: [{ value: '1', label: 'Sim' }, { value: '0', label: 'Não' }] } },
  ],
  mobileTitle: (record) => String(record.nome || '-'),
  mobileSubtitle: (record) => String(record.codigo || '-'),
  mobileMeta: (record) => `ID: ${String(record.id || '-')}`,
  sections: [
    {
      id: 'general',
      titleKey: 'catalog.sections.general',
      title: 'Dados gerais',
      layout: 'rows',
      fields: [
        { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle' },
        { key: 'menu', labelKey: 'catalog.fields.menu', label: 'Menu', type: 'toggle' },
        { key: 'feed', labelKey: 'catalog.fields.feed', label: 'Feed de dados', type: 'toggle' },
        { key: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', type: 'text' },
        { key: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', type: 'text', required: true },
        { key: 'imagem', labelKey: 'catalog.fields.banner', label: 'Banner', type: 'image', uploadProfileId: 'tenant-public-images', uploadFolder: 'marcas' },
        { key: 'imagem_mobile', labelKey: 'catalog.fields.mobileBanner', label: 'Banner mobile', type: 'image', uploadProfileId: 'tenant-public-images', uploadFolder: 'marcas' },
        { key: 'link', labelKey: 'catalog.fields.link', label: 'Link do banner', type: 'text' },
        { key: 'target', labelKey: 'catalog.fields.target', label: 'Target do banner', type: 'select', options: [{ value: '_self', label: 'Mesma janela' }, { value: '_blank', label: 'Nova janela' }] },
        { key: 'descricao', labelKey: 'catalog.fields.description', label: 'Descrição', type: 'richtext' },
      ],
    },
    {
      id: 'seo',
      titleKey: 'catalog.sections.seo',
      title: 'SEO',
      layout: 'rows',
      fields: [
        { key: 'titulo', labelKey: 'catalog.fields.title', label: 'Título', type: 'text' },
        { key: 'palavras_chave', labelKey: 'catalog.fields.keywords', label: 'Palavras-chave', type: 'text' },
        { key: 'meta_descricao', labelKey: 'catalog.fields.metaDescription', label: 'Meta descrição', type: 'textarea', rows: 4 },
      ],
    },
  ],
}
