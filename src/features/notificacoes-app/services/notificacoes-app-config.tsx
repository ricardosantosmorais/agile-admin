'use client'

import type { CrudModuleConfig } from '@/src/components/crud-base/types'
import { normalizeNotificacaoRecord, toNotificacaoPayload } from '@/src/features/notificacoes-app/services/notificacoes-app-mappers'
import { formatDateTime } from '@/src/lib/date-time'

export const NOTIFICACOES_APP_CONFIG: CrudModuleConfig = {
  key: 'notificacoes-app',
  resource: 'notificacoes',
  routeBase: '/notificacoes-app',
  featureKey: 'notificacoesApp',
  listTitleKey: 'marketing.notifications.title',
  listTitle: 'Notificações App',
  listDescriptionKey: 'marketing.notifications.listDescription',
  listDescription: 'Listagem com título, data de envio, status enviado e ativo.',
  formTitleKey: 'marketing.notifications.formTitle',
  formTitle: 'Notificação App',
  breadcrumbSectionKey: 'simpleCrud.sections.marketing',
  breadcrumbSection: 'Marketing',
  breadcrumbModuleKey: 'menuKeys.notificacoes-app',
  breadcrumbModule: 'Notificações App',
  defaultFilters: {
    page: 1,
    perPage: 15,
    orderBy: 'data_envio',
    sort: 'desc',
    id: '',
    'titulo::like': '',
    'data_envio::ge': '',
    'data_envio::le': '',
    enviado: '',
    ativo: '',
  },
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[120px]', filter: { kind: 'text', key: 'id' } },
    { id: 'titulo', labelKey: 'simpleCrud.fields.title', label: 'Título', sortKey: 'titulo', tdClassName: 'font-semibold text-slate-950', filter: { kind: 'text', key: 'titulo::like' } },
    { id: 'data_envio', labelKey: 'marketing.notifications.fields.sendAt', label: 'Data de envio', sortKey: 'data_envio', render: (record) => record.data_envio ? formatDateTime(String(record.data_envio)) : '-', filter: { kind: 'date-range', fromKey: 'data_envio::ge', toKey: 'data_envio::le' } },
    { id: 'enviado', labelKey: 'marketing.notifications.fields.sent', label: 'Enviado', sortKey: 'enviado', valueKey: 'enviado', thClassName: 'w-[110px]', filter: { kind: 'select', key: 'enviado', options: [{ value: '1', label: 'Sim' }, { value: '0', label: 'Não' }] } },
    { id: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', sortKey: 'ativo', valueKey: 'ativo', thClassName: 'w-[100px]', filter: { kind: 'select', key: 'ativo', options: [{ value: '1', label: 'Sim' }, { value: '0', label: 'Não' }] } },
  ],
  mobileTitle: (record) => String(record.titulo || '-'),
  mobileSubtitle: (record) => record.data_envio ? formatDateTime(String(record.data_envio)) : '-',
  mobileMeta: (record) => `ID: ${String(record.id || '-')}`,
  sections: [
    {
      id: 'general',
      titleKey: 'marketing.notifications.tabs.general',
      title: 'Dados gerais',
      layout: 'rows',
      fields: [
        { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle' },
        { key: 'titulo', labelKey: 'simpleCrud.fields.title', label: 'Título', type: 'text', required: true, layoutClassName: 'max-w-[760px]' },
        { key: 'mensagem', labelKey: 'marketing.notifications.fields.message', label: 'Mensagem', type: 'textarea', required: true, rows: 6, layoutClassName: 'max-w-3xl' },
        { key: 'data_envio', labelKey: 'marketing.notifications.fields.sendAt', label: 'Data/hora de envio', type: 'datetime-local', required: true, layoutClassName: 'max-w-[280px]' },
        { key: 'link', labelKey: 'catalog.fields.link', label: 'Link', type: 'text', layoutClassName: 'max-w-[760px]' },
      ],
    },
  ],
  normalizeRecord: normalizeNotificacaoRecord,
  beforeSave: toNotificacaoPayload,
}
