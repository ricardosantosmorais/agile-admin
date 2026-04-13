import type { CrudModuleConfig } from '@/src/components/crud-base/types'

function normalizeSearchTermText(value: unknown) {
  return String(value || '').trim().replace(/^[?\uFFFD\s]+|[?\uFFFD\s]+$/g, '')
}

export const TERMOS_PESQUISA_CONFIG: CrudModuleConfig = {
  key: 'termos-pesquisa',
  resource: 'termos_pesquisa',
  routeBase: '/termos-de-pesquisa',
  featureKey: 'termosPesquisa',
  listTitleKey: 'maintenance.searchTerms.title',
  listTitle: 'Termos de Pesquisa',
  listDescriptionKey: 'maintenance.searchTerms.listDescription',
  listDescription: 'Listagem com termos, resultado de busca e status ativo.',
  formTitleKey: 'maintenance.searchTerms.formTitle',
  formTitle: 'Termo de Pesquisa',
  breadcrumbSectionKey: 'routes.manutencao',
  breadcrumbSection: 'Manutenção',
  breadcrumbModuleKey: 'routes.termosPesquisa',
  breadcrumbModule: 'Termos de Pesquisa',
  defaultFilters: { page: 1, perPage: 15, orderBy: 'id', sort: 'asc', id: '', 'termos::like': '', 'resultado::like': '', ativo: '' },
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[120px]', filter: { kind: 'text', key: 'id' } },
    {
      id: 'termos',
      labelKey: 'maintenance.searchTerms.fields.terms',
      label: 'Termos de Pesquisa',
      sortKey: 'termos',
      thClassName: 'min-w-[18rem] max-w-[26rem]',
      tdClassName: 'max-w-[26rem] font-semibold text-[color:var(--app-text)]',
      filter: { kind: 'text', key: 'termos::like' },
      render: (record) => (
        <span className="block max-w-[26rem] whitespace-normal break-words leading-5">
          {String(record.termos || '-')}
        </span>
      ),
    },
    {
      id: 'resultado',
      labelKey: 'maintenance.searchTerms.fields.result',
      label: 'Resultado de Busca',
      sortKey: 'resultado',
      thClassName: 'min-w-[14rem] max-w-[22rem]',
      tdClassName: 'max-w-[22rem]',
      filter: { kind: 'text', key: 'resultado::like' },
      render: (record) => (
        <span className="block max-w-[22rem] whitespace-normal break-words leading-5">
          {String(record.resultado || '-')}
        </span>
      ),
    },
    { id: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', sortKey: 'ativo', thClassName: 'w-[100px]', valueKey: 'ativo', filter: { kind: 'select', key: 'ativo', options: [{ value: '1', label: 'Sim' }, { value: '0', label: 'Não' }] } },
  ],
  mobileTitle: (record) => String(record.termos || '-'),
  mobileSubtitle: (record) => String(record.resultado || '-'),
  mobileMeta: (record) => `ID: ${String(record.id || '-')}`,
  sections: [{
    id: 'main',
    titleKey: 'basicRegistrations.sections.general',
    title: 'Dados gerais',
    layout: 'rows',
    fields: [
      { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle', defaultValue: true },
      {
        key: 'termos',
        labelKey: 'maintenance.searchTerms.fields.terms',
        label: 'Termos de Pesquisa',
        type: 'text',
        required: true,
        maxLength: 500,
        helperTextKey: 'maintenance.searchTerms.fields.termsHint',
        helperText: 'Separados por vírgula.',
      },
      {
        key: 'resultado',
        labelKey: 'maintenance.searchTerms.fields.result',
        label: 'Resultado de Busca',
        type: 'text',
        required: true,
        maxLength: 50,
        helperTextKey: 'maintenance.searchTerms.fields.resultHint',
        helperText: 'Pesquisa realizada quando algum termo for informado.',
      },
    ],
  }],
  beforeSave: (record) => ({
    ...record,
    termos: normalizeSearchTermText(record.termos),
    resultado: normalizeSearchTermText(record.resultado),
  }),
}

