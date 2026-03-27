'use client'

import type { CrudModuleConfig, CrudRecord } from '@/src/components/crud-base/types'
import { StatusBadge } from '@/src/components/ui/status-badge'
import {
  normalizeCurrency,
  normalizeInteger,
  parseInteger,
  parseNullableCurrency,
  trimNullable,
} from '@/src/features/financeiro/services/financeiro-form'
import {
  FORMA_PAGAMENTO_TIPO_OPTIONS,
  forceInternalizacaoManual,
  getFormaPagamentoTipoLabel,
} from '@/src/features/formas-pagamento/services/formas-pagamento-mappers'

function normalizeRecord(record: CrudRecord): CrudRecord {
  const next: CrudRecord = {
    ...record,
    parcela_minima: normalizeCurrency(record.parcela_minima),
    valor_taxas: normalizeCurrency(record.valor_taxas),
    posicao: normalizeInteger(record.posicao),
    ordem: normalizeInteger(record.ordem),
  }
  return next
}

function beforeSave(record: CrudRecord): CrudRecord {
  return {
    ...record,
    codigo: trimNullable(record.codigo),
    nome: trimNullable(record.nome),
    instrucoes: trimNullable(record.instrucoes),
    instrucoes_entrega: trimNullable(record.instrucoes_entrega),
    parcela_minima: parseNullableCurrency(record.parcela_minima),
    valor_taxas: parseNullableCurrency(record.valor_taxas),
    posicao: parseInteger(record.posicao),
    ordem: parseInteger(record.ordem),
    internaliza_auto: forceInternalizacaoManual(record),
  }
}

export const FORMAS_PAGAMENTO_CONFIG: CrudModuleConfig = {
  key: 'formas-pagamento',
  resource: 'formas_pagamento',
  routeBase: '/formas-de-pagamento',
  featureKey: 'formasPagamento',
  listTitleKey: 'financial.paymentMethods.title',
  listTitle: 'Formas de pagamento',
  listDescriptionKey: 'financial.paymentMethods.listDescription',
  listDescription: 'Listagem com tipo, restrição, validação de limite e status.',
  formTitleKey: 'financial.paymentMethods.formTitle',
  formTitle: 'Forma de pagamento',
  breadcrumbSectionKey: 'routes.financeiro',
  breadcrumbSection: 'Financeiro',
  breadcrumbModuleKey: 'routes.formasPagamento',
  breadcrumbModule: 'Formas de pagamento',
  formEmbed: 'condicoes_pagamento.condicao_pagamento,restricoes,excecoes',
  defaultFilters: {
    page: 1,
    perPage: 15,
    orderBy: 'nome',
    sort: 'asc',
    id: '',
    'codigo::like': '',
    'nome::like': '',
    tipo: '',
    ativo: '',
  },
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[180px]', filter: { kind: 'text', key: 'id' } },
    { id: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', sortKey: 'codigo', thClassName: 'w-[140px]', filter: { kind: 'text', key: 'codigo::like' } },
    { id: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', sortKey: 'nome', tdClassName: 'font-semibold text-slate-950', filter: { kind: 'text', key: 'nome::like' } },
    {
      id: 'tipo',
      labelKey: 'financial.paymentMethods.fields.type',
      label: 'Tipo de pagamento',
      sortKey: 'tipo',
      filter: { kind: 'select', key: 'tipo', options: FORMA_PAGAMENTO_TIPO_OPTIONS.map((option) => ({ value: option.value, label: option.label, labelKey: option.labelKey })) },
      render: (record) => getFormaPagamentoTipoLabel(record.tipo),
    },
    {
      id: 'restrito',
      labelKey: 'financial.paymentMethods.fields.restricted',
      label: 'Restrito',
      sortKey: 'restrito',
      thClassName: 'w-[110px]',
      render: (record) => <StatusBadge tone={record.restrito ? 'success' : 'warning'}>{record.restrito ? 'Sim' : 'Não'}</StatusBadge>,
    },
    {
      id: 'valida_limite',
      labelKey: 'financial.paymentMethods.fields.validateCredit',
      label: 'Valida limite',
      sortKey: 'valida_limite',
      thClassName: 'w-[110px]',
      render: (record) => <StatusBadge tone={record.valida_limite ? 'success' : 'warning'}>{record.valida_limite ? 'Sim' : 'Não'}</StatusBadge>,
    },
    { id: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', sortKey: 'ativo', thClassName: 'w-[100px]', valueKey: 'ativo', filter: { kind: 'select', key: 'ativo', options: [{ value: '1', label: 'Sim' }, { value: '0', label: 'Não' }] } },
  ],
  mobileTitle: (record) => String(record.nome || '-'),
  mobileSubtitle: (record) => getFormaPagamentoTipoLabel(record.tipo),
  mobileMeta: (record) => `ID: ${String(record.id || '-')}`,
  sections: [
    {
      id: 'flags',
      titleKey: 'financial.sections.general',
      title: 'Dados gerais',
      layout: 'rows',
      fields: [
        { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle' },
        { key: 'app', labelKey: 'financial.paymentMethods.fields.appOnly', label: 'Exclusivo APP', type: 'toggle', helperTextKey: 'financial.paymentMethods.helpers.appOnly', helperText: 'Indica se essa forma de pagamento é disponível apenas para uso no APP.' },
        { key: 'cliente_restrito', labelKey: 'financial.paymentMethods.fields.customerRestricted', label: 'Cliente restrito', type: 'toggle', helperTextKey: 'financial.paymentMethods.helpers.customerRestricted', helperText: 'Indica se a forma de pagamento pode ser utilizada por clientes com restrição.' },
        { key: 'aplica_condicao_pagamento', labelKey: 'financial.paymentMethods.fields.defaultCondition', label: 'Condição de pagamento padrão', type: 'toggle', helperTextKey: 'financial.paymentMethods.helpers.defaultCondition', helperText: 'Indica se a plataforma aplicará a condição de pagamento de menor parcela ou prazo médio como padrão.' },
        { key: 'peso_variavel', labelKey: 'financial.paymentMethods.fields.variableWeight', label: 'Peso variável', type: 'toggle', helperTextKey: 'financial.paymentMethods.helpers.variableWeight', helperText: 'Indica se pedidos com produtos de peso variável sofrerão acréscimo para ajuste após pesagem.' },
        { key: 'prazo_medio', labelKey: 'financial.paymentMethods.fields.averageTermFlag', label: 'Prazo médio', type: 'toggle', helperTextKey: 'financial.paymentMethods.helpers.averageTermFlag', helperText: 'Indica se considera prazo médio dos clientes para liberar as condições de pagamento associadas.' },
        { key: 'restrito', labelKey: 'financial.paymentMethods.fields.restricted', label: 'Restrito', type: 'toggle', helperTextKey: 'financial.paymentMethods.helpers.restricted', helperText: 'Indica se apenas clientes vinculados a essa forma de pagamento podem utilizá-la.' },
        { key: 'valida_limite', labelKey: 'financial.paymentMethods.fields.validateCredit', label: 'Valida limite de crédito', type: 'toggle', helperTextKey: 'financial.paymentMethods.helpers.validateCredit', helperText: 'Indica se valida o limite de crédito do cliente antes de concluir o pedido.' },
        { key: 'exibe_condicao_valor', labelKey: 'financial.paymentMethods.fields.showConditionsByValue', label: 'Exibe condições por valor do pedido', type: 'toggle', helperTextKey: 'financial.paymentMethods.helpers.showConditionsByValue', helperText: 'Indica se a plataforma exibirá apenas as condições de pagamento compatíveis com o valor do pedido.' },
        { key: 'internaliza_auto', labelKey: 'financial.paymentMethods.fields.autoInternalize', label: 'Internaliza imediato', type: 'toggle', helperTextKey: 'financial.paymentMethods.helpers.autoInternalize', helperText: 'Indica se os pedidos com essa forma de pagamento serão internalizados imediatamente pelo ERP.' },
      ],
    },
    {
      id: 'basic',
      titleKey: 'financial.paymentMethods.sections.basic',
      title: 'Identificação',
      layout: 'rows',
      fields: [
        { key: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', type: 'text' },
        {
          key: 'perfil',
          labelKey: 'simpleCrud.fields.profile',
          label: 'Perfil',
          type: 'select',
          required: true,
          options: [
            { value: 'todos', labelKey: 'common.profiles.all', label: 'Todos' },
            { value: 'cliente', labelKey: 'common.profiles.customer', label: 'Cliente' },
            { value: 'vendedor', labelKey: 'common.profiles.seller', label: 'Vendedor' },
          ],
        },
        { key: 'tipo', labelKey: 'financial.paymentMethods.fields.type', label: 'Tipo', type: 'select', required: true, options: FORMA_PAGAMENTO_TIPO_OPTIONS },
        { key: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', type: 'text', required: true },
        { key: 'parcela_minima', labelKey: 'financial.paymentMethods.fields.minimumInstallment', label: 'Parcela mínima', type: 'text', mask: 'currency', prefixText: 'R$' },
        { key: 'valor_taxas', labelKey: 'financial.paymentMethods.fields.fees', label: 'Taxas', type: 'text', mask: 'currency', prefixText: 'R$' },
        { key: 'posicao', labelKey: 'simpleCrud.fields.position', label: 'Posição', type: 'number' },
        { key: 'ordem', labelKey: 'financial.paymentMethods.fields.order', label: 'Ordem', type: 'number' },
      ],
    },
    {
      id: 'instructions',
      titleKey: 'financial.paymentMethods.sections.instructions',
      title: 'Instruções',
      layout: 'rows',
      fields: [
        { key: 'instrucoes', labelKey: 'financial.paymentMethods.fields.paymentInstructions', label: 'Instruções de pagamento', type: 'textarea', rows: 5 },
        { key: 'instrucoes_entrega', labelKey: 'financial.paymentMethods.fields.deliveryInstructions', label: 'Instruções de entrega', type: 'textarea', rows: 5 },
      ],
    },
  ],
  normalizeRecord,
  beforeSave,
}
