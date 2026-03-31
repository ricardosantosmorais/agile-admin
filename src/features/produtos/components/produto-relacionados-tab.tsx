'use client'

import { useMemo, useState } from 'react'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { CrudModal } from '@/src/components/ui/crud-modal'
import { FormField } from '@/src/components/ui/form-field'
import { ClienteRelationSection } from '@/src/features/clientes/components/cliente-relation-section'
import { CatalogLookupSelect } from '@/src/features/catalog/components/catalog-lookup-select'
import { useI18n } from '@/src/i18n/use-i18n'
import { httpClient } from '@/src/services/http/http-client'

type ProdutoRelacionadoRecord = {
  id_produto_relacionado: string
  produto_relacionado?: {
    id?: string
    nome?: string | null
    codigo?: string | null
    disponivel?: boolean
  } | null
}

export function ProdutoRelacionadosTab({
  productId,
  items,
  readOnly,
  onRefresh,
  onError,
}: {
  productId: string
  items: ProdutoRelacionadoRecord[]
  readOnly: boolean
  onRefresh: () => Promise<void>
  onError: (message: string | null) => void
}) {
  const { t } = useI18n()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [modalFeedback, setModalFeedback] = useState<string | null>(null)
  const [produto, setProduto] = useState<{ id: string; label: string } | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const orderedItems = useMemo(
    () => [...items].sort((left, right) => String(left.produto_relacionado?.nome || '').localeCompare(String(right.produto_relacionado?.nome || ''))),
    [items],
  )

  async function handleCreate() {
    if (!produto) {
      setModalFeedback(t('catalog.produtos.tabs.related.required', 'Selecione o produto relacionado.'))
      return
    }
    try {
      await httpClient(`/api/produtos/${encodeURIComponent(productId)}/relacionados`, {
        method: 'POST',
        body: JSON.stringify({ id_produto_relacionado: produto.id }),
        cache: 'no-store',
      })
      setModalOpen(false)
      setProduto(null)
      setModalFeedback(null)
      onError(null)
      await onRefresh()
    } catch (error) {
      setModalFeedback(error instanceof Error ? error.message : t('simpleCrud.saveError', 'Não foi possível salvar o registro.'))
    }
  }

  async function handleDelete() {
    try {
      await httpClient(`/api/produtos/${encodeURIComponent(productId)}/relacionados`, {
        method: 'DELETE',
        body: JSON.stringify({ ids: selectedIds }),
        cache: 'no-store',
      })
      setConfirmOpen(false)
      setSelectedIds([])
      onError(null)
      await onRefresh()
    } catch (error) {
      onError(error instanceof Error ? error.message : t('simpleCrud.deleteError', 'Não foi possível excluir os registros.'))
    }
  }

  return (
    <>
      <ClienteRelationSection<ProdutoRelacionadoRecord>
        title={t('catalog.produtos.tabs.related.title', 'Relacionados')}
        readOnly={readOnly}
        hasSelection={selectedIds.length > 0}
        onDelete={() => setConfirmOpen(true)}
        onCreate={() => {
          setModalFeedback(null)
          setProduto(null)
          setModalOpen(true)
        }}
        items={orderedItems}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        getRowId={(item) => item.id_produto_relacionado}
        emptyMessage={t('catalog.produtos.tabs.related.empty', 'Nenhum produto relacionado foi configurado.')}
        columns={[
          { header: t('simpleCrud.fields.id', 'ID'), headerClassName: 'w-[160px]', render: (item) => item.id_produto_relacionado },
          { header: t('simpleCrud.fields.code', 'Código'), headerClassName: 'w-[140px]', render: (item) => item.produto_relacionado?.codigo || '-' },
          { header: t('simpleCrud.fields.name', 'Nome'), render: (item) => item.produto_relacionado?.nome || '-', cellClassName: 'font-semibold text-slate-950' },
          { header: t('catalog.produtos.fields.available', 'Disponível'), headerClassName: 'w-[120px]', render: (item) => item.produto_relacionado?.disponivel ? t('common.yes', 'Sim') : t('common.no', 'Não') },
        ]}
      />

      <CrudModal open={modalOpen} title={t('catalog.produtos.tabs.related.add', 'Adicionar relacionado')} onClose={() => setModalOpen(false)} onConfirm={() => void handleCreate()}>
        <div className="grid gap-4">
          {modalFeedback ? <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{modalFeedback}</div> : null}
          <FormField label={t('catalog.produtos.tabs.related.product', 'Produto relacionado')} required>
            <CatalogLookupSelect resource="produtos" label={t('catalog.produtos.tabs.related.product', 'Produto relacionado')} value={produto} onChange={setProduto} disabled={readOnly} />
          </FormField>
        </div>
      </CrudModal>

      <ConfirmDialog open={confirmOpen} title={t('simpleCrud.actions.delete', 'Excluir')} description={t('catalog.produtos.tabs.related.deleteDescription', 'Os produtos relacionados selecionados serão removidos.')} confirmLabel={t('common.delete', 'Excluir')} onClose={() => setConfirmOpen(false)} onConfirm={() => void handleDelete()} />
    </>
  )
}
