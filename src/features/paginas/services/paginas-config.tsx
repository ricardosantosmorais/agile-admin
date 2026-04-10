import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import type { CrudModuleConfig } from '@/src/components/crud-base/types'

export const PAGINAS_CONFIG: CrudModuleConfig = {
  key: 'paginas',
  resource: 'paginas',
  routeBase: '/paginas',
  featureKey: 'paginas',
  listTitleKey: 'simpleCrud.modules.paginas.title',
  listTitle: 'Paginas',
  listDescriptionKey: 'simpleCrud.modules.paginas.listDescription',
  listDescription: 'Listing with area, title, position and active status.',
  formTitleKey: 'simpleCrud.modules.paginas.formTitle',
  formTitle: 'Pagina',
  breadcrumbSectionKey: 'simpleCrud.sections.content',
  breadcrumbSection: 'Content',
  breadcrumbModuleKey: 'simpleCrud.modules.paginas.title',
  breadcrumbModule: 'Pages',
  defaultFilters: { page: 1, perPage: 15, orderBy: 'titulo', sort: 'asc', id: '', 'area:nome::like': '', 'titulo::like': '', posicao: '', ativo: '' },
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[120px]', filter: { kind: 'text', key: 'id' } },
    { id: 'area', labelKey: 'simpleCrud.fields.area', label: 'Area', sortKey: 'area:nome', render: (record) => String(record.area?.nome || '-'), filter: { kind: 'text', key: 'area:nome::like' } },
    {
      id: 'titulo',
      labelKey: 'simpleCrud.fields.title',
      label: 'Title',
      sortKey: 'titulo',
      tdClassName: 'font-semibold text-slate-950',
      render: (record, context) => {
        const title = String(record.titulo || '-')
        const slug = typeof record.url?.slug === 'string' ? record.url.slug : ''
        if (!slug || !context.tenantUrl) return title
        return <Link href={`${context.tenantUrl}${slug}`} target="_blank" className="inline-flex items-center gap-2 hover:underline"><span>{title}</span><ExternalLink className="h-3.5 w-3.5" /></Link>
      },
      filter: { kind: 'text', key: 'titulo::like' },
    },
    { id: 'posicao', labelKey: 'simpleCrud.fields.position', label: 'Position', sortKey: 'posicao', thClassName: 'w-[110px]', filter: { kind: 'text', key: 'posicao', inputMode: 'numeric' } },
    { id: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Active', sortKey: 'ativo', thClassName: 'w-[110px]', valueKey: 'ativo', filter: { kind: 'select', key: 'ativo', options: [{ value: '1', label: 'Yes' }, { value: '0', label: 'No' }] } },
  ],
  mobileTitle: (record) => String(record.titulo || '-'),
  mobileSubtitle: (record) => String(record.area?.nome || '-'),
  mobileMeta: (record) => `ID: ${record.id}`,
  details: [
    { key: 'position', labelKey: 'simpleCrud.fields.position', label: 'Position', render: (record) => String(record.posicao || '-') },
    { key: 'profile', labelKey: 'simpleCrud.fields.profile', label: 'User profile', render: (record) => String(record.perfil || '-') },
    { key: 'externalLink', labelKey: 'simpleCrud.fields.externalLink', label: 'External link', render: (record) => String(record.link_externo || '-') },
  ],
  sections: [
    { id: 'main', titleKey: 'simpleCrud.sections.main', title: 'Main data', layout: 'rows', fields: [
      { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Active', type: 'toggle' },
      { key: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Code', type: 'text', layoutClassName: 'max-w-[280px]' },
      { key: 'id_area_pagina', labelKey: 'simpleCrud.fields.area', label: 'Area', type: 'select', required: true, optionsResource: 'areas_pagina', layoutClassName: 'max-w-[520px]' },
      { key: 'titulo', labelKey: 'simpleCrud.fields.title', label: 'Title', type: 'text', required: true, layoutClassName: 'max-w-[760px]' },
      { key: 'posicao', labelKey: 'simpleCrud.fields.position', label: 'Position', type: 'number', inputMode: 'numeric', layoutClassName: 'max-w-[220px]' },
      { key: 'link_externo', labelKey: 'simpleCrud.fields.externalLink', label: 'External link', type: 'text', helperTextKey: 'simpleCrud.fields.externalLinkHint', helperText: 'If filled, the external link opens in a new window.', layoutClassName: 'max-w-[760px]' },
      { key: 'perfil', labelKey: 'simpleCrud.fields.profile', label: 'User profile', type: 'select', required: true, options: [{ value: 'todos', labelKey: 'simpleCrud.profile.all', label: 'All' }, { value: 'cliente', labelKey: 'simpleCrud.profile.customer', label: 'Customer' }, { value: 'vendedor', labelKey: 'simpleCrud.profile.seller', label: 'Seller' }], layoutClassName: 'max-w-[320px]' },
    ] },
    { id: 'content', titleKey: 'simpleCrud.sections.contentBody', title: 'Content', layout: 'rows', fields: [{ key: 'texto', labelKey: 'simpleCrud.fields.content', label: 'Content', type: 'richtext', layoutClassName: 'w-full' }] },
  ],
  listEmbed: 'area,url',
  formEmbed: 'area,url',
  normalizeRecord: (record) => ({ ...record, id_area_pagina: typeof record.id_area_pagina === 'string' ? record.id_area_pagina : record.area?.id || '', perfil: typeof record.perfil === 'string' ? record.perfil : 'todos' }),
  beforeSave: (record) => {
    const positionValue = record.posicao as unknown
    return { ...record, posicao: positionValue === '' || positionValue === undefined ? null : record.posicao, link_externo: record.link_externo || null, texto: record.texto || null }
  },
}
