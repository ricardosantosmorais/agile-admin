'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { CrudRecord } from '@/src/components/crud-base/types'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { LookupSelect, type LookupOption } from '@/src/components/ui/lookup-select'
import { SectionCard } from '@/src/components/ui/section-card'
import { SelectableDataTable, type SelectableDataTableColumn } from '@/src/components/ui/selectable-data-table'
import { notificacoesPainelClient } from '@/src/features/notificacoes-painel/services/notificacoes-painel-client'
import { normalizeNotificacaoPainelRecord } from '@/src/features/notificacoes-painel/services/notificacoes-painel-mappers'
import { useI18n } from '@/src/i18n/use-i18n'

type EmpresaVinculada = {
  id: string
  id_empresa: string
  nome: string
  codigo?: string
}

export function NotificacaoPainelEmpresasTab({
  id,
  form,
  readOnly,
  refreshRecord,
  onFeedback,
}: {
  id?: string
  form: CrudRecord
  readOnly: boolean
  refreshRecord: () => Promise<void>
  onFeedback: (message: string | null, tone?: 'success' | 'error') => void
}) {
  const { t } = useI18n()
  const [selectedCompany, setSelectedCompany] = useState<LookupOption | null>(null)
  const [selectedRelationIds, setSelectedRelationIds] = useState<string[]>([])
  const [removingIds, setRemovingIds] = useState<string[] | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const empresas = useMemo(() => (normalizeNotificacaoPainelRecord(form).empresas ?? []) as EmpresaVinculada[], [form])
  const linkedCompanyIds = useMemo(() => new Set(empresas.map((empresa) => empresa.id_empresa)), [empresas])
  const columns = useMemo<Array<SelectableDataTableColumn<EmpresaVinculada>>>(() => [
    {
      header: t('simpleCrud.fields.id', 'ID'),
      headerClassName: 'w-[180px]',
      cellClassName: 'w-[180px] whitespace-nowrap text-sm font-semibold text-[color:var(--app-text)]',
      render: (empresa) => empresa.id_empresa,
    },
    {
      header: t('routes.empresas', 'Empresa'),
      cellClassName: 'min-w-[280px]',
      render: (empresa) => (
        <div>
          <div className="break-words text-sm font-semibold text-[color:var(--app-text)]">{empresa.nome || '-'}</div>
          {empresa.codigo ? <div className="mt-0.5 break-words text-xs text-[color:var(--app-muted)]">{empresa.codigo}</div> : null}
        </div>
      ),
    },
  ], [t])

  async function loadAvailableCompanies(query: string, page: number, perPage: number) {
    const options = await notificacoesPainelClient.loadEmpresaOptions(query, page, perPage)
    return options.filter((option) => !linkedCompanyIds.has(option.id))
  }

  async function handleAddEmpresa() {
    if (!id || !selectedCompany) return
    setIsSaving(true)
    onFeedback(null)
    try {
      await notificacoesPainelClient.addEmpresa(id, selectedCompany.id, String(form.titulo ?? 'Notificação'))
      setSelectedCompany(null)
      await refreshRecord()
    } catch (error) {
      onFeedback(error instanceof Error ? error.message : t('panelNotifications.companies.linkError', 'Não foi possível vincular a empresa.'), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleRemoveEmpresas(ids: string[]) {
    if (!id || !ids.length) return
    setIsSaving(true)
    onFeedback(null)
    try {
      await notificacoesPainelClient.removeEmpresas(id, ids)
      setSelectedRelationIds((current) => current.filter((item) => !ids.includes(item)))
      setRemovingIds(null)
      await refreshRecord()
    } catch (error) {
      onFeedback(error instanceof Error ? error.message : t('panelNotifications.companies.unlinkError', 'Não foi possível remover a empresa.'), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <SectionCard
        title={t('panelNotifications.companies.title', 'Empresas vinculadas')}
        description={t('panelNotifications.companies.description', 'Defina quais empresas recebem esta notificação. Sem vínculo específico, a publicação segue como geral.')}
        action={!readOnly ? (
          <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[560px] lg:flex-row">
            <div className="min-w-0 flex-1">
              <LookupSelect
                label={t('routes.empresas', 'Empresa')}
                value={selectedCompany}
                onChange={setSelectedCompany}
                loadOptions={loadAvailableCompanies}
                pageSize={20}
              />
            </div>
            <button
              type="button"
              disabled={!selectedCompany || isSaving}
              onClick={handleAddEmpresa}
              className="app-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              <Plus className="h-4 w-4" />
              {t('common.include', 'Incluir')}
            </button>
          </div>
        ) : null}
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-[color:var(--app-muted)]">
            {t('panelNotifications.companies.total', '{{count}} empresa(s) vinculada(s).', { count: empresas.length })}
          </div>
          {selectedRelationIds.length ? (
            <button type="button" onClick={() => setRemovingIds(selectedRelationIds)} className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-rose-600">
              <Trash2 className="h-4 w-4" />
              {t('simpleCrud.deleteSelected', 'Excluir ({{count}})', { count: selectedRelationIds.length })}
            </button>
          ) : null}
        </div>

        <SelectableDataTable
          items={empresas}
          selectedIds={selectedRelationIds}
          onSelectedIdsChange={setSelectedRelationIds}
          getRowId={(empresa) => empresa.id}
          columns={columns}
          emptyMessage={t('panelNotifications.companies.empty', 'Não existem empresas na notificação. Selecione uma empresa acima e clique em Incluir.')}
          actionsLabel={t('simpleCrud.actions.title', 'Ações')}
          rowActions={(empresa) => [
            {
              label: t('common.remove', 'Remover'),
              icon: Trash2,
              tone: 'danger',
              onClick: () => setRemovingIds([empresa.id]),
            },
          ]}
        />
      </SectionCard>

      <ConfirmDialog
        open={Boolean(removingIds?.length)}
        title={t('panelNotifications.companies.confirmUnlinkTitle', 'Remover vínculo?')}
        description={t('panelNotifications.companies.confirmUnlinkDescription', 'As empresas selecionadas deixam de receber esta notificação por vínculo específico.')}
        confirmLabel={t('simpleCrud.actions.delete', 'Excluir')}
        cancelLabel={t('common.cancel', 'Cancelar')}
        isLoading={isSaving}
        onClose={() => setRemovingIds(null)}
        onConfirm={() => void handleRemoveEmpresas(removingIds ?? [])}
      />
    </>
  )
}
