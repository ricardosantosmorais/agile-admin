'use client'

import { Pencil, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { AppDataTable } from '@/src/components/data-table/app-data-table'
import type { AppDataTableColumn } from '@/src/components/data-table/types'
import { inputClasses } from '@/src/components/ui/input-styles'
import { SectionCard } from '@/src/components/ui/section-card'
import type { CrudListFilters, CrudRecord } from '@/src/components/crud-base/types'
import { relatoriosMasterClient, type RelatorioCampoRecord } from '@/src/features/relatorios-master/services/relatorios-master-client'
import { useI18n } from '@/src/i18n/use-i18n'

type RelatorioMappingTabProps = {
  form: CrudRecord
  readOnly: boolean
  onFeedback: (message: string | null, tone?: 'success' | 'error') => void
}

const DEFAULT_FILTERS: CrudListFilters = { page: 1, perPage: 100, orderBy: 'id', sort: 'asc' }
const TIPO_OPTIONS = [
  { value: 'texto', label: 'Texto' },
  { value: 'data', label: 'Data' },
  { value: 'data_hora', label: 'Data/Hora' },
  { value: 'inteiro', label: 'Numero' },
  { value: 'valor', label: 'Valor' },
]

export function RelatorioMappingTab({ form, readOnly, onFeedback }: RelatorioMappingTabProps) {
  const { t } = useI18n()
  const idQuery = String(form.id_query ?? '').trim()
  const [rows, setRows] = useState<RelatorioCampoRecord[]>([])
  const [meta, setMeta] = useState<CrudListFilters & { total?: number; pages?: number; from?: number; to?: number }>(DEFAULT_FILTERS)
  const [isLoading, setIsLoading] = useState(false)
  const [editing, setEditing] = useState<CrudRecord | null>(null)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)

  const columns = useMemo(() => ([
    { id: 'id', label: 'ID', thClassName: 'w-[90px]', cell: (row: RelatorioCampoRecord) => row.id },
    { id: 'nome_alias', label: t('maintenance.reportsMaster.mapping.alias', 'Alias'), cell: (row: RelatorioCampoRecord) => row.nome_alias || '-' },
    { id: 'campo', label: t('maintenance.reportsMaster.mapping.field', 'Campo'), cell: (row: RelatorioCampoRecord) => row.campo || '-' },
    { id: 'titulo', label: t('maintenance.reportsMaster.mapping.title', 'Titulo'), tdClassName: 'font-semibold text-[color:var(--app-text)]', cell: (row: RelatorioCampoRecord) => row.titulo || '-' },
    { id: 'tipo', label: t('maintenance.reportsMaster.mapping.type', 'Tipo'), thClassName: 'w-[130px]', cell: (row: RelatorioCampoRecord) => row.tipo || '-' },
    { id: 'ordenacao', label: t('maintenance.reportsMaster.mapping.order', 'Ordenacao'), thClassName: 'w-[130px]', cell: (row: RelatorioCampoRecord) => row.ordenacao || '-' },
  ]) satisfies AppDataTableColumn<RelatorioCampoRecord, CrudListFilters>[], [t])

  async function loadRows() {
    if (!idQuery) {
      setRows([])
      return
    }
    setIsLoading(true)
    try {
      const response = await relatoriosMasterClient.listCampos(idQuery, filters)
      setRows(response.data as RelatorioCampoRecord[])
      setMeta({ ...filters, total: response.meta.total, pages: response.meta.pages, from: response.meta.from, to: response.meta.to })
    } catch (error) {
      onFeedback(error instanceof Error ? error.message : t('maintenance.reportsMaster.mapping.loadError', 'Nao foi possivel carregar o mapeamento.'), 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadRows()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idQuery, filters.page, filters.perPage, filters.orderBy, filters.sort])

  async function saveCampo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing) return
    try {
      await relatoriosMasterClient.saveCampo({ ...editing, id_query: idQuery })
      setEditing(null)
      onFeedback(t('maintenance.reportsMaster.mapping.saved', 'Campo salvo com sucesso.'), 'success')
      await loadRows()
    } catch (error) {
      onFeedback(error instanceof Error ? error.message : t('maintenance.reportsMaster.mapping.saveError', 'Nao foi possivel salvar o campo.'), 'error')
    }
  }

  return (
    <SectionCard
      action={!readOnly && idQuery ? (
        <button type="button" onClick={() => setEditing({ id_query: idQuery, titulo: '', tipo: '', ordenacao: '' })} className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold">
          <Plus className="h-4 w-4" />
          {t('maintenance.reportsMaster.mapping.newField', 'Novo campo')}
        </button>
      ) : null}
    >
      <div className="mb-4">
        <h2 className="text-base font-black text-[color:var(--app-text)]">{t('maintenance.reportsMaster.mapping.titleSection', 'Mapeamento')}</h2>
        <p className="text-sm text-[color:var(--app-muted)]">{t('maintenance.reportsMaster.mapping.description', 'Configure titulo, tipo e ordenacao dos campos retornados pela query.')}</p>
      </div>

      <AppDataTable
        rows={rows}
        getRowId={(row) => row.id}
        emptyMessage={isLoading ? t('common.loading', 'Carregando...') : t('maintenance.reportsMaster.mapping.empty', 'Nenhum campo mapeado para esta query.')}
        columns={columns}
        mobileCard={{ title: (row) => row.titulo || row.campo || row.id, subtitle: (row) => row.nome_alias || '-', meta: (row) => row.tipo || '-' }}
        rowActions={(row) => [
          { id: 'edit', label: t('common.edit', 'Editar'), icon: Pencil, visible: !readOnly, onClick: () => setEditing(row) },
        ]}
        pagination={meta.total !== undefined ? { page: filters.page, pages: Number(meta.pages || 1), perPage: filters.perPage, from: Number(meta.from || 0), to: Number(meta.to || 0), total: Number(meta.total || 0) } : undefined}
        onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
        actionsColumnClassName="w-[92px] min-w-[92px] whitespace-nowrap"
      />

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
          <form onSubmit={(event) => void saveCampo(event)} className="app-card-modern w-full max-w-2xl rounded-[1.4rem] p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h3 className="text-lg font-black text-[color:var(--app-text)]">{editing.id ? t('maintenance.reportsMaster.mapping.editField', 'Editar campo') : t('maintenance.reportsMaster.mapping.newField', 'Novo campo')}</h3>
              <button type="button" onClick={() => setEditing(null)} className="app-button-secondary rounded-full px-4 py-2 text-sm font-semibold">{t('common.cancel', 'Cancelar')}</button>
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-[color:var(--app-text)]">
                {t('maintenance.reportsMaster.mapping.fieldTitle', 'Titulo')} *
                <input className={`${inputClasses()} mt-2`} value={String(editing.titulo ?? '')} onChange={(event) => setEditing((current) => ({ ...current, titulo: event.target.value }))} />
              </label>
              <label className="block text-sm font-semibold text-[color:var(--app-text)]">
                {t('maintenance.reportsMaster.mapping.type', 'Tipo')} *
                <select className={`${inputClasses()} mt-2`} value={String(editing.tipo ?? '')} onChange={(event) => setEditing((current) => ({ ...current, tipo: event.target.value }))}>
                  <option value="">{t('common.select', 'Selecione')}</option>
                  {TIPO_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold text-[color:var(--app-text)]">
                {t('maintenance.reportsMaster.mapping.order', 'Ordenacao')}
                <select className={`${inputClasses()} mt-2`} value={String(editing.ordenacao ?? '')} onChange={(event) => setEditing((current) => ({ ...current, ordenacao: event.target.value }))}>
                  <option value="">{t('common.select', 'Selecione')}</option>
                  <option value="asc">{t('maintenance.reportsMaster.mapping.asc', 'Ascendente')}</option>
                  <option value="desc">{t('maintenance.reportsMaster.mapping.desc', 'Descendente')}</option>
                </select>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="app-button-secondary rounded-full px-4 py-2.5 text-sm font-semibold">{t('common.cancel', 'Cancelar')}</button>
              <button type="submit" className="app-button-primary rounded-full px-4 py-2.5 text-sm font-semibold">{t('common.save', 'Salvar')}</button>
            </div>
          </form>
        </div>
      ) : null}
    </SectionCard>
  )
}
