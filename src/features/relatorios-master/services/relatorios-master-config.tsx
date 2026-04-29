import { IconPickerPreview } from '@/src/components/ui/icon-picker-field'
import type { CrudModuleConfig, CrudRecord } from '@/src/components/crud-base/types'
import { httpClient } from '@/src/services/http/http-client'

function normalizeRelatorio(record: CrudRecord): CrudRecord {
  const grupo = record.grupo && typeof record.grupo === 'object' ? record.grupo as Record<string, unknown> : null
  const idGrupo = String(record.id_grupo ?? grupo?.id ?? '').trim()
  const nomeGrupo = String(grupo?.nome ?? '').trim()

  return {
    ...record,
    id_grupo: idGrupo,
    id_grupo_lookup: idGrupo ? { id: idGrupo, label: nomeGrupo && nomeGrupo !== idGrupo ? `${nomeGrupo} - ${idGrupo}` : idGrupo } : null,
    query: String(record.query ?? ''),
  }
}

export const RELATORIOS_MASTER_CONFIG: CrudModuleConfig = {
  key: 'relatoriosMaster',
  resource: 'relatorios',
  routeBase: '/cadastros/relatorios-v2',
  featureKey: 'relatorios',
  listTitleKey: 'maintenance.reportsMaster.title',
  listTitle: 'Relatorios v2',
  listDescriptionKey: 'maintenance.reportsMaster.listDescription',
  listDescription: 'Cadastro dos relatorios dinamicos, query e mapeamento de campos.',
  formTitleKey: 'maintenance.reportsMaster.formTitle',
  formTitle: 'Relatorio',
  breadcrumbSectionKey: 'routes.cadastros',
  breadcrumbSection: 'Cadastros',
  breadcrumbModuleKey: 'maintenance.reportsMaster.title',
  breadcrumbModule: 'Relatorios v2',
  defaultFilters: {
    page: 1,
    perPage: 15,
    orderBy: 'id',
    sort: 'asc',
    id: '',
    codigo: '',
    'nome::like': '',
    'grupo:nome::like': '',
    ativo: '',
  },
  normalizeRecord: normalizeRelatorio,
  beforeSave: (record) => ({
    ...record,
    id_grupo: String(record.id_grupo ?? '').trim(),
    query: String(record.query ?? ''),
  }),
  stayOnSave: true,
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[110px]', filter: { kind: 'text', key: 'id' } },
    { id: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Codigo', sortKey: 'codigo', thClassName: 'w-[140px]', filter: { kind: 'text', key: 'codigo' } },
    {
      id: 'grupo',
      labelKey: 'maintenance.reportsMaster.fields.group',
      label: 'Grupo',
      sortKey: 'grupo:nome',
      visibility: 'lg',
      filter: { kind: 'text', key: 'grupo:nome::like' },
      render: (record) => {
        const grupo = record.grupo && typeof record.grupo === 'object' ? record.grupo as Record<string, unknown> : null
        const nome = String(grupo?.nome ?? '').trim()
        return nome || '-'
      },
    },
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
        key: 'id_grupo',
        labelKey: 'maintenance.reportsMaster.fields.group',
        label: 'Grupo',
        type: 'lookup',
        required: true,
        lookupStateKey: 'id_grupo_lookup',
        lookupLoadOptions: async ({ query, page, perPage }) => {
          const response = await httpClient<Array<{ value: string; label: string }>>(`/api/lookups/relatorios-grupos?page=${page}&perPage=${perPage}&q=${encodeURIComponent(query)}`, {
            method: 'GET',
            cache: 'no-store',
          })
          return response.map((option) => ({ id: option.value, label: option.label }))
        },
      },
      {
        key: 'icone',
        labelKey: 'simpleCrud.fields.icon',
        label: 'Icone',
        type: 'icon',
        helperTextKey: 'maintenance.reportsMaster.fields.iconHint',
        helperText: 'Selecione um icone da biblioteca atual para substituir referencias FontAwesome do legado.',
      },
    ],
  }],
}
