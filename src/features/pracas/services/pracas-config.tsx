'use client'

import type { CrudModuleConfig, CrudRecord } from '@/src/components/crud-base/types'
import { cepMask, currencyMask, parseCurrencyInput } from '@/src/lib/input-masks'

function normalizeDecimal(value: unknown, precision = 3) {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  const parsed = typeof value === 'number'
    ? value
    : Number(String(value).trim().replace(',', '.'))

  if (!Number.isFinite(parsed)) {
    return ''
  }

  return parsed.toLocaleString('pt-BR', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  })
}

function normalizeLookup(record: CrudRecord, idKey: string, relationKey: string, lookupStateKey: string) {
  const relation = record[relationKey]
  if (!relation || typeof relation !== 'object' || Array.isArray(relation)) {
    return {
      [lookupStateKey]: record[idKey]
        ? { id: String(record[idKey]), label: String(record[idKey]) }
        : null,
    }
  }

  const value = String((relation as { id?: unknown }).id || record[idKey] || '')
  const label = String((relation as { nome?: unknown; titulo?: unknown }).nome || (relation as { titulo?: unknown }).titulo || value || '')
  return {
    [lookupStateKey]: value ? { id: value, label } : null,
  }
}

export const PRACAS_CONFIG: CrudModuleConfig = {
  key: 'pracas',
  resource: 'pracas',
  routeBase: '/pracas',
  featureKey: 'pracas',
  listTitleKey: 'logistics.pracas.title',
  listTitle: 'Praças',
  listDescriptionKey: 'logistics.pracas.listDescription',
  listDescription: 'Listagem com rota, tabela de preço, faixa de CEP e status ativo.',
  formTitleKey: 'logistics.pracas.formTitle',
  formTitle: 'Praça',
  breadcrumbSectionKey: 'routes.logistica',
  breadcrumbSection: 'Logística',
  breadcrumbModuleKey: 'routes.pracas',
  breadcrumbModule: 'Praças',
  defaultFilters: { page: 1, perPage: 15, orderBy: 'nome', sort: 'asc', id: '', codigo: '', 'nome::like': '', ativo: '' },
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[120px]', filter: { kind: 'text', key: 'id' } },
    { id: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', sortKey: 'codigo', thClassName: 'w-[140px]', filter: { kind: 'text', key: 'codigo' } },
    { id: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', sortKey: 'nome', tdClassName: 'font-semibold text-slate-950', filter: { kind: 'text', key: 'nome::like' } },
    { id: 'pedido_minimo', labelKey: 'logistics.pracas.fields.minimumOrder', label: 'Pedido mínimo', render: (record) => record.pedido_minimo ? `R$ ${currencyMask(String(record.pedido_minimo))}` : '-', visibility: 'xl' },
    { id: 'peso_minimo', labelKey: 'logistics.pracas.fields.minimumWeight', label: 'Peso mínimo', render: (record) => record.peso_minimo ? `${normalizeDecimal(record.peso_minimo, 3)} kg` : '-', visibility: 'xl' },
    { id: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', sortKey: 'ativo', thClassName: 'w-[100px]', valueKey: 'ativo', filter: { kind: 'select', key: 'ativo', options: [{ value: '1', label: 'Sim' }, { value: '0', label: 'Não' }] } },
  ],
  mobileTitle: (record) => String(record.nome || '-'),
  mobileSubtitle: (record) => String(record.codigo || '-'),
  mobileMeta: (record) => `ID: ${String(record.id || '-')}`,
  sections: [
    {
      id: 'general',
      titleKey: 'logistics.sections.general',
      title: 'Dados gerais',
      layout: 'rows',
      fields: [
        { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle' },
        { key: 'id_rota', labelKey: 'logistics.pracas.fields.rota', label: 'Rota', type: 'lookup', optionsResource: 'rotas', lookupStateKey: 'id_rota_lookup' },
        { key: 'id_tabela_preco', labelKey: 'logistics.pracas.fields.priceTable', label: 'Tabela de preço', type: 'lookup', optionsResource: 'tabelas_preco', lookupStateKey: 'id_tabela_preco_lookup' },
        { key: 'cep_de', labelKey: 'logistics.pracas.fields.zipStart', label: 'CEP inicial', type: 'text', mask: 'cep' },
        { key: 'cep_ate', labelKey: 'logistics.pracas.fields.zipEnd', label: 'CEP final', type: 'text', mask: 'cep' },
        { key: 'pedido_minimo', labelKey: 'logistics.pracas.fields.minimumOrder', label: 'Pedido mínimo', type: 'text', mask: 'currency', prefixText: 'R$' },
        { key: 'peso_minimo', labelKey: 'logistics.pracas.fields.minimumWeight', label: 'Peso mínimo', type: 'text', mask: 'decimal', suffixText: 'kg' },
        { key: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', type: 'text' },
        { key: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', type: 'text', required: true },
      ],
    },
  ],
  formEmbed: 'rota,tabela_preco',
  normalizeRecord: (record) => ({
    ...record,
    cep_de: cepMask(String(record.cep_de || '')),
    cep_ate: cepMask(String(record.cep_ate || '')),
    pedido_minimo: record.pedido_minimo === null || record.pedido_minimo === undefined ? '' : currencyMask(String(record.pedido_minimo)),
    peso_minimo: normalizeDecimal(record.peso_minimo, 3),
    ...normalizeLookup(record, 'id_rota', 'rota', 'id_rota_lookup'),
    ...normalizeLookup(record, 'id_tabela_preco', 'tabela_preco', 'id_tabela_preco_lookup'),
  }),
  beforeSave: (record) => ({
    ...record,
    id_rota: record.id_rota ? String(record.id_rota) : null,
    id_tabela_preco: record.id_tabela_preco ? String(record.id_tabela_preco) : null,
    cep_de: String(record.cep_de || '').replace(/\D/g, '') || null,
    cep_ate: String(record.cep_ate || '').replace(/\D/g, '') || null,
    pedido_minimo: parseCurrencyInput(String(record.pedido_minimo || '')),
    peso_minimo: parseCurrencyInput(String(record.peso_minimo || '')),
    codigo: String(record.codigo || '').trim() || null,
    id_rota_lookup: undefined,
    rota: undefined,
    id_tabela_preco_lookup: undefined,
    tabela_preco: undefined,
  }),
}
