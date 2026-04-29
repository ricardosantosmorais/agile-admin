import { CodeEditor } from '@/src/components/ui/code-editor'
import type { CrudModuleConfig } from '@/src/components/crud-base/types'
import { EMAIL_PAYLOAD_TYPE_OPTIONS, getEmailPayloadTypeLabel } from '@/src/features/emails-payloads/services/emails-payloads-options'

export const EMAILS_PAYLOADS_CONFIG: CrudModuleConfig = {
  key: 'emailsPayloads',
  resource: 'emails_payloads',
  routeBase: '/cadastros/emails-payloads',
  featureKey: 'emailsPayloads',
  listTitleKey: 'maintenance.emailPayloads.title',
  listTitle: 'E-mails Payloads',
  listDescriptionKey: 'maintenance.emailPayloads.listDescription',
  listDescription: 'Payloads usados nos eventos de e-mail do legado.',
  formTitleKey: 'maintenance.emailPayloads.formTitle',
  formTitle: 'E-mail Payload',
  breadcrumbSectionKey: 'routes.cadastros',
  breadcrumbSection: 'Cadastros',
  breadcrumbModuleKey: 'maintenance.emailPayloads.title',
  breadcrumbModule: 'E-mails Payloads',
  defaultFilters: {
    page: 1,
    perPage: 15,
    orderBy: 'id',
    sort: 'asc',
    id: '',
    codigo: '',
    'titulo::like': '',
    ativo: '',
  },
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[110px]', filter: { kind: 'text', key: 'id' } },
    { id: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Codigo', sortKey: 'codigo', thClassName: 'w-[150px]', filter: { kind: 'text', key: 'codigo' } },
    { id: 'titulo', labelKey: 'simpleCrud.fields.title', label: 'Titulo', sortKey: 'titulo', tdClassName: 'min-w-[260px] font-semibold text-[color:var(--app-text)]', filter: { kind: 'text', key: 'titulo::like' } },
    { id: 'tipo', labelKey: 'maintenance.emailPayloads.fields.type', label: 'Tipo', visibility: 'lg', render: (record) => getEmailPayloadTypeLabel(record.tipo) },
    { id: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', sortKey: 'ativo', thClassName: 'w-[110px]', valueKey: 'ativo', filter: { kind: 'select', key: 'ativo', options: [{ value: '1', label: 'Sim' }, { value: '0', label: 'Nao' }] } },
  ],
  mobileTitle: (record) => String(record.titulo || '-'),
  mobileSubtitle: (record) => getEmailPayloadTypeLabel(record.tipo),
  mobileMeta: (record) => `ID: ${String(record.id || '-')}`,
  sections: [{
    id: 'main',
    titleKey: 'basicRegistrations.sections.general',
    title: 'Dados gerais',
    layout: 'rows',
    fields: [
      { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle', defaultValue: true, required: true },
      { key: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Codigo', type: 'text', maxLength: 32 },
      { key: 'titulo', labelKey: 'simpleCrud.fields.title', label: 'Titulo', type: 'text', maxLength: 255 },
      { key: 'tipo', labelKey: 'maintenance.emailPayloads.fields.type', label: 'Tipo', type: 'select', options: EMAIL_PAYLOAD_TYPE_OPTIONS },
      {
        key: 'payload',
        labelKey: 'maintenance.emailPayloads.fields.payload',
        label: 'Payload',
        type: 'custom',
        render: ({ value, readOnly, disabled, patch }) => (
          <CodeEditor
            editorId="email-payload-json"
            language="json"
            value={String(value ?? '')}
            onChange={(nextValue) => patch('payload', nextValue)}
            readOnly={readOnly || disabled}
            height="360px"
          />
        ),
      },
    ],
  }],
}
