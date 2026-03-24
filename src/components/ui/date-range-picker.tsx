'use client'

import { CalendarRange, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { translateDashboardPresetLabel } from '@/src/features/dashboard/services/dashboard-i18n'
import { useI18n } from '@/src/i18n/use-i18n'

export type DateRangeValue = {
  start: string
  end: string
}

export type DateRangePreset = {
  id: string
  label: string
  range: DateRangeValue
}

type DateRangePickerProps = {
  value: DateRangeValue
  onChange: (nextValue: DateRangeValue) => void
  presets: DateRangePreset[]
  maxDays?: number
  align?: 'left' | 'right'
}

function formatDisplayDate(date: string) {
  const [year, month, day] = date.split('-')
  return `${day}/${month}/${year}`
}

function getInclusiveDifferenceInDays(start: string, end: string) {
  const startDate = new Date(`${start}T00:00:00`)
  const endDate = new Date(`${end}T00:00:00`)
  const difference = endDate.getTime() - startDate.getTime()
  return Math.floor(difference / (1000 * 60 * 60 * 24)) + 1
}

function parseDateParts(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return { year, month, day }
}

function formatDateFromParts(year: number, month: number, day: number) {
  const safeDate = new Date(year, month - 1, day)
  return safeDate.toISOString().slice(0, 10)
}

function getMonthName(month: number, locale: string) {
  return new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2026, month - 1, 1))
}

export function DateRangePicker({
  value,
  onChange,
  presets,
  maxDays = 90,
  align = 'right',
}: DateRangePickerProps) {
  const { locale, t } = useI18n()
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [draftValue, setDraftValue] = useState<DateRangeValue>(value)

  const daysSelected = useMemo(() => getInclusiveDifferenceInDays(draftValue.start, draftValue.end), [draftValue.end, draftValue.start])
  const isInvalidRange = daysSelected <= 0 || daysSelected > maxDays
  const currentPreset = useMemo(
    () => presets.find((preset) => preset.range.start === value.start && preset.range.end === value.end),
    [presets, value.end, value.start],
  )
  const startParts = parseDateParts(draftValue.start)
  const endParts = parseDateParts(draftValue.end)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 11 }, (_, index) => currentYear - 5 + index)
  }, [])

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handlePointerDown)
    }

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [isOpen])

  function openPicker() {
    setDraftValue(value)
    setIsOpen(true)
  }

  function shiftMonth(target: 'start' | 'end', step: number) {
    const parts = target === 'start' ? startParts : endParts
    const shifted = new Date(parts.year, parts.month - 1 + step, 1)
    const nextDay = target === 'start' ? 1 : new Date(shifted.getFullYear(), shifted.getMonth() + 1, 0).getDate()
    const nextValue = formatDateFromParts(shifted.getFullYear(), shifted.getMonth() + 1, nextDay)
    setDraftValue((current) => ({ ...current, [target]: nextValue }))
  }

  function updatePart(target: 'start' | 'end', nextYear: number, nextMonth: number) {
    const currentParts = target === 'start' ? startParts : endParts
    const maxDay = new Date(nextYear, nextMonth, 0).getDate()
    const nextDay = Math.min(currentParts.day, maxDay)
    const nextValue = formatDateFromParts(nextYear, nextMonth, nextDay)
    setDraftValue((current) => ({ ...current, [target]: nextValue }))
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => (isOpen ? setIsOpen(false) : openPicker())}
        className="inline-flex h-10 min-w-[240px] items-center justify-between gap-2 rounded-full border border-line bg-white px-3.5 text-sm font-semibold text-slate-700 transition hover:border-accent/20 hover:text-accent"
      >
        <span className="inline-flex items-center gap-2 truncate">
          <CalendarRange className="h-4 w-4 shrink-0" />
          <span className="truncate">
            {currentPreset
              ? translateDashboardPresetLabel(currentPreset.id, currentPreset.label, t)
              : `${formatDisplayDate(value.start)} a ${formatDisplayDate(value.end)}`}
          </span>
        </span>
        <ChevronDown className={['h-4 w-4 shrink-0 transition-transform', isOpen ? 'rotate-180' : ''].join(' ')} />
      </button>

      {isOpen ? (
        <div
          className={[
            'absolute top-12 z-50 w-[380px] rounded-[1.5rem] border border-line bg-white p-4 shadow-2xl',
            align === 'right' ? 'right-0' : 'left-0',
          ].join(' ')}
        >
          <div className="mb-3">
            <p className="text-sm font-bold text-slate-950">{t('dashboard.dateRange.title', 'Periodo')}</p>
            <p className="text-xs leading-5 text-slate-500">{t('dashboard.dateRange.subtitle', 'Selecione um intervalo de ate {{maxDays}} dias.', { maxDays })}</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {presets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setDraftValue(preset.range)
                  onChange(preset.range)
                  setIsOpen(false)
                }}
                className="rounded-2xl border border-line bg-surface px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:border-accent/20 hover:text-accent"
              >
                {translateDashboardPresetLabel(preset.id, preset.label, t)}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-3">
            {(['start', 'end'] as const).map((target) => {
              const parts = target === 'start' ? startParts : endParts
              const label = target === 'start'
                ? t('dashboard.dateRange.start', 'Inicio')
                : t('dashboard.dateRange.end', 'Fim')
              return (
                <div key={target} className="rounded-[1rem] border border-line bg-surface p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => shiftMonth(target, -1)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white text-slate-600 transition hover:border-accent/20 hover:text-accent"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => shiftMonth(target, 1)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white text-slate-600 transition hover:border-accent/20 hover:text-accent"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-[1.3fr_1fr]">
                    <select
                      value={parts.month}
                      onChange={(event) => updatePart(target, parts.year, Number(event.target.value))}
                      className="h-10 rounded-xl border border-line bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-accent/30"
                    >
                      {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                        <option key={month} value={month}>
                          {getMonthName(month, locale)}
                        </option>
                      ))}
                    </select>

                    <select
                      value={parts.year}
                      onChange={(event) => updatePart(target, Number(event.target.value), parts.month)}
                      className="h-10 rounded-xl border border-line bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-accent/30"
                    >
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  <input
                    type="date"
                    value={draftValue[target]}
                    onChange={(event) => setDraftValue((current) => ({ ...current, [target]: event.target.value }))}
                    className="mt-2 h-10 w-full rounded-xl border border-line bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-accent/30"
                  />
                </div>
              )
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accentSoft px-3 py-1 text-[11px] font-semibold text-accent">
              {daysSelected > 0
                ? t('dashboard.dateRange.days', '{{count}} dias', { count: daysSelected })
                : t('dashboard.dateRange.invalidPeriod', 'Periodo invalido')}
            </span>
            {isInvalidRange ? (
              <span className="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-semibold text-rose-700">
                {t('dashboard.dateRange.invalidRange', 'O intervalo precisa ficar entre 1 e {{maxDays}} dias.', { maxDays })}
              </span>
            ) : null}
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full border border-line px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent/20 hover:text-accent"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              disabled={isInvalidRange}
              onClick={() => {
                onChange(draftValue)
                setIsOpen(false)
              }}
              className="rounded-full bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('dashboard.dateRange.applyPeriod', 'Aplicar periodo')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
