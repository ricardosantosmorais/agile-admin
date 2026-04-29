import type { CrudModuleConfig, CrudRecord } from '@/src/components/crud-base/types'
import { httpClient } from '@/src/services/http/http-client'
import { normalizeLookupState } from '@/src/lib/lookup-options'

function normalizeTarefa(record: CrudRecord): CrudRecord {
  return {
    ...record,
    ...normalizeLookupState(record, 'id_fase', 'fase', 'id_fase_lookup'),
    ...normalizeLookupState(record, 'id_categoria', 'categoria', 'id_categoria_lookup'),
    id_empresa_lookup: record.id_empresa ? { id: String(record.id_empresa), label: String(record.id_empresa) } : null,
  }
}

export const TAREFAS_CONFIG: CrudModuleConfig = {
  key: 'tarefas',
  resource: 'implantacao/tarefas',
  routeBase: '/cadastros/tarefas',
  featureKey: 'tarefas',
  listTitleKey: 'registrations.tasks.title',
  listTitle: 'Tarefas',
  listDescriptionKey: 'registrations.tasks.listDescription',
  listDescription: 'Tarefas de implantacao vinculadas a fases, categorias e empresas.',
  formTitleKey: 'registrations.tasks.formTitle',
  formTitle: 'Tarefa',
  breadcrumbSectionKey: 'routes.cadastros',
  breadcrumbSection: 'Cadastros',
  breadcrumbModuleKey: 'registrations.tasks.title',
  breadcrumbModule: 'Tarefas',
  defaultFilters: { page: 1, perPage: 15, orderBy: 'nome', sort: 'asc', id: '', codigo: '', 'nome::like': '', ativo: '' },
  normalizeRecord: normalizeTarefa,
  beforeSave: (record) => ({
    ...record,
    id_fase: String(record.id_fase ?? '').trim() || null,
    id_categoria: String(record.id_categoria ?? '').trim() || null,
    id_empresa: String(record.id_empresa ?? '').trim() || null,
    id_tarefa_pai: String(record.id_tarefa_pai ?? '').trim() || null,
    id_template: String(record.id_template ?? '').trim() || null,
    palavras_chaves: String(record.palavras_chaves ?? '').trim() || null,
    fonte_dados: String(record.fonte_dados ?? '').trim() || null,
    chave: String(record.chave ?? '').trim() || null,
    link: String(record.link ?? '').trim() || null,
  }),
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[110px]', filter: { kind: 'text', key: 'id' } },
    { id: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Codigo', sortKey: 'codigo', thClassName: 'w-[150px]', filter: { kind: 'text', key: 'codigo' } },
    { id: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', sortKey: 'nome', tdClassName: 'min-w-[320px] font-semibold text-[color:var(--app-text)]', filter: { kind: 'text', key: 'nome::like' } },
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
      {
        key: 'id_empresa',
        labelKey: 'registrations.tasks.fields.company',
        label: 'Empresa',
        type: 'lookup',
        optionsResource: 'agilesync_empresas',
        lookupStateKey: 'id_empresa_lookup',
      },
      { key: 'id_fase', labelKey: 'registrations.tasks.fields.phase', label: 'Fase', type: 'lookup', required: true, optionsResource: 'fases', lookupStateKey: 'id_fase_lookup' },
      {
        key: 'id_categoria',
        labelKey: 'registrations.tasks.fields.category',
        label: 'Categoria',
        type: 'lookup',
        required: true,
        optionsResource: 'categorias_tarefas',
        lookupStateKey: 'id_categoria_lookup',
        lookupLoadOptions: async ({ query, page, perPage, form }) => {
          const params = new URLSearchParams({
            page: String(page),
            perPage: String(perPage),
            orderBy: 'nome',
            sort: 'asc',
          })
          const idFase = String(form.id_fase ?? '').trim()
          if (idFase) params.set('id_fase', idFase)
          if (query.trim()) params.set('nome::like', query.trim())
          const response = await httpClient<{ data: Array<{ id?: string | number; nome?: string | null }> }>(`/api/categorias-tarefas?${params.toString()}`, {
            method: 'GET',
            cache: 'no-store',
          })
          return response.data.map((item) => ({ id: String(item.id ?? ''), label: String(item.nome ?? item.id ?? '') })).filter((option) => option.id)
        },
      },
      { key: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', type: 'text', required: true, maxLength: 255 },
      { key: 'posicao', labelKey: 'simpleCrud.fields.position', label: 'Posicao', type: 'number', inputMode: 'numeric' },
      { key: 'descricao', labelKey: 'simpleCrud.fields.description', label: 'Descricao', type: 'textarea', rows: 5 },
      { key: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Codigo', type: 'text', maxLength: 32 },
    ],
  }],
}
