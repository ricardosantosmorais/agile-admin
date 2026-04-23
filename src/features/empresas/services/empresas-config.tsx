import type { CrudModuleConfig, CrudRecord } from '@/src/components/crud-base/types'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { buildEmpresaPayload, mapEmpresaDetail } from '@/src/features/empresas/services/empresas-form'
import { formatCpfCnpj } from '@/src/lib/formatters'

const STATUS_OPTIONS = [
  { value: 'producao', labelKey: 'rootCompanies.options.status.producao', label: 'Produção' },
  { value: 'homologacao', labelKey: 'rootCompanies.options.status.homologacao', label: 'Homologação' },
  { value: 'pausado', labelKey: 'rootCompanies.options.status.pausado', label: 'Pausado' },
  { value: 'cancelado', labelKey: 'rootCompanies.options.status.cancelado', label: 'Cancelado' },
]

const TYPE_OPTIONS = [
  { value: 'b2b', labelKey: 'rootCompanies.options.type.b2b', label: 'B2B' },
  { value: 'b2c', labelKey: 'rootCompanies.options.type.b2c', label: 'B2C' },
]

const ERP_OPTIONS = [
  { value: 'aps', labelKey: 'rootCompanies.options.erp.aps', label: 'APS' },
  { value: 'bm', labelKey: 'rootCompanies.options.erp.bm', label: 'BM' },
  { value: 'consinco', labelKey: 'rootCompanies.options.erp.consinco', label: 'Consinco' },
  { value: 'gcf', labelKey: 'rootCompanies.options.erp.gcf', label: 'GCF' },
  { value: 'proprio', labelKey: 'rootCompanies.options.erp.proprio', label: 'Próprio' },
  { value: 'protheus', labelKey: 'rootCompanies.options.erp.protheus', label: 'Protheus' },
  { value: 'sankhya', labelKey: 'rootCompanies.options.erp.sankhya', label: 'Sankhya' },
  { value: 'sap', labelKey: 'rootCompanies.options.erp.sap', label: 'SAP' },
  { value: 'winthor', labelKey: 'rootCompanies.options.erp.winthor', label: 'Winthor' },
  { value: 'omie', labelKey: 'rootCompanies.options.erp.omie', label: 'Omie' },
  { value: 'outros', labelKey: 'rootCompanies.options.erp.outros', label: 'Outros/Nenhum' },
]

const UF_OPTIONS = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
]

function isTruthy(value: unknown) {
  return value === true || value === 1 || value === '1'
}

function statusTone(status: unknown): 'success' | 'warning' | 'danger' | 'neutral' {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'producao') return 'success'
  if (normalized === 'homologacao') return 'warning'
  if (normalized === 'cancelado') return 'danger'
  return 'neutral'
}

function statusFallback(record: CrudRecord) {
  const match = STATUS_OPTIONS.find((item) => item.value === String(record.status || '').toLowerCase())
  return match?.label || String(record.status || '-')
}

export const EMPRESAS_CONFIG: CrudModuleConfig = {
  key: 'empresas',
  resource: 'empresas',
  routeBase: '/empresas',
  featureKey: 'empresas',
  listTitleKey: 'rootCompanies.title',
  listTitle: 'Empresas',
  listDescriptionKey: 'rootCompanies.listDescription',
  listDescription: 'Gerencie empresas do perfil Agile E-commerce com os mesmos filtros centrais do legado.',
  formTitleKey: 'rootCompanies.formTitle',
  formTitle: 'Empresa',
  hideBreadcrumbSection: true,
  breadcrumbSectionKey: 'routes.administration',
  breadcrumbSection: 'Administração',
  breadcrumbModuleKey: 'rootCompanies.title',
  breadcrumbModule: 'Empresas',
  selectable: false,
  actionsColumnClassName: 'w-[88px] whitespace-nowrap',
  defaultFilters: {
    page: 1,
    perPage: 15,
    orderBy: 'nome_fantasia',
    sort: 'asc',
    id: '',
    codigo: '',
    cnpj: '',
    'nome_fantasia::like': '',
    status: '',
    manutencao: '',
    bloqueado: '',
    ativo: '',
  },
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[14%]', filter: { kind: 'text', key: 'id' } },
    { id: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', sortKey: 'codigo', thClassName: 'w-[9%]', filter: { kind: 'text', key: 'codigo' } },
    {
      id: 'cnpj',
      labelKey: 'rootCompanies.fields.document',
      label: 'CNPJ',
      sortKey: 'cnpj',
      thClassName: 'w-[15%]',
      render: (record) => formatCpfCnpj(record.cnpj),
      filter: { kind: 'text', key: 'cnpj', labelKey: 'rootCompanies.fields.document', label: 'CNPJ' },
    },
    {
      id: 'nome_fantasia',
      labelKey: 'rootCompanies.fields.tradeName',
      label: 'Nome fantasia',
      sortKey: 'nome_fantasia',
      thClassName: 'w-[21%]',
      tdClassName: 'font-semibold text-slate-950',
      render: (record) => {
        const name = String(record.nome_fantasia || '-')
        const url = String(record.url || '').trim()
        if (!url) {
          return <span className="truncate">{name}</span>
        }

        return <a href={url} target="_blank" rel="noreferrer" className="truncate text-sky-700 hover:underline">{name}</a>
      },
      filter: { kind: 'text', key: 'nome_fantasia::like', labelKey: 'rootCompanies.fields.tradeName', label: 'Nome fantasia' },
    },
    {
      id: 'status',
      labelKey: 'rootCompanies.fields.status',
      label: 'Status',
      sortKey: 'status',
      thClassName: 'w-[12%]',
      render: (record, { t }) => <StatusBadge tone={statusTone(record.status)}>{t(`rootCompanies.options.status.${String(record.status || '').toLowerCase()}`, statusFallback(record))}</StatusBadge>,
      filter: { kind: 'select', key: 'status', labelKey: 'rootCompanies.fields.status', label: 'Status', options: STATUS_OPTIONS },
    },
    {
      id: 'manutencao',
      labelKey: 'rootCompanies.fields.maintenance',
      label: 'Manutenção',
      sortKey: 'manutencao',
      thClassName: 'w-[11%]',
      render: (record, { t }) => <StatusBadge tone={isTruthy(record.manutencao) ? 'danger' : 'success'}>{isTruthy(record.manutencao) ? t('common.yes', 'Sim') : t('common.no', 'Não')}</StatusBadge>,
      filter: { kind: 'select', key: 'manutencao', labelKey: 'rootCompanies.fields.maintenance', label: 'Manutenção', options: [{ value: '1', label: 'Yes' }, { value: '0', label: 'No' }] },
    },
    {
      id: 'bloqueado',
      labelKey: 'rootCompanies.fields.blocked',
      label: 'Bloqueado',
      sortKey: 'bloqueado',
      thClassName: 'w-[11%]',
      render: (record, { t }) => <StatusBadge tone={isTruthy(record.bloqueado) ? 'danger' : 'success'}>{isTruthy(record.bloqueado) ? t('common.yes', 'Sim') : t('common.no', 'Não')}</StatusBadge>,
      filter: { kind: 'select', key: 'bloqueado', labelKey: 'rootCompanies.fields.blocked', label: 'Bloqueado', options: [{ value: '1', label: 'Yes' }, { value: '0', label: 'No' }] },
    },
    {
      id: 'ativo',
      labelKey: 'simpleCrud.fields.active',
      label: 'Ativo',
      sortKey: 'ativo',
      thClassName: 'w-[9%]',
      valueKey: 'ativo',
      filter: { kind: 'select', key: 'ativo', options: [{ value: '1', label: 'Yes' }, { value: '0', label: 'No' }] },
    },
  ],
  mobileTitle: (record) => String(record.nome_fantasia || '-'),
  mobileSubtitle: (record) => formatCpfCnpj(record.cnpj),
  mobileMeta: (record) => `ID: ${String(record.id || '-')}`,
  renderMobileBadges: (record, { t }) => (
    <div className="flex flex-wrap gap-2">
      <StatusBadge tone={statusTone(record.status)}>{t(`rootCompanies.options.status.${String(record.status || '').toLowerCase()}`, statusFallback(record))}</StatusBadge>
      <StatusBadge tone={isTruthy(record.bloqueado) ? 'danger' : 'success'}>{isTruthy(record.bloqueado) ? t('rootCompanies.fields.blocked', 'Bloqueado') : t('rootCompanies.fields.released', 'Liberado')}</StatusBadge>
    </div>
  ),
  sections: [
    {
      id: 'general',
      titleKey: 'rootCompanies.sections.general',
      title: 'Dados gerais',
      layout: 'rows',
      fields: [
        { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle' },
        { key: 'manutencao', labelKey: 'rootCompanies.fields.maintenance', label: 'Manutenção', type: 'toggle' },
        { key: 'bloqueado', labelKey: 'rootCompanies.fields.blocked', label: 'Bloqueado', type: 'toggle' },
        { key: 'tipo', labelKey: 'rootCompanies.fields.type', label: 'Tipo', type: 'select', options: TYPE_OPTIONS, required: true },
        { key: 'status', labelKey: 'rootCompanies.fields.status', label: 'Status', type: 'select', options: STATUS_OPTIONS, required: true },
        { key: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', type: 'text', disabled: ({ isEditing }) => isEditing },
        { key: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', type: 'text' },
        { key: 'cnpj', labelKey: 'rootCompanies.fields.document', label: 'CNPJ', type: 'text', mask: 'cnpj', required: true },
        { key: 'nome_fantasia', labelKey: 'rootCompanies.fields.tradeName', label: 'Nome fantasia', type: 'text', required: true },
        { key: 'razao_social', labelKey: 'rootCompanies.fields.legalName', label: 'Razão social', type: 'text', required: true },
      ],
    },
    {
      id: 'address',
      titleKey: 'rootCompanies.sections.address',
      title: 'Endereço',
      layout: 'rows',
      fields: [
        { key: 'cep', labelKey: 'rootCompanies.fields.zipCode', label: 'CEP', type: 'text', mask: 'cep', required: true },
        { key: 'endereco', labelKey: 'rootCompanies.fields.address', label: 'Endereço', type: 'text', required: true },
        { key: 'numero', labelKey: 'rootCompanies.fields.number', label: 'Número', type: 'text', required: true },
        { key: 'complemento', labelKey: 'rootCompanies.fields.complement', label: 'Complemento', type: 'text' },
        { key: 'bairro', labelKey: 'rootCompanies.fields.neighborhood', label: 'Bairro', type: 'text', required: true },
        { key: 'cidade', labelKey: 'rootCompanies.fields.city', label: 'Cidade', type: 'text', required: true },
        { key: 'uf', labelKey: 'rootCompanies.fields.state', label: 'UF', type: 'select', options: UF_OPTIONS, required: true },
      ],
    },
    {
      id: 'contacts',
      titleKey: 'rootCompanies.sections.contacts',
      title: 'Contatos',
      layout: 'rows',
      fields: [
        { key: 'intercom', labelKey: 'rootCompanies.fields.intercom', label: 'Suporte Intercom', type: 'toggle' },
        { key: 'email', labelKey: 'simpleCrud.fields.email', label: 'E-mail', type: 'email', required: true },
        { key: 'telefone', labelKey: 'rootCompanies.fields.phone', label: 'Telefone', type: 'text', mask: 'phone' },
        { key: 'celular', labelKey: 'rootCompanies.fields.mobile', label: 'Celular', type: 'text', mask: 'mobile' },
        { key: 'contato_comercial', labelKey: 'rootCompanies.fields.commercialContact', label: 'Contato comercial', type: 'text' },
        { key: 'email_comercial', labelKey: 'rootCompanies.fields.commercialEmail', label: 'E-mail comercial', type: 'email' },
        { key: 'telefone_comercial', labelKey: 'rootCompanies.fields.commercialPhone', label: 'Telefone comercial', type: 'text', mask: 'mobile' },
        { key: 'contato_financeiro', labelKey: 'rootCompanies.fields.financeContact', label: 'Contato financeiro', type: 'text' },
        { key: 'email_financeiro', labelKey: 'rootCompanies.fields.financeEmail', label: 'E-mail financeiro', type: 'email' },
        { key: 'telefone_financeiro', labelKey: 'rootCompanies.fields.financePhone', label: 'Telefone financeiro', type: 'text', mask: 'mobile' },
        { key: 'contato_tecnico', labelKey: 'rootCompanies.fields.technicalContact', label: 'Contato técnico', type: 'text' },
        { key: 'email_tecnico', labelKey: 'rootCompanies.fields.technicalEmail', label: 'E-mail técnico', type: 'email' },
        { key: 'telefone_tecnico', labelKey: 'rootCompanies.fields.technicalPhone', label: 'Telefone técnico', type: 'text', mask: 'mobile' },
      ],
    },
    {
      id: 'implementation',
      titleKey: 'rootCompanies.sections.implementation',
      title: 'Implantação',
      layout: 'rows',
      fields: [
        { key: 'url', labelKey: 'rootCompanies.fields.url', label: 'URL', type: 'text', prefixText: 'https://', required: true },
        { key: 'id_cluster', labelKey: 'rootCompanies.fields.cluster', label: 'Cluster', type: 'lookup', optionsResource: 'clusters', required: true },
        { key: 's3_bucket', labelKey: 'rootCompanies.fields.bucket', label: 'Bucket S3', type: 'text', prefixText: 'https://', suffixText: '.agilecdn.com.br', required: true, disabled: ({ isEditing }) => isEditing },
        { key: 'erp', labelKey: 'rootCompanies.fields.erp', label: 'ERP', type: 'select', options: ERP_OPTIONS, required: true },
        { key: 'id_template', labelKey: 'rootCompanies.fields.template', label: 'Template de integração', type: 'lookup', optionsResource: 'templates_integracao', required: true },
        { key: 'token_integrador', labelKey: 'rootCompanies.fields.integratorToken', label: 'Token do integrador', type: 'text', disabled: ({ isEditing }) => isEditing },
        { key: 'id_implantacao_gerente', labelKey: 'rootCompanies.fields.implementationManager', label: 'Gerente de implantação', type: 'lookup', optionsResource: 'administradores_master' },
        { key: 'id_implantacao_analista', labelKey: 'rootCompanies.fields.implementationAnalyst', label: 'Analista de implantação', type: 'lookup', optionsResource: 'administradores_master' },
        { key: 'monday_url', labelKey: 'rootCompanies.fields.mondayUrl', label: 'URL do projeto no Monday', type: 'text' },
        { key: 'data_inicio_implantacao', labelKey: 'rootCompanies.fields.startDate', label: 'Data início', type: 'date' },
        { key: 'dias_previsao_implantacao', labelKey: 'rootCompanies.fields.implementationDays', label: 'Dias previstos', type: 'number', inputMode: 'numeric' },
        { key: 'data_fim_implantacao', labelKey: 'rootCompanies.fields.endDate', label: 'Data conclusão', type: 'date' },
      ],
    },
    {
      id: 'financial',
      titleKey: 'rootCompanies.sections.financial',
      title: 'Financeiro',
      layout: 'rows',
      fields: [
        { key: 'fatura_totvs', labelKey: 'rootCompanies.fields.invoiceTotvs', label: 'Faturamento pela TOTVS', type: 'toggle' },
      ],
    },
  ],
  normalizeRecord: (record: CrudRecord) => mapEmpresaDetail(record) as CrudRecord,
  beforeSave: (record: CrudRecord) => buildEmpresaPayload(record as Record<string, unknown>) as CrudRecord,
}
