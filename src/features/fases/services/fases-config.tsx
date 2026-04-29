import { IconPickerPreview } from '@/src/components/ui/icon-picker-field'
import type { CrudModuleConfig } from '@/src/components/crud-base/types'

export const FASES_CONFIG: CrudModuleConfig = {
  key: 'fases',
  resource: 'implantacao/fases',
  routeBase: '/fases',
  featureKey: 'fases',
  listTitleKey: 'registrations.phases.title',
  listTitle: 'Fases',
  listDescriptionKey: 'registrations.phases.listDescription',
  listDescription: 'Listagem com codigo, nome, posicao, icone e status ativo.',
  formTitleKey: 'registrations.phases.formTitle',
  formTitle: 'Fase',
  breadcrumbSectionKey: 'routes.cadastros',
  breadcrumbSection: 'Cadastros',
  breadcrumbModuleKey: 'routes.fases',
  breadcrumbModule: 'Fases',
  defaultFilters: { page: 1, perPage: 15, orderBy: 'nome', sort: 'asc', id: '', codigo: '', 'nome::like': '', posicao: '', icone: '', ativo: '' },
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[180px]', filter: { kind: 'text', key: 'id' } },
    { id: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Codigo', sortKey: 'codigo', thClassName: 'w-[140px]', filter: { kind: 'text', key: 'codigo' } },
    { id: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', sortKey: 'nome', tdClassName: 'font-semibold text-[color:var(--app-text)]', filter: { kind: 'text', key: 'nome::like' } },
    { id: 'posicao', labelKey: 'simpleCrud.fields.position', label: 'Posicao', sortKey: 'posicao', thClassName: 'w-[120px]', filter: { kind: 'text', key: 'posicao', inputMode: 'numeric' } },
    {
      id: 'icone',
      labelKey: 'registrations.phases.fields.icon',
      label: 'Icone',
      sortKey: 'icone',
      visibility: 'lg',
      thClassName: 'w-[120px]',
      filter: { kind: 'text', key: 'icone' },
      render: (record) => record.icone ? (
        <span className="app-control-muted inline-flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--app-text)]">
          <IconPickerPreview value={String(record.icone)} className="h-4 w-4" />
        </span>
      ) : '-',
    },
    { id: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', sortKey: 'ativo', thClassName: 'w-[100px]', valueKey: 'ativo', filter: { kind: 'select', key: 'ativo', options: [{ value: '1', label: 'Sim' }, { value: '0', label: 'Nao' }] } },
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
      { key: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Codigo', type: 'text', maxLength: 32 },
      { key: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', type: 'text', required: true, maxLength: 255 },
      { key: 'posicao', labelKey: 'simpleCrud.fields.position', label: 'Posicao', type: 'number', required: true, inputMode: 'numeric' },
      {
        key: 'icone',
        labelKey: 'registrations.phases.fields.icon',
        label: 'Icone',
        type: 'icon',
        helperTextKey: 'registrations.phases.fields.iconHint',
        helperText: 'Selecione um icone da biblioteca atual. Icones FontAwesome do legado sao convertidos para uma sugestao compativel.',
      },
    ],
  }],
}
