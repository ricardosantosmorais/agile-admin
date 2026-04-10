import { loadCrudLookupOptions } from '@/src/components/crud-base/crud-client'
import type { CrudModuleConfig, CrudListFilters } from '@/src/components/crud-base/types'
import { FormField } from '@/src/components/ui/form-field'
import { LookupSelect } from '@/src/components/ui/lookup-select'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { isTruthyFlag } from '@/src/lib/boolean-utils'

function DepartamentoPaiFilter({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <FormField label="Departamento pai">
      <LookupSelect
        label="Departamento pai"
        value={value ? { id: value, label: value } : null}
        onChange={(nextValue) => onChange(nextValue?.id ?? '')}
        loadOptions={async (query, page, perPage) =>
          (await loadCrudLookupOptions('departamentos', query, page, perPage)).map((option) => ({
            id: option.value,
            label: option.label,
          }))}
      />
    </FormField>
  )
}

export const DEPARTAMENTOS_CONFIG: CrudModuleConfig = {
  key: 'departamentos',
  resource: 'departamentos',
  routeBase: '/departamentos',
  featureKey: 'departamentos',
  listTitleKey: 'catalog.departamentos.title',
  listTitle: 'Departamentos',
  listDescriptionKey: 'catalog.departamentos.description',
  listDescription: 'Listagem de departamentos.',
  formTitleKey: 'catalog.departamentos.formTitle',
  formTitle: 'Departamento',
  breadcrumbSectionKey: 'simpleCrud.sections.catalog',
  breadcrumbSection: 'Catálogo',
  breadcrumbModuleKey: 'catalog.departamentos.title',
  breadcrumbModule: 'Departamentos',
  defaultFilters: { page: 1, perPage: 15, orderBy: 'nome', sort: 'asc', id: '', id_departamento_pai: '', 'nome::like': '', posicao: '', disponivel: '', ativo: '' },
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[180px]', filter: { kind: 'text', key: 'id' } },
    {
      id: 'departamento_pai',
      labelKey: 'catalog.departamentos.fields.parentDepartment',
      label: 'Departamento pai',
      sortKey: 'departamento_pai:nome',
      render: (record) => String((record.departamento_pai as { nome?: string } | undefined)?.nome || '-- Raiz --'),
      filter: {
        kind: 'custom',
        label: 'Departamento pai',
        render: ({ draft, patchDraft }) => (
          <DepartamentoPaiFilter
            value={String((draft as CrudListFilters).id_departamento_pai || '')}
            onChange={(value) => patchDraft('id_departamento_pai', value as CrudListFilters['id_departamento_pai'])}
          />
        ),
      },
    },
    { id: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', sortKey: 'nome', tdClassName: 'font-semibold text-slate-950', filter: { kind: 'text', key: 'nome::like' } },
    { id: 'posicao', labelKey: 'simpleCrud.fields.position', label: 'Posição', sortKey: 'posicao', thClassName: 'w-[110px]', filter: { kind: 'text', key: 'posicao' } },
    {
      id: 'disponivel',
      labelKey: 'catalog.departamentos.fields.available',
      label: 'Disponível',
      sortKey: 'disponivel',
      thClassName: 'w-[110px]',
      render: (record) => {
        const checked = isTruthyFlag(record.disponivel)
        return <StatusBadge tone={checked ? 'success' : 'warning'}>{checked ? 'Sim' : 'Não'}</StatusBadge>
      },
      filter: { kind: 'select', key: 'disponivel', options: [{ value: '1', label: 'Sim' }, { value: '0', label: 'Não' }] },
    },
    { id: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', sortKey: 'ativo', thClassName: 'w-[100px]', valueKey: 'ativo', filter: { kind: 'select', key: 'ativo', options: [{ value: '1', label: 'Sim' }, { value: '0', label: 'Não' }] } },
  ],
  mobileTitle: (record) => String(record.nome || '-'),
  mobileSubtitle: (record) => String((record.departamento_pai as { nome?: string } | undefined)?.nome || '-- Raiz --'),
  mobileMeta: (record) => `ID: ${String(record.id || '-')}`,
  sections: [
    {
      id: 'general',
      titleKey: 'catalog.sections.general',
      title: 'Dados gerais',
      layout: 'rows',
      fields: [
        { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle' },
        { key: 'feed', labelKey: 'catalog.fields.feed', label: 'Feed de dados', type: 'toggle' },
        { key: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', type: 'text' },
        { key: 'id_departamento_pai', labelKey: 'catalog.departamentos.fields.parentDepartment', label: 'Departamento pai', type: 'lookup', optionsResource: 'departamentos', lookupStateKey: 'id_departamento_pai_lookup' },
        { key: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', type: 'text', required: true },
        { key: 'posicao', labelKey: 'simpleCrud.fields.position', label: 'Posição', type: 'number' },
        { key: 'icone', labelKey: 'catalog.departamentos.fields.icon', label: 'Ícone', type: 'icon' },
        { key: 'imagem', labelKey: 'catalog.fields.banner', label: 'Banner', type: 'image', uploadProfileId: 'tenant-public-images', uploadFolder: 'departamentos' },
        { key: 'imagem_mobile', labelKey: 'catalog.fields.mobileBanner', label: 'Banner mobile', type: 'image', uploadProfileId: 'tenant-public-images', uploadFolder: 'departamentos' },
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
        { key: 'codigo_google', labelKey: 'catalog.departamentos.fields.googleCode', label: 'Código Google', type: 'text' },
      ],
    },
  ],
  normalizeRecord: (record) => ({
    ...record,
    id_departamento_pai_lookup: record.id_departamento_pai
      ? {
          id: String(record.id_departamento_pai),
          label: String((record.departamento_pai as { nome?: string } | undefined)?.nome || record.id_departamento_pai),
        }
      : null,
  }),
}
