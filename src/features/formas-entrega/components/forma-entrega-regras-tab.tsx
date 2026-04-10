'use client'

import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppDataTable } from '@/src/components/data-table/app-data-table'
import { DataTableFiltersCard } from '@/src/components/data-table/data-table-filters'
import { DataTableFilterToggleAction, DataTablePageActions } from '@/src/components/data-table/data-table-toolbar'
import type { AppDataTableColumn } from '@/src/components/data-table/types'
import { useDataTableState } from '@/src/components/data-table/use-data-table-state'
import { ConfirmDialog } from '@/src/components/ui/confirm-dialog'
import { CrudModal } from '@/src/components/ui/crud-modal'
import { FormField } from '@/src/components/ui/form-field'
import { InputWithAffix } from '@/src/components/ui/input-with-affix'
import { inputClasses } from '@/src/components/ui/input-styles'
import { MultiLookupSelect, type MultiLookupOption } from '@/src/components/ui/multi-lookup-select'
import { SectionCard } from '@/src/components/ui/section-card'
import {
  formasEntregaClient,
  type CepBairroOption,
  type CepCidadeOption,
  type FormaEntregaRegrasFilters,
} from '@/src/features/formas-entrega/services/formas-entrega-client'
import {
  buildFormaEntregaLocalidadePayload,
  createEmptyFormaEntregaRegraDraft,
  formatFormaEntregaRuleSummary,
  mapFormaEntregaRegraToDraft,
  serializeFormaEntregaRegraDraft,
  type FormaEntregaRegraDraft,
  type FormaEntregaRegraRecord,
} from '@/src/features/formas-entrega/services/formas-entrega-mappers'
import { useI18n } from '@/src/i18n/use-i18n'
import { BRAZILIAN_STATES, BRAZILIAN_STATE_NAMES } from '@/src/lib/brazil'
import { cepMask, currencyMask, decimalMask, parseCurrencyInput } from '@/src/lib/input-masks'

const defaultFilters: FormaEntregaRegrasFilters = {
  page: 1,
  perPage: 15,
  orderBy: 'nome',
  sort: 'asc',
  nome: '',
  tipo: '',
  valorFrom: '',
  valorTo: '',
  prazoFrom: '',
  prazoTo: '',
}

const feedbackClasses = 'app-error-panel md:col-span-2 rounded-[1rem] px-4 py-3 text-sm'

function regraTypeLabel(type: string, t: ReturnType<typeof useI18n>['t']) {
  switch (type) {
    case 'cep':
      return t('logistics.deliveryMethods.ruleTypes.zip', 'Faixa de CEP')
    case 'km':
      return t('logistics.deliveryMethods.ruleTypes.km', 'Raio de KM')
    case 'local':
      return t('logistics.deliveryMethods.ruleTypes.location', 'Localidade')
    default:
      return type
  }
}

function applyStringMask(value: string, mask: 'cep' | 'currency' | 'decimal') {
  if (mask === 'cep') return cepMask(value)
  if (mask === 'currency') return currencyMask(value)
  return decimalMask(value, 3)
}

function normalizeIntegerInput(value: string, maxLength = 10) {
  return value.replace(/[^\d]/g, '').slice(0, maxLength)
}

function formatCurrencyDisplay(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  const numeric = typeof value === 'number'
    ? value
    : parseCurrencyInput(String(value)) ?? Number(String(value).replace(',', '.'))

  if (!Number.isFinite(numeric)) {
    return '-'
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numeric)
}

function buildComplementarPayload(
  formaEntregaId: string,
  draft: FormaEntregaRegraDraft,
  localId: string,
  faixas: Array<{ cep_inicial?: string; cep_final?: string }>,
) {
  return faixas.map((faixa) => ({
    ...serializeFormaEntregaRegraDraft({
      ...draft,
      id: undefined,
      tipo: 'cep',
      cep_de: String(faixa.cep_inicial || ''),
      cep_ate: String(faixa.cep_final || ''),
      km_de: '',
      km_ate: '',
      localidades: { estados: [], cidades: [], bairros: [] },
    }, formaEntregaId),
    id: null,
    nome: `${draft.nome} -> Complementar`,
    tipo: 'cep',
    id_formas_entrega_regras_cepbr: localId,
  }))
}

export function FormaEntregaRegrasTab({
  formaEntregaId,
  readOnly,
  onError,
}: {
  formaEntregaId: string
  readOnly: boolean
  onError: (message: string | null) => void
}) {
  const { t } = useI18n()
  const [items, setItems] = useState<FormaEntregaRegraRecord[]>([])
  const [filters, setFilters] = useState<FormaEntregaRegrasFilters>(defaultFilters)
  const [filtersDraft, setFiltersDraft] = useState<FormaEntregaRegrasFilters>(defaultFilters)
  const [isLoading, setIsLoading] = useState(true)
  const [meta, setMeta] = useState<{ page: number; pages: number; perPage: number; from: number; to: number; total: number } | null>(null)
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [cities, setCities] = useState<CepCidadeOption[]>([])
  const [districts, setDistricts] = useState<CepBairroOption[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [editingItem, setEditingItem] = useState<FormaEntregaRegraRecord | null>(null)
  const [draft, setDraft] = useState<FormaEntregaRegraDraft>(createEmptyFormaEntregaRegraDraft())

  const tableState = useDataTableState({
    rows: items,
    getRowId: (item: FormaEntregaRegraRecord) => item.id,
    filters,
    setFilters,
    setFiltersDraft,
  })

  const isLocal = draft.tipo === 'local'
  const isCep = draft.tipo === 'cep'
  const isKm = draft.tipo === 'km'
  const { clearSelection } = tableState

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await formasEntregaClient.listRegras(formaEntregaId, filters)
      setItems(response.data)
      setMeta(response.meta)
      clearSelection()
      onError(null)
    } catch (error) {
      onError(error instanceof Error ? error.message : t('logistics.deliveryMethods.messages.loadRulesError', 'Não foi possível carregar as regras.'))
    } finally {
      setIsLoading(false)
    }
  }, [clearSelection, filters, formaEntregaId, onError, t])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!draft.localidades.estados.length) {
      setCities([])
      setDistricts([])
      return
    }

    void formasEntregaClient.listCidades(draft.localidades.estados)
      .then((response) => setCities(
        response.map((city) => ({
          id_cidade: String(city.id_cidade),
          cidade: String(city.cidade),
          uf: String(city.uf),
        })),
      ))
      .catch(() => setCities([]))
  }, [draft.localidades.estados])

  useEffect(() => {
    if (!draft.localidades.cidades.length) {
      setDistricts([])
      return
    }

    void formasEntregaClient.listBairros(draft.localidades.cidades)
      .then((response) => setDistricts(
        response.map((district) => ({
          id_bairro: String(district.id_bairro),
          bairro: String(district.bairro),
          id_cidade: String(district.id_cidade),
        })),
      ))
      .catch(() => setDistricts([]))
  }, [draft.localidades.cidades])

  const stateOptions = useMemo<MultiLookupOption[]>(
    () => BRAZILIAN_STATES.map((uf) => ({
      id: uf,
      label: `${uf} - ${BRAZILIAN_STATE_NAMES[uf]}`,
    })),
    [],
  )

  const cityOptions = useMemo<MultiLookupOption[]>(
    () => cities
      .filter((city) => draft.localidades.estados.includes(String(city.uf)))
      .map((city) => ({
        id: String(city.id_cidade),
        label: String(city.cidade),
        description: String(city.uf),
      })),
    [cities, draft.localidades.estados],
  )

  const districtOptions = useMemo<MultiLookupOption[]>(() => {
    const cityMap = new Map(cities.map((city) => [String(city.id_cidade), city]))
    return districts
      .filter((district) => draft.localidades.cidades.includes(String(district.id_cidade)))
      .map((district) => ({
        id: String(district.id_bairro),
        label: String(district.bairro),
        description: (() => {
          const city = cityMap.get(String(district.id_cidade))
          return city ? `${city.cidade} - ${city.uf}` : String(district.id_cidade)
        })(),
      }))
  }, [cities, districts, draft.localidades.cidades])

  const columns: AppDataTableColumn<FormaEntregaRegraRecord, FormaEntregaRegrasFilters>[] = [
    {
      id: 'nome',
      label: t('logistics.deliveryMethods.ruleFields.name', 'Regra'),
      sortKey: 'nome',
      cell: (item) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[color:var(--app-text)]">{formatFormaEntregaRuleSummary(item)}</p>
        </div>
      ),
      filter: {
        id: 'nome',
        kind: 'text',
        key: 'nome',
        label: t('logistics.deliveryMethods.ruleFields.name', 'Regra'),
      },
    },
    {
      id: 'tipo',
      label: t('logistics.deliveryMethods.fields.type', 'Tipo'),
      sortKey: 'tipo',
      cell: (item) => regraTypeLabel(item.tipo, t),
      thClassName: 'w-[140px]',
      filter: {
        id: 'tipo',
        kind: 'select',
        key: 'tipo',
        label: t('logistics.deliveryMethods.fields.type', 'Tipo'),
        options: [
          { value: 'cep', label: regraTypeLabel('cep', t) },
          { value: 'km', label: regraTypeLabel('km', t) },
          { value: 'local', label: regraTypeLabel('local', t) },
        ],
      },
    },
    {
      id: 'valor',
      label: t('logistics.deliveryMethods.ruleFields.freightValue', 'Valor do frete'),
      sortKey: 'valor',
      cell: (item) => formatCurrencyDisplay(item.valor),
      thClassName: 'w-[152px]',
      filter: {
        id: 'valor',
        kind: 'number-range',
        label: t('logistics.deliveryMethods.ruleFields.freightValue', 'Valor do frete'),
        fromKey: 'valorFrom',
        toKey: 'valorTo',
        inputMode: 'decimal',
      },
    },
    {
      id: 'prazo',
      label: t('logistics.deliveryMethods.ruleFields.leadTime', 'Prazo'),
      sortKey: 'prazo',
      cell: (item) => item.prazo ? String(item.prazo) : '0',
      thClassName: 'w-[112px]',
      filter: {
        id: 'prazo',
        kind: 'number-range',
        label: t('logistics.deliveryMethods.ruleFields.leadTime', 'Prazo'),
        fromKey: 'prazoFrom',
        toKey: 'prazoTo',
        inputMode: 'numeric',
      },
    },
  ]

  function closeModal() {
    setModalOpen(false)
    setEditingItem(null)
    setFeedback(null)
    setIsSaving(false)
    setDraft(createEmptyFormaEntregaRegraDraft())
    setCities([])
    setDistricts([])
  }

  function openCreateModal() {
    setEditingItem(null)
    setFeedback(null)
    setDraft(createEmptyFormaEntregaRegraDraft())
    setModalOpen(true)
  }

  function openEditModal(item: FormaEntregaRegraRecord) {
    const seededCities = new Map<string, CepCidadeOption>()
    const seededDistricts = new Map<string, CepBairroOption>()

    for (const cep of item.ceps ?? []) {
      const cidadeId = cep.id_cidade ?? cep.cidade?.id_cidade ?? cep.bairro?.id_cidade ?? null
      const uf = cep.id_uf ?? cep.cidade?.uf ?? null
      const cidadeNome = cep.cidade?.cidade ?? null
      const bairroId = cep.id_bairro ?? cep.bairro?.id_bairro ?? null
      const bairroNome = cep.bairro?.bairro ?? null

      if (cidadeId && uf && cidadeNome) {
        seededCities.set(String(cidadeId), {
          id_cidade: String(cidadeId),
          cidade: String(cidadeNome),
          uf: String(uf),
        })
      }

      if (bairroId && bairroNome && cidadeId) {
        seededDistricts.set(String(bairroId), {
          id_bairro: String(bairroId),
          bairro: String(bairroNome),
          id_cidade: String(cidadeId),
        })
      }
    }

    setCities((current) => {
      const next = new Map(current.map((city) => [city.id_cidade, city]))
      seededCities.forEach((value, key) => next.set(key, value))
      return [...next.values()]
    })
    setDistricts((current) => {
      const next = new Map(current.map((district) => [district.id_bairro, district]))
      seededDistricts.forEach((value, key) => next.set(key, value))
      return [...next.values()]
    })
    setEditingItem(item)
    setFeedback(null)
    setDraft(mapFormaEntregaRegraToDraft(item))
    setModalOpen(true)
  }

  function patchDraft<K extends keyof FormaEntregaRegrasFilters>(key: K, value: FormaEntregaRegrasFilters[K]) {
    setFiltersDraft((current) => ({ ...current, [key]: value }))
  }

  function applyFilters() {
    setFilters({ ...filtersDraft, page: 1 })
  }

  function clearFilters() {
    setFilters({ ...defaultFilters })
    setFiltersDraft({ ...defaultFilters })
  }

  function setPerPage(perPage: number) {
    setFilters((current) => ({ ...current, page: 1, perPage }))
    setFiltersDraft((current) => ({ ...current, page: 1, perPage }))
  }

  async function handleSave() {
    if (!draft.nome.trim()) {
      setFeedback(t('simpleCrud.requiredField', '{{field}} is required.', { field: t('logistics.deliveryMethods.ruleFields.name', 'Nome da regra') }))
      return
    }

    if (isCep && (!draft.cep_de || !draft.cep_ate)) {
      setFeedback(t('logistics.deliveryMethods.messages.ruleZipRequired', 'Informe CEP inicial e CEP final.'))
      return
    }

    if (isKm && (!draft.km_de || !draft.km_ate)) {
      setFeedback(t('logistics.deliveryMethods.messages.ruleKmRequired', 'Informe KM inicial e KM final.'))
      return
    }

    if (isLocal && !draft.localidades.estados.length) {
      setFeedback(t('logistics.deliveryMethods.messages.ruleLocationRequired', 'Selecione pelo menos um estado.'))
      return
    }

    try {
      setIsSaving(true)
      const localidadeDeleteIds = editingItem?.tipo === 'local'
        ? (editingItem.ceps ?? [])
            .map((cep) => cep.id)
            .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        : []
      const saved = await formasEntregaClient.saveRegra(formaEntregaId, serializeFormaEntregaRegraDraft(draft, formaEntregaId))
      const savedRule = Array.isArray(saved) && saved[0] ? saved[0] : null

      if (!savedRule?.id) {
        throw new Error(t('logistics.deliveryMethods.messages.saveRulesError', 'Não foi possível salvar a regra.'))
      }

      if (draft.tipo === 'local') {
        const locais = await formasEntregaClient.saveRegraLocalidades(
          formaEntregaId,
          savedRule.id,
          buildFormaEntregaLocalidadePayload(savedRule.id, draft.localidades, {
            cidades: cities.map((city) => ({ id_cidade: city.id_cidade, uf: city.uf })),
            bairros: districts.map((district) => ({ id_bairro: district.id_bairro, id_cidade: district.id_cidade })),
          }),
          localidadeDeleteIds,
        ) as Array<{ id?: string; id_uf?: string; id_cidade?: string; id_bairro?: string }>
        const complementares: Array<Record<string, unknown>> = []

        for (const local of locais) {
          if (!local.id) {
            continue
          }

          const faixas = local.id_bairro
            ? await formasEntregaClient.listFaixas('bairro', local.id_bairro)
            : local.id_cidade
              ? await formasEntregaClient.listFaixas('cidade', local.id_cidade)
              : local.id_uf
                ? await formasEntregaClient.listFaixas('estado', local.id_uf)
                : []

          complementares.push(...buildComplementarPayload(formaEntregaId, draft, local.id, faixas))
        }

        await formasEntregaClient.replaceRegraComplementares(formaEntregaId, savedRule.id, complementares)
      } else if (editingItem?.tipo === 'local') {
        await formasEntregaClient.saveRegraLocalidades(formaEntregaId, savedRule.id, [], localidadeDeleteIds)
        await formasEntregaClient.replaceRegraComplementares(formaEntregaId, savedRule.id, [])
      }

      await refresh()
      closeModal()
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : t('logistics.deliveryMethods.messages.saveRulesError', 'Não foi possível salvar a regra.'))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    try {
      await formasEntregaClient.deleteRegras(formaEntregaId, tableState.selectedIds)
      tableState.clearSelection()
      setConfirmOpen(false)
      await refresh()
    } catch (error) {
      onError(error instanceof Error ? error.message : t('logistics.deliveryMethods.messages.deleteRulesError', 'Não foi possível excluir as regras.'))
    }
  }

  return (
    <>
      <SectionCard
        title={t('logistics.deliveryMethods.tabs.rules', 'Regras')}
        className="min-w-0 overflow-hidden"
        action={(
          <div className="flex w-full items-center justify-between gap-3">
            <DataTableFilterToggleAction
              expanded={filtersExpanded}
              onClick={() => setFiltersExpanded((current) => !current)}
              collapsedLabel={t('filters.button', 'Filtros')}
              expandedLabel={t('filters.hide', 'Ocultar filtros')}
            />
            {!readOnly ? (
              <DataTablePageActions
                actions={[
                  tableState.selectedIds.length
                    ? {
                        label: t('simpleCrud.actions.delete', 'Excluir'),
                        icon: Trash2,
                        onClick: () => setConfirmOpen(true),
                        tone: 'danger',
                      }
                    : null,
                  {
                    label: t('simpleCrud.actions.create', 'Novo'),
                    icon: Plus,
                    onClick: openCreateModal,
                    tone: 'primary',
                  },
                ]}
              />
            ) : null}
          </div>
        )}
      >
        <DataTableFiltersCard<FormaEntregaRegrasFilters>
          variant="embedded"
          columns={columns as AppDataTableColumn<unknown, FormaEntregaRegrasFilters>[]}
          draft={filtersDraft}
          applied={filters}
          expanded={filtersExpanded}
          onToggleExpanded={() => setFiltersExpanded((current) => !current)}
          onApply={applyFilters}
          onClear={clearFilters}
          patchDraft={patchDraft}
        />
        <AppDataTable<FormaEntregaRegraRecord, FormaEntregaRegrasFilters['orderBy'], FormaEntregaRegrasFilters>
          rows={items}
          getRowId={(item) => item.id}
          emptyMessage={isLoading ? t('common.loading', 'Loading...') : t('logistics.deliveryMethods.messages.emptyRules', 'Nenhuma regra foi cadastrada para esta forma de entrega.')}
          columns={columns}
          sort={{
            activeColumn: filters.orderBy,
            direction: filters.sort,
            onToggle: tableState.toggleSort,
          }}
          rowActions={(item) => !readOnly ? [
            {
              id: 'edit',
              label: t('simpleCrud.actions.edit', 'Editar'),
              icon: Pencil,
              onClick: () => openEditModal(item),
            },
            {
              id: 'delete',
              label: t('simpleCrud.actions.delete', 'Excluir'),
              icon: Trash2,
              tone: 'danger',
              onClick: () => {
                tableState.setSelectedIds([item.id])
                setConfirmOpen(true)
              },
            },
          ] : []}
          selectable={!readOnly}
          selectedIds={tableState.selectedIds}
          allSelected={tableState.allSelected}
          onToggleSelect={tableState.toggleSelection}
          onToggleSelectAll={tableState.toggleSelectAll}
          mobileCard={{
            title: (item) => formatFormaEntregaRuleSummary(item),
            subtitle: (item) => regraTypeLabel(item.tipo, t),
            meta: (item) => `${t('logistics.deliveryMethods.ruleFields.freightValue', 'Valor do frete')}: ${formatCurrencyDisplay(item.valor)}`,
            badges: (item) => (
              <span className="text-xs text-[color:var(--app-muted)]">
                {t('logistics.deliveryMethods.ruleFields.leadTime', 'Prazo')}: {item.prazo ? String(item.prazo) : '0'}
              </span>
            ),
          }}
          pagination={meta ?? undefined}
          onPageChange={tableState.setPage}
          pageSize={{
            value: filtersDraft.perPage,
            options: [15, 30, 45, 60],
            onChange: setPerPage,
          }}
        />
      </SectionCard>

      <CrudModal
        open={modalOpen}
        title={editingItem ? t('logistics.deliveryMethods.messages.editRuleTitle', 'Editar regra') : t('logistics.deliveryMethods.messages.createRuleTitle', 'Nova regra')}
        onClose={closeModal}
        onConfirm={() => void handleSave()}
        isSaving={isSaving}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {feedback ? <div className={feedbackClasses}>{feedback}</div> : null}

          <FormField label={t('logistics.deliveryMethods.ruleFields.name', 'Nome da regra')} className="md:col-span-2">
            <input value={draft.nome} onChange={(event) => setDraft((current) => ({ ...current, nome: event.target.value }))} className={inputClasses()} />
          </FormField>

          <FormField label={t('logistics.deliveryMethods.fields.type', 'Tipo')}>
            <select
              value={draft.tipo}
              onChange={(event) => setDraft((current) => ({
                ...current,
                tipo: event.target.value as FormaEntregaRegraDraft['tipo'],
                localidades: event.target.value === 'local' ? current.localidades : { estados: [], cidades: [], bairros: [] },
              }))}
              className={inputClasses()}
            >
              <option value="cep">{regraTypeLabel('cep', t)}</option>
              <option value="km">{regraTypeLabel('km', t)}</option>
              <option value="local">{regraTypeLabel('local', t)}</option>
            </select>
          </FormField>

          {isCep ? (
            <>
              <FormField label={t('logistics.deliveryMethods.ruleFields.zipStart', 'CEP inicial')}>
                <input value={draft.cep_de} onChange={(event) => setDraft((current) => ({ ...current, cep_de: applyStringMask(event.target.value, 'cep') }))} className={inputClasses()} />
              </FormField>
              <FormField label={t('logistics.deliveryMethods.ruleFields.zipEnd', 'CEP final')}>
                <input value={draft.cep_ate} onChange={(event) => setDraft((current) => ({ ...current, cep_ate: applyStringMask(event.target.value, 'cep') }))} className={inputClasses()} />
              </FormField>
            </>
          ) : null}

          {isKm ? (
            <>
              <FormField label={t('logistics.deliveryMethods.ruleFields.kmStart', 'KM inicial')}>
                <InputWithAffix value={draft.km_de} onChange={(event) => setDraft((current) => ({ ...current, km_de: normalizeIntegerInput(event.target.value, 4) }))} suffix="km" />
              </FormField>
              <FormField label={t('logistics.deliveryMethods.ruleFields.kmEnd', 'KM final')}>
                <InputWithAffix value={draft.km_ate} onChange={(event) => setDraft((current) => ({ ...current, km_ate: normalizeIntegerInput(event.target.value, 4) }))} suffix="km" />
              </FormField>
            </>
          ) : null}

          {isLocal ? (
            <>
              <FormField
                label={t('logistics.deliveryMethods.ruleFields.states', 'Estados')}
                className="md:col-span-2"
                helperText={t('logistics.deliveryMethods.help.ruleStates', 'Pesquise e selecione um ou mais estados. As cidades e bairros ficam disponíveis conforme a seleção.')}
              >
                <MultiLookupSelect
                  label={t('logistics.deliveryMethods.ruleFields.states', 'Estados')}
                  values={draft.localidades.estados}
                  options={stateOptions}
                  onChange={(values) => {
                    const allowedCities = cities.filter((city) => values.includes(city.uf)).map((city) => city.id_cidade)
                    const nextCities = draft.localidades.cidades.filter((city) => allowedCities.includes(city))
                    const allowedDistricts = districts.filter((district) => nextCities.includes(district.id_cidade)).map((district) => district.id_bairro)
                    setDraft((current) => ({
                      ...current,
                      localidades: {
                        estados: values,
                        cidades: nextCities,
                        bairros: current.localidades.bairros.filter((bairro) => allowedDistricts.includes(bairro)),
                      },
                    }))
                  }}
                  disabled={readOnly}
                  placeholder={t('logistics.deliveryMethods.placeholders.searchStates', 'Buscar estados')}
                />
              </FormField>
              <FormField
                label={t('logistics.deliveryMethods.ruleFields.cities', 'Cidades')}
                className="md:col-span-2"
                helperText={t('logistics.deliveryMethods.help.ruleCities', 'Você pode selecionar várias cidades. Os bairros aparecem agrupados conforme as cidades escolhidas.')}
              >
                <MultiLookupSelect
                  label={t('logistics.deliveryMethods.ruleFields.cities', 'Cidades')}
                  values={draft.localidades.cidades}
                  options={cityOptions}
                  onChange={(values) => {
                    const allowedDistricts = districts.filter((district) => values.includes(district.id_cidade)).map((district) => district.id_bairro)
                    setDraft((current) => ({
                      ...current,
                      localidades: {
                        ...current.localidades,
                        cidades: values,
                        bairros: current.localidades.bairros.filter((bairro) => allowedDistricts.includes(bairro)),
                      },
                    }))
                  }}
                  disabled={readOnly || !draft.localidades.estados.length}
                  placeholder={t('logistics.deliveryMethods.placeholders.searchCities', 'Buscar cidades')}
                />
              </FormField>
              <FormField
                label={t('logistics.deliveryMethods.ruleFields.districts', 'Bairros')}
                className="md:col-span-2"
                helperText={t('logistics.deliveryMethods.help.ruleDistricts', 'Os bairros são carregados a partir das cidades selecionadas e podem ser escolhidos em múltipla seleção.')}
              >
                <MultiLookupSelect
                  label={t('logistics.deliveryMethods.ruleFields.districts', 'Bairros')}
                  values={draft.localidades.bairros}
                  options={districtOptions}
                  onChange={(values) => setDraft((current) => ({ ...current, localidades: { ...current.localidades, bairros: values } }))}
                  disabled={readOnly || !draft.localidades.cidades.length}
                  placeholder={t('logistics.deliveryMethods.placeholders.searchDistricts', 'Buscar bairros')}
                />
              </FormField>
            </>
          ) : null}

          <FormField label={t('logistics.deliveryMethods.ruleFields.valueStart', 'Valor inicial')}>
            <InputWithAffix prefix="R$" value={draft.valor_de} onChange={(event) => setDraft((current) => ({ ...current, valor_de: applyStringMask(event.target.value, 'currency') }))} />
          </FormField>
          <FormField label={t('logistics.deliveryMethods.ruleFields.valueEnd', 'Valor final')}>
            <InputWithAffix prefix="R$" value={draft.valor_ate} onChange={(event) => setDraft((current) => ({ ...current, valor_ate: applyStringMask(event.target.value, 'currency') }))} />
          </FormField>
          <FormField label={t('logistics.deliveryMethods.ruleFields.weightStart', 'Peso inicial')}>
            <InputWithAffix suffix="kg" value={draft.peso_de} onChange={(event) => setDraft((current) => ({ ...current, peso_de: applyStringMask(event.target.value, 'decimal') }))} />
          </FormField>
          <FormField label={t('logistics.deliveryMethods.ruleFields.weightEnd', 'Peso final')}>
            <InputWithAffix suffix="kg" value={draft.peso_ate} onChange={(event) => setDraft((current) => ({ ...current, peso_ate: applyStringMask(event.target.value, 'decimal') }))} />
          </FormField>
          <FormField label={t('logistics.deliveryMethods.ruleFields.maxWeight', 'Peso máximo')}>
            <InputWithAffix suffix="kg" value={draft.peso_maximo} onChange={(event) => setDraft((current) => ({ ...current, peso_maximo: applyStringMask(event.target.value, 'decimal') }))} />
          </FormField>
          <FormField label={t('logistics.deliveryMethods.ruleFields.maxItems', 'Máximo de itens')} helperText={t('logistics.deliveryMethods.help.maxItems', 'Quantidade de unidades.')}>
            <input value={draft.maximo_itens} onChange={(event) => setDraft((current) => ({ ...current, maximo_itens: normalizeIntegerInput(event.target.value) }))} className={inputClasses()} />
          </FormField>
          <FormField label={t('logistics.deliveryMethods.ruleFields.maxProducts', 'Máximo de produtos')} helperText={t('logistics.deliveryMethods.help.maxProducts', 'Quantidade de produtos distintos.')}>
            <input value={draft.maximo_produtos} onChange={(event) => setDraft((current) => ({ ...current, maximo_produtos: normalizeIntegerInput(event.target.value) }))} className={inputClasses()} />
          </FormField>
          <FormField label={t('logistics.deliveryMethods.ruleFields.cubicStart', 'Cubagem inicial')} helperText={t('logistics.deliveryMethods.help.cubicRule', 'Multiplicação das faces do produto: altura x largura x comprimento.')}>
            <InputWithAffix suffix="cm³" value={draft.dimensao_de} onChange={(event) => setDraft((current) => ({ ...current, dimensao_de: normalizeIntegerInput(event.target.value) }))} />
          </FormField>
          <FormField label={t('logistics.deliveryMethods.ruleFields.cubicEnd', 'Cubagem final')} helperText={t('logistics.deliveryMethods.help.cubicRule', 'Multiplicação das faces do produto: altura x largura x comprimento.')}>
            <InputWithAffix suffix="cm³" value={draft.dimensao_ate} onChange={(event) => setDraft((current) => ({ ...current, dimensao_ate: normalizeIntegerInput(event.target.value) }))} />
          </FormField>
          <FormField label={t('logistics.deliveryMethods.ruleFields.maxDimension', 'Dimensão máxima')} helperText={t('logistics.deliveryMethods.help.maxDimension', 'Comprimento da maior face do produto.')}>
            <InputWithAffix suffix="cm" value={draft.dimensao_maxima} onChange={(event) => setDraft((current) => ({ ...current, dimensao_maxima: normalizeIntegerInput(event.target.value) }))} />
          </FormField>
          <FormField label={t('logistics.deliveryMethods.ruleFields.maxPerimeter', 'Perímetro máximo')} helperText={t('logistics.deliveryMethods.help.maxPerimeter', 'Soma das faces do produto: altura + largura + comprimento.')}>
            <InputWithAffix suffix="cm" value={draft.perimetro_maximo} onChange={(event) => setDraft((current) => ({ ...current, perimetro_maximo: normalizeIntegerInput(event.target.value) }))} />
          </FormField>
          <FormField label={t('logistics.deliveryMethods.ruleFields.leadTime', 'Prazo')}>
            <InputWithAffix suffix={t('logistics.deliveryMethods.scheduling.daysSuffix', 'dias')} value={draft.prazo} onChange={(event) => setDraft((current) => ({ ...current, prazo: normalizeIntegerInput(event.target.value, 3) }))} />
          </FormField>
          <FormField label={t('logistics.deliveryMethods.ruleFields.freightValue', 'Valor do frete')}>
            <InputWithAffix prefix="R$" value={draft.valor} onChange={(event) => setDraft((current) => ({ ...current, valor: applyStringMask(event.target.value, 'currency') }))} />
          </FormField>
          <FormField label={t('logistics.deliveryMethods.ruleFields.additionalValue', 'Valor adicional')}>
            <InputWithAffix prefix="R$" value={draft.valor_adicional} onChange={(event) => setDraft((current) => ({ ...current, valor_adicional: applyStringMask(event.target.value, 'currency') }))} />
          </FormField>
          <FormField label={t('logistics.deliveryMethods.ruleFields.adValorem', 'AD valorem')}>
            <InputWithAffix suffix="%" value={draft.ad_valorem} onChange={(event) => setDraft((current) => ({ ...current, ad_valorem: applyStringMask(event.target.value, 'currency') }))} />
          </FormField>
          <FormField label={t('logistics.deliveryMethods.ruleFields.kgAdditional', 'KG adicional')}>
            <InputWithAffix prefix="R$" value={draft.kg_adicional} onChange={(event) => setDraft((current) => ({ ...current, kg_adicional: applyStringMask(event.target.value, 'currency') }))} />
          </FormField>
        </div>
      </CrudModal>

      <ConfirmDialog
        open={confirmOpen}
        title={t('logistics.deliveryMethods.messages.deleteRulesTitle', 'Excluir regras')}
        description={t('logistics.deliveryMethods.messages.deleteRulesDescription', 'As regras selecionadas serão removidas.')}
        confirmLabel={t('common.delete', 'Excluir')}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </>
  )
}
