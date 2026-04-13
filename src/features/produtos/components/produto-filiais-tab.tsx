'use client'

import { useMemo, useState } from 'react'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { CrudModal } from '@/src/components/ui/crud-modal'
import { CurrencyInput } from '@/src/components/ui/currency-input'
import { FormField } from '@/src/components/ui/form-field'
import { inputClasses } from '@/src/components/ui/input-styles'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { ClienteRelationSection } from '@/src/features/clientes/components/cliente-relation-section'
import { CatalogLookupSelect } from '@/src/features/catalog/components/catalog-lookup-select'
import { useI18n } from '@/src/i18n/use-i18n'
import { httpClient } from '@/src/services/http/http-client'
import { parsePriceStockDecimal, PRODUCT_BRANCH_STATUS_META } from '@/src/features/precos-estoques/services/precos-estoques-shared'
import { formatLocalizedCurrency } from '@/src/lib/formatters'

type ProdutoFilialRecord = {
  id: string
  id_produto: string
  id_filial: string
  id_tabela_preco?: string | null
  id_canal_distribuicao_cliente?: string | null
  estoque_disponivel?: number | null
  preco?: number | null
  status?: string | null
  ativo?: boolean
  estoque_positivo?: boolean
  promocao_ecommerce?: boolean
  filial?: { id?: string; nome?: string | null; nome_fantasia?: string | null } | null
  tabela_preco?: { id?: string; nome?: string | null } | null
  canal_distribuicao?: { id?: string; nome?: string | null } | null
}

type LookupValue = { id: string; label: string } | null

type Draft = {
  id: string
  filial: LookupValue
  tabelaPreco: LookupValue
  canal: LookupValue
  estoqueDisponivel: string
  preco: string
  status: string
  ativo: boolean
  estoquePositivo: boolean
  promocaoEcommerce: boolean
}

function toLookupValue(entity: { id?: string; nome?: string | null; nome_fantasia?: string | null } | null | undefined) {
  if (!entity?.id) {
    return null
  }
  return {
    id: entity.id,
    label: entity.nome_fantasia || entity.nome || entity.id,
  }
}

function emptyDraft(): Draft {
  return {
    id: '',
    filial: null,
    tabelaPreco: null,
    canal: null,
    estoqueDisponivel: '',
    preco: '',
    status: 'disponivel',
    ativo: true,
    estoquePositivo: false,
    promocaoEcommerce: false,
  }
}

export function ProdutoFiliaisTab({
  productId,
  items,
  readOnly,
  onRefresh,
  onError,
}: {
  productId: string
  items: ProdutoFilialRecord[]
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
    () =>
      [...items].sort((left, right) =>
        String(left.filial?.nome_fantasia || left.filial?.nome || '').localeCompare(
          String(right.filial?.nome_fantasia || right.filial?.nome || ''),
        )),
    [items],
  )

  function openCreate() {
    setDraft(emptyDraft())
    setModalFeedback(null)
    setModalOpen(true)
  }

  function openEdit(item: ProdutoFilialRecord) {
    setDraft({
      id: item.id,
      filial: toLookupValue(item.filial),
      tabelaPreco: item.tabela_preco?.id ? { id: item.tabela_preco.id, label: item.tabela_preco.nome || item.tabela_preco.id } : null,
      canal: item.canal_distribuicao?.id ? { id: item.canal_distribuicao.id, label: item.canal_distribuicao.nome || item.canal_distribuicao.id } : null,
      estoqueDisponivel: String(item.estoque_disponivel ?? ''),
      preco: item.preco === null || item.preco === undefined ? '' : String(item.preco).replace('.', ','),
      status: String(item.status || 'disponivel'),
      ativo: Boolean(item.ativo),
      estoquePositivo: Boolean(item.estoque_positivo),
      promocaoEcommerce: Boolean(item.promocao_ecommerce),
    })
    setModalFeedback(null)
    setModalOpen(true)
  }

  async function handleSave() {
    if (!draft.filial) {
      setModalFeedback(t('catalog.produtos.tabs.productBranches.requiredBranch', 'Selecione a filial.'))
      return
    }

    try {
      await httpClient(`/api/produtos/${encodeURIComponent(productId)}/filiais`, {
        method: 'POST',
        body: JSON.stringify({
          id: draft.id || undefined,
          id_filial: draft.filial.id,
          id_tabela_preco: draft.tabelaPreco?.id || null,
          id_canal_distribuicao_cliente: draft.canal?.id || null,
          estoque_disponivel: draft.estoqueDisponivel ? Number(draft.estoqueDisponivel) : null,
          preco: parsePriceStockDecimal(draft.preco),
          status: draft.status,
          ativo: draft.ativo,
          estoque_positivo: draft.estoquePositivo,
          promocao_ecommerce: draft.promocaoEcommerce,
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
      await httpClient(`/api/produtos/${encodeURIComponent(productId)}/filiais`, {
        method: 'DELETE',
        body: JSON.stringify({
          rows: orderedItems.filter((item) => selectedIds.includes(item.id)),
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
      <ClienteRelationSection<ProdutoFilialRecord>
        title={t('catalog.produtos.tabs.productBranches.title', 'Filiais')}
        readOnly={readOnly}
        hasSelection={selectedIds.length > 0}
        onDelete={() => setConfirmOpen(true)}
        onCreate={openCreate}
        items={orderedItems}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        getRowId={(item) => item.id}
        emptyMessage={t('catalog.produtos.tabs.productBranches.empty', 'Nenhuma filial foi configurada para este produto.')}
        columns={[
          {
            header: t('catalog.produtos.fields.branch', 'Filial'),
            render: (item) => item.filial?.nome_fantasia || item.filial?.nome || item.id_filial,
            cellClassName: 'font-semibold text-slate-950',
          },
          {
            header: t('priceStock.productBranches.fields.availableStock', 'Estoque disponível'),
            headerClassName: 'w-[150px]',
            render: (item) => String(item.estoque_disponivel ?? '-'),
          },
          {
            header: t('priceStock.productBranches.fields.price', 'Preço'),
            headerClassName: 'w-[150px]',
            render: (item) => (item.preco === null || item.preco === undefined ? '-' : formatLocalizedCurrency(item.preco)),
          },
          {
            header: t('catalog.produtos.fields.status', 'Status'),
            headerClassName: 'w-[160px]',
            render: (item) => {
              const meta = PRODUCT_BRANCH_STATUS_META[String(item.status || '') as keyof typeof PRODUCT_BRANCH_STATUS_META]
              return <StatusBadge tone={meta?.tone ?? 'neutral'}>{meta?.label ?? String(item.status || '-')}</StatusBadge>
            },
          },
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
          <FormField label={t('priceStock.productBranches.fields.priceTable', 'Tabela de preço')}>
            <CatalogLookupSelect
              resource="tabelas_preco"
              label={t('priceStock.productBranches.fields.priceTable', 'Tabela de preço')}
              value={draft.tabelaPreco}
              onChange={(value) => setDraft((current) => ({ ...current, tabelaPreco: value }))}
              disabled={readOnly || Boolean(draft.id)}
            />
          </FormField>
          <FormField label={t('catalog.produtos.fields.channel', 'Canal de distribuição')}>
            <CatalogLookupSelect
              resource="canais_distribuicao"
              label={t('catalog.produtos.fields.channel', 'Canal de distribuição')}
              value={draft.canal}
              onChange={(value) => setDraft((current) => ({ ...current, canal: value }))}
              disabled={readOnly || Boolean(draft.id)}
            />
          </FormField>
          <FormField label={t('priceStock.productBranches.fields.availableStock', 'Estoque disponível')}>
            <input
              type="number"
              value={draft.estoqueDisponivel}
              onChange={(event) => setDraft((current) => ({ ...current, estoqueDisponivel: event.target.value }))}
              className={inputClasses()}
            />
          </FormField>
          <FormField label={t('priceStock.productBranches.fields.price', 'Preço')}>
            <CurrencyInput
              value={draft.preco}
              onChange={(value) => setDraft((current) => ({ ...current, preco: value }))}
            />
          </FormField>
          <FormField label={t('catalog.produtos.fields.status', 'Status')}>
            <select
              value={draft.status}
              onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}
              className={inputClasses()}
            >
              <option value="disponivel">{t('catalog.produtos.options.available', 'Disponível')}</option>
              <option value="indisponivel">{t('catalog.produtos.options.unavailable', 'Indisponível')}</option>
              <option value="em_revisao">{t('catalog.produtos.options.inReview', 'Em revisão')}</option>
              <option value="fora_de_linha">{t('catalog.produtos.options.discontinued', 'Fora de linha')}</option>
            </select>
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
        description={t('catalog.produtos.tabs.productBranches.deleteDescription', 'As filiais selecionadas serão removidas deste produto.')}
        confirmLabel={t('common.delete', 'Excluir')}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </>
  )
}
