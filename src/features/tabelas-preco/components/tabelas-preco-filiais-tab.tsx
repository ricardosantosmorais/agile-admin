'use client'

import { useMemo, useState } from 'react'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { CrudModal } from '@/src/components/ui/crud-modal'
import { FormField } from '@/src/components/ui/form-field'
import { LookupSelect, type LookupOption } from '@/src/components/ui/lookup-select'
import { ClienteRelationSection } from '@/src/features/clientes/components/cliente-relation-section'
import type { TabelaPrecoFilialRecord } from '@/src/features/tabelas-preco/services/tabelas-preco-client'
import { tabelasPrecoClient } from '@/src/features/tabelas-preco/services/tabelas-preco-client'
import { loadCrudLookupOptions } from '@/src/components/crud-base/crud-client'
import { useI18n } from '@/src/i18n/use-i18n'

type Props = {
  tabelaPrecoId: string
  items: TabelaPrecoFilialRecord[]
  readOnly: boolean
  onRefresh: () => Promise<void>
  onError: (message: string | null) => void
}

function getRowId(item: TabelaPrecoFilialRecord) {
  return `${item.id_tabela_preco}:${item.id_filial}`
}

const feedbackClasses = 'app-error-panel rounded-[1rem] px-4 py-3 text-sm'

export function TabelasPrecoFiliaisTab({
  tabelaPrecoId,
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
  const [draft, setDraft] = useState<{ filial: LookupOption | null; padrao: boolean }>({ filial: null, padrao: false })

  const tableItems = useMemo(() => items, [items])

  function closeModal() {
    setModalOpen(false)
    setFeedback(null)
    setDraft({ filial: null, padrao: false })
    setIsSaving(false)
  }

  async function handleCreate() {
    if (!draft.filial) {
      setFeedback(t('financial.common.selectBranch', 'Selecione uma filial.'))
      return
    }

    setIsSaving(true)
    try {
      await tabelasPrecoClient.createFilial(tabelaPrecoId, {
        id_tabela_preco: tabelaPrecoId,
        id_filial: draft.filial.id,
        padrao: draft.padrao,
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
      await tabelasPrecoClient.deleteFiliais(tabelaPrecoId, selectedIds.map((value) => {
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
      <ClienteRelationSection<TabelaPrecoFilialRecord>
        title={t('financial.priceTables.tabs.branches', 'Filiais')}
        readOnly={readOnly}
        hasSelection={selectedIds.length > 0}
        onDelete={() => setConfirmOpen(true)}
        onCreate={() => setModalOpen(true)}
        items={tableItems}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        getRowId={getRowId}
        emptyMessage={t('financial.priceTables.messages.emptyBranches', 'Nenhuma filial vinculada foi encontrada.')}
        columns={[
          { header: t('simpleCrud.fields.id', 'ID'), render: (item) => item.filial?.id || item.id_filial },
          { header: t('simpleCrud.fields.code', 'Código'), render: (item) => item.filial?.codigo || '-' },
          { header: t('financial.common.branch', 'Filial'), render: (item) => item.filial?.nome_fantasia || item.filial?.nome || item.id_filial },
          { header: t('financial.priceTables.fields.defaultBranch', 'Padrão'), render: (item) => item.padrao ? 'Sim' : 'Não' },
        ]}
      />

      <CrudModal
        open={modalOpen}
        title={t('financial.priceTables.messages.includeBranch', 'Adicionar filial')}
        onClose={closeModal}
        onConfirm={() => void handleCreate()}
        isSaving={isSaving}
      >
        {feedback ? <div className={feedbackClasses}>{feedback}</div> : null}
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label={t('financial.common.branch', 'Filial')}>
            <LookupSelect
              label={t('financial.common.branch', 'Filial')}
              value={draft.filial}
              onChange={(value) => setDraft((current) => ({ ...current, filial: value }))}
              disabled={readOnly}
              loadOptions={(query, page, perPage) => loadCrudLookupOptions('filiais', query, page, perPage).then((options) => options.map((option) => ({ id: option.value, label: option.label })))}
            />
          </FormField>
          <FormField label={t('financial.priceTables.fields.defaultBranch', 'Padrão')}>
            <button
              type="button"
              onClick={() => setDraft((current) => ({ ...current, padrao: !current.padrao }))}
              disabled={readOnly}
              className={`inline-flex h-11 w-full items-center justify-center rounded-[1rem] border text-sm font-semibold transition ${draft.padrao ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-500' : 'app-button-secondary'}`}
            >
              {draft.padrao ? t('common.yes', 'Sim') : t('common.no', 'Não')}
            </button>
          </FormField>
        </div>
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
