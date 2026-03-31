'use client'

import Link from 'next/link'
import { ArrowDown, ArrowUp, ExternalLink, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { CrudModal } from '@/src/components/ui/crud-modal'
import { FormField } from '@/src/components/ui/form-field'
import { ImageUploadField } from '@/src/components/ui/image-upload-field'
import { ClienteRelationSection } from '@/src/features/clientes/components/cliente-relation-section'
import { useAuth } from '@/src/contexts/auth-context'
import { ProdutoImagePreview } from '@/src/features/produtos/components/produto-image-preview'
import { buildProdutoImageUrl } from '@/src/features/produtos/services/produto-image-url'
import { useI18n } from '@/src/i18n/use-i18n'
import { httpClient } from '@/src/services/http/http-client'

type ProdutoImagemRecord = {
  id: string
  imagem?: string | null
  imagem_url?: string | null
  imagem_thumb?: string | null
  posicao?: number | null
}

type UploadDraft = {
  value: string
  key: string
  fileName: string
}

function fileNameFromKey(key: string) {
  const clean = key.trim().replace(/^\/+/, '')
  const segments = clean.split('/').filter(Boolean)
  return segments[segments.length - 1] || clean
}

export function ProdutoImagensTab({
  productId,
  items,
  readOnly,
  onRefresh,
  onError,
}: {
  productId: string
  items: ProdutoImagemRecord[]
  readOnly: boolean
  onRefresh: () => Promise<void>
  onError: (message: string | null) => void
}) {
  const { t } = useI18n()
  const { session } = useAuth()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [modalFeedback, setModalFeedback] = useState<string | null>(null)
  const [draft, setDraft] = useState<UploadDraft>({ value: '', key: '', fileName: '' })
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteIds, setDeleteIds] = useState<string[]>([])

  const orderedItems = useMemo(
    () => [...items].sort((left, right) => Number(left.posicao || 0) - Number(right.posicao || 0)),
    [items],
  )

  function resolveImageUrl(item: ProdutoImagemRecord) {
    return String(item.imagem_url || '').trim() || buildProdutoImageUrl(item.imagem_thumb || item.imagem, session?.currentTenant.assetsBucketUrl)
  }

  async function uploadImage(file: File) {
    const extension = file.name.includes('.') ? file.name.split('.').pop() || 'png' : 'png'
    const formData = new FormData()
    formData.append('file', file)
    formData.append('profileId', 'tenant-public-images')
    formData.append('folder', 'produtos')
    formData.append('tenantBucketUrl', session?.currentTenant.assetsBucketUrl || '')
    formData.append('fixedFileName', `${productId}_${orderedItems.length + 1}.${extension}`)

    const response = await fetch('/api/uploads', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    })
    const payload = await response.json()
    if (!response.ok) {
      throw new Error(typeof payload?.message === 'string' ? payload.message : 'Não foi possível enviar a imagem.')
    }

    const key = typeof payload.s3_key === 'string' ? payload.s3_key : ''
    const value = typeof payload.file_url === 'string' ? payload.file_url : ''
    const fileName = fileNameFromKey(key)
    setDraft({ value, key, fileName })
    return value
  }

  async function handleCreate() {
    if (!draft.key) {
      setModalFeedback(t('catalog.produtos.tabs.images.required', 'Envie uma imagem antes de salvar.'))
      return
    }

    try {
      setIsSaving(true)
      await httpClient(`/api/produtos/${encodeURIComponent(productId)}/imagens`, {
        method: 'POST',
        body: JSON.stringify({
          s3_key: draft.key,
          file_name: draft.fileName,
          posicao: orderedItems.length + 1,
        }),
        cache: 'no-store',
      })
      setModalOpen(false)
      setDraft({ value: '', key: '', fileName: '' })
      setModalFeedback(null)
      onError(null)
      await onRefresh()
    } catch (error) {
      setModalFeedback(error instanceof Error ? error.message : t('simpleCrud.saveError', 'Não foi possível salvar o registro.'))
    } finally {
      setIsSaving(false)
    }
  }

  async function moveImage(id: string, direction: -1 | 1) {
    const index = orderedItems.findIndex((item) => item.id === id)
    const nextIndex = index + direction
    if (index < 0 || nextIndex < 0 || nextIndex >= orderedItems.length) {
      return
    }

    const reordered = [...orderedItems]
    const [item] = reordered.splice(index, 1)
    reordered.splice(nextIndex, 0, item)

    await httpClient(`/api/produtos/${encodeURIComponent(productId)}/imagens`, {
      method: 'POST',
      body: JSON.stringify(
        reordered.map((entry, orderIndex) => ({
          id: entry.id,
          posicao: orderIndex + 1,
        })),
      ),
      cache: 'no-store',
    })
    onError(null)
    await onRefresh()
  }

  async function handleDelete() {
    try {
      setIsDeleting(true)
      await httpClient(`/api/produtos/${encodeURIComponent(productId)}/imagens`, {
        method: 'DELETE',
        body: JSON.stringify({ ids: deleteIds }),
        cache: 'no-store',
      })
      setSelectedIds((current) => current.filter((id) => !deleteIds.includes(id)))
      setDeleteIds([])
      setConfirmOpen(false)
      onError(null)
      await onRefresh()
    } catch (error) {
      onError(error instanceof Error ? error.message : t('simpleCrud.deleteError', 'Não foi possível excluir os registros.'))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <ClienteRelationSection<ProdutoImagemRecord>
        title={t('catalog.produtos.tabs.images.title', 'Imagens')}
        readOnly={readOnly}
        hasSelection={selectedIds.length > 0}
        onDelete={() => {
          setDeleteIds(selectedIds)
          setConfirmOpen(true)
        }}
        onCreate={() => {
          setDraft({ value: '', key: '', fileName: '' })
          setModalFeedback(null)
          setModalOpen(true)
        }}
        items={orderedItems}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        getRowId={(item) => item.id}
        emptyMessage={t('catalog.produtos.tabs.images.empty', 'Nenhuma imagem foi adicionada ao produto.')}
        columns={[
          {
            header: t('catalog.produtos.fields.image', 'Imagem'),
            headerClassName: 'w-[120px]',
            render: (item) => (
              <ProdutoImagePreview
                directUrl={String(item.imagem_url || '').trim()}
                imageName={item.imagem_thumb || item.imagem}
                assetsBucketUrl={session?.currentTenant.assetsBucketUrl}
                alt=""
              />
            ),
          },
          {
            header: t('catalog.productsTab.position', 'Posição'),
            headerClassName: 'w-[100px]',
            render: (item) => String(item.posicao || '-'),
          },
          {
            header: t('catalog.produtos.tabs.images.url', 'URL'),
            headerClassName: 'w-[360px]',
            cellClassName: 'max-w-[360px]',
            render: (item) => {
              const src = resolveImageUrl(item)
              return src ? (
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm text-slate-600">{src}</span>
                  <Link
                    href={src}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {t('common.open', 'Abrir')}
                  </Link>
                </div>
              ) : '-'
            },
          },
          {
            header: t('catalog.productsTab.order', 'Ordem'),
            headerClassName: 'w-[180px]',
            render: (item) =>
              readOnly ? null : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void moveImage(item.id, -1)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white text-slate-700"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void moveImage(item.id, 1)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white text-slate-700"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteIds([item.id])
                      setConfirmOpen(true)
                    }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ),
          },
        ]}
      />

      <CrudModal
        open={modalOpen}
        title={t('catalog.produtos.tabs.images.add', 'Adicionar imagem')}
        onClose={() => setModalOpen(false)}
        onConfirm={() => void handleCreate()}
        isSaving={isSaving}
      >
        <div className="grid gap-4">
          {modalFeedback ? (
            <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {modalFeedback}
            </div>
          ) : null}
          <FormField label={t('catalog.produtos.fields.image', 'Imagem')} required>
            <ImageUploadField
              value={draft.value}
              onChange={(value) =>
                setDraft((current) =>
                  value
                    ? { ...current, value }
                    : { ...current, value, key: '', fileName: '' })
              }
              onUploadFile={uploadImage}
            />
          </FormField>
        </div>
      </CrudModal>

      <ConfirmDialog
        open={confirmOpen}
        title={t('simpleCrud.actions.delete', 'Excluir')}
        description={t('catalog.produtos.tabs.images.deleteDescription', 'As imagens selecionadas serão removidas do produto.')}
        confirmLabel={t('common.delete', 'Excluir')}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleDelete()}
        isLoading={isDeleting}
      />
    </>
  )
}
