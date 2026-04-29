import { CodeEditor } from '@/src/components/ui/code-editor'
import { StatusBadge } from '@/src/components/ui/status-badge'
import type { CrudModuleConfig, CrudRecord } from '@/src/components/crud-base/types'
import { buildComponentePayload, normalizeComponenteRecord } from '@/src/features/componentes/services/componentes-mappers'

const COMPONENTE_TIPO_OPTIONS = [
  { value: 'banner', labelKey: 'registrations.components.types.banner', label: 'Banner' },
  { value: 'vitrine', labelKey: 'registrations.components.types.showcase', label: 'Vitrine' },
]

function booleanBadge(value: unknown, yes: string, no: string) {
  const checked = value === true || value === 1 || value === '1'
  return <StatusBadge tone={checked ? 'success' : 'warning'}>{checked ? yes : no}</StatusBadge>
}

function validateJson(value: unknown) {
  const content = String(value ?? '').trim()
  if (!content) {
    return null
  }

  try {
    JSON.parse(content)
    return null
  } catch {
    return 'registrations.components.validation.invalidJson'
  }
}

export const COMPONENTES_CONFIG: CrudModuleConfig = {
  key: 'componentes',
  resource: 'componentes',
  routeBase: '/componentes',
  featureKey: 'componentes',
  listTitleKey: 'registrations.components.title',
  listTitle: 'Componentes',
  listDescriptionKey: 'registrations.components.listDescription',
  listDescription: 'Componentes visuais usados pelo site, com template JSON e campos configuraveis.',
  formTitleKey: 'registrations.components.formTitle',
  formTitle: 'Componente',
  breadcrumbSectionKey: 'routes.cadastros',
  breadcrumbSection: 'Cadastros',
  breadcrumbModuleKey: 'routes.componentes',
  breadcrumbModule: 'Componentes',
  defaultFilters: {
    page: 1,
    perPage: 15,
    orderBy: 'nome',
    sort: 'asc',
    id: '',
    codigo: '',
    'nome::like': '',
    tipo: '',
    ativo: '',
  },
  formEmbed: 'campos',
  normalizeRecord: normalizeComponenteRecord,
  beforeSave: (record) => buildComponentePayload(record) as CrudRecord,
  stayOnSave: true,
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[120px]', filter: { kind: 'text', key: 'id' } },
    { id: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Codigo', sortKey: 'codigo', thClassName: 'w-[150px]', filter: { kind: 'text', key: 'codigo' } },
    { id: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', sortKey: 'nome', tdClassName: 'min-w-[240px] font-semibold text-[color:var(--app-text)]', filter: { kind: 'text', key: 'nome::like' } },
    { id: 'tipo', labelKey: 'registrations.components.fields.type', label: 'Tipo', sortKey: 'tipo', thClassName: 'w-[160px]', filter: { kind: 'select', key: 'tipo', options: COMPONENTE_TIPO_OPTIONS } },
    { id: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', sortKey: 'ativo', thClassName: 'w-[110px]', filter: { kind: 'select', key: 'ativo', options: [{ value: '1', label: 'Sim' }, { value: '0', label: 'Nao' }] }, render: (record, { t }) => booleanBadge(record.ativo, t('common.yes', 'Sim'), t('common.no', 'Nao')) },
  ],
  mobileTitle: (record) => String(record.nome || '-'),
  mobileSubtitle: (record) => String(record.tipo || record.codigo || '-'),
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
      { key: 'tipo', labelKey: 'registrations.components.fields.type', label: 'Tipo', type: 'select', required: true, options: [{ value: '', labelKey: 'common.select', label: 'Selecione' }, ...COMPONENTE_TIPO_OPTIONS] },
      { key: 'arquivo', labelKey: 'registrations.components.fields.file', label: 'Arquivo', type: 'text', required: true, maxLength: 255 },
      { key: 'imagem', labelKey: 'registrations.components.fields.image', label: 'Imagem', type: 'image', uploadProfileId: 'public-cdn-components' },
      {
        key: 'json',
        labelKey: 'registrations.components.fields.defaultTemplate',
        label: 'Template padrao (JSON)',
        type: 'custom',
        validate: ({ value }) => validateJson(value),
        render: ({ value, readOnly, disabled, patch }) => (
          <div className="space-y-3">
            <CodeEditor
              editorId="componente-template-json"
              language="json"
              value={String(value ?? '')}
              onChange={(nextValue) => patch('json', nextValue)}
              readOnly={readOnly || disabled}
              height="360px"
            />
            <button
              type="button"
              className="app-button-secondary inline-flex rounded-full px-4 py-2 text-sm font-semibold"
              onClick={() => {
                const content = String(value ?? '').trim()
                if (!content) {
                  return
                }
                try {
                  patch('json', JSON.stringify(JSON.parse(content), null, 2))
                } catch {
                  // A validacao do formulario mostra a mensagem ao salvar.
                }
              }}
            >
              Formatar codigo
            </button>
          </div>
        ),
      },
    ],
  }],
}
