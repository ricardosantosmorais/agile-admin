'use client'

import { useState } from 'react'
import { BooleanChoice } from '@/src/components/ui/boolean-choice'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { CrudModal } from '@/src/components/ui/crud-modal'
import { FormField as Field } from '@/src/components/ui/form-field'
import { InputWithAffix } from '@/src/components/ui/input-with-affix'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { ClientLookupSelect } from '@/src/features/clientes/components/client-lookup-select'
import { ClienteRelationSection } from '@/src/features/clientes/components/cliente-relation-section'
import type { ClientAssociatedBranch, ClientLookupOption } from '@/src/features/clientes/types/clientes'
import { useI18n } from '@/src/i18n/use-i18n'
import { currencyMask, parseCurrencyInput } from '@/src/lib/input-masks'
import { appData } from '@/src/services/app-data'

type ClienteFiliaisTabProps = {
  clientId: string
  readOnly: boolean
  items: ClientAssociatedBranch[]
  onRefresh: () => Promise<void>
  onError: (message: string | null) => void
}

export function ClienteFiliaisTab({
  clientId,
  readOnly,
  items,
  onRefresh,
  onError,
}: ClienteFiliaisTabProps) {
  const { t } = useI18n()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalFeedback, setModalFeedback] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [draft, setDraft] = useState({
    filial: null as ClientLookupOption | null,
    tabelaPreco: null as ClientLookupOption | null,
    limiteCredito: '',
    padrao: false,
  })

  function closeModal() {
    setModalOpen(false)
    setModalFeedback(null)
    setDraft({ filial: null, tabelaPreco: null, limiteCredito: '', padrao: false })
  }

  async function handleCreate() {
    if (!draft.filial) {
      setModalFeedback(t('clientes.form.relations.selectBranch', 'Select the branch to add.'))
      return
    }

    try {
      await appData.clients.createRelation(clientId, 'filiais', {
        id_cliente: clientId,
        id_filial: draft.filial.id,
        id_tabela_preco: draft.tabelaPreco?.id || null,
        limite_credito: draft.limiteCredito ? parseCurrencyInput(draft.limiteCredito) : null,
        padrao: draft.padrao,
      })
      await onRefresh()
      onError(null)
      closeModal()
    } catch (error) {
      setModalFeedback(error instanceof Error ? error.message : t('clientes.form.relations.saveError', 'Could not save the relation.'))
    }
  }

  async function handleDelete() {
    try {
      for (const relationId of selectedIds) {
        await appData.clients.deleteRelation(clientId, 'filiais', {
          id_cliente: clientId,
          id_filial: relationId,
        })
      }
      setSelectedIds([])
      setConfirmOpen(false)
      await onRefresh()
      onError(null)
    } catch (error) {
      onError(error instanceof Error ? error.message : t('clientes.form.relations.deleteError', 'Could not delete the relation.'))
    }
  }

  return (
    <>
      <ClienteRelationSection<ClientAssociatedBranch>
        title={t('clientes.form.relations.branchesTitle', 'Linked branches')}
        readOnly={readOnly}
        hasSelection={selectedIds.length > 0}
        onDelete={() => setConfirmOpen(true)}
        onCreate={() => {
          setModalFeedback(null)
          setModalOpen(true)
        }}
        items={items}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        getRowId={(item) => item.idFilial}
        emptyMessage={t('clientes.form.relations.branchesEmpty', 'There are no branches for this customer. Select above and click add.')}
        columns={[
          { header: t('clientes.form.relations.branch', 'Branch'), render: (item) => item.nomeFilial },
          { header: t('clientes.form.relations.priceTable', 'Price table'), render: (item) => item.tabelaPreco || '-' },
          { header: t('clientes.form.relations.creditLimit', 'Credit limit'), render: (item) => item.limiteCredito || '-' },
          {
            header: t('clientes.form.relations.default', 'Default'),
            render: (item) => (
              <StatusBadge tone={item.padrao ? 'success' : 'neutral'}>
                {item.padrao ? t('clientes.status.yes', 'Yes') : t('clientes.status.no', 'No')}
              </StatusBadge>
            ),
          },
        ]}
      />

      <CrudModal open={modalOpen} title={t('clientes.form.relations.includeBranch', 'Add branch')} onClose={closeModal} onConfirm={() => void handleCreate()}>
        <div className="grid gap-4 md:grid-cols-2">
          {modalFeedback ? <div className="app-error-panel md:col-span-2 rounded-[1rem] px-4 py-3 text-sm">{modalFeedback}</div> : null}
          <Field label={t('clientes.form.relations.branch', 'Branch')}><ClientLookupSelect resource="filiais" label={t('clientes.form.relations.branch', 'Branch')} value={draft.filial} onChange={(value) => setDraft((current) => ({ ...current, filial: value }))} disabled={readOnly} /></Field>
          <Field label={t('clientes.form.relations.priceTable', 'Price table')}><ClientLookupSelect resource="tabelas_preco" label={t('clientes.form.relations.priceTable', 'Price table')} value={draft.tabelaPreco} onChange={(value) => setDraft((current) => ({ ...current, tabelaPreco: value }))} disabled={readOnly} /></Field>
          <Field label={t('clientes.form.relations.creditLimit', 'Credit limit')}>
            <InputWithAffix
              prefix="R$"
              value={draft.limiteCredito}
              onChange={(event) => setDraft((current) => ({ ...current, limiteCredito: currencyMask(event.target.value) }))}
              disabled={readOnly}
              placeholder="0,00"
              inputMode="numeric"
            />
          </Field>
          <Field label={t('clientes.form.relations.default', 'Default')}>
            <BooleanChoice value={draft.padrao} onChange={(value) => setDraft((current) => ({ ...current, padrao: value }))} disabled={readOnly} trueLabel={t('common.yes', 'Yes')} falseLabel={t('common.no', 'No')} />
          </Field>
        </div>
      </CrudModal>

      <ConfirmDialog
        open={confirmOpen}
        title={t('clientes.form.relations.deleteBranchesTitle', 'Delete linked branches')}
        description={t('clientes.form.relations.deleteBranchesDescription', 'This action removes the selected branches from this customer.')}
        confirmLabel={t('clientes.actions.delete', 'Delete')}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </>
  )
}
