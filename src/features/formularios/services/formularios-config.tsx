import { FileSearch, Lock } from 'lucide-react'
import type { CrudModuleConfig, CrudRecord } from '@/src/components/crud-base/types'

function toTrimmedString(value: unknown) {
  return String(value ?? '').trim()
}

function toNullableString(value: unknown) {
  const normalized = toTrimmedString(value)
  return normalized ? normalized : null
}

function toBoolean(value: unknown) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === '1' || normalized === 'true' || normalized === 'sim'
  }
  return false
}

function isProtectedForm(form: CrudRecord) {
  return toBoolean(form.protegido)
}

function buildExternalUrl(tenantUrl: string | null | undefined, slug: string | null | undefined) {
  if (!tenantUrl || !slug) {
    return null
  }

  const base = tenantUrl.endsWith('/') ? tenantUrl.slice(0, -1) : tenantUrl
  const suffix = slug.startsWith('/') ? slug : `/${slug}`
  return `${base}${suffix}`
}

export function normalizeFormularioRecord(record: CrudRecord): CrudRecord {
  return {
    ...record,
    ativo: toBoolean(record.ativo),
    menu: toBoolean(record.menu),
    protegido: toBoolean(record.protegido),
  }
}

export function serializeFormularioRecord(record: CrudRecord): CrudRecord {
  return {
    ...record,
    ativo: toBoolean(record.ativo),
    menu: toBoolean(record.menu),
    codigo: toNullableString(record.codigo),
    titulo: toTrimmedString(record.titulo),
    icone: toNullableString(record.icone),
    mensagem_alerta: toNullableString(record.mensagem_alerta),
    mensagem_confirmacao: toNullableString(record.mensagem_confirmacao),
    instrucoes: toNullableString(record.instrucoes),
  }
}

export const FORMULARIOS_CONFIG: CrudModuleConfig = {
  key: 'formularios',
  resource: 'formularios',
  routeBase: '/formularios',
  featureKey: 'formularios',
  listTitleKey: 'maintenance.forms.title',
  listTitle: 'Formulários',
  listDescriptionKey: 'maintenance.forms.listDescription',
  listDescription: 'Listagem com código, nome e status ativo do formulário.',
  formTitleKey: 'maintenance.forms.formTitle',
  formTitle: 'Formulário',
  breadcrumbSectionKey: 'routes.manutencao',
  breadcrumbSection: 'Manutenção',
  breadcrumbModuleKey: 'routes.formularios',
  breadcrumbModule: 'Formulários',
  defaultFilters: {
    page: 1,
    perPage: 15,
    orderBy: 'titulo',
    sort: 'asc',
    id: '',
    codigo: '',
    'titulo::like': '',
    ativo: '',
  },
  listEmbed: 'url',
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[90px]', filter: { kind: 'text', key: 'id', inputMode: 'numeric' } },
    { id: 'codigo', labelKey: 'maintenance.forms.fields.code', label: 'Código', sortKey: 'codigo', thClassName: 'w-[180px]', filter: { kind: 'text', key: 'codigo' } },
    {
      id: 'titulo',
      labelKey: 'maintenance.forms.fields.title',
      label: 'Nome',
      sortKey: 'titulo',
      tdClassName: 'font-semibold text-slate-950',
      filter: { kind: 'text', key: 'titulo::like' },
      render: (record, context) => {
        const protectedLabel = toBoolean(record.protegido)
        const slug = typeof record.url === 'object' && record.url !== null && 'slug' in record.url && typeof record.url.slug === 'string'
          ? record.url.slug
          : null
        const targetUrl = buildExternalUrl(context.tenantUrl, slug)
        const title = String(record.titulo || '-')

        return (
          <span className="inline-flex max-w-full items-center gap-1.5">
            {protectedLabel ? <Lock className="h-3.5 w-3.5 shrink-0 text-slate-500" /> : null}
            {targetUrl ? (
              <a
                href={targetUrl}
                target="_blank"
                rel="noreferrer"
                className="truncate text-slate-950 underline decoration-dotted underline-offset-2"
              >
                {title}
              </a>
            ) : (
              <span className="truncate">{title}</span>
            )}
          </span>
        )
      },
    },
    {
      id: 'ativo',
      labelKey: 'simpleCrud.fields.active',
      label: 'Ativo',
      sortKey: 'ativo',
      thClassName: 'w-[110px]',
      valueKey: 'ativo',
      filter: {
        kind: 'select',
        key: 'ativo',
        options: [
          { value: '1', labelKey: 'common.yes', label: 'Sim' },
          { value: '0', labelKey: 'common.no', label: 'Não' },
        ],
      },
    },
  ],
  mobileTitle: (record) => String(record.titulo || '-'),
  mobileSubtitle: (record) => String(record.codigo || '-'),
  mobileMeta: (record) => `ID: ${String(record.id || '-')}`,
  sections: [
    {
      id: 'main',
      titleKey: 'basicRegistrations.sections.general',
      title: 'Dados gerais',
      layout: 'rows',
      fields: [
        { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle', defaultValue: true },
        { key: 'menu', labelKey: 'maintenance.forms.fields.userMenu', label: 'Menu do Usuário', type: 'toggle', defaultValue: false, disabled: ({ form }) => isProtectedForm(form) },
        { key: 'codigo', labelKey: 'maintenance.forms.fields.code', label: 'Código', type: 'text', maxLength: 32, disabled: ({ form }) => isProtectedForm(form) },
        { key: 'titulo', labelKey: 'maintenance.forms.fields.title', label: 'Título', type: 'text', required: true, maxLength: 255 },
        { key: 'icone', labelKey: 'maintenance.forms.fields.icon', label: 'Ícone', type: 'text', maxLength: 255 },
        { key: 'mensagem_alerta', labelKey: 'maintenance.forms.fields.alertMessage', label: 'Mensagem de alerta', type: 'text', maxLength: 255 },
        { key: 'mensagem_confirmacao', labelKey: 'maintenance.forms.fields.confirmationMessage', label: 'Mensagem de confirmação', type: 'text', maxLength: 255 },
        { key: 'instrucoes', labelKey: 'maintenance.forms.fields.instructions', label: 'Instruções', type: 'textarea', rows: 5 },
      ],
    },
  ],
  normalizeRecord: normalizeFormularioRecord,
  beforeSave: serializeFormularioRecord,
  canDeleteRow: (record) => !toBoolean(record.protegido),
  canSelectRow: (record) => !toBoolean(record.protegido),
  buildListRowActions: ({ record, t }) => [
    {
      id: 'logs',
      label: t('maintenance.logs.title', 'Logs'),
      icon: FileSearch,
      href: `/logs?modulo=FRM&id_registro=${record.id}`,
    },
  ],
}
