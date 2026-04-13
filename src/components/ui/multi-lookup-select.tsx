'use client'

import { Check, ChevronDown, Search, X } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
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
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const listboxId = useId()
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

  function closeDropdown() {
    setOpen(false)
    setHighlightedIndex(-1)
  }

  function openDropdown() {
    setOpen(true)
    setHighlightedIndex(filteredOptions.length ? 0 : -1)
  }

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node
      if (!containerRef.current?.contains(target) && !dropdownRef.current?.contains(target)) {
        closeDropdown()
      }
    }

    window.addEventListener('pointerdown', handlePointerDown, true)
    return () => window.removeEventListener('pointerdown', handlePointerDown, true)
  }, [])

  useEffect(() => {
    if (!open) return

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

  function moveHighlight(direction: 1 | -1) {
    if (!filteredOptions.length) {
      return
    }

    setHighlightedIndex((current) => {
      if (current < 0) {
        return direction > 0 ? 0 : filteredOptions.length - 1
      }

      const nextIndex = current + direction
      if (nextIndex < 0) {
        return filteredOptions.length - 1
      }

      if (nextIndex >= filteredOptions.length) {
        return 0
      }

      return nextIndex
    })
  }

  function handleTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) {
      return
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      openDropdown()
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (open) {
        closeDropdown()
      } else {
        openDropdown()
      }
    }
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      moveHighlight(1)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      moveHighlight(-1)
      return
    }

    if (event.key === 'Home') {
      event.preventDefault()
      setHighlightedIndex(filteredOptions.length ? 0 : -1)
      return
    }

    if (event.key === 'End') {
      event.preventDefault()
      setHighlightedIndex(filteredOptions.length ? filteredOptions.length - 1 : -1)
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
        toggleValue(filteredOptions[highlightedIndex].id)
      }
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      closeDropdown()
      triggerRef.current?.focus()
    }
  }

  useEffect(() => {
    if (!open || highlightedIndex < 0) {
      return
    }

    const activeOption = listRef.current?.querySelector<HTMLElement>(`[data-option-index="${highlightedIndex}"]`)
    activeOption?.scrollIntoView({ block: 'nearest' })
  }, [highlightedIndex, open])

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (open) {
            closeDropdown()
          } else {
            openDropdown()
          }
        }}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        className="app-control flex min-h-[46px] w-full items-center justify-between gap-3 rounded-[1rem] px-3.5 py-2.5 text-left text-sm shadow-[inset_0_1px_0_var(--app-inset-highlight)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <div className="min-w-0 flex-1">
          {selectedOptions.length ? (
            <div className="flex flex-wrap gap-1.5">
              {selectedOptions.slice(0, 3).map((option) => (
                <span key={option.id} className="app-button-secondary inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-xs font-medium">
                  <span className="truncate">{option.label}</span>
                </span>
              ))}
              {selectedOptions.length > 3 ? (
                <span className="app-control-muted inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium text-[color:var(--app-muted)]">
                  +{selectedOptions.length - 3}
                </span>
              ) : null}
            </div>
          ) : (
            <span className="text-[color:var(--app-muted)]">
              {placeholder || t('common.searchFor', 'Search {{label}}', { label: label.toLowerCase() })}
            </span>
          )}
        </div>
        <ChevronDown className={['h-4 w-4 shrink-0 text-[color:var(--app-muted)] transition', open ? 'rotate-180' : ''].join(' ')} />
      </button>

      {open && dropdownStyle && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={dropdownRef}
              style={dropdownStyle}
              className="app-card-modern fixed z-[240] rounded-[1.2rem] p-3 shadow-[0_22px_46px_rgba(15,23,42,0.12)]"
            >
              <div className="app-control-muted flex items-center gap-2 rounded-[0.95rem] px-3 py-2.5">
                <Search className="h-4 w-4 text-[color:var(--app-muted)]" />
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => {
                    const nextQuery = event.target.value
                    setQuery(nextQuery)
                    const nextFilteredOptions = options.filter((option) => {
                      const haystack = `${option.label} ${option.description ?? ''}`.toLowerCase()
                      return haystack.includes(nextQuery.trim().toLowerCase())
                    })
                    setHighlightedIndex(nextFilteredOptions.length ? 0 : -1)
                  }}
                  onKeyDown={handleInputKeyDown}
                  role="combobox"
                  aria-expanded={open}
                  aria-controls={listboxId}
                  aria-autocomplete="list"
                  aria-activedescendant={highlightedIndex >= 0 ? `${listboxId}-option-${highlightedIndex}` : undefined}
                  className="w-full border-none bg-transparent text-sm text-[color:var(--app-text)] outline-none placeholder:text-[color:var(--app-muted)]"
                  placeholder={t('common.searchFor', 'Search {{label}}', { label: label.toLowerCase() })}
                />
                {query ? (
                  <button type="button" onClick={() => setQuery('')} className="text-[color:var(--app-muted)] transition hover:text-[color:var(--app-text)]">
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <div
                id={listboxId}
                role="listbox"
                ref={listRef}
                style={{ maxHeight: Math.max(dropdownStyle.maxHeight - 72, 132) }}
                className="mt-3 overflow-y-auto"
              >
                <button
                  type="button"
                  onPointerDown={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    onChange([])
                    setHighlightedIndex(filteredOptions.length ? 0 : -1)
                  }}
                  className="flex w-full items-center gap-3 rounded-[0.95rem] px-3 py-2.5 text-left text-sm text-[color:var(--app-muted)] transition hover:bg-[color:var(--app-hover-surface)]"
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-[color:var(--app-control-border)] text-[10px]">x</span>
                  {t('common.clearSelection', 'Clear selection')}
                </button>

                {filteredOptions.length ? (
                  filteredOptions.map((option) => {
                    const isSelected = values.includes(option.id)
                    const optionIndex = filteredOptions.findIndex((item) => item.id === option.id)
                    const isHighlighted = optionIndex === highlightedIndex
                    return (
                      <button
                        id={`${listboxId}-option-${optionIndex}`}
                        key={option.id}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        data-option-index={optionIndex}
                        onMouseEnter={() => setHighlightedIndex(optionIndex)}
                        onPointerDown={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          toggleValue(option.id)
                        }}
                        className={[
                          'flex w-full items-start justify-between gap-3 rounded-[0.95rem] px-3 py-2.5 text-left text-sm transition hover:bg-[color:var(--app-hover-surface)]',
                          isHighlighted ? 'bg-[color:var(--app-hover-surface)]' : '',
                        ].join(' ')}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[color:var(--app-text)]">{option.label}</p>
                          {option.description ? <p className="truncate text-xs text-[color:var(--app-muted)]">{option.description}</p> : null}
                        </div>
                        {isSelected ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : null}
                      </button>
                    )
                  })
                ) : (
                  <div className="px-3 py-6 text-center text-sm text-[color:var(--app-muted)]">{t('common.noResults', 'No results found.')}</div>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
