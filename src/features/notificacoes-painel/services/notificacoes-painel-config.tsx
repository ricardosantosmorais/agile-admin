import { StatusBadge } from '@/src/components/ui/status-badge'
import type { CrudModuleConfig } from '@/src/components/crud-base/types'
import { buildNotificacaoPainelPayload, getNotificacaoPainelChannelLabel, isPublished, normalizeNotificacaoPainelRecord, NOTIFICACAO_PAINEL_CHANNEL_OPTIONS } from '@/src/features/notificacoes-painel/services/notificacoes-painel-mappers'

function formatDate(value: string) {
  const normalized = value.includes('T') ? value : value.replace(' ', 'T')
  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('pt-BR').format(date)
}

function formatDisplayPeriod(record: Record<string, unknown>) {
  const start = record.data_inicio ? formatDate(String(record.data_inicio)) : '-'
  const end = record.data_fim ? formatDate(String(record.data_fim)) : '-'
  return `${start} até ${end}`
}

export const NOTIFICACOES_PAINEL_CONFIG: CrudModuleConfig = {
  key: 'notificacoesPainel',
  resource: 'notificacoes_painel',
  routeBase: '/notificacoes-painel',
  featureKey: 'notificacoesPainel',
  listTitleKey: 'panelNotifications.title',
  listTitle: 'Notificações',
  listDescriptionKey: 'panelNotifications.listDescription',
  listDescription: 'Notificações exibidas no painel, com vínculo por empresa, publicação e visualização de usuários.',
  formTitleKey: 'panelNotifications.formTitle',
  formTitle: 'Notificação',
  breadcrumbSectionKey: 'panelNotifications.section',
  breadcrumbSection: 'Notificações',
  breadcrumbModuleKey: 'panelNotifications.title',
  breadcrumbModule: 'Notificações',
  hideBreadcrumbSection: true,
  defaultFilters: {
    page: 1,
    perPage: 15,
    orderBy: 'data_inicio',
    sort: 'desc',
    id: '',
    'titulo::like': '',
    'data_inicio::ge': '',
    'data_fim::le': '',
    canal: '',
    publicado: '',
    ativo: '',
  },
  formEmbed: 'empresas.empresa',
  normalizeRecord: normalizeNotificacaoPainelRecord,
  beforeSave: buildNotificacaoPainelPayload,
  stayOnSave: true,
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[90px]', filter: { kind: 'text', key: 'id' } },
    { id: 'titulo', labelKey: 'simpleCrud.fields.title', label: 'Título', sortKey: 'titulo', tdClassName: 'font-semibold text-[color:var(--app-text)]', filter: { kind: 'text', key: 'titulo::like' } },
    { id: 'data_inicio', labelKey: 'panelNotifications.fields.displayPeriod', label: 'Exibição', sortKey: 'data_inicio', render: formatDisplayPeriod, filter: { kind: 'date-range', fromKey: 'data_inicio::ge', toKey: 'data_fim::le' } },
    { id: 'canal', labelKey: 'panelNotifications.fields.channel', label: 'Canal', sortKey: 'canal', render: (record) => getNotificacaoPainelChannelLabel(record.canal), filter: { kind: 'select', key: 'canal', options: NOTIFICACAO_PAINEL_CHANNEL_OPTIONS.map(({ value, label }) => ({ value, label })) } },
    { id: 'publicado', labelKey: 'panelNotifications.fields.published', label: 'Publicada', sortKey: 'publicado', render: (record, { t }) => {
      const checked = isPublished(record.publicado)
      return <StatusBadge tone={checked ? 'success' : 'warning'}>{checked ? t('common.yes', 'Sim') : t('common.no', 'Não')}</StatusBadge>
    }, filter: { kind: 'select', key: 'publicado', options: [{ value: '1', label: 'Sim' }, { value: '0', label: 'Não' }] } },
    { id: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', sortKey: 'ativo', valueKey: 'ativo', filter: { kind: 'select', key: 'ativo', options: [{ value: '1', label: 'Sim' }, { value: '0', label: 'Não' }] } },
  ],
  mobileTitle: (record) => String(record.titulo || '-'),
  mobileSubtitle: (record) => formatDisplayPeriod(record),
  mobileMeta: (record) => `ID: ${String(record.id || '-')}`,
  sections: [
    {
      id: 'general',
      titleKey: 'basicRegistrations.sections.general',
      title: 'Dados gerais',
      layout: 'rows',
      fields: [
        { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle', defaultValue: true, required: true },
        { key: 'registrar_changelog', labelKey: 'panelNotifications.fields.registerChangelog', label: 'Registrar changelog', type: 'toggle', defaultValue: false },
        { key: 'titulo', labelKey: 'simpleCrud.fields.title', label: 'Título', type: 'text', required: true, maxLength: 50 },
        { key: 'canal', labelKey: 'panelNotifications.fields.channel', label: 'Canal', type: 'select', required: true, options: [{ value: '', label: 'Selecione' }, ...NOTIFICACAO_PAINEL_CHANNEL_OPTIONS] },
        { key: 'data_inicio', labelKey: 'panelNotifications.fields.startDate', label: 'Data de Início', type: 'date', required: true },
        { key: 'data_fim', labelKey: 'panelNotifications.fields.endDate', label: 'Data Fim', type: 'date', required: true },
        { key: 'mensagem', labelKey: 'panelNotifications.fields.message', label: 'Mensagem', type: 'richtext' },
      ],
    },
  ],
}
