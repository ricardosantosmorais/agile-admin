import type { CrudModuleConfig, CrudRecord } from '@/src/components/crud-base/types'
import { normalizeLookupState } from '@/src/lib/lookup-options'

function normalizeCategoriaTarefa(record: CrudRecord): CrudRecord {
  return {
    ...record,
    ...normalizeLookupState(record, 'id_fase', 'fase', 'id_fase_lookup'),
  }
}

export const CATEGORIAS_TAREFAS_CONFIG: CrudModuleConfig = {
  key: 'categoriasTarefas',
  resource: 'implantacao/categorias_tarefas',
  routeBase: '/cadastros/categorias-tarefas',
  featureKey: 'categoriasTarefas',
  listTitleKey: 'registrations.taskCategories.title',
  listTitle: 'Categorias de Tarefas',
  listDescriptionKey: 'registrations.taskCategories.listDescription',
  listDescription: 'Categorias usadas para agrupar tarefas por fase de implantacao.',
  formTitleKey: 'registrations.taskCategories.formTitle',
  formTitle: 'Categoria de Tarefa',
  breadcrumbSectionKey: 'routes.cadastros',
  breadcrumbSection: 'Cadastros',
  breadcrumbModuleKey: 'registrations.taskCategories.title',
  breadcrumbModule: 'Categorias de Tarefas',
  defaultFilters: { page: 1, perPage: 15, orderBy: 'codigo', sort: 'asc', id: '', codigo: '', 'nome::like': '', ativo: '' },
  formEmbed: 'fase',
  normalizeRecord: normalizeCategoriaTarefa,
  beforeSave: (record) => ({
    ...record,
    id_fase: String(record.id_fase ?? '').trim() || null,
    posicao: String(record.posicao ?? '').trim() || null,
  }),
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[110px]', filter: { kind: 'text', key: 'id' } },
    { id: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Codigo', sortKey: 'codigo', thClassName: 'w-[150px]', filter: { kind: 'text', key: 'codigo' } },
    {
      id: 'fase',
      labelKey: 'registrations.taskCategories.fields.phase',
      label: 'Fase',
      visibility: 'lg',
      render: (record) => {
        const fase = record.fase && typeof record.fase === 'object' ? record.fase as Record<string, unknown> : null
        return String(fase?.nome ?? record.id_fase ?? '-')
      },
    },
    { id: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', sortKey: 'nome', tdClassName: 'min-w-[260px] font-semibold text-[color:var(--app-text)]', filter: { kind: 'text', key: 'nome::like' } },
    { id: 'posicao', labelKey: 'simpleCrud.fields.position', label: 'Posicao', sortKey: 'posicao', thClassName: 'w-[120px]' },
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
      { key: 'id_fase', labelKey: 'registrations.taskCategories.fields.phase', label: 'Fase', type: 'lookup', required: true, optionsResource: 'fases', lookupStateKey: 'id_fase_lookup' },
      { key: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Codigo', type: 'text', maxLength: 32 },
      { key: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', type: 'text', required: true, maxLength: 255 },
      { key: 'posicao', labelKey: 'simpleCrud.fields.position', label: 'Posicao', type: 'number', required: true, inputMode: 'numeric' },
    ],
  }],
}
