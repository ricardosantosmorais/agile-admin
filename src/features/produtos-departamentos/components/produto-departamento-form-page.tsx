'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { AsyncState } from '@/src/components/ui/async-state'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { inputClasses } from '@/src/components/ui/input-styles'
import { PageHeader } from '@/src/components/ui/page-header'
import { PageToast } from '@/src/components/ui/page-toast'
import { SectionCard } from '@/src/components/ui/section-card'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { DepartamentoTreeSelector } from '@/src/features/produtos-departamentos/components/departamento-tree-selector'
import {
  produtosDepartamentosClient,
  type DepartamentoTreeRecord,
  type ProdutoSelectionRecord,
} from '@/src/features/produtos-departamentos/services/produtos-departamentos-client'
import { useI18n } from '@/src/i18n/use-i18n'

type PendingRelation = {
  id: string
  id_produto: string
  produto: string
  id_departamento: string
  departamento: string
  nivel: number
  departamento_pai: string
}

function computeDepartamentoPai(relations: PendingRelation[]) {
  const deepestByProduct = new Map<string, { id: string; nivel: number }>()
  for (const relation of relations) {
    const current = deepestByProduct.get(relation.id_produto)
    if (!current || relation.nivel > current.nivel) {
      deepestByProduct.set(relation.id_produto, { id: relation.id_departamento, nivel: relation.nivel })
    }
  }

  return relations.map((relation) => ({
    ...relation,
    departamento_pai: deepestByProduct.get(relation.id_produto)?.id || relation.id_departamento,
  }))
}

export function ProdutoDepartamentoFormPage() {
  const { t } = useI18n()
  const router = useRouter()
  const access = useFeatureAccess('produtosDepartamentos')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [productQuery, setProductQuery] = useState('')
  const [departmentQuery, setDepartmentQuery] = useState('')
  const [onlyWithoutDepartment, setOnlyWithoutDepartment] = useState(true)
  const [productPage, setProductPage] = useState(1)
  const [productMeta, setProductMeta] = useState({ page: 1, pages: 1, perPage: 30, from: 0, to: 0, total: 0 })
  const [products, setProducts] = useState<ProdutoSelectionRecord[]>([])
  const [departments, setDepartments] = useState<DepartamentoTreeRecord[]>([])
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([])
  const [selectedPendingIds, setSelectedPendingIds] = useState<string[]>([])
  const [pending, setPending] = useState<PendingRelation[]>([])
  const [confirmOpen, setConfirmOpen] = useState(false)

  const loadDepartments = useCallback(async () => {
    const response = await produtosDepartamentosClient.listDepartmentsTree()
    setDepartments(response.data)
  }, [])

  const loadProducts = useCallback(async (nextPage = 1, append = false) => {
    const response = await produtosDepartamentosClient.listSelectableProducts({
      page: nextPage,
      perPage: 30,
      q: productQuery,
      onlyWithoutDepartment,
    })
    setProducts((current) => append ? [...current, ...response.data] : response.data)
    setProductMeta(response.meta)
    setProductPage(nextPage)
  }, [onlyWithoutDepartment, productQuery])

  useEffect(() => {
    let active = true

    async function bootstrap() {
      setIsLoading(true)
      setError(null)
      try {
        await Promise.all([loadDepartments(), loadProducts(1)])
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Nao foi possivel carregar os dados.')
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void bootstrap()
    return () => {
      active = false
    }
  }, [loadDepartments, loadProducts])

  useEffect(() => {
    if (isLoading) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      void loadProducts(1)
    }, 250)

    return () => window.clearTimeout(timeoutId)
  }, [isLoading, loadProducts])

  if (!access.canOpen) {
    return <AccessDeniedState title={t('catalog.produtosDepartamentos.title', 'Produtos x Departamentos')} backHref="/dashboard" />
  }

  function toggleProduct(id: string) {
    setSelectedProductIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  function toggleDepartment(id: string) {
    setSelectedDepartmentIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  function addRelations() {
    if (!selectedProductIds.length) {
      setFeedback('Selecione ao menos um produto.')
      return
    }
    if (!selectedDepartmentIds.length) {
      setFeedback('Selecione ao menos um departamento.')
      return
    }

    const selectedProducts = products.filter((product) => selectedProductIds.includes(product.id))
    const selectedDepartments = departments.filter((department) => selectedDepartmentIds.includes(department.id))
    const nextPending = [...pending]

    for (const product of selectedProducts) {
      for (const department of selectedDepartments) {
        const rowId = `${product.id}:${department.id}`
        if (nextPending.some((relation) => relation.id === rowId)) {
          continue
        }

        nextPending.push({
          id: rowId,
          id_produto: product.id,
          produto: `${product.id} - ${product.nome || '-'}`,
          id_departamento: department.id,
          departamento: department.nome,
          nivel: Number(department.nivel || 0),
          departamento_pai: department.id,
        })
      }
    }

    setPending(computeDepartamentoPai(nextPending))
    setSelectedDepartmentIds([])
    setFeedback(null)
  }

  function removePending(ids?: string[]) {
    const itemsToRemove = ids && ids.length ? ids : selectedPendingIds
    if (!itemsToRemove.length) {
      return
    }
    setPending((current) => computeDepartamentoPai(current.filter((relation) => !itemsToRemove.includes(relation.id))))
    setSelectedPendingIds((current) => current.filter((id) => !itemsToRemove.includes(id)))
    setConfirmOpen(false)
  }

  async function saveRelations() {
    if (!pending.length) {
      setFeedback('Selecione ao menos um relacionamento.')
      return
    }

    setIsSaving(true)
    try {
      await produtosDepartamentosClient.create(
        pending.map((relation) => ({
          id_produto: relation.id_produto,
          id_departamento: relation.id_departamento,
          departamento_pai: relation.departamento_pai,
        })),
      )
      router.push('/produtos-departamentos')
    } catch (saveError) {
      setFeedback(saveError instanceof Error ? saveError.message : 'Nao foi possivel salvar os relacionamentos.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={[
          { label: t('routes.dashboard', 'Inicio'), href: '/dashboard' },
          { label: t('simpleCrud.sections.catalog', 'Catalogo') },
          { label: t('catalog.produtosDepartamentos.title', 'Produtos x Departamentos'), href: '/produtos-departamentos' },
          { label: t('routes.novo', 'Novo') },
        ]}
        actions={<Link href="/produtos-departamentos" className="app-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"><ArrowLeft className="h-4 w-4" />{t('common.back', 'Voltar')}</Link>}
      />

      <AsyncState isLoading={isLoading} error={error || undefined}>
        <PageToast message={feedback} onClose={() => setFeedback(null)} />

        <SectionCard>
          <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
            <section className="app-pane-muted space-y-3 rounded-[1rem] border border-[color:var(--app-card-border)] p-4">
              <div className="space-y-3">
                <h2 className="text-sm font-bold text-[color:var(--app-text)]">Produtos</h2>
                <input
                  value={productQuery}
                  onChange={(event) => setProductQuery(event.target.value)}
                  placeholder="Buscar por ID, codigo ou nome"
                  className={inputClasses()}
                />
                <label className="flex items-center gap-2 text-sm text-[color:var(--app-text)]">
                  <input
                    type="checkbox"
                    checked={onlyWithoutDepartment}
                    onChange={(event) => setOnlyWithoutDepartment(event.target.checked)}
                    className="h-4 w-4 rounded border-[color:var(--app-control-border)]"
                  />
                  Exibir apenas produtos sem relacionamento
                </label>
              </div>

              <div className="app-pane max-h-[420px] overflow-y-auto rounded-[1rem] border border-[color:var(--app-card-border)]">
                {products.map((product) => (
                  <label key={product.id} className="flex items-center gap-3 border-b border-[color:var(--app-border)] px-4 py-3 text-sm text-[color:var(--app-text)] last:border-b-0">
                    <input
                      type="checkbox"
                      checked={selectedProductIds.includes(product.id)}
                      onChange={() => toggleProduct(product.id)}
                      className="h-4 w-4 rounded border-[color:var(--app-control-border)]"
                    />
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-[color:var(--app-text)]">{product.id} - {product.nome || '-'}</div>
                      <div className="text-xs text-[color:var(--app-muted)]">Codigo: {product.codigo || '--'}</div>
                    </div>
                  </label>
                ))}
              </div>

              {productPage < productMeta.pages ? (
                <div className="flex justify-center">
                  <button type="button" onClick={() => void loadProducts(productPage + 1, true)} className="app-button-secondary inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold">
                    <Plus className="h-4 w-4" />
                    Carregar mais produtos
                  </button>
                </div>
              ) : null}
            </section>

            <section className="app-pane-muted space-y-3 rounded-[1rem] border border-[color:var(--app-card-border)] p-4">
              <div className="space-y-3">
                <h2 className="text-sm font-bold text-[color:var(--app-text)]">Departamentos</h2>
                <input
                  value={departmentQuery}
                  onChange={(event) => setDepartmentQuery(event.target.value)}
                  placeholder="Buscar departamento"
                  className={inputClasses()}
                />
              </div>
              <DepartamentoTreeSelector
                items={departments}
                search={departmentQuery}
                selectedIds={selectedDepartmentIds}
                onToggle={toggleDepartment}
              />
            </section>
          </div>

          <div className="mt-5 flex justify-center">
            <button type="button" onClick={addRelations} className="app-button-primary inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold">
              <Plus className="h-4 w-4" />
              Adicionar relacionamentos
            </button>
          </div>

          <div className="app-pane-muted mt-5 rounded-[1rem] border border-[color:var(--app-card-border)] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-[color:var(--app-text)]">Relacionamentos pendentes</h2>
              {selectedPendingIds.length ? (
                <button type="button" onClick={() => setConfirmOpen(true)} className="app-button-danger inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold">
                  <Trash2 className="h-4 w-4" />
                  Excluir selecionados
                </button>
              ) : null}
            </div>

            <div className="space-y-2">
              {pending.length ? (
                pending.map((relation) => (
                  <div key={relation.id} className="app-pane grid items-center gap-3 rounded-[0.95rem] border border-[color:var(--app-card-border)] px-4 py-3 md:grid-cols-[auto_minmax(0,2fr)_minmax(0,1.4fr)_auto]">
                    <input
                      type="checkbox"
                      checked={selectedPendingIds.includes(relation.id)}
                      onChange={() => setSelectedPendingIds((current) => current.includes(relation.id) ? current.filter((item) => item !== relation.id) : [...current, relation.id])}
                      className="h-4 w-4 rounded border-[color:var(--app-control-border)]"
                    />
                    <div className="min-w-0 truncate text-sm font-semibold text-[color:var(--app-text)]">{relation.produto}</div>
                    <div className="min-w-0 truncate text-sm text-[color:var(--app-text)]">{relation.departamento}</div>
                    <button type="button" onClick={() => removePending([relation.id])} className="app-button-danger inline-flex h-9 w-9 items-center justify-center rounded-full p-0">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="app-pane rounded-[1rem] border border-dashed border-[color:var(--app-card-border)] px-4 py-6 text-sm text-[color:var(--app-muted)]">
                  Nenhum relacionamento selecionado.
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 flex justify-center gap-2.5">
            <button type="button" onClick={() => void saveRelations()} disabled={isSaving} className="app-button-primary inline-flex items-center gap-2 rounded-full px-4.5 py-2.5 text-sm font-semibold disabled:opacity-60">
              <Save className="h-4 w-4" />
              {isSaving ? t('common.loading', 'Salvando...') : t('common.save', 'Salvar')}
            </button>
            <Link href="/produtos-departamentos" className="app-button-secondary inline-flex items-center rounded-full px-4.5 py-2.5 text-sm font-semibold">
              {t('common.cancel', 'Cancelar')}
            </Link>
          </div>
        </SectionCard>
      </AsyncState>

      <ConfirmDialog
        open={confirmOpen}
        title="Excluir relacionamentos pendentes"
        description="Os relacionamentos selecionados serao removidos da lista antes do salvamento."
        confirmLabel={t('common.delete', 'Excluir')}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => removePending()}
      />
    </div>
  )
}
