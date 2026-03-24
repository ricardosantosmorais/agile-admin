'use client'

import { ArrowDown, ArrowUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { CrudModal } from '@/src/components/ui/crud-modal'
import { FormField } from '@/src/components/ui/form-field'
import { inputClasses } from '@/src/components/ui/input-styles'
import { ClienteRelationSection } from '@/src/features/clientes/components/cliente-relation-section'
import { CatalogLookupSelect } from '@/src/features/catalog/components/catalog-lookup-select'
import type { CatalogLookupOption, CatalogProductRelation } from '@/src/features/catalog/types/catalog-relations'
import { useI18n } from '@/src/i18n/use-i18n'

type CatalogProductsTabProps = {
  mode: 'colecoes' | 'listas'
  entityId: string
  readOnly: boolean
  items: CatalogProductRelation[]
  onRefresh: () => Promise<void>
  onError: (message: string | null) => void
  createProducts: (id: string, items: Array<Pick<CatalogProductRelation, 'id_produto' | 'id_tabela_preco' | 'quantidade' | 'posicao'>>) => Promise<unknown>
  deleteProducts: (id: string, items: Array<Pick<CatalogProductRelation, 'id_produto' | 'id_tabela_preco'>>) => Promise<unknown>
}

type ProductDraft = {
  produto: CatalogLookupOption | null
  tabelaPreco: CatalogLookupOption | null
  quantidade: string
}

function resolveProductId(item: CatalogProductRelation) {
  return String(item.id_produto || item.produto?.id || '')
}

function resolvePriceTableId(item: CatalogProductRelation) {
  return String(item.id_tabela_preco || item.tabela_preco?.id || '')
}

function buildRowId(item: CatalogProductRelation) {
  return `${resolveProductId(item)}:${resolvePriceTableId(item)}`
}

export function CatalogProductsTab({
  mode,
  entityId,
  readOnly,
  items,
  onRefresh,
  onError,
  createProducts,
  deleteProducts,
}: CatalogProductsTabProps) {
  const { t } = useI18n()
  const orderedItems = useMemo(
    () => [...items].sort((left, right) => Number(left.posicao || 0) - Number(right.posicao || 0)),
    [items],
  )
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalFeedback, setModalFeedback] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [draft, setDraft] = useState<ProductDraft>({
    produto: null,
    tabelaPreco: null,
    quantidade: '1',
  })

  function closeModal() {
    setModalOpen(false)
    setModalFeedback(null)
    setDraft({ produto: null, tabelaPreco: null, quantidade: '1' })
  }

  async function handleCreate() {
    if (!draft.produto) {
      setModalFeedback(t('catalog.productsTab.selectProduct', 'Select a product.'))
      return
    }

    if (mode === 'listas' && (!draft.quantidade.trim() || Number(draft.quantidade) <= 0)) {
      setModalFeedback(t('catalog.productsTab.invalidQuantity', 'Enter a valid quantity.'))
      return
    }

    if (mode === 'listas' && orderedItems.length >= 100) {
      setModalFeedback(t('catalog.listas.products.maxProducts', 'This list already reached the limit of 100 products.'))
      return
    }

    try {
      await createProducts(entityId, [{
        id_produto: draft.produto.id,
        id_tabela_preco: mode === 'colecoes' ? draft.tabelaPreco?.id || null : null,
        quantidade: mode === 'listas' ? Number(draft.quantidade || '1') : null,
        posicao: orderedItems.length + 1,
      }])
      await onRefresh()
      onError(null)
      closeModal()
    } catch (error) {
      setModalFeedback(error instanceof Error ? error.message : t('catalog.productsTab.saveError', 'Could not save the product relation.'))
    }
  }

  async function handleDelete() {
    try {
      await deleteProducts(entityId, selectedIds.map((item) => {
        const [id_produto, id_tabela_preco] = item.split(':')
        return { id_produto, id_tabela_preco: id_tabela_preco || null }
      }))
      setSelectedIds([])
      setConfirmOpen(false)
      await onRefresh()
      onError(null)
    } catch (error) {
      onError(error instanceof Error ? error.message : t('catalog.productsTab.deleteError', 'Could not remove the selected products.'))
    }
  }

  async function moveItem(rowId: string, direction: -1 | 1) {
    const index = orderedItems.findIndex((item) => buildRowId(item) === rowId)
    const nextIndex = index + direction
    if (index < 0 || nextIndex < 0 || nextIndex >= orderedItems.length) {
      return
    }

    const reordered = [...orderedItems]
    const [item] = reordered.splice(index, 1)
    reordered.splice(nextIndex, 0, item)

    try {
      await createProducts(entityId, reordered.map((entry, orderIndex) => ({
        id_produto: resolveProductId(entry),
        id_tabela_preco: resolvePriceTableId(entry) || null,
        quantidade: entry.quantidade ?? 1,
        posicao: orderIndex + 1,
      })))
      await onRefresh()
      onError(null)
    } catch (error) {
      onError(error instanceof Error ? error.message : t('catalog.productsTab.orderError', 'Could not update product order.'))
    }
  }

  return (
    <>
      <ClienteRelationSection<CatalogProductRelation>
        title={mode === 'colecoes' ? t('catalog.colecoes.products.title', 'Products') : t('catalog.listas.products.title', 'Products')}
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
        getRowId={buildRowId}
        emptyMessage={t('catalog.productsTab.empty', 'No related products were found.')}
        columns={[
          { header: t('catalog.productsTab.position', 'Position'), headerClassName: 'w-[90px]', render: (item) => String(item.posicao || '-') },
          { header: t('catalog.productsTab.productId', 'Product ID'), headerClassName: 'w-[150px]', render: (item) => resolveProductId(item) || '-' },
          { header: t('catalog.productsTab.product', 'Product'), cellClassName: 'font-semibold text-slate-950', render: (item) => item.produto?.nome || '-' },
          ...(mode === 'colecoes'
            ? [{
                header: t('catalog.productsTab.priceTable', 'Price table'),
                render: (item: CatalogProductRelation) => item.tabela_preco?.nome || resolvePriceTableId(item) || '-',
              }]
            : [{
                header: t('catalog.productsTab.quantity', 'Quantity'),
                headerClassName: 'w-[120px]',
                render: (item: CatalogProductRelation) => String(item.quantidade ?? 1),
              }]),
          {
            header: t('catalog.productsTab.order', 'Order'),
            headerClassName: 'w-[120px]',
            render: (item) => readOnly ? null : (
              <div className="flex gap-2">
                <button type="button" onClick={() => void moveItem(buildRowId(item), -1)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white text-slate-700">
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => void moveItem(buildRowId(item), 1)} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white text-slate-700">
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
            ),
          },
        ]}
      />

      <CrudModal
        open={modalOpen}
        title={mode === 'colecoes' ? t('catalog.colecoes.products.add', 'Add product') : t('catalog.listas.products.add', 'Add product')}
        onClose={closeModal}
        onConfirm={() => void handleCreate()}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {modalFeedback ? (
            <div className="md:col-span-2 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{modalFeedback}</div>
          ) : null}

          <FormField label={t('catalog.productsTab.product', 'Product')} className="md:col-span-2">
            <CatalogLookupSelect
              resource="produtos"
              label={t('catalog.productsTab.product', 'Product')}
              value={draft.produto}
              onChange={(value) => setDraft((current) => ({ ...current, produto: value }))}
              disabled={readOnly}
            />
          </FormField>

          {mode === 'colecoes' ? (
            <FormField label={t('catalog.productsTab.priceTable', 'Price table')} className="md:col-span-2">
              <CatalogLookupSelect
                resource="tabelas_preco"
                label={t('catalog.productsTab.priceTable', 'Price table')}
                value={draft.tabelaPreco}
                onChange={(value) => setDraft((current) => ({ ...current, tabelaPreco: value }))}
                disabled={readOnly}
              />
            </FormField>
          ) : (
            <FormField label={t('catalog.productsTab.quantity', 'Quantity')}>
              <input
                type="number"
                min={1}
                value={draft.quantidade}
                onChange={(event) => setDraft((current) => ({ ...current, quantidade: event.target.value }))}
                className={inputClasses()}
                disabled={readOnly}
              />
            </FormField>
          )}
        </div>
      </CrudModal>

      <ConfirmDialog
        open={confirmOpen}
        title={t('catalog.productsTab.deleteTitle', 'Delete products')}
        description={t('catalog.productsTab.deleteDescription', 'The selected products will be removed from this record.')}
        confirmLabel={t('common.delete', 'Delete')}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </>
  )
}
