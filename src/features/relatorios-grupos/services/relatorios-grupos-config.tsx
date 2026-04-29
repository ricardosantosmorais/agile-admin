import { IconPickerPreview } from '@/src/components/ui/icon-picker-field'
import type { CrudModuleConfig } from '@/src/components/crud-base/types'

export const RELATORIOS_GRUPOS_CONFIG: CrudModuleConfig = {
  key: 'relatoriosGrupos',
  resource: 'relatorios/grupos',
  routeBase: '/cadastros/relatorios-grupos',
  featureKey: 'relatoriosGrupos',
  listTitleKey: 'registrations.reportGroups.title',
  listTitle: 'Grupos de Relatorios',
  listDescriptionKey: 'registrations.reportGroups.listDescription',
  listDescription: 'Grupos usados para organizar os relatorios dinamicos.',
  formTitleKey: 'registrations.reportGroups.formTitle',
  formTitle: 'Grupo de Relatorios',
  breadcrumbSectionKey: 'routes.cadastros',
  breadcrumbSection: 'Cadastros',
  breadcrumbModuleKey: 'registrations.reportGroups.title',
  breadcrumbModule: 'Grupos de Relatorios',
  defaultFilters: { page: 1, perPage: 15, orderBy: 'id', sort: 'asc', id: '', codigo: '', 'nome::like': '', ativo: '' },
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[110px]', filter: { kind: 'text', key: 'id' } },
    { id: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Codigo', sortKey: 'codigo', thClassName: 'w-[150px]', filter: { kind: 'text', key: 'codigo' } },
    {
      id: 'nome',
      labelKey: 'simpleCrud.fields.name',
      label: 'Nome',
      sortKey: 'nome',
      tdClassName: 'min-w-[280px] font-semibold text-[color:var(--app-text)]',
      filter: { kind: 'text', key: 'nome::like' },
      render: (record) => (
        <span className="inline-flex min-w-0 items-center gap-2">
          {record.icone ? <IconPickerPreview value={String(record.icone)} className="h-4 w-4 shrink-0" /> : null}
          <span className="truncate">{String(record.nome ?? '-')}</span>
        </span>
      ),
    },
    { id: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', sortKey: 'ativo', thClassName: 'w-[110px]', valueKey: 'ativo', filter: { kind: 'select', key: 'ativo', options: [{ value: '1', label: 'Sim' }, { value: '0', label: 'Nao' }] } },
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
      { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle', defaultValue: true, required: true },
      { key: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Codigo', type: 'text', maxLength: 32 },
      { key: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', type: 'text', required: true, maxLength: 255 },
      {
        key: 'icone',
        labelKey: 'simpleCrud.fields.icon',
        label: 'Icone',
        type: 'icon',
        helperTextKey: 'registrations.reportGroups.fields.iconHint',
        helperText: 'Selecione um icone da biblioteca atual. Icones FontAwesome do legado sao convertidos para uma sugestao compativel.',
      },
    ],
  }],
}
