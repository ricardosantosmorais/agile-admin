'use client'

import { useMemo, useState } from 'react'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { CrudModal } from '@/src/components/ui/crud-modal'
import { FormField } from '@/src/components/ui/form-field'
import { inputClasses } from '@/src/components/ui/input-styles'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { ClienteRelationSection } from '@/src/features/clientes/components/cliente-relation-section'
import { CatalogLookupSelect } from '@/src/features/catalog/components/catalog-lookup-select'
import { useI18n } from '@/src/i18n/use-i18n'
import { httpClient } from '@/src/services/http/http-client'

type ProdutoEmbalagemRecord = {
  id: string
  id_produto: string
  id_filial: string
  nome?: string | null
  unidade?: string | null
  quantidade?: string | number | null
  ean?: string | null
  ativo?: boolean
  filial?: { id?: string; nome?: string | null; nome_fantasia?: string | null } | null
}

type Draft = {
  id: string
  filial: { id: string; label: string } | null
  nome: string
  unidade: string
  quantidade: string
  ean: string
  ativo: boolean
}

function emptyDraft(): Draft {
  return {
    id: '',
    filial: null,
    nome: '',
    unidade: '',
    quantidade: '',
    ean: '',
    ativo: true,
  }
}

function embalagemRowId(item: ProdutoEmbalagemRecord) {
  return [
    item.id,
    item.id_filial,
    String(item.nome || ''),
    String(item.unidade || ''),
    String(item.quantidade ?? ''),
    String(item.ean || ''),
  ].join('|')
}

export function ProdutoEmbalagensTab({
  productId,
  items,
  readOnly,
  onRefresh,
  onError,
}: {
  productId: string
  items: ProdutoEmbalagemRecord[]
  readOnly: boolean
  onRefresh: () => Promise<void>
  onError: (message: string | null) => void
}) {
  const { t } = useI18n()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [modalFeedback, setModalFeedback] = useState<string | null>(null)

  const orderedItems = useMemo(
    () => [...items].sort((left, right) => String(left.nome || '').localeCompare(String(right.nome || ''))),
    [items],
  )

  function openCreate() {
    setDraft(emptyDraft())
    setModalFeedback(null)
    setModalOpen(true)
  }

  function openEdit(item: ProdutoEmbalagemRecord) {
    setDraft({
      id: item.id,
      filial: item.filial?.id ? { id: item.filial.id, label: item.filial.nome_fantasia || item.filial.nome || item.filial.id } : null,
      nome: String(item.nome || ''),
      unidade: String(item.unidade || ''),
      quantidade: String(item.quantidade ?? ''),
      ean: String(item.ean || ''),
      ativo: Boolean(item.ativo),
    })
    setModalFeedback(null)
    setModalOpen(true)
  }

  async function handleSave() {
    if (!draft.filial || !draft.nome.trim()) {
      setModalFeedback(t('catalog.produtos.tabs.packages.requiredFields', 'Preencha filial e nome da embalagem.'))
      return
    }

    try {
      await httpClient(`/api/produtos/${encodeURIComponent(productId)}/embalagens`, {
        method: 'POST',
        body: JSON.stringify({
          id: draft.id || undefined,
          id_filial: draft.filial.id,
          nome: draft.nome,
          unidade: draft.unidade || null,
          quantidade: draft.quantidade || null,
          ean: draft.ean || null,
          ativo: draft.ativo,
        }),
        cache: 'no-store',
      })
      setModalOpen(false)
      setDraft(emptyDraft())
      onError(null)
      await onRefresh()
    } catch (error) {
      setModalFeedback(error instanceof Error ? error.message : t('simpleCrud.saveError', 'Não foi possível salvar o registro.'))
    }
  }

  async function handleDelete() {
    try {
      await httpClient(`/api/produtos/${encodeURIComponent(productId)}/embalagens`, {
        method: 'DELETE',
        body: JSON.stringify({
          rows: orderedItems.filter((item) => selectedIds.includes(embalagemRowId(item))),
        }),
        cache: 'no-store',
      })
      setSelectedIds([])
      setConfirmOpen(false)
      onError(null)
      await onRefresh()
    } catch (error) {
      onError(error instanceof Error ? error.message : t('simpleCrud.deleteError', 'Não foi possível excluir os registros.'))
    }
  }

  return (
    <>
      <ClienteRelationSection<ProdutoEmbalagemRecord>
        title={t('catalog.produtos.tabs.packages.title', 'Embalagens')}
        readOnly={readOnly}
        hasSelection={selectedIds.length > 0}
        onDelete={() => setConfirmOpen(true)}
        onCreate={openCreate}
        items={orderedItems}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        getRowId={embalagemRowId}
        emptyMessage={t('catalog.produtos.tabs.packages.empty', 'Nenhuma embalagem foi configurada para este produto.')}
        columns={[
          { header: t('catalog.produtos.fields.branch', 'Filial'), render: (item) => item.filial?.nome_fantasia || item.filial?.nome || item.id_filial },
          { header: t('simpleCrud.fields.name', 'Nome'), render: (item) => item.nome || '-', cellClassName: 'font-semibold text-slate-950' },
          { header: t('catalog.produtos.fields.unit', 'Unidade'), headerClassName: 'w-[120px]', render: (item) => item.unidade || '-' },
          { header: t('catalog.produtos.fields.packageQuantity', 'Quantidade'), headerClassName: 'w-[120px]', render: (item) => String(item.quantidade ?? '-') },
          { header: t('catalog.produtos.fields.ean', 'EAN'), headerClassName: 'w-[160px]', render: (item) => item.ean || '-' },
          {
            header: t('simpleCrud.fields.active', 'Ativo'),
            headerClassName: 'w-[100px]',
            render: (item) => (
              <StatusBadge tone={item.ativo ? 'success' : 'danger'}>
                {item.ativo ? t('common.yes', 'Sim') : t('common.no', 'Não')}
              </StatusBadge>
            ),
          },
          {
            header: t('common.actions', 'Ações'),
            headerClassName: 'w-[120px]',
            render: (item) =>
              !readOnly ? (
                <button
                  type="button"
                  onClick={() => openEdit(item)}
                  className="app-button-secondary inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold"
                >
                  {t('simpleCrud.actions.edit', 'Editar')}
                </button>
              ) : null,
          },
        ]}
        action={
          !readOnly ? (
            <div className="flex items-center gap-2">
              {selectedIds.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  className="app-button-danger inline-flex h-11 items-center rounded-full px-5 text-sm font-semibold"
                >
                  {t('common.delete', 'Excluir')}
                </button>
              ) : null}
              <button
                type="button"
                onClick={openCreate}
                className="app-button-primary inline-flex h-11 items-center rounded-full px-5 text-sm font-semibold"
              >
                {t('common.new', 'Novo')}
              </button>
            </div>
          ) : null
        }
      />

      <CrudModal
        open={modalOpen}
        title={draft.id ? t('simpleCrud.actions.edit', 'Editar') : t('common.new', 'Novo')}
        onClose={() => setModalOpen(false)}
        onConfirm={() => void handleSave()}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {modalFeedback ? (
            <div className="md:col-span-2 rounded-[1rem] border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {modalFeedback}
            </div>
          ) : null}
          <FormField label={t('catalog.produtos.fields.branch', 'Filial')} required>
            <CatalogLookupSelect
              resource="filiais"
              label={t('catalog.produtos.fields.branch', 'Filial')}
              value={draft.filial}
              onChange={(value) => setDraft((current) => ({ ...current, filial: value }))}
              disabled={readOnly || Boolean(draft.id)}
            />
          </FormField>
          <FormField label={t('simpleCrud.fields.name', 'Nome')} required>
            <input
              type="text"
              value={draft.nome}
              onChange={(event) => setDraft((current) => ({ ...current, nome: event.target.value }))}
              className={inputClasses()}
            />
          </FormField>
          <FormField label={t('catalog.produtos.fields.unit', 'Unidade')}>
            <input
              type="text"
              value={draft.unidade}
              onChange={(event) => setDraft((current) => ({ ...current, unidade: event.target.value }))}
              className={inputClasses()}
            />
          </FormField>
          <FormField label={t('catalog.produtos.fields.packageQuantity', 'Quantidade')}>
            <input
              type="text"
              value={draft.quantidade}
              onChange={(event) => setDraft((current) => ({ ...current, quantidade: event.target.value }))}
              className={inputClasses()}
            />
          </FormField>
          <FormField label={t('catalog.produtos.fields.ean', 'EAN')}>
            <input
              type="text"
              value={draft.ean}
              onChange={(event) => setDraft((current) => ({ ...current, ean: event.target.value }))}
              className={inputClasses()}
            />
          </FormField>
          <FormField label={t('simpleCrud.fields.active', 'Ativo')}>
            <select
              value={draft.ativo ? '1' : '0'}
              onChange={(event) => setDraft((current) => ({ ...current, ativo: event.target.value === '1' }))}
              className={inputClasses()}
            >
              <option value="1">{t('common.yes', 'Sim')}</option>
              <option value="0">{t('common.no', 'Não')}</option>
            </select>
          </FormField>
        </div>
      </CrudModal>

      <ConfirmDialog
        open={confirmOpen}
        title={t('simpleCrud.actions.delete', 'Excluir')}
        description={t('catalog.produtos.tabs.packages.deleteDescription', 'As embalagens selecionadas serão removidas deste produto.')}
        confirmLabel={t('common.delete', 'Excluir')}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </>
  )
}
