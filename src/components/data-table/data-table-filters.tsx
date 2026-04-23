'use client'

import { ChevronDown, Search as SearchIcon } from 'lucide-react'
import { DateInput } from '@/src/components/ui/date-input'
import { FormField } from '@/src/components/ui/form-field'
import { InputWithAffix } from '@/src/components/ui/input-with-affix'
import { inputClasses } from '@/src/components/ui/input-styles'
import { LookupSelect } from '@/src/components/ui/lookup-select'
import type { AppDataTableColumn, AppDataTableFilterConfig } from '@/src/components/data-table/types'
import { useI18n } from '@/src/i18n/use-i18n'
import { currencyMask, decimalMask } from '@/src/lib/input-masks'

type DataTableFiltersCardProps<TFilters> = {
  title?: string
  description?: string
  columns?: AppDataTableColumn<unknown, TFilters>[]
  extraFilters?: AppDataTableFilterConfig<TFilters>[]
  draft: TFilters
  applied: TFilters
  expanded: boolean
  emptySummaryLabel?: string
  sortDescription?: string
  variant?: 'card' | 'embedded'
  onToggleExpanded: () => void
  onApply: () => void
  onClear: () => void
  patchDraft: <K extends keyof TFilters>(key: K, value: TFilters[K]) => void
}

function getVisibilityClass(visibility?: AppDataTableFilterConfig<unknown>['visibility']) {
  switch (visibility) {
    case 'lg':
      return 'hidden lg:block'
    case 'xl':
      return 'hidden xl:block'
    case '2xl':
      return 'hidden 2xl:block'
    default:
      return 'block'
  }
}

function toInputValue(value: unknown) {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
}

function applyMask(mask: 'currency' | 'decimal' | undefined, value: string) {
  if (mask === 'currency') {
    return currencyMask(value)
  }

  if (mask === 'decimal') {
    return decimalMask(value)
  }

  return value
}

function buildDefaultSummary<TFilters>(filter: AppDataTableFilterConfig<TFilters>, filters: TFilters) {
  switch (filter.kind) {
    case 'text': {
      const value = filters[filter.key]
      return value ? `${filter.summaryLabel ?? filter.label}: ${value}` : null
    }
    case 'select': {
      const value = toInputValue(filters[filter.key])
      if (!value) {
        return null
      }

      const selected = filter.options.find((option) => option.value === value)
      return `${filter.summaryLabel ?? filter.label}: ${selected?.label ?? value}`
    }
    case 'date-range': {
      const from = toInputValue(filters[filter.fromKey])
      const to = toInputValue(filters[filter.toKey])
      return from || to ? filter.summaryLabel ?? filter.label : null
    }
    case 'number-range': {
      const from = toInputValue(filters[filter.fromKey])
      const to = toInputValue(filters[filter.toKey])
      return from || to ? filter.summaryLabel ?? filter.label : null
    }
    case 'lookup': {
      const value = toInputValue(filters[filter.key])
      const label = toInputValue(filters[`${String(filter.key)}_label` as keyof TFilters])
      return value ? `${filter.summaryLabel ?? filter.label}: ${label || value}` : null
    }
    case 'custom':
      return null
    default:
      return null
  }
}

function renderFilterField<TFilters>(
  filter: AppDataTableFilterConfig<TFilters>,
  draft: TFilters,
  patchDraft: <K extends keyof TFilters>(key: K, value: TFilters[K]) => void,
  emptyOptionLabel: string,
) {
  switch (filter.kind) {
    case 'text':
      return (
        <FormField label={filter.label}>
          <input
            value={toInputValue(draft[filter.key])}
            onChange={(event) => patchDraft(filter.key, event.target.value as TFilters[typeof filter.key])}
            placeholder={filter.placeholder}
            inputMode={filter.inputMode}
            className={inputClasses()}
          />
        </FormField>
      )
    case 'select':
      return (
        <FormField label={filter.label}>
          <select
            value={toInputValue(draft[filter.key])}
            onChange={(event) => patchDraft(filter.key, event.target.value as TFilters[typeof filter.key])}
            className={inputClasses()}
          >
            <option value="">{filter.emptyLabel ?? emptyOptionLabel}</option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
      )
    case 'date-range':
      return (
        <FormField label={filter.label}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DateInput
              value={toInputValue(draft[filter.fromKey])}
              onChange={(event) => patchDraft(filter.fromKey, event.target.value as TFilters[typeof filter.fromKey])}
            />
            <DateInput
              value={toInputValue(draft[filter.toKey])}
              onChange={(event) => patchDraft(filter.toKey, event.target.value as TFilters[typeof filter.toKey])}
            />
          </div>
        </FormField>
      )
    case 'number-range':
      return (
        <FormField label={filter.label}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <InputWithAffix
              type={filter.mask ? 'text' : 'number'}
              prefix={filter.prefixText}
              suffix={filter.suffixText}
              value={toInputValue(draft[filter.fromKey])}
              onChange={(event) => patchDraft(filter.fromKey, applyMask(filter.mask, event.target.value) as TFilters[typeof filter.fromKey])}
              inputMode={filter.inputMode}
            />
            <InputWithAffix
              type={filter.mask ? 'text' : 'number'}
              prefix={filter.prefixText}
              suffix={filter.suffixText}
              value={toInputValue(draft[filter.toKey])}
              onChange={(event) => patchDraft(filter.toKey, applyMask(filter.mask, event.target.value) as TFilters[typeof filter.toKey])}
              inputMode={filter.inputMode}
            />
          </div>
        </FormField>
      )
    case 'lookup':
      return (
        <FormField label={filter.label}>
          <LookupSelect
            label={filter.label}
            value={toInputValue(draft[filter.key])
              ? {
                  id: toInputValue(draft[filter.key]),
                  label: toInputValue(draft[`${String(filter.key)}_label` as keyof TFilters]) || toInputValue(draft[filter.key]),
                }
              : null}
            onChange={(value) => {
              patchDraft(filter.key, (value?.id ?? '') as TFilters[typeof filter.key])
              patchDraft(`${String(filter.key)}_label` as keyof TFilters, (value?.label ?? '') as TFilters[keyof TFilters])
            }}
            loadOptions={filter.loadOptions}
            pageSize={filter.pageSize}
          />
        </FormField>
      )
    case 'custom':
      return filter.render({ draft, patchDraft })
    default:
      return null
  }
}

export function DataTableFiltersCard<TFilters>({
  title,
  description,
  columns = [],
  extraFilters = [],
  draft,
  applied,
  expanded,
  emptySummaryLabel = 'Sem filtros aplicados',
  sortDescription,
  variant = 'card',
  onToggleExpanded,
  onApply,
  onClear,
  patchDraft,
}: DataTableFiltersCardProps<TFilters>) {
  const { t } = useI18n()

  function handleApply() {
    onApply()
    onToggleExpanded()
  }

  function handleClear() {
    onClear()
    onToggleExpanded()
  }

  const filters = [
    ...columns.flatMap((column) => (column.filter ? [column.filter] : [])),
    ...extraFilters,
  ]

  const summary = filters
    .map((filter) => filter.getSummary?.(applied) ?? buildDefaultSummary(filter, applied))
    .filter(Boolean)
    .join(' • ')

  if (!expanded) {
    if (variant === 'embedded') {
      return null
    }

    return (
      <section className="app-card-modern rounded-[1.1rem] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            {title ? <h2 className="text-sm font-bold tracking-tight text-slate-950">{title}</h2> : null}
            <div className="mt-1 flex min-w-0 items-center gap-2 text-xs text-slate-500">
              <SearchIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">
                {summary || emptySummaryLabel || t('filters.noneApplied', 'Sem filtros aplicados')}
              </span>
              {sortDescription ? <span className="hidden truncate text-slate-400 xl:inline">{sortDescription}</span> : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleExpanded}
            className="app-button-secondary inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold"
          >
            {t('filters.expand', 'Expandir')}
            <ChevronDown className="h-4 w-4 transition" />
          </button>
        </div>
      </section>
    )
  }

  return (
    <section
      className={
        variant === 'embedded'
          ? 'pb-5'
          : 'app-card-modern rounded-[1.1rem] px-5 py-4'
      }
    >
      <div className="space-y-3">
        {variant === 'card' ? (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              {title ? <h2 className="text-sm font-bold tracking-tight text-slate-950">{title}</h2> : null}
              {description ? <p className="mt-0.5 text-[11px] leading-5 text-slate-500">{description}</p> : null}
            </div>
            <button
              type="button"
              onClick={onToggleExpanded}
              className="app-button-secondary inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold"
            >
              {t('filters.collapse', 'Recolher')}
              <ChevronDown className="h-4 w-4 rotate-180 transition" />
            </button>
          </div>
        ) : null}

        {variant === 'card' ? (
          <div className="app-pane-muted flex flex-col gap-1.5 rounded-[1rem] border border-dashed px-3.5 py-2.5 text-sm text-slate-600">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <SearchIcon className="h-4 w-4 text-slate-500" />
              {summary || emptySummaryLabel || t('filters.noneApplied', 'Sem filtros aplicados')}
            </div>
            {sortDescription ? <div className="text-xs text-slate-500">{sortDescription}</div> : null}
          </div>
        ) : null}

        <div className="app-pane-muted space-y-3 rounded-[1.1rem] p-3.5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {filters.map((filter) => (
              <div
                key={filter.id}
                className={`${filter.widthClassName ?? ''} ${getVisibilityClass(filter.visibility as AppDataTableFilterConfig<unknown>['visibility'])}`.trim()}
              >
                {renderFilterField(filter, draft, patchDraft, t('common.all', 'Todos'))}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={handleClear}
              className="app-button-secondary inline-flex items-center gap-2 rounded-full px-3.5 py-2.5 text-sm font-semibold"
            >
              {t('filters.clear', 'Limpar')}
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="app-button-primary inline-flex items-center gap-2 rounded-full px-3.5 py-2.5 text-sm font-semibold"
            >
              <SearchIcon className="h-4 w-4" />
              {t('filters.apply', 'Aplicar filtros')}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
