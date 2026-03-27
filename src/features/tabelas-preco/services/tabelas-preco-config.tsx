'use client'

import type { CrudModuleConfig, CrudRecord } from '@/src/components/crud-base/types'
import { trimNullable } from '@/src/features/financeiro/services/financeiro-form'

export const TABELAS_PRECO_CONFIG: CrudModuleConfig = {
  key: 'tabelas-preco',
  resource: 'tabelas_preco',
  routeBase: '/tabelas-de-preco',
  featureKey: 'tabelasPreco',
  listTitleKey: 'financial.priceTables.title',
  listTitle: 'Tabelas de preço',
  listDescriptionKey: 'financial.priceTables.listDescription',
  listDescription: 'Listagem com código, nome e status ativo.',
  formTitleKey: 'financial.priceTables.formTitle',
  formTitle: 'Tabela de preço',
  breadcrumbSectionKey: 'routes.financeiro',
  breadcrumbSection: 'Financeiro',
  breadcrumbModuleKey: 'routes.tabelasPreco',
  breadcrumbModule: 'Tabelas de preço',
  formEmbed: 'filiais.filial',
  defaultFilters: {
    page: 1,
    perPage: 15,
    orderBy: 'nome',
    sort: 'asc',
    id: '',
    'codigo::like': '',
    'nome::like': '',
    ativo: '',
  },
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[180px]', filter: { kind: 'text', key: 'id' } },
    { id: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', sortKey: 'codigo', thClassName: 'w-[140px]', filter: { kind: 'text', key: 'codigo::like' } },
    { id: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', sortKey: 'nome', tdClassName: 'font-semibold text-slate-950', filter: { kind: 'text', key: 'nome::like' } },
    { id: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', sortKey: 'ativo', thClassName: 'w-[100px]', valueKey: 'ativo', filter: { kind: 'select', key: 'ativo', options: [{ value: '1', label: 'Sim' }, { value: '0', label: 'Não' }] } },
  ],
  mobileTitle: (record) => String(record.nome || '-'),
  mobileSubtitle: (record) => `ID: ${String(record.id || '-')}`,
  sections: [
    {
      id: 'general',
      titleKey: 'financial.sections.general',
      title: 'Dados gerais',
      layout: 'rows',
      fields: [
        { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle' },
        { key: 'aplica_cupom_desconto', labelKey: 'financial.priceTables.fields.discountCoupon', label: 'Aplica cupom desconto', type: 'toggle' },
        { key: 'aplica_desconto_embalagem', labelKey: 'financial.priceTables.fields.packageDiscount', label: 'Aplica desconto embalagem', type: 'toggle' },
        { key: 'aplica_precificador', labelKey: 'financial.priceTables.fields.pricingEngine', label: 'Aplica precificador', type: 'toggle' },
        { key: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', type: 'text' },
        { key: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', type: 'text', required: true },
      ],
    },
  ],
  normalizeRecord: (record: CrudRecord) => ({ ...record }),
  beforeSave: (record: CrudRecord) => ({
    ...record,
    codigo: trimNullable(record.codigo),
    nome: trimNullable(record.nome),
  }),
}
