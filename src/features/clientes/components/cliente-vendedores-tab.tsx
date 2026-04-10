'use client'

import { useState } from 'react'
import { BooleanChoice } from '@/src/components/ui/boolean-choice'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { CrudModal } from '@/src/components/ui/crud-modal'
import { FormField as Field } from '@/src/components/ui/form-field'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { ClientLookupSelect } from '@/src/features/clientes/components/client-lookup-select'
import { ClienteRelationSection } from '@/src/features/clientes/components/cliente-relation-section'
import type { ClientAssociatedSeller, ClientLookupOption } from '@/src/features/clientes/types/clientes'
import { useI18n } from '@/src/i18n/use-i18n'
import { appData } from '@/src/services/app-data'

type ClienteVendedoresTabProps = {
  clientId: string
  readOnly: boolean
  items: ClientAssociatedSeller[]
  onRefresh: () => Promise<void>
  onError: (message: string | null) => void
}

export function ClienteVendedoresTab({
  clientId,
  readOnly,
  items,
  onRefresh,
  onError,
}: ClienteVendedoresTabProps) {
  const { t } = useI18n()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalFeedback, setModalFeedback] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [draft, setDraft] = useState({
    vendedor: null as ClientLookupOption | null,
    padrao: false,
  })

  function closeModal() {
    setModalOpen(false)
    setModalFeedback(null)
    setDraft({ vendedor: null, padrao: false })
  }

  async function handleCreate() {
    if (!draft.vendedor) {
      setModalFeedback(t('clientes.form.relations.selectSeller', 'Select the seller to add.'))
      return
    }

    try {
      await appData.clients.createRelation(clientId, 'vendedores', {
        id_cliente: clientId,
        id_vendedor: draft.vendedor.id,
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
        await appData.clients.deleteRelation(clientId, 'vendedores', {
          id_cliente: clientId,
          id_vendedor: relationId,
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
      <ClienteRelationSection<ClientAssociatedSeller>
        title={t('clientes.form.relations.sellersTitle', 'Linked sellers')}
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
        getRowId={(item) => item.idVendedor}
        emptyMessage={t('clientes.form.relations.sellersEmpty', 'There are no sellers for this customer. Select above and click add.')}
        columns={[
          { header: t('clientes.form.relations.seller', 'Seller'), render: (item) => item.nomeVendedor },
          { header: t('clientes.form.relations.contact', 'Contact'), render: (item) => item.email || item.telefone || '-' },
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

      <CrudModal open={modalOpen} title={t('clientes.form.relations.includeSeller', 'Add seller')} onClose={closeModal} onConfirm={() => void handleCreate()}>
        <div className="grid gap-4 md:grid-cols-2">
          {modalFeedback ? <div className="app-error-panel md:col-span-2 rounded-[1rem] px-4 py-3 text-sm">{modalFeedback}</div> : null}
          <Field label={t('clientes.form.relations.seller', 'Seller')}><ClientLookupSelect resource="vendedores" label={t('clientes.form.relations.seller', 'Seller')} value={draft.vendedor} onChange={(value) => setDraft((current) => ({ ...current, vendedor: value }))} disabled={readOnly} /></Field>
          <Field label={t('clientes.form.relations.default', 'Default')}>
            <BooleanChoice value={draft.padrao} onChange={(value) => setDraft((current) => ({ ...current, padrao: value }))} disabled={readOnly} trueLabel={t('common.yes', 'Yes')} falseLabel={t('common.no', 'No')} />
          </Field>
        </div>
      </CrudModal>

      <ConfirmDialog
        open={confirmOpen}
        title={t('clientes.form.relations.deleteSellersTitle', 'Delete linked sellers')}
        description={t('clientes.form.relations.deleteSellersDescription', 'This action removes the selected sellers from this customer.')}
        confirmLabel={t('clientes.actions.delete', 'Delete')}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </>
  )
}
