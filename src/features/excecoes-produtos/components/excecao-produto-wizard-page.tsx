'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronRight, LoaderCircle, Plus, Save, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { CrudResource } from '@/src/components/crud-base/types'
import { AppDataTable } from '@/src/components/data-table/app-data-table'
import { AsyncState } from '@/src/components/ui/async-state'
import { LookupSelect } from '@/src/components/ui/lookup-select'
import { PageHeader } from '@/src/components/ui/page-header'
import { PageToast } from '@/src/components/ui/page-toast'
import { SectionCard } from '@/src/components/ui/section-card'
import { StepIndicator } from '@/src/components/ui/step-indicator'
import { ToggleCard } from '@/src/components/ui/toggle-card'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { excecoesProdutosClient } from '@/src/features/excecoes-produtos/services/excecoes-produtos-client'
import {
  buildWizardPayload,
  flattenWizardDraft,
  excecaoProdutoDefaultDraft,
} from '@/src/features/excecoes-produtos/services/excecoes-produtos-mappers'
import {
  getAudienceMeta,
  getProductMeta,
  EXCECAO_PRODUTO_AUDIENCE_TYPES,
  EXCECAO_PRODUTO_PRODUCT_TYPES,
} from '@/src/features/excecoes-produtos/services/excecoes-produtos-meta'
import type {
  ExcecaoProdutoApiRow,
  ExcecaoProdutoAudienceCriterion,
  ExcecaoProdutoAudienceType,
  ExcecaoProdutoConditionsDraft,
  ExcecaoProdutoCriterionOption,
  ExcecaoProdutoProductCriterion,
  ExcecaoProdutoProductType,
  ExcecaoProdutoWizardDraft,
} from '@/src/features/excecoes-produtos/services/excecoes-produtos-types'
import { useI18n } from '@/src/i18n/use-i18n'
import { formatInputDateTimeForDisplay } from '@/src/lib/date-time-input'

type StepId = 'audience' | 'products' | 'rule' | 'conditions' | 'review'

const STEP_IDS: StepId[] = ['audience', 'products', 'rule', 'conditions', 'review']

const WEEKDAYS = [
  { key: 'seg', label: 'Segunda-feira' },
  { key: 'ter', label: 'Terça-feira' },
  { key: 'qua', label: 'Quarta-feira' },
  { key: 'qui', label: 'Quinta-feira' },
  { key: 'sex', label: 'Sexta-feira' },
  { key: 'sab', label: 'Sábado' },
  { key: 'dom', label: 'Domingo' },
] as const

function createAudienceCriterion(index: number): ExcecaoProdutoAudienceCriterion {
  return { id: `aud-${Date.now()}-${index}`, type: 'todos', values: [] }
}

function createProductCriterion(index: number): ExcecaoProdutoProductCriterion {
  return { id: `prd-${Date.now()}-${index}`, type: 'todos', values: [] }
}

function renderInputClass(invalid = false) {
  return [
    'app-control w-full rounded-[1rem] px-3.5 py-3 text-sm',
    invalid ? 'border-rose-300 ring-2 ring-rose-500/20' : '',
  ].join(' ')
}

function buildWeekdaySummary(conditions: ExcecaoProdutoConditionsDraft) {
  return WEEKDAYS
    .filter((day) => conditions[day.key].active)
    .map((day) => {
      const item = conditions[day.key]
      return item.from && item.to ? `${day.label}: ${item.from} às ${item.to}` : `${day.label}: dia inteiro`
    })
}

function InfoCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="app-control rounded-[1rem] px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--app-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--app-text)]">{value}</p>
    </div>
  )
}

function SummaryBlock({
  title,
  items,
}: {
  title: string
  items: Array<{ label: string; type: string; values: string }>
}) {
  return (
    <div>
      <h3 className="text-xl font-semibold text-[color:var(--app-text)]">{title}</h3>
      <div className="mt-3 space-y-3">
        {items.map((item) => (
          <div key={item.label} className="app-control-muted rounded-[1rem] px-4 py-4">
            <p className="text-sm font-semibold text-[color:var(--app-text)]">{item.label}</p>
            <p className="mt-2 text-sm text-[color:var(--app-muted)]">
              Tipo: <span className="font-semibold text-[color:var(--app-text)]">{item.type}</span>
            </p>
            <p className="mt-1 text-sm text-[color:var(--app-muted)]">
              Seleção: <span className="font-semibold text-[color:var(--app-text)]">{item.values}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

type CriteriaSectionProps<TType extends string> = {
  title: string
  description: string
  criterionLabel: string
  items: Array<{ id: string; type: TType; values: ExcecaoProdutoCriterionOption[] }>
  typeOptions: Array<{ value: TType; label: string }>
  getMeta: (type: TType) => { label: string; resource?: CrudResource; staticOptions?: ExcecaoProdutoCriterionOption[] }
  onAdd: () => void
  onRemove: (id: string) => void
  onTypeChange: (id: string, type: TType) => void
  onValuesChange: (id: string, values: ExcecaoProdutoCriterionOption[]) => void
  loadLookupOptions: (resource: CrudResource, query: string, page: number, perPage: number) => Promise<ExcecaoProdutoCriterionOption[]>
  showValidation: boolean
}

function CriteriaSection<TType extends string>({
  title,
  description,
  criterionLabel,
  items,
  typeOptions,
  getMeta,
  onAdd,
  onRemove,
  onTypeChange,
  onValuesChange,
  loadLookupOptions,
  showValidation,
}: CriteriaSectionProps<TType>) {
  const { t } = useI18n()
  const [candidateById, setCandidateById] = useState<Record<string, ExcecaoProdutoCriterionOption | null>>({})

  return (
    <SectionCard title={title} description={description}>
      <div className="space-y-4">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onAdd}
            className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" />
            {t('common.add', 'Adicionar')}
          </button>
        </div>
        {items.map((item, index) => {
          const meta = getMeta(item.type)
          const invalid = showValidation && item.type !== ('todos' as TType) && item.values.length === 0

          return (
            <div
              key={item.id}
              className={[
                'app-control rounded-[1.25rem] p-4',
                invalid ? 'border-rose-300' : '',
              ].join(' ')}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="text-sm font-semibold text-[color:var(--app-text)]">
                  {criterionLabel} {index + 1}
                </div>
                {items.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-300"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t('common.remove', 'Remover')}
                  </button>
                ) : null}
              </div>

              <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[color:var(--app-text)]">
                    {t('maintenance.productExceptions.criterionType', 'Tipo do critério')}
                  </label>
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

                <div className="space-y-2">
                  {item.type === ('todos' as TType) ? (
                    <div className="app-control-muted flex min-h-[72px] items-center rounded-[1rem] border-dashed px-4 py-3 text-sm text-[color:var(--app-muted)]">
                      {t(
                        'maintenance.productExceptions.appliesToAll',
                        'Este bloco aplica a todos. Nenhuma seleção adicional é necessária.',
                      )}
                    </div>
                  ) : (
                    <>
                      <label className="text-sm font-semibold text-[color:var(--app-text)]">{meta.label}</label>
                      {meta.resource ? (
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
                          loadOptions={(query, page, perPage) => loadLookupOptions(meta.resource as CrudResource, query, page, perPage)}
                        />
                      ) : (
                        <select
                          value={candidateById[item.id]?.id ?? ''}
                          onChange={(event) => {
                            const option = meta.staticOptions?.find((entry) => entry.id === event.target.value) ?? null
                            if (option && !item.values.some((selected) => selected.id === option.id)) {
                              onValuesChange(item.id, [...item.values, option])
                            }
                            setCandidateById((current) => ({ ...current, [item.id]: null }))
                          }}
                          className={renderInputClass(invalid)}
                        >
                          <option value="">{t('common.select', 'Selecione')}</option>
                          {meta.staticOptions?.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </>
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

                  {invalid ? (
                    <p className="text-xs text-rose-600">
                      {t('maintenance.productExceptions.selectOne', 'Selecione ao menos uma opção neste critério.')}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}

export function ExcecaoProdutoWizardPage({ id }: { id?: string }) {
  const { t } = useI18n()
  const router = useRouter()
  const access = useFeatureAccess('excecoesProdutos')
  const [draft, setDraft] = useState<ExcecaoProdutoWizardDraft>(excecaoProdutoDefaultDraft)
  const [activeStep, setActiveStep] = useState<StepId>(id ? 'review' : 'audience')
  const [originalRows, setOriginalRows] = useState<ExcecaoProdutoApiRow[]>([])
  const [isLoading, setIsLoading] = useState(Boolean(id))
  const [loadError, setLoadError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)
  const [showValidation, setShowValidation] = useState(false)

  useEffect(() => {
    if (!id) return
    const wizardId = id
    let alive = true

    async function load() {
      setIsLoading(true)
      setLoadError('')
      try {
        const response = await excecoesProdutosClient.getWizard(wizardId)
        if (!alive) return
        setDraft(response.draft)
        setOriginalRows(response.originalRows)
      } catch (error) {
        if (!alive) return
        setLoadError(
          error instanceof Error
            ? error.message
            : t('maintenance.productExceptions.loadError', 'Não foi possível carregar a exceção.'),
        )
      } finally {
        if (alive) setIsLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [id, t])

  useEffect(() => {
    setDraft((current) => {
      let changed = false
      const nextConditions = { ...current.conditions }

      for (const key of WEEKDAYS.map((day) => day.key)) {
        const item = current.conditions[key]
        if (!item.active) continue

        const nextFrom = item.from || '00:00'
        const nextTo = item.to || '23:59'
        if (nextFrom !== item.from || nextTo !== item.to) {
          changed = true
          nextConditions[key] = { ...item, from: nextFrom, to: nextTo }
        }
      }

      return changed ? { ...current, conditions: nextConditions } : current
    })
  }, [])

  const steps = useMemo(
    () => [
      { id: 'audience', label: t('maintenance.productExceptions.steps.audience', 'Público-alvo') },
      { id: 'products', label: t('maintenance.productExceptions.steps.products', 'Produtos') },
      { id: 'rule', label: t('maintenance.productExceptions.steps.rule', 'Regra') },
      { id: 'conditions', label: t('maintenance.productExceptions.steps.conditions', 'Condições') },
      { id: 'review', label: t('maintenance.productExceptions.steps.review', 'Resumo') },
    ],
    [t],
  )

  const audienceTypeOptions = useMemo(
    () => EXCECAO_PRODUTO_AUDIENCE_TYPES.map((item) => ({ value: item.value, label: item.label })),
    [],
  )

  const productTypeOptions = useMemo(
    () => EXCECAO_PRODUTO_PRODUCT_TYPES.map((item) => ({ value: item.value, label: item.label })),
    [],
  )

  const flatRowsPreview = useMemo(() => flattenWizardDraft(draft), [draft])

  const expandedAudienceSelections = useMemo(
    () => draft.audiences.flatMap((item) => (
      item.type === 'todos'
        ? [{ key: `${item.id}-all`, type: getAudienceMeta(item.type).label, value: 'Todos' }]
        : item.values.map((value) => ({
            key: `${item.id}-${value.id}`,
            type: getAudienceMeta(item.type).label,
            value: value.label,
          }))
    )),
    [draft.audiences],
  )

  const expandedProductSelections = useMemo(
    () => draft.products.flatMap((item) => (
      item.type === 'todos'
        ? [{ key: `${item.id}-all`, type: getProductMeta(item.type).label, value: 'Todos' }]
        : item.values.map((value) => ({
            key: `${item.id}-${value.id}`,
            type: getProductMeta(item.type).label,
            value: value.label,
          }))
    )),
    [draft.products],
  )

  const audienceSummary = useMemo(
    () => draft.audiences.map((item, index) => ({
      label: `${t('maintenance.productExceptions.audienceCriterion', 'Destinatário')} ${index + 1}`,
      type: getAudienceMeta(item.type).label,
      values: item.type === 'todos' ? 'Todos' : item.values.map((value) => value.label).join(', '),
    })),
    [draft.audiences, t],
  )

  const productSummary = useMemo(
    () => draft.products.map((item, index) => ({
      label: `${t('maintenance.productExceptions.productCriterion', 'Critério de produto')} ${index + 1}`,
      type: getProductMeta(item.type).label,
      values: item.type === 'todos' ? 'Todos' : item.values.map((value) => value.label).join(', '),
    })),
    [draft.products, t],
  )

  const previewRows = useMemo(
    () => expandedAudienceSelections
      .flatMap((audience) => expandedProductSelections.map((product, index) => ({
        key: `${audience.key}-${product.key}-${index}`,
        audience: `${audience.type}: ${audience.value}`,
        product: `${product.type}: ${product.value}`,
      })))
      .slice(0, 12),
    [expandedAudienceSelections, expandedProductSelections],
  )

  if (!access.canList) {
    return (
      <AccessDeniedState
        title={t('maintenance.productExceptions.title', 'Exceções x Produtos')}
        backHref="/dashboard"
      />
    )
  }

  function patchAudience(idValue: string, patch: Partial<ExcecaoProdutoAudienceCriterion>) {
    setDraft((current) => ({
      ...current,
      audiences: current.audiences.map((item) => (item.id === idValue ? { ...item, ...patch } : item)),
    }))
  }

  function patchProduct(idValue: string, patch: Partial<ExcecaoProdutoProductCriterion>) {
    setDraft((current) => ({
      ...current,
      products: current.products.map((item) => (item.id === idValue ? { ...item, ...patch } : item)),
    }))
  }

  function patchConditions<K extends keyof ExcecaoProdutoConditionsDraft>(key: K, value: ExcecaoProdutoConditionsDraft[K]) {
    setDraft((current) => ({
      ...current,
      conditions: {
        ...current.conditions,
        [key]: value,
      },
    }))
  }

  function validateStep(step = activeStep) {
    if (step === 'audience') {
      return draft.audiences.every((item) => item.type === 'todos' || item.values.length > 0)
    }
    if (step === 'products') {
      return draft.products.every((item) => item.type === 'todos' || item.values.length > 0)
    }
    if (step === 'rule') {
      return Boolean(draft.general.motivo.trim())
    }
    if (step === 'conditions') {
      return WEEKDAYS.every((day) => {
        const item = draft.conditions[day.key]
        if (!item.active) return true
        if ((item.from && !item.to) || (!item.from && item.to)) return false
        if (item.from && item.to && item.to <= item.from) return false
        return true
      })
    }
    return true
  }

  function goNext() {
    setShowValidation(true)
    if (activeStep !== 'conditions' && !validateStep(activeStep)) return
    const currentIndex = STEP_IDS.indexOf(activeStep)
    setActiveStep(STEP_IDS[Math.min(currentIndex + 1, STEP_IDS.length - 1)])
    setShowValidation(false)
  }

  function goPrev() {
    const currentIndex = STEP_IDS.indexOf(activeStep)
    setActiveStep(STEP_IDS[Math.max(currentIndex - 1, 0)])
  }

  async function handleSave() {
    setShowValidation(true)
    const firstInvalid = STEP_IDS.find((step) => !validateStep(step))
    if (firstInvalid) {
      setActiveStep(firstInvalid)
      return
    }

    setIsSaving(true)
    try {
      const payload = buildWizardPayload(draft, originalRows, id)
      await excecoesProdutosClient.saveWizard(payload)
      router.push('/excecoes-produtos')
      router.refresh()
    } catch (error) {
      setToast({
        tone: 'error',
        message: error instanceof Error
          ? error.message
          : t('maintenance.productExceptions.saveError', 'Não foi possível salvar a exceção.'),
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={[
          { label: t('routes.dashboard', 'Início'), href: '/dashboard' },
          { label: t('routes.manutencao', 'Manutenção') },
          { label: t('routes.excecoesProdutos', 'Exceções x Produtos'), href: '/excecoes-produtos' },
          { label: id ? t('common.edit', 'Editar') : t('common.new', 'Novo') },
        ]}
        actions={(
          <div className="flex items-center gap-2">
            <Link
              href="/excecoes-produtos"
                className="app-button-secondary inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('common.back', 'Voltar')}
            </Link>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving}
                className="app-button-primary inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {t('common.save', 'Salvar')}
            </button>
          </div>
        )}
      />

      <AsyncState isLoading={isLoading} error={loadError}>
        <div className="space-y-4">
          <SectionCard
            title={id ? t('maintenance.productExceptions.editTitle', 'Editar exceção') : t('maintenance.productExceptions.createTitle', 'Nova exceção')}
            description={t('maintenance.productExceptions.wizardDescription', 'Defina para quem a exceção vale, quais produtos ela afeta e em quais condições ela deve ser aplicada.')}
          >
            <StepIndicator items={steps} activeStep={activeStep} onStepClick={(step) => setActiveStep(step as StepId)} />
          </SectionCard>

          {activeStep === 'audience' ? (
            <CriteriaSection
              title={t('maintenance.productExceptions.audienceTitle', 'Público-alvo')}
              description={t('maintenance.productExceptions.audienceDescription', 'Escolha os públicos para os quais a exceção será aplicada.')}
              criterionLabel={t('maintenance.productExceptions.audienceCriterion', 'Destinatário')}
              items={draft.audiences}
              typeOptions={audienceTypeOptions}
              getMeta={(type) => getAudienceMeta(type as ExcecaoProdutoAudienceType)}
              onAdd={() => setDraft((current) => ({ ...current, audiences: [...current.audiences, createAudienceCriterion(current.audiences.length)] }))}
              onRemove={(itemId) => setDraft((current) => ({ ...current, audiences: current.audiences.filter((item) => item.id !== itemId) }))}
              onTypeChange={(itemId, type) => patchAudience(itemId, { type: type as ExcecaoProdutoAudienceType, values: [] })}
              onValuesChange={(itemId, values) => patchAudience(itemId, { values })}
              loadLookupOptions={(resource, query, page, perPage) => excecoesProdutosClient.loadLookupOptions(resource, query, page, perPage)}
              showValidation={showValidation}
            />
          ) : null}

          {activeStep === 'products' ? (
            <CriteriaSection
              title={t('maintenance.productExceptions.productsTitle', 'Seleção de produtos')}
              description={t('maintenance.productExceptions.productsDescription', 'Selecione os produtos ou agrupamentos que serão afetados pela exceção.')}
              criterionLabel={t('maintenance.productExceptions.productCriterion', 'Critério de produto')}
              items={draft.products}
              typeOptions={productTypeOptions}
              getMeta={(type) => getProductMeta(type as ExcecaoProdutoProductType)}
              onAdd={() => setDraft((current) => ({ ...current, products: [...current.products, createProductCriterion(current.products.length)] }))}
              onRemove={(itemId) => setDraft((current) => ({ ...current, products: current.products.filter((item) => item.id !== itemId) }))}
              onTypeChange={(itemId, type) => patchProduct(itemId, { type: type as ExcecaoProdutoProductType, values: [] })}
              onValuesChange={(itemId, values) => patchProduct(itemId, { values })}
              loadLookupOptions={(resource, query, page, perPage) => excecoesProdutosClient.loadLookupOptions(resource, query, page, perPage)}
              showValidation={showValidation}
            />
          ) : null}

          {activeStep === 'rule' ? (
            <SectionCard title={t('maintenance.productExceptions.ruleTitle', 'Configuração da exceção')}>
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[color:var(--app-text)]">
                    {t('maintenance.productExceptions.fields.reason', 'Motivo da exceção')}
                  </label>
                  <textarea
                    value={draft.general.motivo}
                    onChange={(event) => setDraft((current) => ({ ...current, general: { ...current.general, motivo: event.target.value } }))}
                    rows={4}
                    className={renderInputClass(showValidation && !draft.general.motivo.trim())}
                  />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[color:var(--app-text)]">
                      {t('maintenance.productExceptions.fields.metadata', 'Metadata')}
                    </label>
                    <textarea
                      value={draft.general.metadata}
                      onChange={(event) => setDraft((current) => ({ ...current, general: { ...current.general, metadata: event.target.value } }))}
                      rows={4}
                      className={renderInputClass(false)}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <ToggleCard
                      label={t('maintenance.productExceptions.fields.active', 'Ativo')}
                      checked={draft.general.ativo}
                      onChange={(value) => setDraft((current) => ({ ...current, general: { ...current.general, ativo: value } }))}
                    />
                    <ToggleCard
                      label={t('maintenance.productExceptions.fields.quote', 'Orçamento')}
                      checked={draft.general.orcamento}
                      onChange={(value) => setDraft((current) => ({ ...current, general: { ...current.general, orcamento: value } }))}
                    />
                  </div>
                </div>
              </div>
            </SectionCard>
          ) : null}

          {activeStep === 'conditions' ? (
            <SectionCard title={t('maintenance.productExceptions.conditionsTitle', 'Condições e validade')}>
              <div className="space-y-5">
                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[color:var(--app-text)]">
                      {t('maintenance.productExceptions.fields.startDate', 'Data inicial')}
                    </label>
                    <input
                      type="datetime-local"
                      value={draft.conditions.data_inicio}
                      onChange={(event) => patchConditions('data_inicio', event.target.value)}
                      className={renderInputClass(false)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[color:var(--app-text)]">
                      {t('maintenance.productExceptions.fields.endDate', 'Data final')}
                    </label>
                    <input
                      type="datetime-local"
                      value={draft.conditions.data_fim}
                      onChange={(event) => patchConditions('data_fim', event.target.value)}
                      className={renderInputClass(false)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[color:var(--app-text)]">
                      {t('maintenance.productExceptions.fields.paymentMethod', 'Forma de pagamento')}
                    </label>
                    <LookupSelect
                      label={t('maintenance.productExceptions.fields.paymentMethod', 'Forma de pagamento')}
                      value={draft.conditions.forma_pagamento_lookup}
                      onChange={(value) => setDraft((current) => ({
                        ...current,
                        conditions: {
                          ...current.conditions,
                          forma_pagamento_lookup: value,
                          id_forma_pagamento: value?.id ?? '',
                        },
                      }))}
                      loadOptions={(query, page, perPage) => excecoesProdutosClient.loadLookupOptions('formas_pagamento', query, page, perPage)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-[color:var(--app-text)]">
                      {t('maintenance.productExceptions.fields.paymentCondition', 'Condição de pagamento')}
                    </label>
                    <LookupSelect
                      label={t('maintenance.productExceptions.fields.paymentCondition', 'Condição de pagamento')}
                      value={draft.conditions.condicao_pagamento_lookup}
                      onChange={(value) => setDraft((current) => ({
                        ...current,
                        conditions: {
                          ...current.conditions,
                          condicao_pagamento_lookup: value,
                          id_condicao_pagamento: value?.id ?? '',
                        },
                      }))}
                      loadOptions={(query, page, perPage) => excecoesProdutosClient.loadLookupOptions('condicoes_pagamento', query, page, perPage)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-[color:var(--app-text)]">
                    {t('maintenance.productExceptions.fields.deliveryType', 'Tipo de entrega')}
                  </label>
                  <input
                    type="text"
                    value={draft.conditions.tipo_entrega}
                    onChange={(event) => patchConditions('tipo_entrega', event.target.value)}
                    className={renderInputClass(false)}
                    placeholder={t('maintenance.productExceptions.fields.deliveryTypePlaceholder', 'Ex.: entrega, retirada, transportadora')}
                  />
                </div>

                <div className="app-control-muted rounded-[1.2rem] p-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--app-muted)]">
                      {t('maintenance.productExceptions.fields.schedule', 'Dias e horários')}
                    </h3>
                    <p className="mt-1 text-sm text-[color:var(--app-muted)]">
                      {t('maintenance.productExceptions.scheduleHint', 'Marque os dias em que a exceção deve valer. Se um dia estiver marcado sem horário, ela valerá durante todo o dia.')}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {WEEKDAYS.map((day) => {
                      const item = draft.conditions[day.key]
                      const invalid = Boolean(
                        showValidation
                        && item.active
                        && ((item.from && !item.to) || (!item.from && item.to) || (item.from && item.to && item.to <= item.from)),
                      )

                      return (
                        <div
                          key={day.key}
                          className="app-control grid gap-3 rounded-[1rem] p-3 md:grid-cols-[220px_1fr_1fr] md:items-center"
                        >
                          <ToggleCard
                            label={day.label}
                            checked={item.active}
                            onChange={(value) => setDraft((current) => ({
                              ...current,
                              conditions: {
                                ...current.conditions,
                                [day.key]: {
                                  ...current.conditions[day.key],
                                  active: value,
                                  from: value ? (current.conditions[day.key].from || '00:00') : current.conditions[day.key].from,
                                  to: value ? (current.conditions[day.key].to || '23:59') : current.conditions[day.key].to,
                                },
                              },
                            }))}
                          />
                          <input
                            type="time"
                            value={item.active ? (item.from || '00:00') : item.from}
                            disabled={!item.active}
                            onChange={(event) => setDraft((current) => ({
                              ...current,
                              conditions: {
                                ...current.conditions,
                                [day.key]: { ...current.conditions[day.key], from: event.target.value },
                              },
                            }))}
                            className={renderInputClass(invalid)}
                          />
                          <input
                            type="time"
                            value={item.active ? (item.to || '23:59') : item.to}
                            disabled={!item.active}
                            onChange={(event) => setDraft((current) => ({
                              ...current,
                              conditions: {
                                ...current.conditions,
                                [day.key]: { ...current.conditions[day.key], to: event.target.value },
                              },
                            }))}
                            className={renderInputClass(invalid)}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </SectionCard>
          ) : null}

          {activeStep === 'review' ? (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_380px]">
              <SectionCard>
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-3">
                    <InfoCard label={t('maintenance.productExceptions.steps.audience', 'Público-alvo')} value={expandedAudienceSelections.length} />
                    <InfoCard label={t('maintenance.productExceptions.steps.products', 'Produtos')} value={expandedProductSelections.length} />
                    <InfoCard label="Combinações" value={flatRowsPreview.length} />
                  </div>

                  <div className="space-y-6">
                    <SummaryBlock
                      title={t('maintenance.productExceptions.steps.audience', 'Público-alvo')}
                      items={audienceSummary}
                    />

                    <SummaryBlock
                      title={t('maintenance.productExceptions.steps.products', 'Produtos')}
                      items={productSummary}
                    />

                    <div>
                      <h3 className="text-xl font-semibold text-[color:var(--app-text)]">Prévia do lote</h3>
                      <div className="mt-3">
                        <AppDataTable
                          rows={previewRows}
                          getRowId={(row) => row.key}
                          columns={[
                            {
                              id: 'audience',
                              label: t('maintenance.productExceptions.steps.audience', 'P\u00fablico-alvo'),
                              cell: (row) => row.audience,
                              tdClassName: 'font-medium text-[color:var(--app-text)]',
                            },
                            {
                              id: 'product',
                              label: t('maintenance.productExceptions.steps.products', 'Produtos'),
                              cell: (row) => row.product,
                              tdClassName: 'text-[color:var(--app-muted)]',
                            },
                          ]}
                          emptyMessage={t('maintenance.productExceptions.emptyPreview', 'Nenhuma combina\u00e7\u00e3o gerada.')}
                          mobileCard={{
                            title: (row) => row.audience,
                            subtitle: (row) => row.product,
                          }}
                        />
                      </div>
                      {flatRowsPreview.length > 12 ? (
                        <p className="mt-3 text-sm text-[color:var(--app-muted)]">
                          Exibindo 12 de {flatRowsPreview.length} combinações geradas.
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </SectionCard>
              <SectionCard title="Resumo final" description="Revise os valores comuns antes de salvar.">
                <div className="space-y-3 text-sm text-[color:var(--app-muted)]">
                  <p>
                    {t('maintenance.productExceptions.fields.active', 'Ativo')}:{' '}
                    <span className="font-semibold text-[color:var(--app-text)]">{draft.general.ativo ? 'Sim' : 'Não'}</span>
                  </p>
                  <p>
                    {t('maintenance.productExceptions.fields.quote', 'Orçamento')}:{' '}
                    <span className="font-semibold text-[color:var(--app-text)]">{draft.general.orcamento ? 'Sim' : 'Não'}</span>
                  </p>
                  <p>
                    {t('maintenance.productExceptions.fields.metadata', 'Metadata')}:{' '}
                    <span className="font-semibold text-[color:var(--app-text)]">{draft.general.metadata || '-'}</span>
                  </p>
                  <p>
                    {t('maintenance.productExceptions.fields.reason', 'Motivo da exceção')}:{' '}
                    <span className="font-semibold text-[color:var(--app-text)]">{draft.general.motivo || '-'}</span>
                  </p>
                  <p>
                    {t('maintenance.productExceptions.fields.paymentMethod', 'Forma de pagamento')}:{' '}
                    <span className="font-semibold text-[color:var(--app-text)]">{draft.conditions.forma_pagamento_lookup?.label || '-'}</span>
                  </p>
                  <p>
                    {t('maintenance.productExceptions.fields.paymentCondition', 'Condição de pagamento')}:{' '}
                    <span className="font-semibold text-[color:var(--app-text)]">{draft.conditions.condicao_pagamento_lookup?.label || '-'}</span>
                  </p>
                  <p>
                    {t('maintenance.productExceptions.fields.deliveryType', 'Tipo de entrega')}:{' '}
                    <span className="font-semibold text-[color:var(--app-text)]">{draft.conditions.tipo_entrega || '-'}</span>
                  </p>
                  <p>
                    {t('maintenance.productExceptions.fields.startDate', 'Data inicial')}:{' '}
                    <span className="font-semibold text-[color:var(--app-text)]">{formatInputDateTimeForDisplay(draft.conditions.data_inicio) || '-'}</span>
                  </p>
                  <p>
                    {t('maintenance.productExceptions.fields.endDate', 'Data final')}:{' '}
                    <span className="font-semibold text-[color:var(--app-text)]">{formatInputDateTimeForDisplay(draft.conditions.data_fim) || '-'}</span>
                  </p>
                  <p>
                    {t('maintenance.productExceptions.fields.schedule', 'Dias e horários')}:{' '}
                    <span className="font-semibold text-[color:var(--app-text)]">{buildWeekdaySummary(draft.conditions).join('; ') || '-'}</span>
                  </p>
                </div>
              </SectionCard>
            </div>
          ) : null}

          <SectionCard>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={goPrev}
                disabled={activeStep === 'audience'}
                className="app-button-secondary inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('common.previous', 'Anterior')}
              </button>

              {activeStep === 'review' ? (
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={isSaving}
                  className="app-button-primary inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {t('common.save', 'Salvar')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goNext}
                  className="app-button-primary inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold"
                >
                  {t('common.next', 'Próximo')}
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </SectionCard>
        </div>
      </AsyncState>

      {toast ? (
        <PageToast
          variant={toast.tone === 'success' ? 'success' : 'danger'}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      ) : null}
    </div>
  )
}
