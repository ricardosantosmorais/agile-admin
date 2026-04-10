'use client'

import { Pencil, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { BooleanChoice } from '@/src/components/ui/boolean-choice'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { CrudModal } from '@/src/components/ui/crud-modal'
import { FormField } from '@/src/components/ui/form-field'
import { LookupSelect, type LookupOption } from '@/src/components/ui/lookup-select'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { TooltipIconButton } from '@/src/components/ui/tooltip-icon-button'
import { loadCrudLookupOptions } from '@/src/components/crud-base/crud-client'
import { ClienteRelationSection } from '@/src/features/clientes/components/cliente-relation-section'
import type { CupomDescontoPagamentoRecord } from '@/src/features/cupons-desconto/services/cupons-desconto-client'
import { cuponsDescontoClient } from '@/src/features/cupons-desconto/services/cupons-desconto-client'
import { useI18n } from '@/src/i18n/use-i18n'

type PagamentoDraft = {
  restricao: boolean
  formaPagamento: LookupOption | null
  condicaoPagamento: LookupOption | null
}

function RestrictionBadge({ value, yesLabel, noLabel }: { value: boolean | number | string; yesLabel: string; noLabel: string }) {
  const checked = value === true || value === 1 || value === '1'
  return <StatusBadge tone={checked ? 'warning' : 'success'}>{checked ? yesLabel : noLabel}</StatusBadge>
}

export function CupomDescontoPagamentosTab({
  cupomId,
  readOnly,
  onError,
}: {
  cupomId: string
  readOnly: boolean
  onError: (message: string | null) => void
}) {
  const { t } = useI18n()
  const [items, setItems] = useState<CupomDescontoPagamentoRecord[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [modalFeedback, setModalFeedback] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<CupomDescontoPagamentoRecord | null>(null)
  const [draft, setDraft] = useState<PagamentoDraft>({
    restricao: false,
    formaPagamento: null,
    condicaoPagamento: null,
  })

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      setItems(await cuponsDescontoClient.listPagamentos(cupomId))
      onError(null)
    } catch (error) {
      onError(error instanceof Error ? error.message : t('marketing.coupons.tabs.payments.loadError', 'Não foi possível carregar as regras de pagamento.'))
    } finally {
      setIsLoading(false)
    }
  }, [cupomId, onError, t])

  useEffect(() => {
    void refresh()
  }, [refresh])

  function closeModal() {
    setModalOpen(false)
    setEditingItem(null)
    setModalFeedback(null)
    setDraft({
      restricao: false,
      formaPagamento: null,
      condicaoPagamento: null,
    })
  }

  function openEditModal(item: CupomDescontoPagamentoRecord) {
    setEditingItem(item)
    setModalFeedback(null)
    setDraft({
      restricao: item.restricao === true || item.restricao === 1 || item.restricao === '1',
      formaPagamento: item.forma_pagamento?.id ? { id: item.forma_pagamento.id, label: item.forma_pagamento.nome || item.forma_pagamento.id } : null,
      condicaoPagamento: item.condicao_pagamento?.id ? { id: item.condicao_pagamento.id, label: item.condicao_pagamento.nome || item.condicao_pagamento.id } : null,
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!draft.formaPagamento && !draft.condicaoPagamento) {
      setModalFeedback(t('marketing.coupons.tabs.payments.validation.selectPayment', 'Selecione pelo menos uma forma ou condição de pagamento.'))
      return
    }

    try {
      if (editingItem) {
        await cuponsDescontoClient.deletePagamentos(cupomId, [editingItem.id])
      }

      await cuponsDescontoClient.createPagamento(cupomId, {
        id_cupom_desconto: cupomId,
        restricao: draft.restricao,
        id_forma_pagamento: draft.formaPagamento?.id || null,
        id_condicao_pagamento: draft.condicaoPagamento?.id || null,
      })

      await refresh()
      closeModal()
    } catch (error) {
      setModalFeedback(error instanceof Error ? error.message : t('marketing.coupons.tabs.payments.saveError', 'Não foi possível salvar a regra de pagamento.'))
    }
  }

  async function handleDelete() {
    try {
      await cuponsDescontoClient.deletePagamentos(cupomId, selectedIds)
      setSelectedIds([])
      setConfirmOpen(false)
      await refresh()
    } catch (error) {
      onError(error instanceof Error ? error.message : t('marketing.coupons.tabs.payments.deleteError', 'Não foi possível excluir as regras de pagamento.'))
    }
  }

  return (
    <>
      <ClienteRelationSection<CupomDescontoPagamentoRecord>
        title={t('marketing.coupons.tabs.payments.title', 'Formas e condições de pagamento')}
        readOnly={readOnly}
        hasSelection={selectedIds.length > 0}
        onDelete={() => setConfirmOpen(true)}
        onCreate={() => {
          setEditingItem(null)
          setModalFeedback(null)
          setDraft({ restricao: false, formaPagamento: null, condicaoPagamento: null })
          setModalOpen(true)
        }}
        items={items}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        getRowId={(item) => item.id}
        emptyMessage={isLoading
          ? t('common.loading', 'Loading...')
          : t('marketing.coupons.tabs.payments.empty', 'Nenhuma regra de pagamento foi cadastrada.')}
        columns={[
          { header: t('marketing.coupons.fields.paymentMethod', 'Forma de pagamento'), render: (item) => item.forma_pagamento?.nome || item.id_forma_pagamento || '-' },
          { header: t('marketing.coupons.fields.paymentCondition', 'Condição de pagamento'), render: (item) => item.condicao_pagamento?.nome || item.id_condicao_pagamento || '-' },
          {
            header: t('marketing.coupons.tabs.common.restriction', 'Restrição'),
            headerClassName: 'w-[120px]',
            render: (item) => <RestrictionBadge value={item.restricao} yesLabel={t('common.yes', 'Sim')} noLabel={t('common.no', 'Não')} />,
          },
          {
            header: t('common.actions', 'Ações'),
            headerClassName: 'w-[104px]',
            cellClassName: 'whitespace-nowrap',
            render: (item) => !readOnly ? (
              <div className="flex items-center gap-2">
                <TooltipIconButton label={t('simpleCrud.actions.edit', 'Editar')}>
                  <button type="button" onClick={() => openEditModal(item)} className="app-button-secondary inline-flex h-9 w-9 items-center justify-center rounded-full p-0">
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
                    className="app-button-danger inline-flex h-9 w-9 items-center justify-center rounded-full p-0"
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
          ? t('marketing.coupons.tabs.payments.editTitle', 'Editar regra de pagamento')
          : t('marketing.coupons.tabs.payments.createTitle', 'Nova regra de pagamento')}
        onClose={closeModal}
        onConfirm={() => void handleSave()}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {modalFeedback ? <div className="md:col-span-2 rounded-[1rem] border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{modalFeedback}</div> : null}

          <FormField label={t('marketing.coupons.fields.paymentMethod', 'Forma de pagamento')}>
            <LookupSelect<LookupOption>
              label={t('marketing.coupons.fields.paymentMethod', 'Forma de pagamento')}
              value={draft.formaPagamento}
              onChange={(value) => setDraft((current) => ({ ...current, formaPagamento: value }))}
              disabled={readOnly}
              loadOptions={(query, page, perPage) => loadCrudLookupOptions('formas_pagamento', query, page, perPage).then((options) => options.map((option) => ({ id: option.value, label: option.label })))}
            />
          </FormField>

          <FormField label={t('marketing.coupons.fields.paymentCondition', 'Condição de pagamento')}>
            <LookupSelect<LookupOption>
              label={t('marketing.coupons.fields.paymentCondition', 'Condição de pagamento')}
              value={draft.condicaoPagamento}
              onChange={(value) => setDraft((current) => ({ ...current, condicaoPagamento: value }))}
              disabled={readOnly}
              loadOptions={(query, page, perPage) => loadCrudLookupOptions('condicoes_pagamento', query, page, perPage).then((options) => options.map((option) => ({ id: option.value, label: option.label })))}
            />
          </FormField>

          <FormField label={t('marketing.coupons.tabs.common.restriction', 'Restrição')} className="md:col-span-2">
            <BooleanChoice
              value={draft.restricao}
              onChange={(value) => setDraft((current) => ({ ...current, restricao: value }))}
              disabled={readOnly}
              trueLabel={t('common.yes', 'Sim')}
              falseLabel={t('common.no', 'Não')}
            />
          </FormField>
        </div>
      </CrudModal>

      <ConfirmDialog
        open={confirmOpen}
        title={t('marketing.coupons.tabs.payments.deleteTitle', 'Excluir regras de pagamento')}
        description={t('marketing.coupons.tabs.payments.deleteDescription', 'As regras de pagamento selecionadas serão removidas.')}
        confirmLabel={t('common.delete', 'Excluir')}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </>
  )
}
