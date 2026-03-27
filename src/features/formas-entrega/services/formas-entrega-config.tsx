'use client'

import { loadCrudLookupOptions } from '@/src/components/crud-base/crud-client'
import type { CrudModuleConfig } from '@/src/components/crud-base/types'
import { normalizeFormaEntregaRecord, serializeFormaEntregaRecord } from '@/src/features/formas-entrega/services/formas-entrega-mappers'

function typeLabel(value: unknown) {
  switch (value) {
    case 'calcular':
      return 'A calcular'
    case 'cif':
      return 'CIF'
    case 'fob':
      return 'FOB'
    case 'precificador':
      return 'Precificador'
    case 'retira':
      return 'Retira'
    default:
      return '-'
  }
}

function filialLabel(value: unknown) {
  return typeof value === 'object' && value !== null && 'nome_fantasia' in value
    ? String((value as { nome_fantasia?: unknown }).nome_fantasia || (value as { id?: unknown }).id || '-')
    : '-'
}

function loadFilialLookup(query: string, page: number, perPage: number) {
  return loadCrudLookupOptions('filiais', query, page, perPage).then((options) => options.map((option) => ({
    id: option.value,
    label: option.label,
  })))
}

export const FORMAS_ENTREGA_CONFIG: CrudModuleConfig = {
  key: 'formas-entrega',
  resource: 'formas_entrega',
  routeBase: '/formas-de-entrega',
  featureKey: 'formasEntrega',
  listTitleKey: 'logistics.deliveryMethods.title',
  listTitle: 'Formas de entrega',
  listDescriptionKey: 'logistics.deliveryMethods.listDescription',
  listDescription: 'Listagem com tipo, filiais vinculadas, posição e status ativo.',
  formTitleKey: 'logistics.deliveryMethods.formTitle',
  formTitle: 'Forma de entrega',
  breadcrumbSectionKey: 'routes.logistica',
  breadcrumbSection: 'Logística',
  breadcrumbModuleKey: 'routes.formasEntrega',
  breadcrumbModule: 'Formas de Entrega',
  listEmbed: 'filial,filial_retira',
  formEmbed: 'filial,filial_pedido,filial_estoque,filial_retira,filial_expressa,tabela_preco',
  defaultFilters: {
    page: 1,
    perPage: 15,
    orderBy: 'ativo',
    sort: 'desc',
    id: '',
    'nome::like': '',
    tipo: '',
    id_filial: '',
    id_filial_retira: '',
    posicao: '',
    ativo: '',
  },
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[120px]', filter: { kind: 'text', key: 'id' } },
    { id: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', sortKey: 'nome', tdClassName: 'font-semibold text-slate-950', filter: { kind: 'text', key: 'nome::like' } },
    {
      id: 'tipo',
      labelKey: 'logistics.deliveryMethods.fields.type',
      label: 'Tipo',
      sortKey: 'tipo',
      render: (record) => typeLabel(record.tipo),
      filter: {
        kind: 'select',
        key: 'tipo',
        options: [
          { value: 'calcular', label: 'A calcular' },
          { value: 'cif', label: 'CIF' },
          { value: 'fob', label: 'FOB' },
          { value: 'precificador', label: 'Precificador' },
          { value: 'retira', label: 'Retira' },
        ],
      },
    },
    {
      id: 'filial',
      labelKey: 'logistics.deliveryMethods.fields.branch',
      label: 'Filial',
      sortKey: 'id_filial',
      render: (record) => filialLabel(record.filial),
      filter: { kind: 'lookup', key: 'id_filial', loadOptions: loadFilialLookup },
      visibility: 'xl',
    },
    {
      id: 'filial_retira',
      labelKey: 'logistics.deliveryMethods.fields.pickupBranch',
      label: 'Filial de retirada',
      sortKey: 'id_filial_retira',
      render: (record) => filialLabel(record.filial_retira),
      filter: { kind: 'lookup', key: 'id_filial_retira', loadOptions: loadFilialLookup },
      visibility: 'xl',
    },
    {
      id: 'posicao',
      labelKey: 'logistics.deliveryMethods.fields.position',
      label: 'Posição',
      sortKey: 'posicao',
      thClassName: 'w-[110px]',
      filter: { kind: 'text', key: 'posicao', inputMode: 'numeric' },
    },
    {
      id: 'ativo',
      labelKey: 'simpleCrud.fields.active',
      label: 'Ativo',
      sortKey: 'ativo',
      valueKey: 'ativo',
      thClassName: 'w-[100px]',
      filter: { kind: 'select', key: 'ativo', options: [{ value: '1', label: 'Sim' }, { value: '0', label: 'Não' }] },
    },
  ],
  mobileTitle: (record) => String(record.nome || '-'),
  mobileSubtitle: (record) => typeLabel(record.tipo),
  mobileMeta: (record) => `ID: ${String(record.id || '-')}`,
  sections: [
    {
      id: 'flags',
      titleKey: 'logistics.sections.general',
      title: 'Dados gerais',
      layout: 'rows',
      fields: [
        { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle', defaultValue: true },
        { key: 'acrescimo_condicao_pagamento', labelKey: 'logistics.deliveryMethods.fields.paymentConditionSurcharge', label: 'Acréscimo condição de pagamento', type: 'toggle' },
        { key: 'embarque_maritimo', labelKey: 'logistics.deliveryMethods.fields.maritimeShipment', label: 'Embarque marítimo/fluvial', type: 'toggle' },
        { key: 'app', labelKey: 'logistics.deliveryMethods.fields.appOnly', label: 'Exclusivo app', type: 'toggle' },
        { key: 'informa_veiculo', labelKey: 'logistics.deliveryMethods.fields.vehicleInfo', label: 'Informa dados do veículo', type: 'toggle' },
        { key: 'usa_prazo_rota', labelKey: 'logistics.deliveryMethods.fields.useRouteLeadTime', label: 'Usa prazo da rota', type: 'toggle' },
        { key: 'grupo_filial', labelKey: 'logistics.deliveryMethods.fields.branchGroupPickup', label: 'Retira para filiais do grupo', type: 'toggle', helperTextKey: 'logistics.deliveryMethods.help.branchGroupPickup', helperText: 'No caso dessa forma de entrega ser do tipo "Retira" e ter "Filial de retirada" preenchida, determina se ela será disponibilizada para todas as filiais do grupo em múltiplas encomendas.' },
        { key: 'altera_valor', labelKey: 'logistics.deliveryMethods.fields.sellerChangesPrice', label: 'Vendedor altera valor', type: 'toggle', helperTextKey: 'logistics.deliveryMethods.help.sellerChangesPrice', helperText: 'Permite que vendedores alterem o valor do frete no checkout.' },
        { key: 'observacoes', labelKey: 'logistics.deliveryMethods.fields.observations', label: 'Observações', type: 'toggle' },
      ],
    },
    {
      id: 'basic',
      titleKey: 'logistics.deliveryMethods.sections.settings',
      title: 'Configuração operacional',
      layout: 'rows',
      fields: [
        { key: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', type: 'text' },
        { key: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', type: 'text', required: true },
        { key: 'posicao', labelKey: 'logistics.deliveryMethods.fields.position', label: 'Posição', type: 'number', required: true, inputMode: 'numeric' },
        { key: 'prioridade', labelKey: 'logistics.deliveryMethods.fields.priority', label: 'Prioridade', type: 'number', required: true, inputMode: 'numeric' },
        {
          key: 'tipo',
          labelKey: 'logistics.deliveryMethods.fields.type',
          label: 'Tipo',
          type: 'select',
          required: true,
          options: [
            { value: 'calcular', labelKey: 'logistics.deliveryMethods.types.calcular', label: 'A calcular' },
            { value: 'cif', label: 'CIF' },
            { value: 'fob', label: 'FOB' },
            { value: 'precificador', labelKey: 'logistics.deliveryMethods.types.precificador', label: 'Precificador' },
            { value: 'retira', labelKey: 'logistics.deliveryMethods.types.retira', label: 'Retira' },
          ],
        },
        {
          key: 'perfil',
          labelKey: 'logistics.deliveryMethods.fields.profile',
          label: 'Perfil de usuário',
          type: 'select',
          required: true,
          options: [
            { value: 'todos', labelKey: 'logistics.deliveryMethods.profiles.all', label: 'Todos' },
            { value: 'cliente', labelKey: 'logistics.deliveryMethods.profiles.customer', label: 'Cliente' },
            { value: 'vendedor', labelKey: 'logistics.deliveryMethods.profiles.seller', label: 'Vendedor' },
          ],
        },
        {
          key: 'seleciona_transportadora',
          labelKey: 'logistics.deliveryMethods.fields.userTransportSelection',
          label: 'Seleciona transportadora',
          type: 'select',
          options: [
            { value: 'todos', labelKey: 'logistics.deliveryMethods.profiles.all', label: 'Todos' },
            { value: 'cliente', labelKey: 'logistics.deliveryMethods.profiles.customer', label: 'Cliente' },
            { value: 'vendedor', labelKey: 'logistics.deliveryMethods.profiles.seller', label: 'Vendedor' },
          ],
        },
        {
          key: 'servico',
          labelKey: 'logistics.deliveryMethods.fields.integrationService',
          label: 'Serviço de integração',
          type: 'select',
          options: [
            { value: 'frenet', label: 'Frenet' },
            { value: 'mandae', label: 'Mandae' },
            { value: 'freterapido', labelKey: 'logistics.deliveryMethods.services.freterapido', label: 'Frete Rápido' },
            { value: 'setcanhoto', label: 'SetCanhoto' },
            { value: 'iboltt', label: 'IBoltt' },
          ],
        },
        { key: 'codigo_transportadora', labelKey: 'logistics.deliveryMethods.fields.carrierName', label: 'Nome da transportadora', type: 'text', helperTextKey: 'logistics.deliveryMethods.help.carrierName', helperText: 'No caso de integração com Frete Rápido ou SetCanhoto, deve ser o nome da transportadora para vínculo com a plataforma.' },
        { key: 'servico_transportadora', labelKey: 'logistics.deliveryMethods.fields.carrierService', label: 'Serviço da transportadora', type: 'text', helperTextKey: 'logistics.deliveryMethods.help.carrierService', helperText: 'No caso de integração com Frenet, Mandae ou Frete Rápido, deve ser o serviço da transportadora para vínculo com a plataforma.' },
        { key: 'data_inicio', labelKey: 'logistics.deliveryMethods.fields.startDate', label: 'Data início', type: 'date' },
        { key: 'data_fim', labelKey: 'logistics.deliveryMethods.fields.endDate', label: 'Data fim', type: 'date' },
        { key: 'desconto', labelKey: 'logistics.deliveryMethods.fields.shippingDiscount', label: 'Desconto no frete', type: 'text', mask: 'currency', prefixText: 'R$' },
        { key: 'acrescimo', labelKey: 'logistics.deliveryMethods.fields.shippingSurcharge', label: 'Acréscimo no frete', type: 'text', mask: 'currency', prefixText: 'R$' },
        { key: 'frete_gratis', labelKey: 'logistics.deliveryMethods.fields.freeShippingValue', label: 'Frete grátis acima de', type: 'text', mask: 'currency', prefixText: 'R$' },
      ],
    },
    {
      id: 'delivery-days',
      titleKey: 'logistics.sections.deliveryDays',
      title: 'Dias de entrega',
      layout: 'rows',
      fields: [
        { key: 'seg', labelKey: 'logistics.rotas.fields.monday', label: 'Segunda', type: 'toggle', defaultValue: true },
        { key: 'ter', labelKey: 'logistics.rotas.fields.tuesday', label: 'Terça', type: 'toggle', defaultValue: true },
        { key: 'qua', labelKey: 'logistics.rotas.fields.wednesday', label: 'Quarta', type: 'toggle', defaultValue: true },
        { key: 'qui', labelKey: 'logistics.rotas.fields.thursday', label: 'Quinta', type: 'toggle', defaultValue: true },
        { key: 'sex', labelKey: 'logistics.rotas.fields.friday', label: 'Sexta', type: 'toggle', defaultValue: true },
        { key: 'sab', labelKey: 'logistics.rotas.fields.saturday', label: 'Sábado', type: 'toggle', defaultValue: true },
        { key: 'dom', labelKey: 'logistics.rotas.fields.sunday', label: 'Domingo', type: 'toggle', defaultValue: true },
      ],
    },
    {
      id: 'branches',
      titleKey: 'logistics.deliveryMethods.sections.branches',
      title: 'Filiais e tabela',
      layout: 'rows',
      fields: [
        { key: 'id_filial', labelKey: 'logistics.deliveryMethods.fields.branch', label: 'Filial', type: 'lookup', optionsResource: 'filiais', lookupStateKey: 'id_filial_lookup' },
        { key: 'id_filial_pedido', labelKey: 'logistics.deliveryMethods.fields.orderBranch', label: 'Filial do pedido', type: 'lookup', optionsResource: 'filiais', lookupStateKey: 'id_filial_pedido_lookup' },
        { key: 'id_filial_estoque', labelKey: 'logistics.deliveryMethods.fields.stockBranch', label: 'Filial de estoque', type: 'lookup', optionsResource: 'filiais', lookupStateKey: 'id_filial_estoque_lookup' },
        { key: 'id_filial_retira', labelKey: 'logistics.deliveryMethods.fields.pickupBranch', label: 'Filial de retirada', type: 'lookup', optionsResource: 'filiais', lookupStateKey: 'id_filial_retira_lookup', helperTextKey: 'logistics.deliveryMethods.help.pickupBranch', helperText: 'Quando preenchida em formas do tipo retira, define a filial usada para retirada.' },
        { key: 'id_filial_expressa', labelKey: 'logistics.deliveryMethods.fields.expressBranch', label: 'Filial expressa', type: 'lookup', optionsResource: 'filiais', lookupStateKey: 'id_filial_expressa_lookup' },
        { key: 'id_tabela_preco', labelKey: 'logistics.deliveryMethods.fields.priceTable', label: 'Tabela de preço', type: 'lookup', optionsResource: 'tabelas_preco', lookupStateKey: 'id_tabela_preco_lookup' },
      ],
    },
    {
      id: 'transport-restrictions',
      titleKey: 'logistics.deliveryMethods.sections.transportRestrictions',
      title: 'Restrições de transporte',
      layout: 'rows',
      fields: [
        { key: 'restrito_transporte_inflamavel', labelKey: 'logistics.deliveryMethods.transportRestrictions.flammable', label: 'Inflamável', type: 'toggle' },
        { key: 'restrito_transporte_resfriado', labelKey: 'logistics.deliveryMethods.transportRestrictions.chilled', label: 'Resfriado', type: 'toggle' },
        { key: 'restrito_transporte_transportadora', labelKey: 'logistics.deliveryMethods.transportRestrictions.carrierOnly', label: 'Transportadora', type: 'toggle' },
      ],
    },
    {
      id: 'instructions',
      titleKey: 'logistics.deliveryMethods.sections.instructions',
      title: 'Instruções',
      layout: 'stacked',
      fields: [
        { key: 'instrucoes', labelKey: 'logistics.deliveryMethods.fields.instructions', label: 'Instruções', type: 'richtext' },
      ],
    },
    {
      id: 'scheduling',
      titleKey: 'logistics.deliveryMethods.tabs.scheduling',
      title: 'Agendamento',
      layout: 'rows',
      fields: [
        { key: 'agendamento', labelKey: 'logistics.deliveryMethods.scheduling.enabled', label: 'Agendamento', type: 'toggle' },
        { key: 'agendamento_dias_minimo', labelKey: 'logistics.deliveryMethods.scheduling.minDays', label: 'Mínimo de dias para agendamento', type: 'number', inputMode: 'numeric' },
        { key: 'agendamento_dias_maximo', labelKey: 'logistics.deliveryMethods.scheduling.maxDays', label: 'Máximo de dias para agendamento', type: 'number', inputMode: 'numeric' },
        { key: 'agendamento_horario_corte', labelKey: 'logistics.deliveryMethods.scheduling.cutoffTime', label: 'Horário de corte', type: 'time' },
        { key: 'agendamento_seg', labelKey: 'logistics.rotas.fields.monday', label: 'Segunda', type: 'toggle' },
        { key: 'agendamento_ter', labelKey: 'logistics.rotas.fields.tuesday', label: 'Terça', type: 'toggle' },
        { key: 'agendamento_qua', labelKey: 'logistics.rotas.fields.wednesday', label: 'Quarta', type: 'toggle' },
        { key: 'agendamento_qui', labelKey: 'logistics.rotas.fields.thursday', label: 'Quinta', type: 'toggle' },
        { key: 'agendamento_sex', labelKey: 'logistics.rotas.fields.friday', label: 'Sexta', type: 'toggle' },
        { key: 'agendamento_sab', labelKey: 'logistics.rotas.fields.saturday', label: 'Sábado', type: 'toggle' },
        { key: 'agendamento_dom', labelKey: 'logistics.rotas.fields.sunday', label: 'Domingo', type: 'toggle' },
      ],
    },
  ],
  normalizeRecord: normalizeFormaEntregaRecord,
  beforeSave: serializeFormaEntregaRecord,
}
