import type { CrudDataClient, CrudListFilters, CrudListRecord, CrudModuleConfig, CrudRecord } from '@/src/components/crud-base/types'
import { sacAdminClient } from '@/src/features/sac-admin/services/sac-admin-client'
import type { SacArea } from '@/src/features/sac-admin/types/sac-admin'

function toAreaRecord(area: SacArea): CrudListRecord {
  return {
    id: area.id,
    nome: area.name,
    sla_horas: area.slaHours,
    mostrar_nome_responsavel_cliente: area.showResponsibleName,
    total_chamados: area.totalTickets,
    ativo: area.active,
  }
}

function matchesText(value: unknown, query: unknown) {
  const normalizedQuery = String(query ?? '').trim().toLowerCase()
  if (!normalizedQuery) return true
  return String(value ?? '').toLowerCase().includes(normalizedQuery)
}

function matchesActive(value: unknown, filter: unknown) {
  const normalizedFilter = String(filter ?? '').trim()
  if (!normalizedFilter) return true
  const checked = value === true || value === 1 || value === '1'
  return normalizedFilter === '1' ? checked : !checked
}

function sortAreas(rows: CrudListRecord[], filters: CrudListFilters) {
  const orderBy = String(filters.orderBy || 'nome')
  const direction = filters.sort === 'desc' ? -1 : 1

  return [...rows].sort((left, right) => {
    const leftValue = left[orderBy]
    const rightValue = right[orderBy]
    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return (leftValue - rightValue) * direction
    }
    return String(leftValue ?? '').localeCompare(String(rightValue ?? ''), 'pt-BR', { numeric: true }) * direction
  })
}

function normalizeSaveResponse(response: unknown, payload: CrudRecord): CrudRecord[] {
  const responseRecord = response && typeof response === 'object' ? response as Record<string, unknown> : {}
  const data = responseRecord.data && typeof responseRecord.data === 'object' ? responseRecord.data as Record<string, unknown> : {}
  const id = String(data.id ?? responseRecord.id ?? payload.id ?? '').trim()
  return [{ ...payload, id }]
}

export const SAC_AREAS_SUBJECTS_CONFIG: CrudModuleConfig = {
  key: 'sac-areas-assuntos',
  resource: 'sac_areas',
  routeBase: '/sac/areas-assuntos',
  featureKey: 'sac',
  listTitleKey: 'sacAdmin.areasCrud.title',
  listTitle: 'Áreas e assuntos',
  listDescriptionKey: 'sacAdmin.areasCrud.description',
  listDescription: 'Cadastro operacional de áreas, assuntos e responsáveis do SAC.',
  formTitleKey: 'sacAdmin.areasCrud.formTitle',
  formTitle: 'Área do SAC',
  breadcrumbParents: [{ labelKey: 'sacAdmin.title', label: 'SAC', href: '/sac/dashboard' }],
  hideBreadcrumbSection: true,
  breadcrumbSectionKey: 'sacAdmin.title',
  breadcrumbSection: 'SAC',
  breadcrumbModuleKey: 'sacAdmin.menu.areasSubjects',
  breadcrumbModule: 'Áreas/Assuntos',
  defaultFilters: { page: 1, perPage: 15, orderBy: 'nome', sort: 'asc', id: '', 'nome::like': '', ativo: '' },
  columns: [
    { id: 'id', labelKey: 'simpleCrud.fields.id', label: 'ID', sortKey: 'id', thClassName: 'w-[140px]', filter: { kind: 'text', key: 'id' } },
    { id: 'nome', labelKey: 'sacAdmin.areasCrud.fields.areaName', label: 'Área', sortKey: 'nome', tdClassName: 'font-semibold text-[color:var(--app-text)]', filter: { kind: 'text', key: 'nome::like' } },
    { id: 'sla_horas', labelKey: 'sacAdmin.areasCrud.fields.slaHours', label: 'SLA', sortKey: 'sla_horas', thClassName: 'w-[120px]', render: (record) => `${String(record.sla_horas ?? 0)} h` },
    { id: 'mostrar_nome_responsavel_cliente', labelKey: 'sacAdmin.areasCrud.fields.showResponsible', label: 'Exibe responsável', visibility: 'xl', render: (record, { t }) => record.mostrar_nome_responsavel_cliente ? t('common.yes', 'Sim') : t('common.no', 'Não') },
    { id: 'total_chamados', labelKey: 'sacAdmin.areasCrud.fields.totalTickets', label: 'Chamados', sortKey: 'total_chamados', thClassName: 'w-[120px]' },
    { id: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', sortKey: 'ativo', thClassName: 'w-[110px]', valueKey: 'ativo', filter: { kind: 'select', key: 'ativo', options: [{ value: '1', label: 'Sim' }, { value: '0', label: 'Não' }] } },
  ],
  mobileTitle: (record) => String(record.nome || '-'),
  mobileSubtitle: (record) => `${String(record.sla_horas ?? 0)} h`,
  mobileMeta: (record) => `ID: ${String(record.id || '-')}`,
  sections: [
    {
      id: 'general',
      titleKey: 'sacAdmin.areasCrud.tabs.general',
      title: 'Dados da área',
      layout: 'rows',
      fields: [
        { key: 'ativo', labelKey: 'simpleCrud.fields.active', label: 'Ativo', type: 'toggle' },
        { key: 'nome', labelKey: 'sacAdmin.areasCrud.fields.areaNameFull', label: 'Nome da área', type: 'text', required: true },
        { key: 'sla_horas', labelKey: 'sacAdmin.areasCrud.fields.slaHoursFull', label: 'SLA da área', type: 'number', required: true, suffixText: 'h', inputMode: 'numeric' },
        { key: 'mostrar_nome_responsavel_cliente', labelKey: 'sacAdmin.areasCrud.fields.showResponsibleFull', label: 'Mostrar responsável ao cliente', type: 'toggle' },
      ],
    },
  ],
  normalizeRecord: (record) => ({
    ...record,
    ativo: record.ativo === undefined ? true : record.ativo,
    mostrar_nome_responsavel_cliente: record.mostrar_nome_responsavel_cliente === true || record.mostrar_nome_responsavel_cliente === 1 || record.mostrar_nome_responsavel_cliente === '1',
    sla_horas: Number(record.sla_horas ?? 24),
  }),
  beforeSave: (record) => ({
    id: record.id ? String(record.id) : '',
    nome: String(record.nome ?? '').trim(),
    sla_horas: Number(record.sla_horas ?? 0),
    mostrar_nome_responsavel_cliente: record.mostrar_nome_responsavel_cliente ? 1 : 0,
    ativo: record.ativo ? 1 : 0,
  }),
  stayOnSave: true,
}

export const sacAreasSubjectsCrudClient: CrudDataClient = {
  async list(filters) {
    const rows = sortAreas(
      (await sacAdminClient.areas())
        .map(toAreaRecord)
        .filter((record) => matchesText(record.id, filters.id))
        .filter((record) => matchesText(record.nome, filters['nome::like']))
        .filter((record) => matchesActive(record.ativo, filters.ativo)),
      filters,
    )
    const page = Number(filters.page || 1)
    const perPage = Number(filters.perPage || 15)
    const total = rows.length
    const pages = Math.max(Math.ceil(total / Math.max(perPage, 1)), 1)
    const start = (page - 1) * perPage
    const data = rows.slice(start, start + perPage)

    return {
      data,
      meta: {
        page,
        pages,
        perPage,
        from: total ? start + 1 : 0,
        to: start + data.length,
        total,
      },
    }
  },
  async getById(id) {
    const area = (await sacAdminClient.areas()).find((item) => item.id === id)
    if (!area) {
      throw new Error('Área do SAC não encontrada.')
    }
    return toAreaRecord(area)
  },
  async save(payload) {
    const response = await sacAdminClient.saveArea(payload)
    return normalizeSaveResponse(response, payload)
  },
  async delete(ids) {
    await Promise.all(ids.map((id) => sacAdminClient.deleteArea(id)))
    return { success: true }
  },
  async listOptions() {
    return []
  },
}
