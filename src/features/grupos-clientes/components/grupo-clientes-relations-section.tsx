'use client'

import { Trash2, Upload } from 'lucide-react'
import { useState } from 'react'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { SectionCard } from '@/src/components/ui/section-card'
import { SelectableDataTable } from '@/src/components/ui/selectable-data-table'
import { TooltipIconButton } from '@/src/components/ui/tooltip-icon-button'
import { ClientLookupSelect } from '@/src/features/clientes/components/client-lookup-select'
import type { ClientLookupOption } from '@/src/features/clientes/types/clientes'
import { addGrupoClientes, deleteGrupoClientes, type GrupoClienteRelationItem } from '@/src/features/grupos-clientes/services/grupos-clientes-client'
import { useI18n } from '@/src/i18n/use-i18n'

type GrupoClientesRelationsSectionProps = {
  id: string
  readOnly: boolean
  clientes: GrupoClienteRelationItem[]
  onFeedback: (message: string | null) => void
  onRefresh: () => Promise<void>
}

export function GrupoClientesRelationsSection({
  id,
  readOnly,
  clientes,
  onFeedback,
  onRefresh,
}: GrupoClientesRelationsSectionProps) {
  const { t } = useI18n()
  const [selectedClient, setSelectedClient] = useState<ClientLookupOption | null>(null)
  const [selectedRelationIds, setSelectedRelationIds] = useState<string[]>([])
  const [confirmDeleteIds, setConfirmDeleteIds] = useState<string[] | null>(null)

  async function handleAddCliente() {
    if (!selectedClient) {
      onFeedback(t('people.customerGroups.validation.customer', 'Select the customer to include.'))
      return
    }

    try {
      await addGrupoClientes(id, [selectedClient.id])
      setSelectedClient(null)
      await onRefresh()
    } catch (saveError) {
      onFeedback(saveError instanceof Error ? saveError.message : t('people.customerGroups.relations.saveError', 'Could not link customer to group.'))
    }
  }

  async function handleDeleteClientes(clientIds: string[]) {
    if (!clientIds.length) {
      return
    }

    try {
      await deleteGrupoClientes(id, clientIds)
      setConfirmDeleteIds(null)
      setSelectedRelationIds([])
      await onRefresh()
    } catch (deleteError) {
      onFeedback(deleteError instanceof Error ? deleteError.message : t('people.customerGroups.relations.deleteError', 'Could not remove selected customers.'))
    }
  }

  return (
    <>
      <SectionCard
        title={t('people.customerGroups.tabs.customers', 'Customers')}
        action={(
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="inline-flex items-center gap-2 rounded-full border border-dashed border-[#d8ccb7] bg-white px-4 py-2 text-sm text-slate-500" disabled>
              <Upload className="h-4 w-4" />
              {t('people.customerGroups.import.comingSoon', 'Spreadsheet import in next step')}
            </button>
            {!readOnly && selectedRelationIds.length ? (
              <button type="button" onClick={() => setConfirmDeleteIds(selectedRelationIds)} className="inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white">
                <Trash2 className="h-4 w-4" />
                {t('common.deleteSelected', 'Delete selected')}
              </button>
            ) : null}
          </div>
        )}
      >
        <div className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
            <ClientLookupSelect
              resource="clientes"
              label={t('people.customerGroups.fields.customer', 'Customer')}
              value={selectedClient}
              onChange={setSelectedClient}
              disabled={readOnly}
            />
            {!readOnly ? (
              <button type="button" onClick={() => void handleAddCliente()} className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
                {t('common.include', 'Include')}
              </button>
            ) : null}
          </div>

          <SelectableDataTable
            items={clientes}
            selectedIds={selectedRelationIds}
            onSelectedIdsChange={setSelectedRelationIds}
            getRowId={(item) => item.id_cliente}
            emptyMessage={t('people.customerGroups.relations.empty', 'There are no customers in this group yet.')}
            columns={[
              { header: 'ID', headerClassName: 'w-[180px]', render: (item) => item.cliente?.id || item.id_cliente },
              { header: t('simpleCrud.fields.code', 'Code'), headerClassName: 'w-[120px]', render: (item) => item.cliente?.codigo || '-' },
              { header: t('simpleCrud.fields.name', 'Name'), render: (item) => item.cliente?.nome_fantasia || '-' },
              {
                header: t('common.actions', 'Actions'),
                headerClassName: 'w-[90px]',
                render: (item) => !readOnly ? (
                  <TooltipIconButton label={t('simpleCrud.actions.delete', 'Delete')}>
                    <button type="button" onClick={() => setConfirmDeleteIds([item.id_cliente])} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-700">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TooltipIconButton>
                ) : null,
              },
            ]}
          />
        </div>
      </SectionCard>

      <ConfirmDialog
        open={Boolean(confirmDeleteIds?.length)}
        title={t('people.customerGroups.confirmDeleteTitle', 'Remove customers from group?')}
        description={t('people.customerGroups.confirmDeleteDescription', 'The selected customers will be removed from this group.')}
        confirmLabel={t('simpleCrud.actions.delete', 'Delete')}
        cancelLabel={t('common.cancel', 'Cancel')}
        onClose={() => setConfirmDeleteIds(null)}
        onConfirm={() => void handleDeleteClientes(confirmDeleteIds ?? [])}
      />
    </>
  )
}
