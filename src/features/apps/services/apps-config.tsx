import { Bot, FileSearch, Rocket, Send, Smartphone } from 'lucide-react'
import { AppsFileUploads } from '@/src/features/apps/components/apps-file-uploads'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { formatDateTime } from '@/src/lib/date-time'
import { APP_DEFAULTS, buildAppPayload, normalizeAppRecord } from '@/src/features/apps/services/apps-mappers'
import type { CrudModuleConfig, CrudRecord } from '@/src/components/crud-base/types'

function text(value: unknown) {
  return String(value ?? '').trim()
}

function activeBadge(value: unknown, yes: string, no: string) {
  const checked = value === true || value === 1 || value === '1'
  return <StatusBadge tone={checked ? 'success' : 'warning'}>{checked ? yes : no}</StatusBadge>
}

function renderLastLog(record: CrudRecord) {
  const value = text(record.last_log_created_at)
  return value ? formatDateTime(value) : 'N/A'
}

function defaultValue(key: string) {
  const value = APP_DEFAULTS[key]
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null ? value : undefined
}

export const APPS_CONFIG: CrudModuleConfig = {
  key: 'apps',
  resource: 'apps',
  routeBase: '/cadastros/apps',
  featureKey: 'apps',
  listTitleKey: 'registrations.apps.title',
  listTitle: 'Apps',
  listDescriptionKey: 'registrations.apps.listDescription',
  listDescription: 'Apps mobile, identidade visual, arquivos Firebase e publicação via GitHub Actions.',
  formTitleKey: 'registrations.apps.formTitle',
  formTitle: 'App',
  breadcrumbSectionKey: 'routes.cadastros',
  breadcrumbSection: 'Cadastros',
  breadcrumbModuleKey: 'registrations.apps.title',
  breadcrumbModule: 'Apps',
  defaultFilters: {
    page: 1,
    perPage: 15,
    orderBy: 'chave_cliente',
    sort: 'asc',
    id: '',
    'chave_cliente::like': '',
    'nome_app::like': '',
    'identificador_app::like': '',
    ativo: '',
  },
  listEmbed: 'last_log',
  normalizeRecord: normalizeAppRecord,
  beforeSave: (record) => buildAppPayload(record),
  stayOnSave: true,
  columns: [
    { id: 'chave_cliente', labelKey: 'registrations.apps.fields.clientKey', label: 'Chave', sortKey: 'chave_cliente', tdClassName: 'min-w-[160px] font-semibold text-[color:var(--app-text)]', filter: { kind: 'text', key: 'chave_cliente::like' } },
    { id: 'nome_app', labelKey: 'registrations.apps.fields.appName', label: 'Nome', sortKey: 'nome_app', tdClassName: 'min-w-[220px] font-semibold text-[color:var(--app-text)]', filter: { kind: 'text', key: 'nome_app::like' } },
    { id: 'identificador_app', labelKey: 'registrations.apps.fields.identifier', label: 'Identificador', sortKey: 'identificador_app', visibility: 'lg', tdClassName: 'min-w-[260px]', filter: { kind: 'text', key: 'identificador_app::like' } },
    { id: 'last_log_created_at', labelKey: 'registrations.apps.fields.lastUpdate', label: 'Última Atualização', visibility: 'xl', render: renderLastLog },
    { id: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', sortKey: 'ativo', thClassName: 'w-[110px]', filter: { kind: 'select', key: 'ativo', options: [{ value: '1', label: 'Sim' }, { value: '0', label: 'Não' }] }, render: (record, { t }) => activeBadge(record.ativo, t('common.yes', 'Sim'), t('common.no', 'Não')) },
  ],
  mobileTitle: (record) => text(record.nome_app) || '-',
  mobileSubtitle: (record) => text(record.chave_cliente) || text(record.identificador_app) || '-',
  mobileMeta: (record) => `ID: ${String(record.id || '-')}`,
  actionsColumnClassName: 'w-[232px] min-w-[232px] whitespace-nowrap',
  buildListRowActions: ({ record, t }) => [
    {
      id: 'build',
      label: t('registrations.apps.actions.buildAndroid', 'Compilar Android'),
      icon: Rocket,
      onClick: () => window.dispatchEvent(new CustomEvent('apps:build', { detail: { id: record.id, name: record.nome_app || record.chave_cliente || record.id } })),
      visible: true,
    },
    {
      id: 'publish-android',
      label: t('registrations.apps.actions.publishAndroid', 'Publicar Google Play'),
      icon: Bot,
      onClick: () => window.dispatchEvent(new CustomEvent('apps:deploy', { detail: { id: record.id, platform: 'android', name: record.nome_app || record.chave_cliente || record.id } })),
      visible: true,
    },
    {
      id: 'publish-ios',
      label: t('registrations.apps.actions.publishIos', 'Publicar App Store'),
      icon: Send,
      onClick: () => window.dispatchEvent(new CustomEvent('apps:deploy', { detail: { id: record.id, platform: 'ios', name: record.nome_app || record.chave_cliente || record.id } })),
      visible: true,
    },
    {
      id: 'logs',
      label: t('simpleCrud.actions.logs', 'Logs'),
      icon: FileSearch,
      onClick: () => window.dispatchEvent(new CustomEvent('apps:logs', { detail: { id: record.id, chaveCliente: record.chave_cliente } })),
      visible: true,
    },
  ],
  sections: [
    {
      id: 'general',
      titleKey: 'basicRegistrations.sections.general',
      title: 'Dados gerais',
      layout: 'rows',
      fields: [
        { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle', defaultValue: defaultValue('ativo'), required: true },
        { key: 'id_empresa', labelKey: 'registrations.apps.fields.company', label: 'Empresa', type: 'lookup', required: true, optionsResource: 'empresas', lookupStateKey: 'id_empresa_lookup' },
        { key: 'chave_cliente', labelKey: 'registrations.apps.fields.clientKey', label: 'Chave do Cliente', type: 'text', required: true, maxLength: 50, helperTextKey: 'registrations.apps.hints.clientKey', helperText: 'Slug usado no clients.json e nos workflows do GitHub.' },
        { key: 'identificador_app', labelKey: 'registrations.apps.fields.identifier', label: 'Identificador do App', type: 'text', required: true, maxLength: 150, helperTextKey: 'registrations.apps.hints.identifier', helperText: 'Bundle/Package do app, por exemplo br.com.nordil.' },
        { key: 'nome_app', labelKey: 'registrations.apps.fields.appName', label: 'Nome do App', type: 'text', required: true, maxLength: 100 },
        { key: 'versao_app', labelKey: 'registrations.apps.fields.version', label: 'Versão', type: 'text', defaultValue: defaultValue('versao_app'), maxLength: 20 },
        { key: 'build_ios', labelKey: 'registrations.apps.fields.iosBuild', label: 'Build iOS', type: 'number', defaultValue: defaultValue('build_ios'), inputMode: 'numeric' },
        { key: 'build_android', labelKey: 'registrations.apps.fields.androidBuild', label: 'Build Android', type: 'number', defaultValue: defaultValue('build_android'), inputMode: 'numeric' },
        { key: 'url_empresa', labelKey: 'registrations.apps.fields.companyUrl', label: 'URL da Empresa', type: 'text', required: true, maxLength: 255 },
      ],
    },
    {
      id: 'theme',
      titleKey: 'registrations.apps.sections.theme',
      title: 'Cores',
      layout: 'rows',
      fields: [
        { key: 'cor_splash_background', labelKey: 'registrations.apps.fields.splashBackground', label: 'Cor Splash Background', type: 'color', defaultValue: defaultValue('cor_splash_background'), maxLength: 7 },
        { key: 'cor_header', labelKey: 'registrations.apps.fields.headerColor', label: 'Cor Header', type: 'color', defaultValue: defaultValue('cor_header'), maxLength: 7 },
        { key: 'cor_botao', labelKey: 'registrations.apps.fields.buttonColor', label: 'Cor Botão', type: 'color', defaultValue: defaultValue('cor_botao'), maxLength: 7 },
        { key: 'cor_texto', labelKey: 'registrations.apps.fields.textColor', label: 'Cor Texto', type: 'color', defaultValue: defaultValue('cor_texto'), maxLength: 7 },
        { key: 'cor_sem_internet', labelKey: 'registrations.apps.fields.noInternetColor', label: 'Cor Tela Sem Internet', type: 'color', defaultValue: defaultValue('cor_sem_internet'), maxLength: 7 },
      ],
    },
    {
      id: 'texts',
      titleKey: 'registrations.apps.sections.texts',
      title: 'Textos do app',
      layout: 'rows',
      fields: [
        { key: 'login_titulo', labelKey: 'registrations.apps.fields.loginTitle', label: 'Título Login', type: 'text', defaultValue: defaultValue('login_titulo'), maxLength: 255 },
        { key: 'login_subtitulo', labelKey: 'registrations.apps.fields.loginSubtitle', label: 'Subtítulo Login', type: 'text', defaultValue: defaultValue('login_subtitulo'), maxLength: 255 },
        { key: 'login_esqueci_senha', labelKey: 'registrations.apps.fields.loginForgot', label: 'Texto Esqueci minha senha', type: 'text', defaultValue: defaultValue('login_esqueci_senha'), maxLength: 255 },
        { key: 'login_cta', labelKey: 'registrations.apps.fields.loginCta', label: 'Texto CTA Login', type: 'text', defaultValue: defaultValue('login_cta'), maxLength: 255 },
        { key: 'login_primeiro_acesso', labelKey: 'registrations.apps.fields.loginFirstAccess', label: 'Texto Primeiro acesso', type: 'text', defaultValue: defaultValue('login_primeiro_acesso'), maxLength: 255 },
        { key: 'fp_titulo', labelKey: 'registrations.apps.fields.fpTitle', label: 'Título Esqueci senha', type: 'text', defaultValue: defaultValue('fp_titulo'), maxLength: 255 },
        { key: 'fp_subtitulo', labelKey: 'registrations.apps.fields.fpSubtitle', label: 'Subtítulo Esqueci senha', type: 'text', defaultValue: defaultValue('fp_subtitulo'), maxLength: 255 },
        { key: 'fp_cta', labelKey: 'registrations.apps.fields.fpCta', label: 'Texto CTA Esqueci senha', type: 'text', defaultValue: defaultValue('fp_cta'), maxLength: 255 },
        { key: 'alerta_titulo', labelKey: 'registrations.apps.fields.alertTitle', label: 'Título padrão alerta', type: 'text', defaultValue: defaultValue('alerta_titulo'), maxLength: 255 },
        { key: 'alerta_login_mensagem', labelKey: 'registrations.apps.fields.alertLogin', label: 'Mensagem alerta Login', type: 'text', defaultValue: defaultValue('alerta_login_mensagem'), maxLength: 255 },
        { key: 'alerta_fp_mensagem', labelKey: 'registrations.apps.fields.alertFp', label: 'Mensagem alerta Esqueci Senha', type: 'text', defaultValue: defaultValue('alerta_fp_mensagem'), maxLength: 255 },
        { key: 'alerta_confirmar', labelKey: 'registrations.apps.fields.alertConfirm', label: 'Texto botão confirmação', type: 'text', defaultValue: defaultValue('alerta_confirmar'), maxLength: 255 },
        { key: 'outro_titulo_codigo_barras', labelKey: 'registrations.apps.fields.barcodeTitle', label: 'Título Código de Barras', type: 'text', defaultValue: defaultValue('outro_titulo_codigo_barras'), maxLength: 255 },
        { key: 'outro_titulo_sem_internet', labelKey: 'registrations.apps.fields.noInternetTitle', label: 'Título Tela Sem Internet', type: 'text', defaultValue: defaultValue('outro_titulo_sem_internet'), maxLength: 255 },
        { key: 'outro_mensagem_sem_internet', labelKey: 'registrations.apps.fields.noInternetMessage', label: 'Mensagem Tela Sem Internet', type: 'textarea', rows: 3, defaultValue: defaultValue('outro_mensagem_sem_internet'), maxLength: 255 },
      ],
    },
    {
      id: 'files',
      titleKey: 'registrations.apps.sections.files',
      title: 'Arquivos e configurações',
      layout: 'rows',
      fields: [
        {
          key: 'files',
          labelKey: 'registrations.apps.sections.files',
          label: 'Arquivos',
          type: 'custom',
          render: ({ form, patch, readOnly, disabled }) => (
            <AppsFileUploads form={form} patch={patch} readOnly={readOnly || disabled} />
          ),
        },
      ],
    },
  ],
}

export const APP_LIST_ICON = Smartphone
