'use client'

import { Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
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
import { compreEGanheClient, type BrindeUniversoRecord } from '@/src/features/compre-e-ganhe/services/compre-e-ganhe-client'
import { getBrindeUniverseLabel } from '@/src/features/compre-e-ganhe/services/compre-e-ganhe-helpers'
import { toBrindeUniversoPayload } from '@/src/features/compre-e-ganhe/services/compre-e-ganhe-mappers'
import { BRAZILIAN_STATES } from '@/src/lib/brazil'
import { useI18n } from '@/src/i18n/use-i18n'

type UniversoKind = 'excecoes' | 'restricoes'
type UniversoDraft = { id?: string; id_regra: string; universo: string; id_objeto: string; ativo: boolean; lookup: LookupOption | null }

function initialDraft(): UniversoDraft {
  return { id_regra: '', universo: '', id_objeto: '', ativo: true, lookup: null }
}

function resolveResource(universo: string) {
  switch (universo) {
    case 'cliente': return 'clientes' as const
    case 'filial': return 'filiais' as const
    case 'grupo': return 'grupos' as const
    case 'praca': return 'pracas' as const
    case 'rede': return 'redes' as const
    case 'segmento': return 'segmentos' as const
    case 'supervisor': return 'supervisores' as const
    case 'tabela_preco': return 'tabelas_preco' as const
    case 'vendedor': return 'vendedores' as const
    default: return null
  }
}

function resolveValue(item: BrindeUniversoRecord, t: ReturnType<typeof useI18n>['t']) {
  if (item.universo === 'cliente') return item.cliente?.nome_fantasia || item.cliente?.razao_social || item.id_objeto || '-'
  if (item.universo === 'filial') return item.filial?.nome_fantasia || item.filial?.nome || item.id_objeto || '-'
  if (item.universo === 'grupo') return item.grupo?.nome || item.id_objeto || '-'
  if (item.universo === 'praca') return item.praca?.nome || item.id_objeto || '-'
  if (item.universo === 'rede') return item.rede?.nome || item.id_objeto || '-'
  if (item.universo === 'segmento') return item.segmento?.nome || item.id_objeto || '-'
  if (item.universo === 'supervisor') return item.supervisor?.nome || item.id_objeto || '-'
  if (item.universo === 'tabela_preco') return item.tabela_preco?.nome || item.id_objeto || '-'
  if (item.universo === 'vendedor') return item.vendedor?.nome || item.id_objeto || '-'
  if (item.universo === 'contribuinte') return item.id_objeto === '1' ? t('common.yes', 'Sim') : t('common.no', 'Não')
  if (item.universo === 'todos') return t('common.all', 'Todos')
  return item.id_objeto || '-'
}

export function CompreEGanheUniversoTab({ brindeId, readOnly, onError, kind }: { brindeId: string; readOnly: boolean; onError: (message: string | null) => void; kind: UniversoKind }) {
  const { t } = useI18n()
  const [items, setItems] = useState<BrindeUniversoRecord[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [draft, setDraft] = useState<UniversoDraft>(initialDraft())

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      setItems(kind === 'excecoes' ? await compreEGanheClient.listExcecoes(brindeId) : await compreEGanheClient.listRestricoes(brindeId))
      onError(null)
    } catch (error) {
      onError(error instanceof Error ? error.message : t(`marketing.buyAndGet.${kind}.loadError`, 'Não foi possível carregar os itens.'))
    } finally {
      setIsLoading(false)
    }
  }, [brindeId, kind, onError, t])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function handleSave() {
    try {
      const payload = toBrindeUniversoPayload(brindeId, {
        id: draft.id,
        id_regra: draft.id_regra,
        universo: draft.universo,
        id_objeto: draft.lookup?.id || draft.id_objeto,
        ativo: draft.ativo,
      })
      if (kind === 'excecoes') {
        await compreEGanheClient.createExcecao(payload)
      } else {
        await compreEGanheClient.createRestricao(payload)
      }
      setDraft(initialDraft())
      setFeedback(null)
      setModalOpen(false)
      await refresh()
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : t(`marketing.buyAndGet.${kind}.saveError`, 'Não foi possível salvar o item.'))
    }
  }

  async function handleDelete() {
    try {
      if (kind === 'excecoes') {
        await compreEGanheClient.deleteExcecoes(selectedIds)
      } else {
        await compreEGanheClient.deleteRestricoes(selectedIds)
      }
      setSelectedIds([])
      setConfirmOpen(false)
      await refresh()
    } catch (error) {
      onError(error instanceof Error ? error.message : t(`marketing.buyAndGet.${kind}.deleteError`, 'Não foi possível excluir os itens.'))
    }
  }

  const lookupResource = resolveResource(draft.universo)

  return (
    <>
      <ClienteRelationSection<BrindeUniversoRecord>
        title={kind === 'excecoes' ? t('marketing.buyAndGet.tabs.exceptions', 'Exceções') : t('marketing.buyAndGet.tabs.restrictions', 'Restrições')}
        readOnly={readOnly}
        hasSelection={selectedIds.length > 0}
        onDelete={() => setConfirmOpen(true)}
        onCreate={() => setModalOpen(true)}
        items={items}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        getRowId={(item) => item.id}
        emptyMessage={isLoading ? t('common.loading', 'Loading...') : t(`marketing.buyAndGet.${kind}.empty`, 'Nenhum item cadastrado.')}
        columns={[
          { header: t('marketing.buyAndGet.universe.fields.ruleCode', 'Código da regra'), render: (item) => item.id_regra || '-' },
          { header: t('marketing.buyAndGet.universe.fields.universe', 'Universo'), render: (item) => getBrindeUniverseLabel(item.universo, t) },
          { header: t('marketing.buyAndGet.universe.fields.value', 'Valor'), cellClassName: 'font-semibold text-slate-950', render: (item) => resolveValue(item, t) },
          { header: t('simpleCrud.fields.active', 'Ativo'), render: (item) => <StatusBadge tone={item.ativo ? 'success' : 'warning'}>{item.ativo ? t('common.yes', 'Sim') : t('common.no', 'Não')}</StatusBadge> },
          {
            header: t('common.actions', 'Ações'),
            headerClassName: 'w-[72px]',
            render: (item) => !readOnly ? (
              <TooltipIconButton label={t('simpleCrud.actions.delete', 'Excluir')}>
                <button type="button" onClick={() => { setSelectedIds([item.id]); setConfirmOpen(true) }} className="app-button-danger inline-flex h-9 w-9 items-center justify-center rounded-full p-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </TooltipIconButton>
            ) : null,
          },
        ]}
      />

      <CrudModal open={modalOpen} title={kind === 'excecoes' ? t('marketing.buyAndGet.exceptions.createTitle', 'Nova exceção') : t('marketing.buyAndGet.restrictions.createTitle', 'Nova restrição')} onClose={() => { setDraft(initialDraft()); setFeedback(null); setModalOpen(false) }} onConfirm={() => void handleSave()}>
        <div className="grid gap-4 md:grid-cols-2">
          {feedback ? <div className="md:col-span-2 rounded-[1rem] border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{feedback}</div> : null}
          <FormField label={t('marketing.buyAndGet.universe.fields.ruleCode', 'Código da regra')}>
            <input value={draft.id_regra} onChange={(event) => setDraft((current) => ({ ...current, id_regra: event.target.value }))} className={inputClasses()} />
          </FormField>
          <FormField label={t('marketing.buyAndGet.universe.fields.universe', 'Universo')}>
            <select value={draft.universo} onChange={(event) => setDraft((current) => ({ ...current, universo: event.target.value, lookup: null, id_objeto: '' }))} className={inputClasses()}>
              <option value="">{t('common.select', 'Selecione')}</option>
              <option value="contribuinte">{t('marketing.buyAndGet.universe.options.taxpayer', 'Contribuinte')}</option>
              <option value="classe">{t('marketing.buyAndGet.universe.options.class', 'Classe')}</option>
              <option value="cliente">{t('marketing.buyAndGet.universe.options.customer', 'Cliente')}</option>
              <option value="filial">{t('marketing.buyAndGet.universe.options.branch', 'Filial')}</option>
              <option value="grupo">{t('marketing.buyAndGet.universe.options.group', 'Grupo')}</option>
              <option value="praca">{t('marketing.buyAndGet.universe.options.square', 'Praça')}</option>
              <option value="rede">{t('marketing.buyAndGet.universe.options.network', 'Rede')}</option>
              <option value="segmento">{t('marketing.buyAndGet.universe.options.segment', 'Segmento')}</option>
              <option value="supervisor">{t('marketing.buyAndGet.universe.options.supervisor', 'Supervisor')}</option>
              <option value="tabela_preco">{t('marketing.buyAndGet.universe.options.priceTable', 'Tabela de preço')}</option>
              <option value="tipo_cliente">{t('marketing.buyAndGet.universe.options.customerType', 'Tipo de cliente')}</option>
              <option value="uf">{t('marketing.buyAndGet.universe.options.state', 'UF')}</option>
              <option value="vendedor">{t('marketing.buyAndGet.universe.options.seller', 'Vendedor')}</option>
              <option value="todos">{t('common.all', 'Todos')}</option>
            </select>
          </FormField>
          {lookupResource ? <FormField label={t('marketing.buyAndGet.universe.fields.value', 'Valor')} className="md:col-span-2"><LookupSelect label={t('marketing.buyAndGet.universe.fields.value', 'Valor')} value={draft.lookup} onChange={(value) => setDraft((current) => ({ ...current, lookup: value }))} loadOptions={(q, p, pp) => loadCrudLookupOptions(lookupResource, q, p, pp).then((options) => options.map((option) => ({ id: option.value, label: option.label })))} /></FormField> : null}
          {draft.universo === 'contribuinte' ? <FormField label={t('marketing.buyAndGet.universe.fields.value', 'Valor')}><select value={draft.id_objeto} onChange={(event) => setDraft((current) => ({ ...current, id_objeto: event.target.value }))} className={inputClasses()}><option value="">{t('common.select', 'Selecione')}</option><option value="1">{t('common.yes', 'Sim')}</option><option value="0">{t('common.no', 'Não')}</option></select></FormField> : null}
          {draft.universo === 'classe' ? <FormField label={t('marketing.buyAndGet.universe.fields.value', 'Valor')}><input value={draft.id_objeto} onChange={(event) => setDraft((current) => ({ ...current, id_objeto: event.target.value }))} className={inputClasses()} /></FormField> : null}
          {draft.universo === 'tipo_cliente' ? <FormField label={t('marketing.buyAndGet.universe.fields.value', 'Valor')}><select value={draft.id_objeto} onChange={(event) => setDraft((current) => ({ ...current, id_objeto: event.target.value }))} className={inputClasses()}><option value="">{t('common.select', 'Selecione')}</option><option value="PF">PF</option><option value="PJ">PJ</option></select></FormField> : null}
          {draft.universo === 'uf' ? <FormField label={t('marketing.buyAndGet.universe.fields.value', 'Valor')}><select value={draft.id_objeto} onChange={(event) => setDraft((current) => ({ ...current, id_objeto: event.target.value }))} className={inputClasses()}><option value="">{t('common.select', 'Selecione')}</option>{BRAZILIAN_STATES.map((state) => <option key={state} value={state}>{state}</option>)}</select></FormField> : null}
          <FormField label={t('simpleCrud.fields.active', 'Ativo')}>
            <BooleanChoice value={draft.ativo} onChange={(value) => setDraft((current) => ({ ...current, ativo: value }))} trueLabel={t('common.yes', 'Sim')} falseLabel={t('common.no', 'Não')} />
          </FormField>
        </div>
      </CrudModal>

      <ConfirmDialog open={confirmOpen} title={kind === 'excecoes' ? t('marketing.buyAndGet.exceptions.deleteTitle', 'Excluir exceções') : t('marketing.buyAndGet.restrictions.deleteTitle', 'Excluir restrições')} description={t('marketing.buyAndGet.universe.deleteDescription', 'Os itens selecionados serão removidos.')} confirmLabel={t('common.delete', 'Excluir')} onClose={() => setConfirmOpen(false)} onConfirm={() => void handleDelete()} />
    </>
  )
}
