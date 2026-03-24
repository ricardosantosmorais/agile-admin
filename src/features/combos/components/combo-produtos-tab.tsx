'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { BooleanChoice } from '@/src/components/ui/boolean-choice'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { CrudModal } from '@/src/components/ui/crud-modal'
import { FormField } from '@/src/components/ui/form-field'
import { LookupSelect, type LookupOption } from '@/src/components/ui/lookup-select'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { TooltipIconButton } from '@/src/components/ui/tooltip-icon-button'
import { loadCrudLookupOptions } from '@/src/components/crud-base/crud-client'
import { inputClasses } from '@/src/components/ui/input-styles'
import { ClienteRelationSection } from '@/src/features/clientes/components/cliente-relation-section'
import { combosClient, type ComboProdutoRecord } from '@/src/features/combos/services/combos-client'
import {
  formatComboProdutoDiscount,
  formatComboProdutoPrice,
  toComboProdutoPayload,
} from '@/src/features/combos/services/combos-mappers'
import { currencyMask, decimalMask } from '@/src/lib/input-masks'
import { useI18n } from '@/src/i18n/use-i18n'

type ProdutoTipo = 'produto_pai' | 'produto' | 'departamento' | 'fornecedor' | 'colecao' | 'marca'

type ProdutoDraft = {
  tipo: ProdutoTipo
  altera_quantidade: boolean
  id_produto_pai: LookupOption | null
  id_produto: LookupOption | null
  id_departamento: LookupOption | null
  id_fornecedor: LookupOption | null
  id_colecao: LookupOption | null
  id_marca: LookupOption | null
  id_embalagem: string
  preco: string
  desconto: string
  pedido_minimo: string
  pedido_maximo: string
}

const PRODUTO_TYPES: ProdutoTipo[] = ['produto_pai', 'produto', 'departamento', 'fornecedor', 'colecao', 'marca']

function getTipoLabel(tipo: ProdutoTipo | string, t: ReturnType<typeof useI18n>['t']) {
  switch (tipo) {
    case 'produto_pai':
      return t('marketing.combos.tabs.products.types.parentProduct', 'Produto pai')
    case 'produto':
      return t('marketing.combos.tabs.products.types.product', 'Produto')
    case 'departamento':
      return t('marketing.combos.tabs.products.types.department', 'Departamento')
    case 'fornecedor':
      return t('marketing.combos.tabs.products.types.supplier', 'Fornecedor')
    case 'colecao':
      return t('marketing.combos.tabs.products.types.collection', 'Coleção')
    case 'marca':
      return t('marketing.combos.tabs.products.types.brand', 'Marca')
    default:
      return tipo
  }
}

function relationLabel(item: ComboProdutoRecord) {
  switch (item.tipo) {
    case 'produto_pai':
      return item.produto_pai?.nome || item.produto_pai?.id || '-'
    case 'produto':
      return item.produto?.nome || item.produto?.id || '-'
    case 'departamento':
      return item.departamento?.nome || item.departamento?.id || '-'
    case 'fornecedor':
      return item.fornecedor?.nome_fantasia || item.fornecedor?.nome || item.fornecedor?.id || '-'
    case 'colecao':
      return item.colecao?.nome || item.colecao?.id || '-'
    case 'marca':
      return item.marca?.nome || item.marca?.id || '-'
    default:
      return '-'
  }
}

function resourceByTipo(tipo: ProdutoTipo) {
  switch (tipo) {
    case 'produto_pai':
    case 'produto':
      return 'produtos' as const
    case 'departamento':
      return 'departamentos' as const
    case 'fornecedor':
      return 'fornecedores' as const
    case 'colecao':
      return 'colecoes' as const
    case 'marca':
      return 'marcas' as const
  }
}

function buildLookupOption(item: ComboProdutoRecord, tipo: ProdutoTipo): LookupOption | null {
  if (tipo === 'produto_pai' && item.produto_pai?.id) return { id: item.produto_pai.id, label: item.produto_pai.nome || item.produto_pai.id }
  if (tipo === 'produto' && item.produto?.id) return { id: item.produto.id, label: item.produto.nome || item.produto.id }
  if (tipo === 'departamento' && item.departamento?.id) return { id: item.departamento.id, label: item.departamento.nome || item.departamento.id }
  if (tipo === 'fornecedor' && item.fornecedor?.id) return { id: item.fornecedor.id, label: item.fornecedor.nome_fantasia || item.fornecedor.nome || item.fornecedor.id }
  if (tipo === 'colecao' && item.colecao?.id) return { id: item.colecao.id, label: item.colecao.nome || item.colecao.id }
  if (tipo === 'marca' && item.marca?.id) return { id: item.marca.id, label: item.marca.nome || item.marca.id }
  return null
}

function initialDraft(): ProdutoDraft {
  return {
    tipo: 'produto_pai',
    altera_quantidade: true,
    id_produto_pai: null,
    id_produto: null,
    id_departamento: null,
    id_fornecedor: null,
    id_colecao: null,
    id_marca: null,
    id_embalagem: '',
    preco: '',
    desconto: '',
    pedido_minimo: '',
    pedido_maximo: '',
  }
}

function yesNoBadge(value: boolean | number | string, t: ReturnType<typeof useI18n>['t']) {
  const checked = value === true || value === 1 || value === '1'
  return <StatusBadge tone={checked ? 'success' : 'warning'}>{checked ? t('common.yes', 'Sim') : t('common.no', 'Não')}</StatusBadge>
}

export function ComboProdutosTab({
  comboId,
  readOnly,
  onError,
}: {
  comboId: string
  readOnly: boolean
  onError: (message: string | null) => void
}) {
  const { t } = useI18n()
  const [items, setItems] = useState<ComboProdutoRecord[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [modalFeedback, setModalFeedback] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<ComboProdutoRecord | null>(null)
  const [draft, setDraft] = useState<ProdutoDraft>(initialDraft())

  const activeLookupValue = useMemo(() => {
    switch (draft.tipo) {
      case 'produto_pai':
        return draft.id_produto_pai
      case 'produto':
        return draft.id_produto
      case 'departamento':
        return draft.id_departamento
      case 'fornecedor':
        return draft.id_fornecedor
      case 'colecao':
        return draft.id_colecao
      case 'marca':
        return draft.id_marca
    }
  }, [draft])

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      setItems(await combosClient.listProdutos(comboId))
      onError(null)
    } catch (error) {
      onError(error instanceof Error ? error.message : t('marketing.combos.tabs.products.loadError', 'Não foi possível carregar os produtos do combo.'))
    } finally {
      setIsLoading(false)
    }
  }, [comboId, onError, t])

  useEffect(() => {
    void refresh()
  }, [refresh])

  function closeModal() {
    setModalOpen(false)
    setEditingItem(null)
    setModalFeedback(null)
    setDraft(initialDraft())
  }

  function openCreateModal() {
    setEditingItem(null)
    setModalFeedback(null)
    setDraft(initialDraft())
    setModalOpen(true)
  }

  function openEditModal(item: ComboProdutoRecord) {
    const tipo = (item.tipo || 'produto_pai') as ProdutoTipo
    setEditingItem(item)
    setModalFeedback(null)
    setDraft({
      tipo,
      altera_quantidade: item.altera_quantidade === true || item.altera_quantidade === 1 || item.altera_quantidade === '1',
      id_produto_pai: buildLookupOption(item, 'produto_pai'),
      id_produto: buildLookupOption(item, 'produto'),
      id_departamento: buildLookupOption(item, 'departamento'),
      id_fornecedor: buildLookupOption(item, 'fornecedor'),
      id_colecao: buildLookupOption(item, 'colecao'),
      id_marca: buildLookupOption(item, 'marca'),
      id_embalagem: item.embalagem?.id || '',
      preco: item.preco === null || item.preco === undefined ? '' : currencyMask(String(item.preco)),
      desconto: item.desconto === null || item.desconto === undefined ? '' : decimalMask(String(item.desconto)),
      pedido_minimo: item.pedido_minimo === null || item.pedido_minimo === undefined ? '' : String(item.pedido_minimo),
      pedido_maximo: item.pedido_maximo === null || item.pedido_maximo === undefined ? '' : String(item.pedido_maximo),
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!activeLookupValue) {
      setModalFeedback(t('marketing.combos.tabs.products.validation.requiredTarget', 'Selecione o alvo do combo.'))
      return
    }

    if (!draft.preco && !draft.desconto) {
      setModalFeedback(t('marketing.combos.tabs.products.validation.priceOrDiscount', 'Informe preço ou desconto.'))
      return
    }

    try {
      if (editingItem) {
        await combosClient.deleteProdutos(comboId, [editingItem.id])
      }

      await combosClient.createProduto(comboId, toComboProdutoPayload(comboId, {
        tipo: draft.tipo,
        altera_quantidade: draft.altera_quantidade,
        id_produto_pai: draft.id_produto_pai?.id || '',
        id_produto: draft.id_produto?.id || '',
        id_departamento: draft.id_departamento?.id || '',
        id_fornecedor: draft.id_fornecedor?.id || '',
        id_colecao: draft.id_colecao?.id || '',
        id_marca: draft.id_marca?.id || '',
        id_embalagem: draft.id_embalagem,
        preco: draft.preco,
        desconto: draft.desconto,
        pedido_minimo: draft.pedido_minimo,
        pedido_maximo: draft.pedido_maximo,
      }))
      await refresh()
      closeModal()
    } catch (error) {
      setModalFeedback(error instanceof Error ? error.message : t('marketing.combos.tabs.products.saveError', 'Não foi possível salvar o produto do combo.'))
    }
  }

  async function handleDelete() {
    try {
      await combosClient.deleteProdutos(comboId, selectedIds)
      setSelectedIds([])
      setConfirmOpen(false)
      await refresh()
    } catch (error) {
      onError(error instanceof Error ? error.message : t('marketing.combos.tabs.products.deleteError', 'Não foi possível excluir os produtos do combo.'))
    }
  }

  return (
    <>
      <ClienteRelationSection<ComboProdutoRecord>
        title={t('marketing.combos.tabs.products.title', 'Produtos')}
        readOnly={readOnly}
        hasSelection={selectedIds.length > 0}
        onDelete={() => setConfirmOpen(true)}
        onCreate={openCreateModal}
        items={items}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        getRowId={(item) => item.id}
        emptyMessage={isLoading ? t('common.loading', 'Loading...') : t('marketing.combos.tabs.products.empty', 'Nenhum produto foi vinculado ao combo.')}
        columns={[
          { header: t('marketing.combos.tabs.common.type', 'Tipo'), render: (item) => getTipoLabel(item.tipo, t) },
          { header: t('marketing.combos.tabs.common.rule', 'Regra'), cellClassName: 'font-semibold text-slate-950', render: (item) => relationLabel(item) },
          { header: t('marketing.combos.tabs.products.fields.price', 'Preço'), render: (item) => formatComboProdutoPrice(item.preco) },
          { header: t('marketing.combos.tabs.products.fields.discount', 'Desconto'), render: (item) => formatComboProdutoDiscount(item.desconto) },
          { header: t('marketing.combos.tabs.products.fields.minQuantity', 'Quant. mínima'), render: (item) => String(item.pedido_minimo ?? '-') },
          { header: t('marketing.combos.tabs.products.fields.maxQuantity', 'Quant. máxima'), render: (item) => String(item.pedido_maximo ?? '-') },
          { header: t('marketing.combos.tabs.products.fields.changeQuantity', 'Altera quantidade'), render: (item) => yesNoBadge(item.altera_quantidade, t) },
          {
            header: t('common.actions', 'Ações'),
            headerClassName: 'w-[104px]',
            cellClassName: 'whitespace-nowrap',
            render: (item) => !readOnly ? (
              <div className="flex items-center gap-2">
                <TooltipIconButton label={t('simpleCrud.actions.edit', 'Editar')}>
                  <button type="button" onClick={() => openEditModal(item)} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#e6dfd3] bg-white text-slate-700">
                    <Pencil className="h-4 w-4" />
                  </button>
                </TooltipIconButton>
                <TooltipIconButton label={t('simpleCrud.actions.delete', 'Excluir')}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedIds([item.id])
                      setConfirmOpen(true)
                    }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </TooltipIconButton>
              </div>
            ) : null,
          },
        ]}
      />

      <CrudModal
        open={modalOpen}
        title={editingItem
          ? t('marketing.combos.tabs.products.editTitle', 'Editar produto do combo')
          : t('marketing.combos.tabs.products.createTitle', 'Novo produto do combo')}
        onClose={closeModal}
        onConfirm={() => void handleSave()}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {modalFeedback ? <div className="md:col-span-2 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{modalFeedback}</div> : null}

          <FormField label={t('marketing.combos.tabs.products.fields.changeQuantity', 'Altera quantidade')}>
            <BooleanChoice
              value={draft.altera_quantidade}
              onChange={(value) => setDraft((current) => ({ ...current, altera_quantidade: value }))}
              disabled={readOnly}
              trueLabel={t('common.yes', 'Sim')}
              falseLabel={t('common.no', 'Não')}
            />
          </FormField>

          <FormField label={t('marketing.combos.tabs.common.type', 'Tipo')}>
            <select
              value={draft.tipo}
              onChange={(event) => setDraft((current) => ({ ...initialDraft(), tipo: event.target.value as ProdutoTipo, altera_quantidade: current.altera_quantidade }))}
              className={inputClasses()}
              disabled={readOnly}
            >
              {PRODUTO_TYPES.map((item) => <option key={item} value={item}>{getTipoLabel(item, t)}</option>)}
            </select>
          </FormField>

          <FormField label={t('marketing.combos.tabs.common.rule', 'Regra')} className="md:col-span-2">
            <LookupSelect<LookupOption>
              key={draft.tipo}
              label={t('marketing.combos.tabs.common.rule', 'Regra')}
              value={activeLookupValue}
              onChange={(value) => setDraft((current) => ({
                ...current,
                id_produto_pai: current.tipo === 'produto_pai' ? value : null,
                id_produto: current.tipo === 'produto' ? value : null,
                id_departamento: current.tipo === 'departamento' ? value : null,
                id_fornecedor: current.tipo === 'fornecedor' ? value : null,
                id_colecao: current.tipo === 'colecao' ? value : null,
                id_marca: current.tipo === 'marca' ? value : null,
              }))}
              disabled={readOnly}
              loadOptions={(query, page, perPage) => loadCrudLookupOptions(resourceByTipo(draft.tipo), query, page, perPage).then((options) => options.map((option) => ({ id: option.value, label: option.label })))}
            />
          </FormField>

          {draft.tipo === 'produto' ? (
            <FormField label={t('marketing.combos.tabs.products.fields.package', 'Embalagem')}>
              <input
                value={draft.id_embalagem}
                onChange={(event) => setDraft((current) => ({ ...current, id_embalagem: event.target.value }))}
                className={inputClasses()}
                disabled={readOnly}
              />
            </FormField>
          ) : null}

          <FormField label={t('marketing.combos.tabs.products.fields.price', 'Preço')}>
            <div className="flex overflow-hidden rounded-[0.9rem] border border-[#e6dfd3] bg-white">
              <span className="inline-flex items-center border-r border-[#e6dfd3] bg-[#fcfaf5] px-3 text-sm font-semibold text-slate-600">R$</span>
              <input
                value={draft.preco}
                onChange={(event) => setDraft((current) => ({ ...current, preco: currencyMask(event.target.value) }))}
                className={`${inputClasses()} rounded-none border-0 shadow-none focus:ring-0`}
                disabled={readOnly}
                inputMode="decimal"
              />
            </div>
          </FormField>

          <FormField label={t('marketing.combos.tabs.products.fields.discount', 'Desconto')}>
            <div className="flex overflow-hidden rounded-[0.9rem] border border-[#e6dfd3] bg-white">
              <input
                value={draft.desconto}
                onChange={(event) => setDraft((current) => ({ ...current, desconto: decimalMask(event.target.value) }))}
                className={`${inputClasses()} rounded-none border-0 shadow-none focus:ring-0`}
                disabled={readOnly}
                inputMode="decimal"
              />
              <span className="inline-flex items-center border-l border-[#e6dfd3] bg-[#fcfaf5] px-3 text-sm font-semibold text-slate-600">%</span>
            </div>
          </FormField>

          <FormField label={t('marketing.combos.tabs.products.fields.minQuantity', 'Quant. mínima')}>
            <input
              type="number"
              min={0}
              value={draft.pedido_minimo}
              onChange={(event) => setDraft((current) => ({ ...current, pedido_minimo: event.target.value }))}
              className={inputClasses()}
              disabled={readOnly}
            />
          </FormField>

          <FormField label={t('marketing.combos.tabs.products.fields.maxQuantity', 'Quant. máxima')}>
            <input
              type="number"
              min={0}
              value={draft.pedido_maximo}
              onChange={(event) => setDraft((current) => ({ ...current, pedido_maximo: event.target.value }))}
              className={inputClasses()}
              disabled={readOnly}
            />
          </FormField>
        </div>
      </CrudModal>

      <ConfirmDialog
        open={confirmOpen}
        title={t('marketing.combos.tabs.products.deleteTitle', 'Excluir produtos do combo')}
        description={t('marketing.combos.tabs.products.deleteDescription', 'Os produtos selecionados serão removidos do combo.')}
        confirmLabel={t('common.delete', 'Excluir')}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </>
  )
}
