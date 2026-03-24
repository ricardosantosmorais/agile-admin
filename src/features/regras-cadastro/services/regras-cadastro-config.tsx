'use client'

import type { CrudModuleConfig } from '@/src/components/crud-base/types'
import { BRAZILIAN_STATES } from '@/src/lib/brazil'
import {
  createEmptyRegraCadastroForm,
  mapRegraCadastroDetail,
  toRegraCadastroPayload,
} from '@/src/features/regras-cadastro/services/regras-cadastro-form'

const stateOptions = BRAZILIAN_STATES.map((state) => ({ value: state, label: state }))

export const REGRAS_CADASTRO_CONFIG: CrudModuleConfig = {
  key: 'regras-cadastro',
  resource: 'regras_cadastro',
  routeBase: '/regras-de-cadastro',
  featureKey: 'regrasCadastro',
  listTitleKey: 'people.registrationRules.title',
  listTitle: 'Regras de cadastro',
  listDescriptionKey: 'people.registrationRules.listDescription',
  listDescription: 'Listagem server-side com código, nome e status ativo.',
  formTitleKey: 'people.registrationRules.formTitle',
  formTitle: 'Regra de cadastro',
  breadcrumbSectionKey: 'routes.people',
  breadcrumbSection: 'Pessoas',
  breadcrumbModuleKey: 'people.registrationRules.title',
  breadcrumbModule: 'Regras de cadastro',
  defaultFilters: { page: 1, perPage: 15, orderBy: 'nome', sort: 'asc', id: '', codigo: '', 'nome::like': '', ativo: '' },
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[180px]', filter: { kind: 'text', key: 'id' } },
    { id: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', sortKey: 'codigo', thClassName: 'w-[140px]', filter: { kind: 'text', key: 'codigo' } },
    { id: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', sortKey: 'nome', tdClassName: 'font-semibold text-slate-950', filter: { kind: 'text', key: 'nome::like' } },
    { id: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', sortKey: 'ativo', thClassName: 'w-[110px]', valueKey: 'ativo', filter: { kind: 'select', key: 'ativo', options: [{ value: '1', label: 'Yes' }, { value: '0', label: 'No' }] } },
  ],
  mobileTitle: (record) => String(record.nome || '-'),
  mobileSubtitle: (record) => String(record.codigo || '-'),
  mobileMeta: (record) => `ID: ${String(record.id || '-')}`,
  sections: [
    {
      id: 'identification',
      titleKey: 'people.registrationRules.sections.identification',
      title: 'Identificação',
      layout: 'rows',
      fields: [
        { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle' },
        { key: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', type: 'text', required: true },
        { key: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', type: 'text', maxLength: 32 },
        { key: 'contribuinte', labelKey: 'people.registrationRules.fields.taxpayer', label: 'Contribuinte', type: 'select', options: [{ value: '1', labelKey: 'common.yes', label: 'Sim' }, { value: '0', labelKey: 'common.no', label: 'Não' }] },
        { key: 'tipo', labelKey: 'people.registrationRules.fields.personType', label: 'Tipo', type: 'select', options: [{ value: 'PF', labelKey: 'people.personType.pf', label: 'Pessoa Física' }, { value: 'PJ', labelKey: 'people.personType.pj', label: 'Pessoa Jurídica' }] },
        { key: 'tipo_cliente', labelKey: 'people.registrationRules.fields.customerType', label: 'Tipo de cliente', type: 'select', options: [{ value: 'C', label: 'Consumo' }, { value: 'R', label: 'Revenda' }, { value: 'F', label: 'Funcionário' }] },
        { key: 'inscricao_estadual', labelKey: 'people.registrationRules.fields.stateRegistration', label: 'Inscrição estadual', type: 'select', options: [{ value: 'ISENTO', labelKey: 'people.registrationRules.options.exempt', label: 'Isento' }, { value: 'NAO_ISENTO', labelKey: 'people.registrationRules.options.notExempt', label: 'Não isento' }] },
        { key: 'uf', labelKey: 'people.registrationRules.fields.uf', label: 'UF', type: 'select', options: stateOptions },
        { key: 'cep_de', labelKey: 'people.registrationRules.fields.zipStart', label: 'CEP início', type: 'text', mask: 'cep' },
        { key: 'cep_ate', labelKey: 'people.registrationRules.fields.zipEnd', label: 'CEP fim', type: 'text', mask: 'cep' },
        { key: 'codigo_cnae', labelKey: 'people.registrationRules.fields.cnaeCode', label: 'Código CNAE', type: 'text' },
        { key: 'valida_limite', labelKey: 'people.registrationRules.fields.validateLimit', label: 'Valida limite', type: 'toggle' },
        { key: 'valida_multiplo', labelKey: 'people.registrationRules.fields.validateMultiple', label: 'Valida múltiplo', type: 'toggle' },
      ],
    },
    {
      id: 'relations',
      titleKey: 'people.registrationRules.sections.relations',
      title: 'Relacionamentos',
      layout: 'rows',
      fields: [
        { key: 'id_filial', labelKey: 'people.registrationRules.fields.branch', label: 'Filial', type: 'lookup', optionsResource: 'filiais', lookupStateKey: 'id_filial_lookup' },
        { key: 'id_filial_pedido', labelKey: 'people.registrationRules.fields.orderBranch', label: 'Filial de pedido', type: 'lookup', optionsResource: 'filiais', lookupStateKey: 'id_filial_pedido_lookup' },
        { key: 'id_filial_estoque', labelKey: 'people.registrationRules.fields.stockBranch', label: 'Filial de estoque', type: 'lookup', optionsResource: 'filiais', lookupStateKey: 'id_filial_estoque_lookup' },
        { key: 'id_vendedor', labelKey: 'people.registrationRules.fields.seller', label: 'Vendedor', type: 'lookup', optionsResource: 'vendedores', lookupStateKey: 'id_vendedor_lookup' },
        { key: 'id_praca', labelKey: 'people.registrationRules.fields.square', label: 'Praça', type: 'lookup', optionsResource: 'pracas', lookupStateKey: 'id_praca_lookup' },
        { key: 'id_tabela_preco', labelKey: 'people.registrationRules.fields.priceTable', label: 'Tabela de preço', type: 'lookup', optionsResource: 'tabelas_preco', lookupStateKey: 'id_tabela_preco_lookup' },
        { key: 'id_canal_distribuicao', labelKey: 'people.registrationRules.fields.distributionChannel', label: 'Canal de distribuição', type: 'lookup', optionsResource: 'canais_distribuicao', lookupStateKey: 'id_canal_distribuicao_lookup' },
      ],
    },
    {
      id: 'cross-relations',
      titleKey: 'people.registrationRules.sections.crossRelations',
      title: 'Regras cruzadas',
      layout: 'rows',
      fields: [
        { key: 'id_cliente_filial', labelKey: 'people.registrationRules.fields.customerBranch', label: 'Cliente x filial', type: 'lookup', optionsResource: 'filiais', lookupStateKey: 'id_cliente_filial_lookup' },
        { key: 'id_tabela_preco_filial', labelKey: 'people.registrationRules.fields.branchPriceTable', label: 'Tabela de preço x filial', type: 'lookup', optionsResource: 'tabelas_preco', lookupStateKey: 'id_tabela_preco_filial_lookup' },
        { key: 'limite_credito', labelKey: 'people.registrationRules.fields.branchCreditLimit', label: 'Limite de crédito x filial', type: 'text', mask: 'currency', prefixText: 'R$' },
        { key: 'id_cliente_canal_distribuicao', labelKey: 'people.registrationRules.fields.customerDistributionChannel', label: 'Cliente x canal de distribuição', type: 'lookup', optionsResource: 'canais_distribuicao', lookupStateKey: 'id_cliente_canal_distribuicao_lookup' },
        { key: 'id_tabela_canal_distribuicao', labelKey: 'people.registrationRules.fields.channelPriceTable', label: 'Tabela de preço x canal de distribuição', type: 'lookup', optionsResource: 'tabelas_preco', lookupStateKey: 'id_tabela_canal_distribuicao_lookup' },
        { key: 'id_vendedor_canal_distribuicao', labelKey: 'people.registrationRules.fields.sellerDistributionChannel', label: 'Vendedor x canal de distribuição', type: 'lookup', optionsResource: 'vendedores', lookupStateKey: 'id_vendedor_canal_distribuicao_lookup' },
        { key: 'id_cliente_vendedor', labelKey: 'people.registrationRules.fields.customerSeller', label: 'Cliente x vendedor', type: 'lookup', optionsResource: 'vendedores', lookupStateKey: 'id_cliente_vendedor_lookup' },
      ],
    },
  ],
  formEmbed: 'filial,filial_pedido,filial_estoque,vendedor,praca,tabela_preco,canal_distribuicao,cliente_filial,tabela_preco_filial,cliente_canal_distribuicao,tabela_canal_distribuicao,vendedor_canal_distribuicao,cliente_vendedor',
  normalizeRecord: mapRegraCadastroDetail,
  beforeSave: toRegraCadastroPayload,
  getSaveRedirectPath: ({ saved, isEditing }) => {
    if (isEditing) {
      return '/regras-de-cadastro'
    }

    const savedId = String(saved[0]?.id || '')
    return savedId ? `/regras-de-cadastro/${savedId}/editar` : '/regras-de-cadastro'
  },
}

export { createEmptyRegraCadastroForm }
