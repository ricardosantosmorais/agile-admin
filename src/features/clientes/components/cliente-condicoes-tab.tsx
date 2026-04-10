'use client'

import { useState } from 'react'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { CrudModal } from '@/src/components/ui/crud-modal'
import { FormField as Field } from '@/src/components/ui/form-field'
import { ClientLookupSelect } from '@/src/features/clientes/components/client-lookup-select'
import { ClienteRelationSection } from '@/src/features/clientes/components/cliente-relation-section'
import type {
  ClientAssociatedPaymentCondition,
  ClientLookupOption,
} from '@/src/features/clientes/types/clientes'
import { createCompositeRelationId } from '@/src/features/clientes/services/cliente-form'
import { useI18n } from '@/src/i18n/use-i18n'
import { appData } from '@/src/services/app-data'

type ClienteCondicoesTabProps = {
  clientId: string
  readOnly: boolean
  items: ClientAssociatedPaymentCondition[]
  onRefresh: () => Promise<void>
  onError: (message: string | null) => void
}

export function ClienteCondicoesTab({
  clientId,
  readOnly,
  items,
  onRefresh,
  onError,
}: ClienteCondicoesTabProps) {
  const { t } = useI18n()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalFeedback, setModalFeedback] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [draft, setDraft] = useState({
    condicaoPagamento: null as ClientLookupOption | null,
    filial: null as ClientLookupOption | null,
  })

  function closeModal() {
    setModalOpen(false)
    setModalFeedback(null)
    setDraft({ condicaoPagamento: null, filial: null })
  }

  async function handleCreate() {
    if (!draft.condicaoPagamento || !draft.filial) {
      setModalFeedback(t('clientes.form.relations.selectPaymentConditionAndBranch', 'Select payment term and branch.'))
      return
    }

    try {
      await appData.clients.createRelation(clientId, 'condicoes_pagamento', {
        id_cliente: clientId,
        id_condicao_pagamento: draft.condicaoPagamento.id,
        id_filial: draft.filial.id,
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
      await appData.clients.deleteRelation(clientId, 'condicoes_pagamento', {
        items: selectedIds.map((item) => {
          const [idCondicaoPagamento, idFilial] = item.split(':')
          return { id_cliente: clientId, id_condicao_pagamento: idCondicaoPagamento, id_filial: idFilial }
        }),
      })
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
      <ClienteRelationSection<ClientAssociatedPaymentCondition>
        title={t('clientes.form.relations.paymentConditionsTitle', 'Payment terms')}
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
        getRowId={(item) => createCompositeRelationId(item.idCondicaoPagamento, item.filialId)}
        emptyMessage={t('clientes.form.relations.paymentConditionsEmpty', 'There are no payment terms for this customer. Select above and click add.')}
        columns={[
          { header: t('clientes.form.relations.paymentCondition', 'Payment term'), render: (item) => item.nomeCondicaoPagamento },
          { header: t('clientes.form.relations.branch', 'Branch'), render: (item) => item.filialNome || '-' },
        ]}
      />

      <CrudModal open={modalOpen} title={t('clientes.form.relations.includePaymentCondition', 'Add payment term')} onClose={closeModal} onConfirm={() => void handleCreate()}>
        <div className="grid gap-4 md:grid-cols-2">
          {modalFeedback ? <div className="app-error-panel md:col-span-2 rounded-[1rem] px-4 py-3 text-sm">{modalFeedback}</div> : null}
          <Field label={t('clientes.form.relations.paymentCondition', 'Payment term')}><ClientLookupSelect resource="condicoes_pagamento" label={t('clientes.form.relations.paymentCondition', 'Payment term')} value={draft.condicaoPagamento} onChange={(value) => setDraft((current) => ({ ...current, condicaoPagamento: value }))} disabled={readOnly} /></Field>
          <Field label={t('clientes.form.relations.branch', 'Branch')}><ClientLookupSelect resource="filiais" label={t('clientes.form.relations.branch', 'Branch')} value={draft.filial} onChange={(value) => setDraft((current) => ({ ...current, filial: value }))} disabled={readOnly} /></Field>
        </div>
      </CrudModal>

      <ConfirmDialog
        open={confirmOpen}
        title={t('clientes.form.relations.deletePaymentConditionsTitle', 'Delete payment terms')}
        description={t('clientes.form.relations.deletePaymentConditionsDescription', 'This action removes the selected payment terms from this customer.')}
        confirmLabel={t('clientes.actions.delete', 'Delete')}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </>
  )
}
