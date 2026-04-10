'use client'

import { useMemo, useState } from 'react'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { CrudModal } from '@/src/components/ui/crud-modal'
import { FormField } from '@/src/components/ui/form-field'
import { LookupSelect, type LookupOption } from '@/src/components/ui/lookup-select'
import { ClienteRelationSection } from '@/src/features/clientes/components/cliente-relation-section'
import { formasPagamentoClient } from '@/src/features/formas-pagamento/services/formas-pagamento-client'
import type { FormaPagamentoCondicaoRecord } from '@/src/features/formas-pagamento/services/formas-pagamento-mappers'
import { loadCrudLookupOptions } from '@/src/components/crud-base/crud-client'
import { useI18n } from '@/src/i18n/use-i18n'

type Props = {
  formaPagamentoId: string
  items: FormaPagamentoCondicaoRecord[]
  readOnly: boolean
  onRefresh: () => Promise<void>
  onError: (message: string | null) => void
}

function getRowId(item: FormaPagamentoCondicaoRecord) {
  return `${item.id_forma_pagamento}:${item.id_condicao_pagamento}`
}

const feedbackClasses = 'app-error-panel rounded-[1rem] px-4 py-3 text-sm'

export function FormaPagamentoCondicoesTab({
  formaPagamentoId,
  items,
  readOnly,
  onRefresh,
  onError,
}: Props) {
  const { t } = useI18n()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [draft, setDraft] = useState<LookupOption | null>(null)
  const tableItems = useMemo(() => items, [items])

  function closeModal() {
    setModalOpen(false)
    setFeedback(null)
    setDraft(null)
    setIsSaving(false)
  }

  async function handleCreate() {
    if (!draft) {
      setFeedback(t('financial.paymentMethods.messages.selectCondition', 'Selecione uma condição de pagamento.'))
      return
    }

    setIsSaving(true)
    try {
      await formasPagamentoClient.createCondicao(formaPagamentoId, {
        id_forma_pagamento: formaPagamentoId,
        id_condicao_pagamento: draft.id,
      })
      await onRefresh()
      onError(null)
      closeModal()
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : t('financial.common.saveRelationError', 'Não foi possível salvar o vínculo.'))
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    try {
      await formasPagamentoClient.deleteCondicoes(formaPagamentoId, selectedIds.map((value) => {
        const [, idCondicaoPagamento] = value.split(':')
        return { id_condicao_pagamento: idCondicaoPagamento }
      }))
      setSelectedIds([])
      setConfirmOpen(false)
      await onRefresh()
      onError(null)
    } catch (error) {
      onError(error instanceof Error ? error.message : t('financial.common.deleteRelationError', 'Não foi possível excluir o vínculo.'))
    }
  }

  return (
    <>
      <ClienteRelationSection<FormaPagamentoCondicaoRecord>
        title={t('financial.paymentMethods.tabs.conditions', 'Condições de pagamento')}
        readOnly={readOnly}
        hasSelection={selectedIds.length > 0}
        onDelete={() => setConfirmOpen(true)}
        onCreate={() => setModalOpen(true)}
        items={tableItems}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        getRowId={getRowId}
        emptyMessage={t('financial.paymentMethods.messages.emptyConditions', 'Nenhuma condição vinculada foi encontrada.')}
        columns={[
          { header: t('simpleCrud.fields.id', 'ID'), render: (item) => item.condicao_pagamento?.id || item.id_condicao_pagamento },
          { header: t('simpleCrud.fields.code', 'Código'), render: (item) => item.condicao_pagamento?.codigo || '-' },
          { header: t('simpleCrud.fields.name', 'Nome'), render: (item) => item.condicao_pagamento?.nome || item.id_condicao_pagamento },
          { header: t('financial.paymentTerms.fields.averageTerm', 'Prazo médio'), render: (item) => String(item.condicao_pagamento?.prazo_medio ?? '-') },
          { header: t('financial.paymentTerms.fields.installments', 'Parcelas'), render: (item) => String(item.condicao_pagamento?.parcelas ?? '-') },
        ]}
      />

      <CrudModal
        open={modalOpen}
        title={t('financial.paymentMethods.messages.includeCondition', 'Adicionar condição de pagamento')}
        onClose={closeModal}
        onConfirm={() => void handleCreate()}
        isSaving={isSaving}
      >
        {feedback ? <div className={feedbackClasses}>{feedback}</div> : null}
        <FormField label={t('financial.paymentMethods.tabs.conditions', 'Condições de pagamento')}>
          <LookupSelect
            label={t('financial.paymentMethods.tabs.conditions', 'Condições de pagamento')}
            value={draft}
            onChange={setDraft}
            disabled={readOnly}
            loadOptions={(query, page, perPage) => loadCrudLookupOptions('condicoes_pagamento', query, page, perPage).then((options) => options.map((option) => ({ id: option.value, label: option.label })))}
          />
        </FormField>
      </CrudModal>

      <ConfirmDialog
        open={confirmOpen}
        title={t('financial.paymentMethods.messages.deleteConditionsTitle', 'Excluir condições')}
        description={t('financial.paymentMethods.messages.deleteConditionsDescription', 'As condições selecionadas serão removidas do vínculo.')}
        confirmLabel={t('common.delete', 'Excluir')}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </>
  )
}
