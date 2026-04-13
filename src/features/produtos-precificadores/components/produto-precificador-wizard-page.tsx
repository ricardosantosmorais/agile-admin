'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronRight, LoaderCircle, Plus, Save, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { AsyncState } from '@/src/components/ui/async-state'
import { InputWithAffix } from '@/src/components/ui/input-with-affix'
import { LookupSelect } from '@/src/components/ui/lookup-select'
import { PageHeader } from '@/src/components/ui/page-header'
import { PageToast } from '@/src/components/ui/page-toast'
import { SectionCard } from '@/src/components/ui/section-card'
import { StepIndicator } from '@/src/components/ui/step-indicator'
import { ToggleCard } from '@/src/components/ui/toggle-card'
import { useFooterActionsVisibility } from '@/src/hooks/use-footer-actions-visibility'
import { useI18n } from '@/src/i18n/use-i18n'
import { formatInputDateTimeForDisplay } from '@/src/lib/date-time-input'
import { formatLocalizedCurrency, formatLocalizedPercent } from '@/src/lib/formatters'
import { currencyMask, decimalMask } from '@/src/lib/input-masks'
import { parseInteger, parseLocalizedNumber } from '@/src/lib/value-parsers'
import {
  buildWizardPayload,
  flattenWizardDraft,
  produtoPrecificadorDefaultDraft,
} from '@/src/features/produtos-precificadores/services/produtos-precificadores-mappers'
import {
  getAudienceMeta,
  getProductMeta,
  PRODUTO_PRECIFICADOR_AUDIENCE_TYPES,
  PRODUTO_PRECIFICADOR_ORIGIN_OPTIONS,
  PRODUTO_PRECIFICADOR_PRODUCT_TYPES,
  PRODUTO_PRECIFICADOR_PROFILE_OPTIONS,
  PRODUTO_PRECIFICADOR_TYPE_OPTIONS,
} from '@/src/features/produtos-precificadores/services/produtos-precificadores-meta'
import { produtosPrecificadoresClient } from '@/src/features/produtos-precificadores/services/produtos-precificadores-client'
import type {
  ProdutoPrecificadorApiRow,
  ProdutoPrecificadorAudienceCriterion,
  ProdutoPrecificadorAudienceType,
  ProdutoPrecificadorConditionsDraft,
  ProdutoPrecificadorCriterionOption,
  ProdutoPrecificadorDefinitionDraft,
  ProdutoPrecificadorProductCriterion,
  ProdutoPrecificadorProductType,
  ProdutoPrecificadorWizardDraft,
} from '@/src/features/produtos-precificadores/services/produtos-precificadores-types'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'

type StepId = 'audience' | 'products' | 'rule' | 'conditions' | 'review'

const AUDIENCE_ROW_FIELDS: Partial<Record<ProdutoPrecificadorAudienceType, keyof ProdutoPrecificadorApiRow>> = {
  canal_distribuicao_cliente: 'id_canal_distribuicao_cliente',
  cliente: 'id_cliente',
  contribuinte: 'contribuinte',
  filial: 'id_filial',
  fonte_st: 'fonte_st',
  grupo: 'id_grupo',
  praca: 'id_praca',
  rede: 'id_rede',
  segmento: 'id_segmento',
  supervisor: 'id_supervisor',
  tabela_preco: 'id_tabela_preco',
  tipo_cliente: 'tipo_cliente',
  uf: 'uf',
  vendedor: 'id_vendedor',
}

const PRODUCT_ROW_FIELDS: Partial<Record<ProdutoPrecificadorProductType, keyof ProdutoPrecificadorApiRow>> = {
  canal_distribuicao_produto: 'id_canal_distribuicao_produto',
  colecao: 'id_colecao',
  departamento: 'id_departamento',
  fornecedor: 'id_fornecedor',
  marca: 'id_marca',
  produto: 'id_produto',
  produto_pai: 'id_produto_pai',
  promocao_precificador: 'id_promocao',
}

type CriterionEditorItem<TType extends string> = {
  id: string
  type: TType
  values: ProdutoPrecificadorCriterionOption[]
  packaging?: ProdutoPrecificadorCriterionOption | null
}

type CriterionEditorProps<TType extends string> = {
  title: string
  description: string
  criterionLabel: string
  items: CriterionEditorItem<TType>[]
  typeOptions: Array<{ value: TType; label: string }>
  onAdd: () => void
  onRemove: (id: string) => void
  onTypeChange: (id: string, type: TType) => void
  onValuesChange: (id: string, values: ProdutoPrecificadorCriterionOption[]) => void
  loadDynamicOptions: (type: TType, query: string, page: number, perPage: number) => Promise<ProdutoPrecificadorCriterionOption[]>
  packagingForProduct?: (id: string, value: ProdutoPrecificadorCriterionOption | null) => void
  loadPackagingOptions?: (productId: string) => Promise<ProdutoPrecificadorCriterionOption[]>
  showValidation?: boolean
}

const STEP_IDS: StepId[] = ['audience', 'products', 'rule', 'conditions', 'review']
const textClasses = 'text-[color:var(--app-text)]'
const mutedTextClasses = 'text-[color:var(--app-muted)]'
const secondaryButtonClasses = 'app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold'
const secondaryButtonLargeClasses = 'app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold'
const primaryButtonLargeClasses = 'app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold disabled:opacity-70'
const dangerButtonClasses = 'app-button-danger inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold'
const paneClasses = 'app-pane-muted rounded-[1rem] px-4 py-4'
const dashedPaneClasses = 'app-pane-muted flex min-h-14 items-center rounded-[1rem] border-dashed px-4 py-3 text-sm text-[color:var(--app-muted)]'
const labelClasses = 'text-sm font-semibold text-[color:var(--app-text)]'
const headingClasses = 'font-semibold text-[color:var(--app-text)]'
const summaryTextClasses = 'text-sm text-[color:var(--app-muted)]'
const summaryStrongClasses = 'font-semibold text-[color:var(--app-text)]'
const errorTextClasses = 'text-[color:#be123c] dark:text-[#f9a8b4]'

function createAudienceCriterion(index: number): ProdutoPrecificadorAudienceCriterion {
  return { id: `aud-${Date.now()}-${index}`, type: 'todos', values: [] }
}

function createProductCriterion(index: number): ProdutoPrecificadorProductCriterion {
  return { id: `prd-${Date.now()}-${index}`, type: 'todos', values: [], packaging: null }
}

function createDefinition(index: number): ProdutoPrecificadorDefinitionDraft {
  return {
    id: `def-${Date.now()}-${index}`,
    ultimo_preco: false,
    preco: '',
    desconto: '',
    acrescimo: '',
    pedido_minimo: '',
    pedido_maximo: '',
    itens_pedido_de: '',
    itens_pedido_ate: '',
  }
}

function getDefinitionMode(type: string) {
  if (type === 'fixo') return 'fixed'
  if (type === 'valor') return 'absolute'
  return 'percent'
}

function criterionDisplayLabel(item: CriterionEditorItem<string>) {
  if (item.type === 'todos') return 'Todos'
  if (!item.values.length) return '-'
  return item.values.map((entry) => entry.label).join(', ')
}

function countCriterionSelections(items: CriterionEditorItem<string>[]) {
  return items.reduce((total, item) => total + (item.type === 'todos' ? 1 : item.values.length), 0)
}

function RequiredLabel({ label }: { label: string }) {
  return (
    <span>
      {label}
      <span className={`ml-1 ${errorTextClasses}`}>*</span>
    </span>
  )
}

function renderInputClass(invalid = false) {
  return [
    'app-control w-full rounded-[1rem] px-3.5 py-3 text-sm text-[color:var(--app-text)]',
    invalid ? 'border-rose-300 ring-2 ring-rose-100 dark:border-rose-400/55 dark:ring-rose-500/20' : '',
  ].join(' ')
}

function renderLookupTriggerClass(invalid = false) {
  return [
    'rounded-[1rem]',
    invalid ? 'border border-rose-300 ring-2 ring-rose-100 dark:border-rose-400/55 dark:ring-rose-500/20' : '',
  ].join(' ')
}

function formatDefinitionValue(value: string, mode: 'currency' | 'percent') {
  if (!value) {
    return '-'
  }

  return mode === 'percent'
    ? formatLocalizedPercent(value)
    : formatLocalizedCurrency(value)
}

function formatDefinitionValueFromRow(value: unknown, mode: 'currency' | 'percent') {
  if (value == null || value === '') {
    return '-'
  }

  return mode === 'percent'
    ? formatLocalizedPercent(value)
    : formatLocalizedCurrency(value)
}

function matchesDefinition(row: ProdutoPrecificadorApiRow, definition: ProdutoPrecificadorDefinitionDraft) {
  return (
    Boolean(row.ultimo_preco) === definition.ultimo_preco
    && (parseLocalizedNumber(row.preco) ?? 0) === (parseLocalizedNumber(definition.preco) ?? 0)
    && (parseLocalizedNumber(row.desconto) ?? 0) === (parseLocalizedNumber(definition.desconto) ?? 0)
    && (parseLocalizedNumber(row.acrescimo) ?? 0) === (parseLocalizedNumber(definition.acrescimo) ?? 0)
    && (parseLocalizedNumber(row.pedido_minimo) ?? 0) === (parseLocalizedNumber(definition.pedido_minimo) ?? 0)
    && (parseLocalizedNumber(row.pedido_maximo) ?? 0) === (parseLocalizedNumber(definition.pedido_maximo) ?? 0)
    && (parseInteger(row.itens_pedido_de) ?? null) === (parseInteger(definition.itens_pedido_de) ?? null)
    && (parseInteger(row.itens_pedido_ate) ?? null) === (parseInteger(definition.itens_pedido_ate) ?? null)
  )
}

function CriterionEditor<TType extends string>({
  title,
  description,
  criterionLabel,
  items,
  typeOptions,
  onAdd,
  onRemove,
  onTypeChange,
  onValuesChange,
  loadDynamicOptions,
  packagingForProduct,
  loadPackagingOptions,
  showValidation = false,
}: CriterionEditorProps<TType>) {
  const { t } = useI18n()
  const [candidateById, setCandidateById] = useState<Record<string, ProdutoPrecificadorCriterionOption | null>>({})
  const [packagingOptionsById, setPackagingOptionsById] = useState<Record<string, ProdutoPrecificadorCriterionOption[]>>({})

  useEffect(() => {
    let alive = true

    async function bootstrapPackaging() {
      if (!loadPackagingOptions) return

      for (const item of items) {
        if (!('packaging' in item) || item.type !== ('produto' as TType) || item.values.length !== 1) continue

        const productId = item.values[0]?.id
        if (!productId || packagingOptionsById[item.id]) continue

        const options = await loadPackagingOptions(productId)
        if (alive) {
          setPackagingOptionsById((current) => ({ ...current, [item.id]: options }))
        }
      }
    }

    void bootstrapPackaging()
    return () => {
      alive = false
    }
  }, [items, loadPackagingOptions, packagingOptionsById])

  return (
    <SectionCard>
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className={`text-lg ${headingClasses}`}>{title}</h2>
            <p className={`mt-1 text-sm ${mutedTextClasses}`}>{description}</p>
          </div>
          <button
            type="button"
            onClick={onAdd}
            className={secondaryButtonClasses}
          >
            <Plus className="h-4 w-4" />
            {t('common.add', 'Adicionar')}
          </button>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => {
            const meta = 'packaging' in item
              ? getProductMeta(item.type as ProdutoPrecificadorProductType)
              : getAudienceMeta(item.type as ProdutoPrecificadorAudienceType)
            const hasDynamicLookup = Boolean('resource' in meta && meta.resource)
            const staticOptions = 'staticOptions' in meta ? meta.staticOptions : undefined
            const canUsePackaging = packagingForProduct && item.type === ('produto' as TType) && item.values.length === 1
            const packagingOptions = packagingOptionsById[item.id] ?? []
            const selectionError = showValidation && item.type !== ('todos' as TType) && item.values.length === 0

            return (
              <div
                key={item.id}
                className={['app-pane-muted rounded-[1.25rem] p-4', selectionError ? 'border-rose-300 dark:border-rose-400/55' : ''].join(' ')}
              >
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div className={labelClasses}>
                    {criterionLabel} {index + 1}
                  </div>
                  {items.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => onRemove(item.id)}
                      className={dangerButtonClasses}
                    >
                      <Trash2 className="h-4 w-4" />
                      {t('common.remove', 'Remover')}
                    </button>
                  ) : null}
                </div>

                <div className="grid items-start gap-x-4 gap-y-2 xl:grid-cols-[340px_minmax(0,1fr)]">
                  <div className="grid content-start gap-2 self-start">
                    <label className={`flex min-h-5 items-end ${labelClasses}`}>Tipo do critério</label>
                    <div className="min-h-14">
                      <select
                        value={item.type}
                        onChange={(event) => onTypeChange(item.id, event.target.value as TType)}
                        className={renderInputClass(false)}
                      >
                        {typeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid content-start gap-2 self-start">
                    <label
                      className={[
                        'flex min-h-5 items-end text-sm font-semibold',
                        item.type === ('todos' as TType) ? 'invisible text-transparent' : textClasses,
                      ].join(' ')}
                    >
                      {meta.label}
                    </label>

                    {item.type !== ('todos' as TType) ? (
                      <>
                        <div className={['min-h-14', selectionError ? renderLookupTriggerClass(true) : ''].join(' ').trim()}>
                          {hasDynamicLookup ? (
                            <LookupSelect
                              label={meta.label}
                              value={candidateById[item.id] ?? null}
                              onChange={(value) => {
                                if (!value) return
                                if (!item.values.some((selected) => selected.id === value.id)) {
                                  onValuesChange(item.id, [...item.values, value])
                                }
                                setCandidateById((current) => ({ ...current, [item.id]: null }))
                              }}
                              loadOptions={(query, page, perPage) => loadDynamicOptions(item.type, query, page, perPage)}
                            />
                          ) : (
                            <select
                              value={candidateById[item.id]?.id ?? ''}
                              onChange={(event) => {
                                const option = staticOptions?.find((entry) => entry.id === event.target.value) ?? null
                                if (option && !item.values.some((selected) => selected.id === option.id)) {
                                  onValuesChange(item.id, [...item.values, option])
                                }
                                setCandidateById((current) => ({ ...current, [item.id]: null }))
                              }}
                              className={renderInputClass(selectionError)}
                            >
                              <option value="">Selecione</option>
                              {staticOptions?.map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        {canUsePackaging && packagingOptions.length > 0 ? (
                          <div className="space-y-2">
                            <label className={labelClasses}>Embalagem</label>
                            <select
                              value={item.packaging?.id ?? ''}
                              onChange={(event) => {
                                const next = packagingOptions.find((option) => option.id === event.target.value) ?? null
                                packagingForProduct(item.id, next)
                              }}
                              className={renderInputClass(false)}
                            >
                              <option value="">Todas as embalagens</option>
                              {packagingOptions.map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : null}

                        {selectionError ? (
                          <p className={`text-xs ${errorTextClasses}`}>Selecione ao menos uma opção neste critério.</p>
                        ) : null}
                      </>
                    ) : (
                      <div className={dashedPaneClasses}>
                        Este bloco aplica a todos. Nenhuma seleção adicional é necessária.
                      </div>
                    )}

                    {item.values.length ? (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {item.values.map((value) => (
                          <span
                            key={value.id}
                            className="app-button-secondary inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium"
                          >
                            {value.label}
                            <button
                              type="button"
                              onClick={() => onValuesChange(item.id, item.values.filter((selected) => selected.id !== value.id))}
                              className="text-[color:var(--app-muted)] transition hover:text-[color:var(--app-text)]"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </SectionCard>
  )
}

function InfoCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={paneClasses}>
      <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${mutedTextClasses}`}>{label}</p>
      <p className={`mt-2 text-3xl font-semibold tracking-tight ${textClasses}`}>{value}</p>
    </div>
  )
}

export function ProdutoPrecificadorWizardPage({ id }: { id?: string }) {
  const router = useRouter()
  const { t } = useI18n()
  const access = useFeatureAccess('produtosPrecificadores')
  const [draft, setDraft] = useState<ProdutoPrecificadorWizardDraft>(produtoPrecificadorDefaultDraft)
  const [originalRows, setOriginalRows] = useState<ProdutoPrecificadorApiRow[]>([])
  const [activeStep, setActiveStep] = useState<StepId>('audience')
  const [isLoading, setIsLoading] = useState(Boolean(id))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [feedback, setFeedback] = useState('')
  const [validatedStep, setValidatedStep] = useState<StepId | null>(null)
  const { footerRef, isFooterVisible } = useFooterActionsVisibility<HTMLDivElement>()

  useEffect(() => {
    let alive = true

    async function bootstrap(recordId: string) {
      setIsLoading(true)
      setError(undefined)
      try {
        const payload = await produtosPrecificadoresClient.getWizard(recordId)
        if (!alive) return
        setDraft(payload.draft)
        setOriginalRows(payload.originalRows)
      } catch (loadError) {
        if (!alive) return
        setError(loadError instanceof Error ? loadError.message : t('simpleCrud.loadError', 'Não foi possível carregar o registro.'))
      } finally {
        if (alive) {
          setIsLoading(false)
        }
      }
    }

    if (id) {
      void bootstrap(id)
    }

    return () => {
      alive = false
    }
  }, [id, t])

  const steps = useMemo(
    () => ([
      { id: 'audience', label: t('priceStock.productPricers.steps.audience', 'Público alvo') },
      { id: 'products', label: t('priceStock.productPricers.steps.products', 'Seleção de produtos') },
      { id: 'rule', label: t('priceStock.productPricers.steps.rule', 'Definição da regra') },
      { id: 'conditions', label: t('priceStock.productPricers.steps.conditions', 'Condições e validade') },
      { id: 'review', label: t('priceStock.productPricers.steps.review', 'Resumo') },
    ]),
    [t],
  )

  const currentStepIndex = STEP_IDS.indexOf(activeStep)
  const flatRowsPreview = useMemo(() => flattenWizardDraft(draft), [draft])
  const definitionMode = getDefinitionMode(draft.general.tipo)
  const showRuleValidation = validatedStep === 'rule'
  const showAudienceValidation = validatedStep === 'audience'
  const showProductValidation = validatedStep === 'products'
  const audienceSelectionCount = countCriterionSelections(draft.audiences)
  const productSelectionCount = countCriterionSelections(draft.products)

  const ruleErrors = {
    nome: showRuleValidation && !draft.general.nome.trim(),
    tipo: showRuleValidation && !draft.general.tipo.trim(),
    origem: showRuleValidation && !draft.general.origem.trim(),
    perfil: showRuleValidation && !draft.general.perfil.trim(),
  }

  function patchGeneral<K extends keyof ProdutoPrecificadorWizardDraft['general']>(
    key: K,
    value: ProdutoPrecificadorWizardDraft['general'][K],
  ) {
    setDraft((current) => ({ ...current, general: { ...current.general, [key]: value } }))
  }

  function patchConditions<K extends keyof ProdutoPrecificadorConditionsDraft>(
    key: K,
    value: ProdutoPrecificadorConditionsDraft[K],
  ) {
    setDraft((current) => ({ ...current, conditions: { ...current.conditions, [key]: value } }))
  }

  function patchDefinition(definitionId: string, patch: Partial<ProdutoPrecificadorDefinitionDraft>) {
    setDraft((current) => ({
      ...current,
      definitions: current.definitions.map((item) => (item.id === definitionId ? { ...item, ...patch } : item)),
    }))
  }

  async function loadAudienceOptions(
    type: ProdutoPrecificadorAudienceType,
    query: string,
    page: number,
    perPage: number,
  ) {
    const meta = getAudienceMeta(type)
    if (!('resource' in meta) || !meta.resource) return []
    return produtosPrecificadoresClient.loadLookupOptions(meta.resource, query, page, perPage)
  }

  async function loadProductOptions(
    type: ProdutoPrecificadorProductType,
    query: string,
    page: number,
    perPage: number,
  ) {
    const meta = getProductMeta(type)
    if (!('resource' in meta) || !meta.resource) return []
    return produtosPrecificadoresClient.loadLookupOptions(meta.resource, query, page, perPage)
  }

  function validateStep(step: StepId) {
    if (step === 'audience') {
      return draft.audiences.every((item) => item.type === 'todos' || item.values.length > 0)
    }

    if (step === 'products') {
      return draft.products.every((item) => item.type === 'todos' || item.values.length > 0)
    }

    if (step === 'rule') {
      return Boolean(
        draft.general.nome.trim()
          && draft.general.tipo.trim()
          && draft.general.origem.trim()
          && draft.general.perfil.trim()
          && draft.definitions.length > 0,
      )
    }

    if (step === 'conditions') {
      if (draft.conditions.data_inicio && draft.conditions.data_fim) {
        const start = new Date(draft.conditions.data_inicio)
        const end = new Date(draft.conditions.data_fim)
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
          return true
        }
        return start.getTime() <= end.getTime()
      }

      return true
    }

    return flatRowsPreview.length > 0
  }

  function goNext() {
    if (!validateStep(activeStep)) {
      setValidatedStep(activeStep)
      setFeedback(t('priceStock.productPricers.feedback.completeStep', 'Preencha os campos obrigatórios antes de avançar.'))
      return
    }

    setValidatedStep(null)
    setFeedback('')
    const nextIndex = currentStepIndex + 1
    if (nextIndex < STEP_IDS.length) {
      setActiveStep(STEP_IDS[nextIndex])
    }
  }

  function goPrev() {
    const previousIndex = currentStepIndex - 1
    if (previousIndex >= 0) {
      setActiveStep(STEP_IDS[previousIndex])
    }
  }

  function handleStepClick(stepId: string) {
    const targetIndex = STEP_IDS.indexOf(stepId as StepId)
    if (targetIndex === -1 || targetIndex === currentStepIndex) {
      return
    }

    if (targetIndex < currentStepIndex) {
      setValidatedStep(null)
      setFeedback('')
      setActiveStep(stepId as StepId)
      return
    }

    if (!validateStep(activeStep)) {
      setValidatedStep(activeStep)
      setFeedback(t('priceStock.productPricers.feedback.completeStep', 'Preencha os campos obrigatórios antes de avançar.'))
      return
    }

    setValidatedStep(null)
    setFeedback('')
    setActiveStep(stepId as StepId)
  }

  async function handleSave() {
    if (!validateStep('review')) {
      setFeedback(t('priceStock.productPricers.feedback.invalidDraft', 'Não foi possível gerar combinações válidas para salvar.'))
      return
    }

    setIsSaving(true)
    setFeedback('')

    try {
      const payload = buildWizardPayload(draft, originalRows, id)
      const result = await produtosPrecificadoresClient.saveWizard(payload)
      if (result.id || id) {
        router.push('/produtos-x-precificadores')
        return
      }
    } catch (saveError) {
      setFeedback(saveError instanceof Error ? saveError.message : t('simpleCrud.saveError', 'Não foi possível salvar o registro.'))
    } finally {
      setIsSaving(false)
    }
  }

  const audienceSummary = draft.audiences.map((item, index) => ({
    label: `Destinatário ${index + 1}`,
    type: getAudienceMeta(item.type).label,
    values: criterionDisplayLabel(item),
  }))

  const productSummary = draft.products.map((item, index) => ({
    label: `Produto alvo ${index + 1}`,
    type: getProductMeta(item.type).label,
    values: criterionDisplayLabel(item),
    packaging: item.packaging?.label || '',
  }))
  const generalToggleSummary = [
    ['Promoção', draft.general.promocao],
    ['Aplicação automática', draft.general.aplica_automatico],
    ['Ativo', draft.general.ativo],
    ['Modifica', draft.general.modifica],
    ['Fator', draft.general.fator],
    ['Aplica promoção', draft.general.aplica_promocao],
    ['Aplica orçamento', draft.general.aplica_orcamento],
    ['App', draft.general.app],
    ['Prioridade', draft.general.prioridade],
    ['Promoção e-commerce', draft.general.promocao_ecommerce],
    ['Conta corrente', draft.general.conta_corrente],
    ['Credita desconto', draft.general.credita_desconto],
    ['Preço base', draft.general.preco_base],
    ['ST', draft.general.st],
  ] as const
  const previewRows = useMemo(() => {
    return flatRowsPreview.slice(0, 12).map((row, index) => {
      const audienceMatch = draft.audiences.find((item) => {
        if (item.type === 'todos') return true
        const field = AUDIENCE_ROW_FIELDS[item.type]
        if (!field) return false
        const rowValue = String(row[field] ?? '').trim()
        return item.values.some((value) => value.id === rowValue)
      })

      const productMatch = draft.products.find((item) => {
        if (item.type === 'todos') return true
        const field = PRODUCT_ROW_FIELDS[item.type]
        if (!field) return false
        const rowValue = String(row[field] ?? '').trim()
        return item.values.some((value) => value.id === rowValue)
      })

      const definitionIndex = draft.definitions.findIndex((item) => matchesDefinition(row, item))
      const audienceValue = audienceMatch?.type === 'todos'
        ? 'Todos'
        : audienceMatch?.values.find((value) => {
            const field = audienceMatch ? AUDIENCE_ROW_FIELDS[audienceMatch.type] : undefined
            return field ? value.id === String(row[field] ?? '').trim() : false
          })?.label || '-'
      const productValue = productMatch?.type === 'todos'
        ? 'Todos'
        : productMatch?.values.find((value) => {
            const field = productMatch ? PRODUCT_ROW_FIELDS[productMatch.type] : undefined
            return field ? value.id === String(row[field] ?? '').trim() : false
          })?.label || '-'

      return {
        key: `${String(row.nome || '-')}-${index}`,
        audience: audienceMatch
          ? `${getAudienceMeta(audienceMatch.type).label}: ${audienceValue}`
          : 'Todos',
        product: productMatch
          ? `${getProductMeta(productMatch.type).label}: ${productValue}`
          : 'Todos',
        definition: `Definição ${definitionIndex >= 0 ? definitionIndex + 1 : ((index % draft.definitions.length) + 1)}`,
        price: formatDefinitionValueFromRow(row.preco, 'currency'),
        discount: formatDefinitionValueFromRow(row.desconto, definitionMode === 'percent' ? 'percent' : 'currency'),
      }
    })
  }, [definitionMode, draft.audiences, draft.definitions, draft.products, flatRowsPreview])

  const breadcrumbs = [
    { label: t('routes.dashboard', 'Início'), href: '/dashboard' },
    { label: t('routes.precosEstoques', 'Preços e Estoques') },
    { label: t('routes.produtosPrecificadores', 'Produtos x Precificadores'), href: '/produtos-x-precificadores' },
    ...(id ? [{ label: `ID #${id}` }] : []),
    { label: t('priceStock.productPricers.actions.creationAssistant', 'Assistente de criação') },
  ]

  const pageTitle = id
    ? t('priceStock.productPricers.formTitleEdit', 'Editar precificador')
    : t('priceStock.productPricers.formTitleCreate', 'Novo precificador')

  if (!access.canCreate && !access.canEdit && !access.canView) {
    return <AccessDeniedState title={t('routes.produtosPrecificadores', 'Produtos x Precificadores')} backHref="/dashboard" />
  }

  const canSave = id ? access.canEdit : access.canCreate

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/produtos-x-precificadores"
              className={secondaryButtonLargeClasses}
            >
              <ArrowLeft className="h-4 w-4" />
              {t('common.back', 'Voltar')}
            </Link>
            {activeStep === 'review' && !isFooterVisible && canSave ? (
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving}
                className={primaryButtonLargeClasses}
              >
                {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t('common.save', 'Salvar')}
              </button>
            ) : null}
          </div>
        }
      />

      <PageToast
        message={feedback || null}
        tone={feedback.toLowerCase().includes('sucesso') ? 'success' : 'error'}
        onClose={() => setFeedback('')}
      />

      <AsyncState isLoading={isLoading} error={error}>
        <SectionCard>
          <div className="space-y-5">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${mutedTextClasses}`}>
                {t('priceStock.productPricers.actions.creationAssistant', 'Assistente de criação')}
              </p>
              <h1 className={`mt-2 text-3xl font-semibold tracking-tight ${textClasses}`}>{pageTitle}</h1>
              <p className={`mt-2 max-w-3xl text-sm ${mutedTextClasses}`}>
                Configure público, produtos, regra e condições em etapas sequenciais antes de salvar o lote.
              </p>
            </div>

            <StepIndicator items={steps} activeStep={activeStep} onStepClick={handleStepClick} />
          </div>
        </SectionCard>

        {activeStep === 'audience' ? (
          <CriterionEditor
            title={t('priceStock.productPricers.steps.audience', 'Público alvo')}
            description={t('priceStock.productPricers.help.audience', 'Defina para quem a regra vai valer. Misture critérios quando necessário e mantenha cada bloco coeso.')}
            criterionLabel="Critério"
            items={draft.audiences}
            typeOptions={PRODUTO_PRECIFICADOR_AUDIENCE_TYPES.map((item) => ({ value: item.value, label: item.label }))}
            onAdd={() => setDraft((current) => ({ ...current, audiences: [...current.audiences, createAudienceCriterion(current.audiences.length + 1)] }))}
            onRemove={(criterionId) => setDraft((current) => ({ ...current, audiences: current.audiences.filter((item) => item.id !== criterionId) }))}
            onTypeChange={(criterionId, type) => setDraft((current) => ({
              ...current,
              audiences: current.audiences.map((item) => item.id === criterionId ? { ...item, type, values: [] } : item),
            }))}
            onValuesChange={(criterionId, values) => setDraft((current) => ({
              ...current,
              audiences: current.audiences.map((item) => item.id === criterionId ? { ...item, values } : item),
            }))}
            loadDynamicOptions={loadAudienceOptions}
            showValidation={showAudienceValidation}
          />
        ) : null}

        {activeStep === 'products' ? (
          <CriterionEditor
            title={t('priceStock.productPricers.steps.products', 'Seleção de produtos')}
            description={t('priceStock.productPricers.help.products', 'Selecione os produtos ou agrupadores impactados. Para produto individual, você pode refinar por embalagem quando houver opções disponíveis.')}
            criterionLabel="Critério"
            items={draft.products}
            typeOptions={PRODUTO_PRECIFICADOR_PRODUCT_TYPES.map((item) => ({ value: item.value, label: item.label }))}
            onAdd={() => setDraft((current) => ({ ...current, products: [...current.products, createProductCriterion(current.products.length + 1)] }))}
            onRemove={(criterionId) => setDraft((current) => ({ ...current, products: current.products.filter((item) => item.id !== criterionId) }))}
            onTypeChange={(criterionId, type) => setDraft((current) => ({
              ...current,
              products: current.products.map((item) => item.id === criterionId ? { ...item, type, values: [], packaging: null } : item),
            }))}
            onValuesChange={(criterionId, values) => setDraft((current) => ({
              ...current,
              products: current.products.map((item) => item.id === criterionId ? { ...item, values, packaging: values.length === 1 ? item.packaging : null } : item),
            }))}
            loadDynamicOptions={loadProductOptions}
            packagingForProduct={(criterionId, packaging) => setDraft((current) => ({
              ...current,
              products: current.products.map((item) => item.id === criterionId ? { ...item, packaging } : item),
            }))}
            loadPackagingOptions={(productId) => produtosPrecificadoresClient.loadPackagingOptions(productId)}
            showValidation={showProductValidation}
          />
        ) : null}

        {activeStep === 'rule' ? (
          <SectionCard title="Definição da regra" description="Preencha os campos obrigatórios e ajuste o modo de cálculo conforme o tipo selecionado.">
            <div className="space-y-6">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <ToggleCard label="Promoção" checked={draft.general.promocao} onChange={(value) => patchGeneral('promocao', value)} />
                <ToggleCard label="Aplicação automática" checked={draft.general.aplica_automatico} onChange={(value) => patchGeneral('aplica_automatico', value)} />
                <ToggleCard label="Ativo" checked={draft.general.ativo} onChange={(value) => patchGeneral('ativo', value)} />
                <ToggleCard label="Modifica" checked={draft.general.modifica} onChange={(value) => patchGeneral('modifica', value)} />
                <ToggleCard label="Fator" checked={draft.general.fator} onChange={(value) => patchGeneral('fator', value)} />
                <ToggleCard label="Aplica promoção" checked={draft.general.aplica_promocao} onChange={(value) => patchGeneral('aplica_promocao', value)} />
                <ToggleCard label="Aplica orçamento" checked={draft.general.aplica_orcamento} onChange={(value) => patchGeneral('aplica_orcamento', value)} />
                <ToggleCard label="App" checked={draft.general.app} onChange={(value) => patchGeneral('app', value)} />
                <ToggleCard label="Prioridade" checked={draft.general.prioridade} onChange={(value) => patchGeneral('prioridade', value)} />
                <ToggleCard label="Promoção e-commerce" checked={draft.general.promocao_ecommerce} onChange={(value) => patchGeneral('promocao_ecommerce', value)} />
                <ToggleCard label="Conta corrente" checked={draft.general.conta_corrente} onChange={(value) => patchGeneral('conta_corrente', value)} />
                <ToggleCard label="Credita desconto" checked={draft.general.credita_desconto} onChange={(value) => patchGeneral('credita_desconto', value)} />
                <ToggleCard label="Preço base" checked={draft.general.preco_base} onChange={(value) => patchGeneral('preco_base', value)} />
                <ToggleCard label="ST" checked={draft.general.st} onChange={(value) => patchGeneral('st', value)} />
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <label className={labelClasses}><RequiredLabel label="Nome" /></label>
                  <input value={draft.general.nome} onChange={(event) => patchGeneral('nome', event.target.value)} className={renderInputClass(ruleErrors.nome)} />
                  {ruleErrors.nome ? <p className={`text-xs ${errorTextClasses}`}>Preencha o nome da regra.</p> : null}
                </div>

                <div className="space-y-2">
                  <label className={labelClasses}>Código</label>
                  <input value={draft.general.codigo} onChange={(event) => patchGeneral('codigo', event.target.value)} className={renderInputClass(false)} />
                </div>

                <div className="space-y-2">
                  <label className={labelClasses}><RequiredLabel label="Tipo" /></label>
                  <select value={draft.general.tipo} onChange={(event) => patchGeneral('tipo', event.target.value)} className={renderInputClass(ruleErrors.tipo)}>
                    <option value="">Selecione</option>
                    {PRODUTO_PRECIFICADOR_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  {ruleErrors.tipo ? <p className={`text-xs ${errorTextClasses}`}>Selecione o tipo da regra.</p> : null}
                </div>

                <div className="space-y-2">
                  <label className={labelClasses}><RequiredLabel label="Origem" /></label>
                  <select value={draft.general.origem} onChange={(event) => patchGeneral('origem', event.target.value)} className={renderInputClass(ruleErrors.origem)}>
                    <option value="">Selecione</option>
                    {PRODUTO_PRECIFICADOR_ORIGIN_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  {ruleErrors.origem ? <p className={`text-xs ${errorTextClasses}`}>Selecione a origem da regra.</p> : null}
                </div>

                <div className="space-y-2">
                  <label className={labelClasses}><RequiredLabel label="Perfil" /></label>
                  <select value={draft.general.perfil} onChange={(event) => patchGeneral('perfil', event.target.value)} className={renderInputClass(ruleErrors.perfil)}>
                    <option value="">Selecione</option>
                    {PRODUTO_PRECIFICADOR_PROFILE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  {ruleErrors.perfil ? <p className={`text-xs ${errorTextClasses}`}>Selecione o perfil da regra.</p> : null}
                </div>

                <div className="space-y-2">
                  <label className={labelClasses}>Índice</label>
                  <input value={draft.general.indice} onChange={(event) => patchGeneral('indice', event.target.value.replace(/\D+/g, ''))} className={renderInputClass(false)} />
                </div>

                <div className="space-y-2">
                  <label className={labelClasses}>Posição</label>
                  <input value={draft.general.posicao} onChange={(event) => patchGeneral('posicao', event.target.value.replace(/\D+/g, ''))} className={renderInputClass(false)} />
                </div>
              </div>

              <div className="app-pane-muted rounded-[1.1rem] p-4">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className={labelClasses}>Definições de preço</h3>
                    <p className={`mt-1 text-sm ${mutedTextClasses}`}>O comportamento dos campos segue o tipo da regra, como no legado.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDraft((current) => ({
                      ...current,
                      definitions: [...current.definitions, createDefinition(current.definitions.length + 1)],
                    }))}
                    className={secondaryButtonClasses}
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar definição
                  </button>
                </div>

                <div className="space-y-4">
                  {draft.definitions.map((currentDefinition, definitionIndex) => (
                    <div key={currentDefinition.id} className="app-control-muted rounded-[1rem] p-4">
                      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h4 className={labelClasses}>Definição {definitionIndex + 1}</h4>
                          <p className={`mt-1 text-sm ${mutedTextClasses}`}>Cada definição adicional amplia o cruzamento final do lote.</p>
                        </div>
                        {draft.definitions.length > 1 && definitionIndex > 0 ? (
                          <button
                            type="button"
                            onClick={() => setDraft((current) => ({
                              ...current,
                              definitions: current.definitions.filter((item) => item.id !== currentDefinition.id),
                            }))}
                            className={dangerButtonClasses}
                          >
                            <Trash2 className="h-4 w-4" />
                            Remover
                          </button>
                        ) : null}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {definitionMode === 'fixed' ? (
                          <>
                            <ToggleCard label="Último preço" checked={currentDefinition.ultimo_preco} onChange={(value) => patchDefinition(currentDefinition.id, { ultimo_preco: value })} />
                            <div className="space-y-2 xl:col-span-3">
                              <label className={labelClasses}>Preço</label>
                              <InputWithAffix prefix="R$" value={currentDefinition.preco} onChange={(event) => patchDefinition(currentDefinition.id, { preco: currencyMask(event.target.value) })} />
                            </div>
                          </>
                        ) : null}

                        {definitionMode === 'absolute' ? (
                          <>
                            <div className="space-y-2">
                              <label className={labelClasses}>Desconto</label>
                              <InputWithAffix prefix="R$" value={currentDefinition.desconto} onChange={(event) => patchDefinition(currentDefinition.id, { desconto: currencyMask(event.target.value) })} />
                            </div>
                            <div className="space-y-2">
                              <label className={labelClasses}>Acréscimo</label>
                              <InputWithAffix prefix="R$" value={currentDefinition.acrescimo} onChange={(event) => patchDefinition(currentDefinition.id, { acrescimo: currencyMask(event.target.value) })} />
                            </div>
                          </>
                        ) : null}

                        {definitionMode === 'percent' ? (
                          <>
                            <div className="space-y-2">
                              <label className={labelClasses}>Desconto</label>
                              <InputWithAffix suffix="%" value={currentDefinition.desconto} onChange={(event) => patchDefinition(currentDefinition.id, { desconto: decimalMask(event.target.value) })} />
                            </div>
                            <div className="space-y-2">
                              <label className={labelClasses}>Acréscimo</label>
                              <InputWithAffix suffix="%" value={currentDefinition.acrescimo} onChange={(event) => patchDefinition(currentDefinition.id, { acrescimo: decimalMask(event.target.value) })} />
                            </div>
                          </>
                        ) : null}

                        <div className="space-y-2">
                          <label className={labelClasses}>Pedido mínimo</label>
                          <InputWithAffix prefix="R$" value={currentDefinition.pedido_minimo} onChange={(event) => patchDefinition(currentDefinition.id, { pedido_minimo: currencyMask(event.target.value) })} />
                        </div>
                        <div className="space-y-2">
                          <label className={labelClasses}>Pedido máximo</label>
                          <InputWithAffix prefix="R$" value={currentDefinition.pedido_maximo} onChange={(event) => patchDefinition(currentDefinition.id, { pedido_maximo: currencyMask(event.target.value) })} />
                        </div>
                        <div className="space-y-2">
                          <label className={labelClasses}>Itens por pedido de</label>
                          <input value={currentDefinition.itens_pedido_de} onChange={(event) => patchDefinition(currentDefinition.id, { itens_pedido_de: event.target.value.replace(/\D+/g, '') })} className={renderInputClass(false)} />
                        </div>
                        <div className="space-y-2">
                          <label className={labelClasses}>Itens por pedido até</label>
                          <input value={currentDefinition.itens_pedido_ate} onChange={(event) => patchDefinition(currentDefinition.id, { itens_pedido_ate: event.target.value.replace(/\D+/g, '') })} className={renderInputClass(false)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>
        ) : null}

        {activeStep === 'conditions' ? (
          <SectionCard title="Condições e validade" description="Defina vigência, forma de pagamento, condição de pagamento, forma de entrega e prazo médio quando aplicável.">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-2">
                <label className={labelClasses}>Data inicial</label>
                <input type="datetime-local" value={draft.conditions.data_inicio} onChange={(event) => patchConditions('data_inicio', event.target.value)} className={renderInputClass(false)} />
              </div>
              <div className="space-y-2">
                <label className={labelClasses}>Data final</label>
                <input type="datetime-local" value={draft.conditions.data_fim} onChange={(event) => patchConditions('data_fim', event.target.value)} className={renderInputClass(false)} />
              </div>
              <div className="space-y-2">
                <label className={labelClasses}>Prazo médio</label>
                <input value={draft.conditions.prazo_medio} onChange={(event) => patchConditions('prazo_medio', event.target.value.replace(/\D+/g, ''))} className={renderInputClass(false)} />
              </div>

              <div className="space-y-2">
                <label className={labelClasses}>Forma de pagamento</label>
                <LookupSelect
                  label="Forma de pagamento"
                  value={draft.conditions.forma_pagamento_lookup}
                  onChange={(value) => setDraft((current) => ({
                    ...current,
                    conditions: {
                      ...current.conditions,
                      forma_pagamento_lookup: value,
                      id_forma_pagamento: value?.id ?? '',
                    },
                  }))}
                  loadOptions={(query, page, perPage) => produtosPrecificadoresClient.loadLookupOptions('formas_pagamento', query, page, perPage)}
                />
              </div>

              <div className="space-y-2">
                <label className={labelClasses}>Condição de pagamento</label>
                <LookupSelect
                  label="Condição de pagamento"
                  value={draft.conditions.condicao_pagamento_lookup}
                  onChange={(value) => setDraft((current) => ({
                    ...current,
                    conditions: {
                      ...current.conditions,
                      condicao_pagamento_lookup: value,
                      id_condicao_pagamento: value?.id ?? '',
                    },
                  }))}
                  loadOptions={(query, page, perPage) => produtosPrecificadoresClient.loadLookupOptions('condicoes_pagamento', query, page, perPage)}
                />
              </div>

              <div className="space-y-2">
                <label className={labelClasses}>Forma de entrega</label>
                <input
                  value={draft.conditions.id_forma_entrega}
                  onChange={(event) => patchConditions('id_forma_entrega', event.target.value)}
                  className={renderInputClass(false)}
                  placeholder="Informe a forma de entrega"
                />
              </div>
            </div>
          </SectionCard>
        ) : null}

        {activeStep === 'review' ? (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_380px]">
            <SectionCard>
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <InfoCard label="Públicos" value={audienceSelectionCount} />
                  <InfoCard label="Produtos" value={productSelectionCount} />
                  <InfoCard label="Definições" value={draft.definitions.length} />
                  <InfoCard label="Combinações" value={flatRowsPreview.length} />
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className={`text-xl ${headingClasses}`}>Público alvo</h3>
                    <div className="mt-3 space-y-3">
                      {audienceSummary.map((item) => (
                        <div key={item.label} className={paneClasses}>
                          <p className={labelClasses}>{item.label}</p>
                          <p className={`mt-2 ${summaryTextClasses}`}>Tipo: <span className={summaryStrongClasses}>{item.type}</span></p>
                          <p className={`mt-1 ${summaryTextClasses}`}>Seleção: <span className={summaryStrongClasses}>{item.values}</span></p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className={`text-xl ${headingClasses}`}>Seleção de produtos</h3>
                    <div className="mt-3 space-y-3">
                      {productSummary.map((item) => (
                        <div key={item.label} className={paneClasses}>
                          <p className={labelClasses}>{item.label}</p>
                          <p className={`mt-2 ${summaryTextClasses}`}>Tipo: <span className={summaryStrongClasses}>{item.type}</span></p>
                          <p className={`mt-1 ${summaryTextClasses}`}>Seleção: <span className={summaryStrongClasses}>{item.values}</span></p>
                          {item.packaging ? <p className={`mt-1 ${summaryTextClasses}`}>Embalagem: <span className={summaryStrongClasses}>{item.packaging}</span></p> : null}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className={`text-xl ${headingClasses}`}>Definição da regra</h3>
                    <div className="mt-3 space-y-3">
                      {draft.definitions.map((item, index) => (
                        <div key={item.id} className={paneClasses}>
                          <p className={labelClasses}>Definição {index + 1}</p>
                          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            <p className={summaryTextClasses}>Último preço: <span className={summaryStrongClasses}>{item.ultimo_preco ? 'Sim' : 'Não'}</span></p>
                            <p className={summaryTextClasses}>Preço: <span className={summaryStrongClasses}>{formatDefinitionValue(item.preco, 'currency')}</span></p>
                            <p className={summaryTextClasses}>Desconto: <span className={summaryStrongClasses}>{formatDefinitionValue(item.desconto, definitionMode === 'percent' ? 'percent' : 'currency')}</span></p>
                            <p className={summaryTextClasses}>Acréscimo: <span className={summaryStrongClasses}>{formatDefinitionValue(item.acrescimo, definitionMode === 'percent' ? 'percent' : 'currency')}</span></p>
                            <p className={summaryTextClasses}>Pedido mínimo: <span className={summaryStrongClasses}>{formatDefinitionValue(item.pedido_minimo, 'currency')}</span></p>
                            <p className={summaryTextClasses}>Pedido máximo: <span className={summaryStrongClasses}>{formatDefinitionValue(item.pedido_maximo, 'currency')}</span></p>
                            <p className={summaryTextClasses}>Itens por pedido de: <span className={summaryStrongClasses}>{item.itens_pedido_de || '-'}</span></p>
                            <p className={summaryTextClasses}>Itens por pedido até: <span className={summaryStrongClasses}>{item.itens_pedido_ate || '-'}</span></p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className={`text-xl ${headingClasses}`}>Prévia do lote</h3>
                    <div className="app-table-shell mt-3 overflow-x-auto rounded-[1rem]">
                      <table className="min-w-full divide-y divide-line/60 text-sm">
                        <thead className="app-table-muted text-left text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">
                          <tr>
                            <th className="px-4 py-3">Público alvo</th>
                            <th className="px-4 py-3">Produto</th>
                            <th className="px-4 py-3">Definição</th>
                            <th className="px-4 py-3">Preço</th>
                            <th className="px-4 py-3">Desconto</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line/50">
                          {previewRows.map((row) => (
                            <tr key={row.key} className="app-table-row-hover">
                              <td className="px-4 py-3 font-medium text-[color:var(--app-text)]">{row.audience}</td>
                              <td className="px-4 py-3 text-[color:var(--app-muted)]">{row.product}</td>
                              <td className="px-4 py-3 text-[color:var(--app-muted)]">{row.definition}</td>
                              <td className="px-4 py-3 text-[color:var(--app-muted)]">{row.price}</td>
                              <td className="px-4 py-3 text-[color:var(--app-muted)]">{row.discount}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {flatRowsPreview.length > 12 ? <p className={`mt-3 text-sm ${mutedTextClasses}`}>Exibindo 12 de {flatRowsPreview.length} combinações geradas.</p> : null}
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Resumo final" description="Revise os dados consolidados antes de salvar o lote.">
              <div className={`space-y-3 text-sm ${mutedTextClasses}`}>
                <p>Nome: <span className={summaryStrongClasses}>{draft.general.nome || '-'}</span></p>
                <p>Código: <span className={summaryStrongClasses}>{draft.general.codigo || '-'}</span></p>
                <p>Tipo: <span className={summaryStrongClasses}>{draft.general.tipo || '-'}</span></p>
                <p>Origem: <span className={summaryStrongClasses}>{draft.general.origem || '-'}</span></p>
                <p>Perfil: <span className={summaryStrongClasses}>{draft.general.perfil || '-'}</span></p>
                <p>Índice: <span className={summaryStrongClasses}>{draft.general.indice || '-'}</span></p>
                <p>Posição: <span className={summaryStrongClasses}>{draft.general.posicao || '-'}</span></p>
                {generalToggleSummary.map(([label, value]) => (
                  <p key={label}>
                    {label}: <span className={summaryStrongClasses}>{value ? 'Sim' : 'Não'}</span>
                  </p>
                ))}
                <p>Forma de pagamento: <span className={summaryStrongClasses}>{draft.conditions.forma_pagamento_lookup?.label || '-'}</span></p>
                <p>Condição de pagamento: <span className={summaryStrongClasses}>{draft.conditions.condicao_pagamento_lookup?.label || '-'}</span></p>
                <p>Forma de entrega: <span className={summaryStrongClasses}>{draft.conditions.id_forma_entrega || '-'}</span></p>
                <p>Data inicial: <span className={summaryStrongClasses}>{formatInputDateTimeForDisplay(draft.conditions.data_inicio) || '-'}</span></p>
                <p>Data final: <span className={summaryStrongClasses}>{formatInputDateTimeForDisplay(draft.conditions.data_fim) || '-'}</span></p>
                <p>Prazo médio: <span className={summaryStrongClasses}>{draft.conditions.prazo_medio || '-'}</span></p>
              </div>
            </SectionCard>
          </div>
        ) : null}

        <div ref={footerRef} className="px-2 py-2">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={goPrev}
              disabled={currentStepIndex === 0}
              className="app-button-secondary rounded-full px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('common.previous', 'Anterior')}
            </button>

            {activeStep !== 'review' ? (
              <button
                type="button"
                onClick={goNext}
                className={primaryButtonLargeClasses}
              >
                {t('common.next', 'Próximo')}
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving || !canSave}
                className={primaryButtonLargeClasses}
              >
                {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t('common.save', 'Salvar')}
              </button>
            )}
          </div>
        </div>
      </AsyncState>
    </div>
  )
}
