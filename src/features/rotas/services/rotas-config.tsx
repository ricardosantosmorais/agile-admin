'use client'

import type { CrudModuleConfig } from '@/src/components/crud-base/types'
import { parseCurrencyInput } from '@/src/lib/input-masks'
import { formatLocalizedDecimal } from '@/src/lib/value-parsers'

function normalizeTime(value: unknown) {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return ''
  }

  const match = raw.match(/^(\d{2}):(\d{2})/)
  return match ? `${match[1]}:${match[2]}` : ''
}

export const ROTAS_CONFIG: CrudModuleConfig = {
  key: 'rotas',
  resource: 'rotas',
  routeBase: '/rotas',
  featureKey: 'rotas',
  listTitleKey: 'logistics.rotas.title',
  listTitle: 'Rotas',
  listDescriptionKey: 'logistics.rotas.listDescription',
  listDescription: 'Listagem com janela de operação, limites e status ativo.',
  formTitleKey: 'logistics.rotas.formTitle',
  formTitle: 'Rota',
  breadcrumbSectionKey: 'routes.logistica',
  breadcrumbSection: 'Logística',
  breadcrumbModuleKey: 'routes.rotas',
  breadcrumbModule: 'Rotas',
  defaultFilters: { page: 1, perPage: 15, orderBy: 'nome', sort: 'asc', id: '', codigo: '', 'nome::like': '', ativo: '' },
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[120px]', filter: { kind: 'text', key: 'id' } },
    { id: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', sortKey: 'codigo', thClassName: 'w-[140px]', filter: { kind: 'text', key: 'codigo' } },
    { id: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', sortKey: 'nome', tdClassName: 'font-semibold text-slate-950', filter: { kind: 'text', key: 'nome::like' } },
    { id: 'horario_corte', labelKey: 'logistics.rotas.fields.cutoffTime', label: 'Horário de corte', visibility: 'xl' },
    { id: 'prazo_entrega', labelKey: 'logistics.rotas.fields.deliveryLeadTime', label: 'Prazo de entrega', visibility: 'xl' },
    { id: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', sortKey: 'ativo', thClassName: 'w-[100px]', valueKey: 'ativo', filter: { kind: 'select', key: 'ativo', options: [{ value: '1', label: 'Sim' }, { value: '0', label: 'Não' }] } },
  ],
  mobileTitle: (record) => String(record.nome || '-'),
  mobileSubtitle: (record) => String(record.codigo || '-'),
  mobileMeta: (record) => `ID: ${String(record.id || '-')}`,
  sections: [
    {
      id: 'general',
      titleKey: 'logistics.sections.deliveryWindow',
      title: 'Operação de entrega',
      layout: 'rows',
      fields: [
        { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle' },
        { key: 'horario_corte', labelKey: 'logistics.rotas.fields.cutoffTime', label: 'Horário de corte', type: 'time' },
        { key: 'prazo_entrega', labelKey: 'logistics.rotas.fields.deliveryLeadTime', label: 'Prazo de entrega', type: 'number', inputMode: 'numeric' },
        { key: 'prazo_fixo', labelKey: 'logistics.rotas.fields.fixedLeadTime', label: 'Prazo fixo', type: 'number', inputMode: 'numeric' },
        { key: 'limite_entregas', labelKey: 'logistics.rotas.fields.deliveryLimit', label: 'Limite de entregas', type: 'number', inputMode: 'numeric' },
        { key: 'limite_peso', labelKey: 'logistics.rotas.fields.weightLimit', label: 'Limite de peso', type: 'text', mask: 'decimal', suffixText: 'kg' },
        { key: 'codigo', labelKey: 'simpleCrud.fields.code', label: 'Código', type: 'text' },
        { key: 'nome', labelKey: 'simpleCrud.fields.name', label: 'Nome', type: 'text', required: true },
      ],
    },
    {
      id: 'days',
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
  ],
  normalizeRecord: (record) => ({
    ...record,
    horario_corte: normalizeTime(record.horario_corte),
    limite_peso: formatLocalizedDecimal(record.limite_peso, 3),
  }),
  beforeSave: (record) => ({
    ...record,
    codigo: String(record.codigo || '').trim() || null,
    horario_corte: String(record.horario_corte || '').trim() || null,
    prazo_entrega: String(record.prazo_entrega || '').trim() || null,
    prazo_fixo: String(record.prazo_fixo || '').trim() || null,
    limite_entregas: String(record.limite_entregas || '').trim() || null,
    limite_peso: parseCurrencyInput(String(record.limite_peso || '')),
    seg: Boolean(record.seg),
    ter: Boolean(record.ter),
    qua: Boolean(record.qua),
    qui: Boolean(record.qui),
    sex: Boolean(record.sex),
    sab: Boolean(record.sab),
    dom: Boolean(record.dom),
  }),
}
