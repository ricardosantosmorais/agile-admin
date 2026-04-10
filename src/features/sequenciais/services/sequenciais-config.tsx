import type { CrudModuleConfig } from '@/src/components/crud-base/types'
import { getSequencialModuleLabel, SEQUENCIAIS_MODULE_OPTIONS } from '@/src/features/sequenciais/services/sequenciais-options'

export const SEQUENCIAIS_CONFIG: CrudModuleConfig = {
  key: 'sequenciais',
  resource: 'sequenciais',
  routeBase: '/sequenciais',
  featureKey: 'sequenciais',
  listTitleKey: 'maintenance.sequences.title',
  listTitle: 'Sequenciais',
  listDescriptionKey: 'maintenance.sequences.listDescription',
  listDescription: 'Listagem por módulo e valor sequencial.',
  formTitleKey: 'maintenance.sequences.formTitle',
  formTitle: 'Sequencial',
  breadcrumbSectionKey: 'routes.manutencao',
  breadcrumbSection: 'Manutenção',
  breadcrumbModuleKey: 'routes.sequenciais',
  breadcrumbModule: 'Sequenciais',
  defaultFilters: { page: 1, perPage: 15, orderBy: 'id', sort: 'asc', id: '', sequencial: '' },
  columns: [
    { id: 'id', labelKey: 'maintenance.sequences.fields.module', label: 'Módulo', sortKey: 'id', thClassName: 'w-[240px]', render: (record) => getSequencialModuleLabel(record.id), filter: { kind: 'select', key: 'id', options: SEQUENCIAIS_MODULE_OPTIONS.map((item) => ({ value: item.value, label: item.label })) } },
    { id: 'sequencial', labelKey: 'maintenance.sequences.fields.sequence', label: 'Sequencial', sortKey: 'sequencial', thClassName: 'w-[140px]', filter: { kind: 'text', key: 'sequencial', inputMode: 'numeric' } },
  ],
  mobileTitle: (record) => getSequencialModuleLabel(record.id),
  mobileSubtitle: (record) => String(record.sequencial || '-'),
  mobileMeta: (record) => `ID: ${String(record.id || '-')}`,
  sections: [{
    id: 'main',
    titleKey: 'basicRegistrations.sections.general',
    title: 'Dados gerais',
    layout: 'rows',
    fields: [
      {
        key: 'id',
        labelKey: 'maintenance.sequences.fields.module',
        label: 'Módulo',
        type: 'select',
        required: true,
        options: SEQUENCIAIS_MODULE_OPTIONS.map((item) => ({ value: item.value, label: item.label })),
        hidden: ({ isEditing }) => isEditing,
      },
      { key: 'sequencial', labelKey: 'maintenance.sequences.fields.sequence', label: 'Sequencial', type: 'number', required: true },
    ],
  }],
  beforeSave: (record) => ({
    ...record,
    id: String(record.id || '').trim(),
    sequencial: String(record.sequencial || '').trim(),
  }),
}
