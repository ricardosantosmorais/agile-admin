'use client'

import { useState } from 'react'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { CrudModal } from '@/src/components/ui/crud-modal'
import { FormField as Field } from '@/src/components/ui/form-field'
import { ClientLookupSelect } from '@/src/features/clientes/components/client-lookup-select'
import { ClienteRelationSection } from '@/src/features/clientes/components/cliente-relation-section'
import type {
  ClientAssociatedPaymentMethod,
  ClientLookupOption,
} from '@/src/features/clientes/types/clientes'
import { createCompositeRelationId } from '@/src/features/clientes/services/cliente-form'
import { useI18n } from '@/src/i18n/use-i18n'
import { appData } from '@/src/services/app-data'

type ClienteFormasTabProps = {
  clientId: string
  readOnly: boolean
  items: ClientAssociatedPaymentMethod[]
  onRefresh: () => Promise<void>
  onError: (message: string | null) => void
}

export function ClienteFormasTab({
  clientId,
  readOnly,
  items,
  onRefresh,
  onError,
}: ClienteFormasTabProps) {
  const { t } = useI18n()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalFeedback, setModalFeedback] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [draft, setDraft] = useState({
    formaPagamento: null as ClientLookupOption | null,
    filial: null as ClientLookupOption | null,
  })

  function closeModal() {
    setModalOpen(false)
    setModalFeedback(null)
    setDraft({ formaPagamento: null, filial: null })
  }

  async function handleCreate() {
    if (!draft.formaPagamento || !draft.filial) {
      setModalFeedback(t('clientes.form.relations.selectPaymentMethodAndBranch', 'Select payment method and branch.'))
      return
    }

    try {
      await appData.clients.createRelation(clientId, 'formas_pagamento', {
        id_cliente: clientId,
        id_forma_pagamento: draft.formaPagamento.id,
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
      await appData.clients.deleteRelation(clientId, 'formas_pagamento', {
        items: selectedIds.map((item) => {
          const [idFormaPagamento, idFilial] = item.split(':')
          return { id_cliente: clientId, id_forma_pagamento: idFormaPagamento, id_filial: idFilial }
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
      <ClienteRelationSection<ClientAssociatedPaymentMethod>
        title={t('clientes.form.relations.paymentMethodsTitle', 'Payment methods')}
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
        getRowId={(item) => createCompositeRelationId(item.idFormaPagamento, item.filialId)}
        emptyMessage={t('clientes.form.relations.paymentMethodsEmpty', 'There are no payment methods for this customer. Select above and click add.')}
        columns={[
          { header: t('clientes.form.relations.paymentMethod', 'Payment method'), render: (item) => item.nomeFormaPagamento },
          { header: t('clientes.form.relations.branch', 'Branch'), render: (item) => item.filialNome || '-' },
        ]}
      />

      <CrudModal open={modalOpen} title={t('clientes.form.relations.includePaymentMethod', 'Add payment method')} onClose={closeModal} onConfirm={() => void handleCreate()}>
        <div className="grid gap-4 md:grid-cols-2">
          {modalFeedback ? <div className="md:col-span-2 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{modalFeedback}</div> : null}
          <Field label={t('clientes.form.relations.paymentMethod', 'Payment method')}><ClientLookupSelect resource="formas_pagamento" label={t('clientes.form.relations.paymentMethod', 'Payment method')} value={draft.formaPagamento} onChange={(value) => setDraft((current) => ({ ...current, formaPagamento: value }))} disabled={readOnly} /></Field>
          <Field label={t('clientes.form.relations.branch', 'Branch')}><ClientLookupSelect resource="filiais" label={t('clientes.form.relations.branch', 'Branch')} value={draft.filial} onChange={(value) => setDraft((current) => ({ ...current, filial: value }))} disabled={readOnly} /></Field>
        </div>
      </CrudModal>

      <ConfirmDialog
        open={confirmOpen}
        title={t('clientes.form.relations.deletePaymentMethodsTitle', 'Delete payment methods')}
        description={t('clientes.form.relations.deletePaymentMethodsDescription', 'This action removes the selected payment methods from this customer.')}
        confirmLabel={t('clientes.actions.delete', 'Delete')}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </>
  )
}
