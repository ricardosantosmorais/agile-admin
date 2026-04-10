import { loadCrudLookupOptions } from '@/src/components/crud-base/crud-client'
import { StatusBadge } from '@/src/components/ui/status-badge'
import type { CrudModuleConfig } from '@/src/components/crud-base/types'

export const COLECOES_CONFIG: CrudModuleConfig = {
  key: 'colecoes',
  resource: 'colecoes',
  routeBase: '/colecoes',
  featureKey: 'colecoes',
  listTitleKey: 'catalog.colecoes.title',
  listTitle: 'Coleções',
  listDescriptionKey: 'catalog.colecoes.description',
  listDescription: 'Listagem de coleções.',
  formTitleKey: 'catalog.colecoes.formTitle',
  formTitle: 'Coleção',
  breadcrumbSectionKey: 'simpleCrud.sections.catalog',
  breadcrumbSection: 'Catálogo',
  breadcrumbModuleKey: 'catalog.colecoes.title',
  breadcrumbModule: 'Coleções',
  defaultFilters: { page: 1, perPage: 15, orderBy: 'nome', sort: 'asc', id: '', codigo: '', 'nome::like': '', id_filial: '', id_filial_label: '', restrito: '', ativo: '' },
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[180px]', filter: { kind: 'text', key: 'id' } },
    { id: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', sortKey: 'codigo', thClassName: 'w-[130px]', filter: { kind: 'text', key: 'codigo' } },
    { id: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', sortKey: 'nome', tdClassName: 'font-semibold text-slate-950', filter: { kind: 'text', key: 'nome::like' } },
    {
      id: 'id_filial',
      labelKey: 'catalog.colecoes.fields.branch',
      label: 'Filial',
      sortKey: 'id_filial',
      thClassName: 'w-[180px]',
      render: (record) => String((record.filial as { nome_fantasia?: string; nome?: string } | undefined)?.nome_fantasia || (record.filial as { nome?: string } | undefined)?.nome || record.id_filial || '-'),
      filter: {
        kind: 'lookup',
        key: 'id_filial',
        loadOptions: async (query, page, perPage) =>
          (await loadCrudLookupOptions('filiais', query, page, perPage)).map((option) => ({
            id: option.value,
            label: option.label,
          })),
      },
    },
    {
      id: 'restrito',
      labelKey: 'catalog.colecoes.fields.restricted',
      label: 'Restrito',
      sortKey: 'restrito',
      thClassName: 'w-[110px]',
      render: (record) => {
        const checked = record.restrito === true || record.restrito === 1 || record.restrito === '1'
        return <StatusBadge tone={checked ? 'success' : 'warning'}>{checked ? 'Sim' : 'Não'}</StatusBadge>
      },
      filter: { kind: 'select', key: 'restrito', options: [{ value: '1', label: 'Sim' }, { value: '0', label: 'Não' }] },
    },
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
        { key: 'restrito', labelKey: 'catalog.colecoes.fields.restricted', label: 'Restrito', type: 'toggle' },
        { key: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', type: 'text' },
        { key: 'id_filial', labelKey: 'catalog.colecoes.fields.branch', label: 'Filial', type: 'lookup', optionsResource: 'filiais', lookupStateKey: 'id_filial_lookup' },
        { key: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', type: 'text', required: true },
        { key: 'selo', labelKey: 'catalog.fields.seal', label: 'Selo', type: 'image', uploadProfileId: 'tenant-public-images', uploadFolder: 'colecoes' },
        { key: 'imagem', labelKey: 'catalog.fields.banner', label: 'Banner', type: 'image', uploadProfileId: 'tenant-public-images', uploadFolder: 'colecoes' },
        { key: 'imagem_mobile', labelKey: 'catalog.fields.mobileBanner', label: 'Banner mobile', type: 'image', uploadProfileId: 'tenant-public-images', uploadFolder: 'colecoes' },
        { key: 'link', labelKey: 'catalog.fields.link', label: 'Link do banner', type: 'text' },
        { key: 'target', labelKey: 'catalog.fields.target', label: 'Target do banner', type: 'select', options: [{ value: '_self', label: 'Mesma janela' }, { value: '_blank', label: 'Nova janela' }] },
        { key: 'descricao', labelKey: 'catalog.fields.description', label: 'Descrição', type: 'richtext' },
      ],
    },
  ],
  normalizeRecord: (record) => ({
    ...record,
    id_filial_lookup: record.id_filial
      ? {
          id: String(record.id_filial),
          label: String((record.filial as { nome_fantasia?: string; nome?: string } | undefined)?.nome_fantasia || (record.filial as { nome?: string } | undefined)?.nome || record.id_filial),
        }
      : null,
  }),
}
