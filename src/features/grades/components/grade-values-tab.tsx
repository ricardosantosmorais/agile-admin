'use client'

import { ArrowDown, ArrowUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { CrudModal } from '@/src/components/ui/crud-modal'
import { FormField } from '@/src/components/ui/form-field'
import { inputClasses } from '@/src/components/ui/input-styles'
import { ClienteRelationSection } from '@/src/features/clientes/components/cliente-relation-section'
import type { GradeValueRecord } from '@/src/features/catalog/types/catalog-relations'
import { useI18n } from '@/src/i18n/use-i18n'

type GradeValuesTabProps = {
  gradeId: string
  readOnly: boolean
  items: GradeValueRecord[]
  onRefresh: () => Promise<void>
  onError: (message: string | null) => void
  saveValue: (id: string, payload: Partial<GradeValueRecord>) => Promise<unknown>
  reorderValues: (id: string, payload: Array<Partial<GradeValueRecord>>) => Promise<unknown>
  deleteValues: (id: string, ids: string[]) => Promise<unknown>
}

type GradeValueDraft = {
  codigo: string
  valor: string
  hexa1: string
  hexa2: string
}

export function GradeValuesTab({
  gradeId,
  readOnly,
  items,
  onRefresh,
  onError,
  saveValue,
  reorderValues,
  deleteValues,
}: GradeValuesTabProps) {
  const { t } = useI18n()
  const orderedItems = useMemo(
    () => [...items].sort((left, right) => Number(left.posicao || 0) - Number(right.posicao || 0)),
    [items],
  )
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalFeedback, setModalFeedback] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [draft, setDraft] = useState<GradeValueDraft>({
    codigo: '',
    valor: '',
    hexa1: '',
    hexa2: '',
  })

  function closeModal() {
    setModalOpen(false)
    setModalFeedback(null)
    setDraft({ codigo: '', valor: '', hexa1: '', hexa2: '' })
  }

  async function handleCreate() {
    if (!draft.valor.trim()) {
      setModalFeedback(t('catalog.grades.values.valueRequired', 'Enter the grade value.'))
      return
    }

    try {
      await saveValue(gradeId, {
        codigo: draft.codigo || null,
        valor: draft.valor,
        hexa1: draft.hexa1 || null,
        hexa2: draft.hexa2 || null,
        posicao: orderedItems.length + 1,
        ativo: true,
      })
      await onRefresh()
      onError(null)
      closeModal()
    } catch (error) {
      setModalFeedback(error instanceof Error ? error.message : t('catalog.grades.values.saveError', 'Could not save the grade value.'))
    }
  }

  async function handleDelete() {
    try {
      await deleteValues(gradeId, selectedIds)
      setSelectedIds([])
      setConfirmOpen(false)
      await onRefresh()
      onError(null)
    } catch (error) {
      onError(error instanceof Error ? error.message : t('catalog.grades.values.deleteError', 'Could not remove the selected values.'))
    }
  }

  async function moveItem(id: string, direction: -1 | 1) {
    const index = orderedItems.findIndex((item) => item.id === id)
    const nextIndex = index + direction
    if (index < 0 || nextIndex < 0 || nextIndex >= orderedItems.length) {
      return
    }

    const reordered = [...orderedItems]
    const [item] = reordered.splice(index, 1)
    reordered.splice(nextIndex, 0, item)

    try {
      await reorderValues(gradeId, reordered.map((entry, orderIndex) => ({
        id: entry.id,
        codigo: entry.codigo || null,
        valor: entry.valor,
        hexa1: entry.hexa1 || null,
        hexa2: entry.hexa2 || null,
        posicao: orderIndex + 1,
        ativo: entry.ativo ?? true,
      })))
      await onRefresh()
      onError(null)
    } catch (error) {
      onError(error instanceof Error ? error.message : t('catalog.grades.values.orderError', 'Could not update the value order.'))
    }
  }

  return (
    <>
      <ClienteRelationSection<GradeValueRecord>
        title={t('catalog.grades.values.title', 'Values')}
        readOnly={readOnly}
        hasSelection={selectedIds.length > 0}
        onDelete={() => setConfirmOpen(true)}
        onCreate={() => {
          setModalFeedback(null)
          setModalOpen(true)
        }}
        items={orderedItems}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        getRowId={(item) => item.id}
        emptyMessage={t('catalog.grades.values.empty', 'No value was configured for this grade.')}
        columns={[
          { header: t('catalog.grades.values.position', 'Position'), headerClassName: 'w-[90px]', render: (item) => String(item.posicao || '-') },
          { header: t('simpleCrud.fields.code', 'Code'), headerClassName: 'w-[140px]', render: (item) => item.codigo || '-' },
          { header: t('catalog.grades.values.value', 'Value'), cellClassName: 'font-semibold text-slate-950', render: (item) => item.valor },
          {
            header: t('catalog.grades.values.colors', 'Colors'),
            render: (item) => (
              <div className="flex gap-2">
                {item.hexa1 ? <span className="inline-flex h-6 w-6 rounded-full border border-line" style={{ backgroundColor: item.hexa1 }} /> : null}
                {item.hexa2 ? <span className="inline-flex h-6 w-6 rounded-full border border-line" style={{ backgroundColor: item.hexa2 }} /> : null}
                {!item.hexa1 && !item.hexa2 ? '-' : null}
              </div>
            ),
          },
          {
            header: t('catalog.productsTab.order', 'Order'),
            headerClassName: 'w-[120px]',
            render: (item) => readOnly ? null : (
              <div className="flex gap-2">
                <button type="button" onClick={() => void moveItem(item.id, -1)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white text-slate-700">
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => void moveItem(item.id, 1)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white text-slate-700">
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
            ),
          },
        ]}
      />

      <CrudModal
        open={modalOpen}
        title={t('catalog.grades.values.add', 'Add value')}
        onClose={closeModal}
        onConfirm={() => void handleCreate()}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {modalFeedback ? (
            <div className="md:col-span-2 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{modalFeedback}</div>
          ) : null}
          <FormField label={t('simpleCrud.fields.code', 'Code')}>
            <input type="text" value={draft.codigo} onChange={(event) => setDraft((current) => ({ ...current, codigo: event.target.value }))} className={inputClasses()} disabled={readOnly} />
          </FormField>
          <FormField label={t('catalog.grades.values.value', 'Value')}>
            <input type="text" value={draft.valor} onChange={(event) => setDraft((current) => ({ ...current, valor: event.target.value }))} className={inputClasses()} disabled={readOnly} />
          </FormField>
          <FormField label={t('catalog.grades.values.primaryColor', 'Primary color')}>
            <input type="text" value={draft.hexa1} onChange={(event) => setDraft((current) => ({ ...current, hexa1: event.target.value.toUpperCase() }))} className={inputClasses()} disabled={readOnly} />
          </FormField>
          <FormField label={t('catalog.grades.values.secondaryColor', 'Secondary color')}>
            <input type="text" value={draft.hexa2} onChange={(event) => setDraft((current) => ({ ...current, hexa2: event.target.value.toUpperCase() }))} className={inputClasses()} disabled={readOnly} />
          </FormField>
        </div>
      </CrudModal>

      <ConfirmDialog
        open={confirmOpen}
        title={t('catalog.grades.values.deleteTitle', 'Delete values')}
        description={t('catalog.grades.values.deleteDescription', 'The selected values will be removed from this grade.')}
        confirmLabel={t('common.delete', 'Delete')}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </>
  )
}
