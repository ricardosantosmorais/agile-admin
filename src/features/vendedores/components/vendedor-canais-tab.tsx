'use client'

import { useState } from 'react'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { CrudModal } from '@/src/components/ui/crud-modal'
import { FormField as Field } from '@/src/components/ui/form-field'
import { inputClasses } from '@/src/components/ui/input-styles'
import { LookupSelect } from '@/src/components/ui/lookup-select'
import { RelationActions } from '@/src/components/ui/relation-actions'
import { SectionCard } from '@/src/components/ui/section-card'
import { SelectableDataTable } from '@/src/components/ui/selectable-data-table'
import { useI18n } from '@/src/i18n/use-i18n'
import { formatNullableCurrency } from '@/src/lib/formatters'
import { currencyMask, parseCurrencyInput } from '@/src/lib/input-masks'
import { addVendedorCanais, deleteVendedorCanais, loadVendedorLookup } from '@/src/features/vendedores/services/vendedores-client'
import type { VendedorCanalDistribuicaoRelation } from '@/src/features/vendedores/types/vendedores'
import type { LookupOption } from '@/src/components/ui/lookup-select'

type VendedorCanaisTabProps = {
  vendedorId: string
  readOnly: boolean
  items: VendedorCanalDistribuicaoRelation[]
  onRefresh: () => Promise<void>
  onError: (message: string | null) => void
}

export function VendedorCanaisTab({
  vendedorId,
  readOnly,
  items,
  onRefresh,
  onError,
}: VendedorCanaisTabProps) {
  const { t } = useI18n()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalFeedback, setModalFeedback] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [draft, setDraft] = useState({
    canal: null as LookupOption | null,
    limiteCredito: '',
  })

  function closeModal() {
    setModalOpen(false)
    setModalFeedback(null)
    setDraft({ canal: null, limiteCredito: '' })
  }

  async function handleCreate() {
    if (!draft.canal) {
      setModalFeedback(t('people.sellers.channels.validation.channel', 'Selecione o canal de distribui??o para incluir.'))
      return
    }

    try {
      await addVendedorCanais(vendedorId, {
        id_canal_distribuicao: draft.canal.id,
        limite_credito: draft.limiteCredito ? parseCurrencyInput(draft.limiteCredito) : null,
      })
      await onRefresh()
      onError(null)
      closeModal()
    } catch (error) {
      setModalFeedback(error instanceof Error ? error.message : t('people.sellers.channels.saveError', 'N?o foi poss?vel vincular o canal de distribui??o.'))
    }
  }

  async function handleDelete() {
    try {
      await deleteVendedorCanais(vendedorId, selectedIds)
      setSelectedIds([])
      setConfirmOpen(false)
      await onRefresh()
      onError(null)
    } catch (error) {
      onError(error instanceof Error ? error.message : t('people.sellers.channels.deleteError', 'N?o foi poss?vel remover os canais selecionados.'))
    }
  }

  return (
    <>
      <SectionCard
        title={t('people.sellers.tabs.channels', 'Canais de distribui??o')}
        action={!readOnly ? (
          <RelationActions
            hasSelection={selectedIds.length > 0}
            onDelete={() => setConfirmOpen(true)}
            onCreate={() => {
              setModalFeedback(null)
              setModalOpen(true)
            }}
            createLabel={t('common.include', 'Include')}
          />
        ) : undefined}
      >
        <SelectableDataTable<VendedorCanalDistribuicaoRelation>
          items={items}
          selectedIds={selectedIds}
          onSelectedIdsChange={setSelectedIds}
          getRowId={(item) => item.id_canal_distribuicao}
          emptyMessage={t('people.sellers.channels.empty', 'There are no distribution channels linked to this seller yet.')}
          columns={[
            {
              header: t('people.sellers.fields.distributionChannel', 'Canal de distribui??o'),
              render: (item) => item.canal_distribuicao?.nome || item.id_canal_distribuicao,
            },
            {
              header: t('people.sellers.fields.creditLimit', 'Limite de cr?dito'),
              headerClassName: 'w-[180px]',
              render: (item) => formatNullableCurrency(item.limite_credito),
            },
          ]}
        />
      </SectionCard>

      <CrudModal open={modalOpen} title={t('people.sellers.channels.includeTitle', 'Incluir canal de distribui??o')} onClose={closeModal} onConfirm={() => void handleCreate()}>
        <div className="grid gap-4 md:grid-cols-2">
          {modalFeedback ? <div className="app-error-panel md:col-span-2 rounded-[1rem] px-4 py-3 text-sm">{modalFeedback}</div> : null}
          <Field label={t('people.sellers.fields.distributionChannel', 'Canal de distribui??o')}>
            <LookupSelect
              label={t('people.sellers.fields.distributionChannel', 'Canal de distribui??o')}
              value={draft.canal}
              onChange={(value) => setDraft((current) => ({ ...current, canal: value }))}
              loadOptions={(query, page, perPage) => loadVendedorLookup('canais_distribuicao', query, page, perPage)}
              disabled={readOnly}
            />
          </Field>
          <Field label={t('people.sellers.fields.creditLimit', 'Limite de cr?dito')}>
            <input
              value={draft.limiteCredito}
              onChange={(event) => setDraft((current) => ({ ...current, limiteCredito: currencyMask(event.target.value) }))}
              className={inputClasses()}
              disabled={readOnly}
              placeholder="R$ 0,00"
              inputMode="numeric"
            />
          </Field>
        </div>
      </CrudModal>

      <ConfirmDialog
        open={confirmOpen}
        title={t('people.sellers.channels.deleteTitle', 'Excluir canais vinculados')}
        description={t('people.sellers.channels.deleteDescription', 'Os canais selecionados ser?o removidos deste vendedor.')}
        confirmLabel={t('common.delete', 'Excluir')}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </>
  )
}
