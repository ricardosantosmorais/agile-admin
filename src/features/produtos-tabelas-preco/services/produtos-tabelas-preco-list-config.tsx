'use client'

import { loadCrudLookupOptions } from '@/src/components/crud-base/crud-client'
import type { CrudModuleConfig } from '@/src/components/crud-base/types'

export const PRODUTOS_TABELAS_PRECO_LIST_CONFIG: CrudModuleConfig = {
  key: 'produtos-tabelas-preco',
  resource: 'tabelas_preco',
  routeBase: '/produtos-x-tabelas-de-preco',
  featureKey: 'produtosTabelasPreco',
  listTitleKey: 'priceStock.productPriceTables.title',
  listTitle: 'Produtos x Tabelas de Preço',
  listDescriptionKey: 'priceStock.productPriceTables.listDescription',
  listDescription: 'Listagem com produto, tabela de preço, preço 1 e status.',
  formTitleKey: 'priceStock.productPriceTables.quickPricingTitle',
  formTitle: 'Precificação rápida',
  breadcrumbSectionKey: 'routes.precosEstoques',
  breadcrumbSection: 'Preços e Estoques',
  breadcrumbModuleKey: 'routes.produtosTabelasPreco',
  breadcrumbModule: 'Produtos x Tabelas de Preço',
  defaultFilters: {
    page: 1,
    perPage: 15,
    orderBy: 'id_produto',
    sort: 'desc',
    'produto:codigo': '',
    id_produto: '',
    id_tabela_preco: '',
    'preco1::ge': '',
    'preco1::le': '',
    ativo: '',
  },
  columns: [
    { id: 'produto_codigo', labelKey: 'priceStock.productPriceTables.fields.productCode', label: 'Código', sortKey: 'produto:codigo', render: (record) => String((record.produto as { codigo?: unknown } | null)?.codigo || '-'), filter: { kind: 'text', key: 'produto:codigo' } },
    {
      id: 'id_produto',
      labelKey: 'priceStock.productPriceTables.fields.product',
      label: 'Produto',
      sortKey: 'produto:nome',
      tdClassName: 'font-semibold text-slate-950',
      render: (record) => String((record.produto as { nome?: unknown } | null)?.nome || record.id_produto || '-'),
      filter: {
        kind: 'lookup',
        key: 'id_produto',
        loadOptions: (query, page, perPage) => loadCrudLookupOptions('produtos', query, page, perPage).then((items) => items.map((item) => ({ id: item.value, label: item.label }))),
      },
    },
    {
      id: 'id_tabela_preco',
      labelKey: 'priceStock.productPriceTables.fields.priceTable',
      label: 'Tabela de preço',
      sortKey: 'tabela_preco:nome',
      render: (record) => String((record.tabela_preco as { nome?: unknown } | null)?.nome || '-'),
      filter: {
        kind: 'lookup',
        key: 'id_tabela_preco',
        loadOptions: (query, page, perPage) => loadCrudLookupOptions('tabelas_preco', query, page, perPage).then((items) => items.map((item) => ({ id: item.value, label: item.label }))),
      },
    },
    { id: 'preco1', labelKey: 'priceStock.productPriceTables.fields.price1', label: 'Preço 1', sortKey: 'preco1', filter: { kind: 'number-range', fromKey: 'preco1::ge', toKey: 'preco1::le', inputMode: 'decimal', mask: 'currency', prefixText: 'R$' } },
    { id: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', sortKey: 'ativo', valueKey: 'ativo', filter: { kind: 'select', key: 'ativo', options: [{ value: '1', label: 'Sim' }, { value: '0', label: 'Não' }] } },
  ],
  mobileTitle: (record) => String((record.produto as { nome?: unknown } | null)?.nome || '-'),
  mobileSubtitle: (record) => String((record.tabela_preco as { nome?: unknown } | null)?.nome || '-'),
  mobileMeta: (record) => `Preço 1: ${String(record.preco1 || '-')}`,
  sections: [],
}
