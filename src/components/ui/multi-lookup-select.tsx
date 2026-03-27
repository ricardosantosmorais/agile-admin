'use client'

import { Check, ChevronDown, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '@/src/i18n/use-i18n'

export type MultiLookupOption = {
  id: string
  label: string
  description?: string
}

type MultiLookupSelectProps = {
  label: string
  values: string[]
  options: MultiLookupOption[]
  onChange: (values: string[]) => void
  disabled?: boolean
  placeholder?: string
}

export function MultiLookupSelect({
  label,
  values,
  options,
  onChange,
  disabled = false,
  placeholder,
}: MultiLookupSelectProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const [dropdownStyle, setDropdownStyle] = useState<{
    top?: number
    bottom?: number
    left: number
    width: number
    maxHeight: number
  } | null>(null)

  const selectedOptions = useMemo(
    () => values.map((value) => options.find((option) => option.id === value)).filter((option): option is MultiLookupOption => Boolean(option)),
    [options, values],
  )

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) {
      return options
    }

    return options.filter((option) => {
      const haystack = `${option.label} ${option.description ?? ''}`.toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }, [options, query])

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node
      if (!containerRef.current?.contains(target) && !dropdownRef.current?.contains(target)) {
        setOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown, true)
    return () => window.removeEventListener('pointerdown', handlePointerDown, true)
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }

    function updateDropdownPosition() {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) {
        return
      }

      const viewportPadding = 12
      const offset = 8
      const spaceBelow = window.innerHeight - rect.bottom - viewportPadding
      const spaceAbove = rect.top - viewportPadding
      const openUpwards = spaceBelow < 240 && spaceAbove > spaceBelow
      const availableSpace = Math.max(openUpwards ? spaceAbove : spaceBelow, 216)

      setDropdownStyle({
        top: openUpwards ? undefined : rect.bottom + offset,
        bottom: openUpwards ? window.innerHeight - rect.top + offset : undefined,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.min(availableSpace - offset, 360),
      })
    }

    updateDropdownPosition()
    window.addEventListener('resize', updateDropdownPosition)
    window.addEventListener('scroll', updateDropdownPosition, true)

    return () => {
      window.removeEventListener('resize', updateDropdownPosition)
      window.removeEventListener('scroll', updateDropdownPosition, true)
    }
  }, [open])

  function toggleValue(optionId: string) {
    if (values.includes(optionId)) {
      onChange(values.filter((value) => value !== optionId))
      return
    }

    onChange([...values, optionId])
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-[46px] w-full items-center justify-between gap-3 rounded-[1rem] border border-[#e6dfd3] bg-white px-3.5 py-2.5 text-left text-sm text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
      >
        <div className="min-w-0 flex-1">
          {selectedOptions.length ? (
            <div className="flex flex-wrap gap-1.5">
              {selectedOptions.slice(0, 3).map((option) => (
                <span key={option.id} className="inline-flex max-w-full items-center rounded-full bg-[#fcfaf5] px-2.5 py-1 text-xs font-medium text-slate-700">
                  <span className="truncate">{option.label}</span>
                </span>
              ))}
              {selectedOptions.length > 3 ? (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  +{selectedOptions.length - 3}
                </span>
              ) : null}
            </div>
          ) : (
            <span className="text-slate-500">
              {placeholder || t('common.searchFor', 'Search {{label}}', { label: label.toLowerCase() })}
            </span>
          )}
        </div>
        <ChevronDown className={['h-4 w-4 shrink-0 text-slate-400 transition', open ? 'rotate-180' : ''].join(' ')} />
      </button>

      {open && dropdownStyle && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={dropdownRef}
              style={dropdownStyle}
              className="fixed z-[240] rounded-[1.2rem] border border-[#e6dfd3] bg-white p-3 shadow-[0_22px_46px_rgba(15,23,42,0.12)]"
            >
              <div className="flex items-center gap-2 rounded-[0.95rem] border border-[#ebe4d8] bg-[#fcfaf5] px-3 py-2.5">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-full border-none bg-transparent text-sm outline-none placeholder:text-slate-400"
                  placeholder={t('common.searchFor', 'Search {{label}}', { label: label.toLowerCase() })}
                />
                {query ? (
                  <button type="button" onClick={() => setQuery('')} className="text-slate-400">
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <div style={{ maxHeight: Math.max(dropdownStyle.maxHeight - 72, 132) }} className="mt-3 overflow-y-auto">
                <button
                  type="button"
                  onPointerDown={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    onChange([])
                  }}
                  className="flex w-full items-center gap-3 rounded-[0.95rem] px-3 py-2.5 text-left text-sm text-slate-600 transition hover:bg-[#fcfaf5]"
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-slate-300 text-[10px]">x</span>
                  {t('common.clearSelection', 'Clear selection')}
                </button>

                {filteredOptions.length ? (
                  filteredOptions.map((option) => {
                    const isSelected = values.includes(option.id)
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onPointerDown={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          toggleValue(option.id)
                        }}
                        className="flex w-full items-start justify-between gap-3 rounded-[0.95rem] px-3 py-2.5 text-left text-sm transition hover:bg-[#fcfaf5]"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900">{option.label}</p>
                          {option.description ? <p className="truncate text-xs text-slate-500">{option.description}</p> : null}
                        </div>
                        {isSelected ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : null}
                      </button>
                    )
                  })
                ) : (
                  <div className="px-3 py-6 text-center text-sm text-slate-500">{t('common.noResults', 'No results found.')}</div>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
