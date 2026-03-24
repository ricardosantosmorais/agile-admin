'use client'

import type { CrudModuleConfig, CrudRecord } from '@/src/components/crud-base/types'
import { cepMask } from '@/src/lib/input-masks'

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
  const label = String((relation as { nome?: unknown }).nome || value || '')
  return {
    [lookupStateKey]: value ? { id: value, label } : null,
  }
}

export const AREAS_ATUACAO_CONFIG: CrudModuleConfig = {
  key: 'areas-atuacao',
  resource: 'areas_atuacao',
  routeBase: '/areas-de-atuacao',
  featureKey: 'areasAtuacao',
  listTitleKey: 'logistics.areasAtuacao.title',
  listTitle: 'Áreas de atuação',
  listDescriptionKey: 'logistics.areasAtuacao.listDescription',
  listDescription: 'Listagem com praça vinculada, faixa de CEP e status ativo.',
  formTitleKey: 'logistics.areasAtuacao.formTitle',
  formTitle: 'Área de atuação',
  breadcrumbSectionKey: 'routes.logistica',
  breadcrumbSection: 'Logística',
  breadcrumbModuleKey: 'routes.areasDeAtuacao',
  breadcrumbModule: 'Áreas de Atuação',
  defaultFilters: { page: 1, perPage: 15, orderBy: 'nome', sort: 'asc', id: '', codigo: '', 'nome::like': '', ativo: '' },
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[120px]', filter: { kind: 'text', key: 'id' } },
    { id: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', sortKey: 'codigo', thClassName: 'w-[140px]', filter: { kind: 'text', key: 'codigo' } },
    { id: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', sortKey: 'nome', tdClassName: 'font-semibold text-slate-950', filter: { kind: 'text', key: 'nome::like' } },
    { id: 'id_praca', labelKey: 'logistics.areasAtuacao.fields.praca', label: 'Praça', render: (record) => String((record.praca as { nome?: string } | null)?.nome || record.id_praca || '-'), visibility: 'xl' },
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
        { key: 'id_praca', labelKey: 'logistics.areasAtuacao.fields.praca', label: 'Praça', type: 'lookup', optionsResource: 'pracas', lookupStateKey: 'id_praca_lookup' },
        { key: 'cep_de', labelKey: 'logistics.areasAtuacao.fields.zipStart', label: 'CEP inicial', type: 'text', mask: 'cep' },
        { key: 'cep_ate', labelKey: 'logistics.areasAtuacao.fields.zipEnd', label: 'CEP final', type: 'text', mask: 'cep' },
        { key: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', type: 'text' },
        { key: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', type: 'text', required: true },
      ],
    },
  ],
  formEmbed: 'praca',
  normalizeRecord: (record) => ({
    ...record,
    cep_de: cepMask(String(record.cep_de || '')),
    cep_ate: cepMask(String(record.cep_ate || '')),
    ...normalizeLookup(record, 'id_praca', 'praca', 'id_praca_lookup'),
  }),
  beforeSave: (record) => ({
    ...record,
    id_praca: record.id_praca ? String(record.id_praca) : null,
    cep_de: String(record.cep_de || '').replace(/\D/g, '') || null,
    cep_ate: String(record.cep_ate || '').replace(/\D/g, '') || null,
    codigo: String(record.codigo || '').trim() || null,
    id_praca_lookup: undefined,
    praca: undefined,
  }),
}
