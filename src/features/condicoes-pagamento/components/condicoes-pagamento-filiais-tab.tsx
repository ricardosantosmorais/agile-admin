'use client'

import { useMemo, useState } from 'react'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { CrudModal } from '@/src/components/ui/crud-modal'
import { FormField } from '@/src/components/ui/form-field'
import { LookupSelect, type LookupOption } from '@/src/components/ui/lookup-select'
import { ClienteRelationSection } from '@/src/features/clientes/components/cliente-relation-section'
import type { CondicaoPagamentoFilialRecord } from '@/src/features/condicoes-pagamento/services/condicoes-pagamento-client'
import { condicoesPagamentoClient } from '@/src/features/condicoes-pagamento/services/condicoes-pagamento-client'
import { loadCrudLookupOptions } from '@/src/components/crud-base/crud-client'
import { useI18n } from '@/src/i18n/use-i18n'

type Props = {
  condicaoPagamentoId: string
  items: CondicaoPagamentoFilialRecord[]
  readOnly: boolean
  onRefresh: () => Promise<void>
  onError: (message: string | null) => void
}

function getRowId(item: CondicaoPagamentoFilialRecord) {
  return `${item.id_condicao_pagamento}:${item.id_filial}`
}

export function CondicoesPagamentoFiliaisTab({
  condicaoPagamentoId,
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
      setFeedback(t('financial.common.selectBranch', 'Selecione uma filial.'))
      return
    }

    setIsSaving(true)
    try {
      await condicoesPagamentoClient.createFilial(condicaoPagamentoId, {
        id_condicao_pagamento: condicaoPagamentoId,
        id_filial: draft.id,
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
      await condicoesPagamentoClient.deleteFiliais(condicaoPagamentoId, selectedIds.map((value) => {
        const [, idFilial] = value.split(':')
        return { id_filial: idFilial }
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
      <ClienteRelationSection<CondicaoPagamentoFilialRecord>
        title={t('financial.paymentTerms.tabs.branches', 'Filiais')}
        readOnly={readOnly}
        hasSelection={selectedIds.length > 0}
        onDelete={() => setConfirmOpen(true)}
        onCreate={() => setModalOpen(true)}
        items={tableItems}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        getRowId={getRowId}
        emptyMessage={t('financial.paymentTerms.messages.emptyBranches', 'Nenhuma filial vinculada foi encontrada.')}
        columns={[
          { header: t('simpleCrud.fields.id', 'ID'), render: (item) => item.filial?.id || item.id_filial },
          { header: t('simpleCrud.fields.code', 'Código'), render: (item) => item.filial?.codigo || '-' },
          { header: t('financial.common.branch', 'Filial'), render: (item) => item.filial?.nome_fantasia || item.filial?.nome || item.id_filial },
          { header: t('simpleCrud.fields.active', 'Ativo'), render: (item) => item.filial?.ativo ? 'Sim' : 'Não' },
        ]}
      />

      <CrudModal
        open={modalOpen}
        title={t('financial.paymentTerms.messages.includeBranch', 'Adicionar filial')}
        onClose={closeModal}
        onConfirm={() => void handleCreate()}
        isSaving={isSaving}
      >
        {feedback ? <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{feedback}</div> : null}
        <FormField label={t('financial.common.branch', 'Filial')}>
          <LookupSelect
            label={t('financial.common.branch', 'Filial')}
            value={draft}
            onChange={setDraft}
            disabled={readOnly}
            loadOptions={(query, page, perPage) => loadCrudLookupOptions('filiais', query, page, perPage).then((options) => options.map((option) => ({ id: option.value, label: option.label })))}
          />
        </FormField>
      </CrudModal>

      <ConfirmDialog
        open={confirmOpen}
        title={t('financial.common.deleteBranchesTitle', 'Excluir filiais')}
        description={t('financial.common.deleteBranchesDescription', 'As filiais selecionadas serão removidas do vínculo.')}
        confirmLabel={t('common.delete', 'Excluir')}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </>
  )
}
