'use client'

import { Check, ChevronDown, LoaderCircle, Search } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '@/src/i18n/use-i18n'

export type LookupOption = {
  id: string
  label: string
  description?: string
}

function dedupeLookupOptions<TOption extends LookupOption>(options: TOption[]) {
  const seen = new Set<string>()
  const deduped: TOption[] = []

  for (const option of options) {
    const key = `${option.id}::${option.label}::${option.description ?? ''}`
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    deduped.push(option)
  }

  return deduped
}

type LookupSelectProps<TOption extends LookupOption> = {
  label: string
  value: TOption | null
  onChange: (value: TOption | null) => void
  loadOptions: (query: string, page: number, perPage: number) => Promise<TOption[]>
  disabled?: boolean
  pageSize?: number
}

export function LookupSelect<TOption extends LookupOption>({
  label,
  value,
  onChange,
  loadOptions,
  disabled = false,
  pageSize = 15,
}: LookupSelectProps<TOption>) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState<TOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const listboxId = useId()
  const [dropdownStyle, setDropdownStyle] = useState<{
    top?: number
    bottom?: number
    left: number
    width: number
    maxHeight: number
  } | null>(null)

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
      setHighlightedIndex(-1)
      return
    }

    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true)
      try {
        const result = dedupeLookupOptions(await loadOptions(query, 1, pageSize))
        setOptions(result)
        setPage(1)
        setHasMore(result.length >= pageSize)
        setHighlightedIndex(result.length ? 0 : -1)
      } finally {
        setIsLoading(false)
      }
    }, 180)

    return () => window.clearTimeout(timeoutId)
  }, [loadOptions, open, pageSize, query])

  useEffect(() => {
    if (!open) {
      setDropdownStyle(null)
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
      const openUpwards = spaceBelow < 220 && spaceAbove > spaceBelow
      const availableSpace = Math.max(openUpwards ? spaceAbove : spaceBelow, 188)

      setDropdownStyle({
        top: openUpwards ? undefined : rect.bottom + offset,
        bottom: openUpwards ? window.innerHeight - rect.top + offset : undefined,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.min(availableSpace - offset, 320),
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

  async function loadMore() {
    if (!open || isLoading || !hasMore) {
      return
    }

    setIsLoading(true)
    try {
      const nextPage = page + 1
      const result = dedupeLookupOptions(await loadOptions(query, nextPage, pageSize))
      setOptions((current) => dedupeLookupOptions([...current, ...result]))
      setPage(nextPage)
      setHasMore(result.length >= pageSize)
      setHighlightedIndex((current) => (current >= 0 ? current : result.length ? 0 : -1))
    } finally {
      setIsLoading(false)
    }
  }

  function handleScroll() {
    const element = listRef.current
    if (!element) {
      return
    }

    const distanceToBottom = element.scrollHeight - element.scrollTop - element.clientHeight
    if (distanceToBottom < 80) {
      void loadMore()
    }
  }

  function commitSelection(nextValue: TOption | null) {
    setOpen(false)
    setQuery('')
    setOptions([])
    setPage(1)
    setHasMore(true)
    setHighlightedIndex(-1)
    onChange(nextValue)
  }

  function moveHighlight(direction: 1 | -1) {
    if (!options.length) {
      return
    }

    setHighlightedIndex((current) => {
      if (current < 0) {
        return direction > 0 ? 0 : options.length - 1
      }

      const nextIndex = current + direction
      if (nextIndex < 0) {
        return options.length - 1
      }

      if (nextIndex >= options.length) {
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
      setOpen(true)
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setOpen((current) => !current)
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
      setHighlightedIndex(options.length ? 0 : -1)
      return
    }

    if (event.key === 'End') {
      event.preventDefault()
      setHighlightedIndex(options.length ? options.length - 1 : -1)
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      if (highlightedIndex >= 0 && options[highlightedIndex]) {
        commitSelection(options[highlightedIndex])
      }
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      triggerRef.current?.focus()
    }
  }

  useEffect(() => {
    if (!open || highlightedIndex < 0) {
      return
    }

    const activeOption = listRef.current?.querySelector<HTMLElement>(`[data-option-index="${highlightedIndex}"]`)
    if (typeof activeOption?.scrollIntoView === 'function') {
      activeOption.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedIndex, open])

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        className="app-control flex w-full items-center justify-between gap-3 rounded-[1rem] px-3.5 py-3 text-left text-[15px] shadow-none disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="min-w-0 truncate">{value?.label || `${t('clientes.form.general.select', 'Select')} ${label.toLowerCase()}`}</span>
        <ChevronDown className={['h-4 w-4 shrink-0 text-[color:var(--app-muted)] transition', open ? 'rotate-180' : ''].join(' ')} />
      </button>

      {open && dropdownStyle && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={dropdownRef}
              style={dropdownStyle}
              className="app-table-shell fixed z-[240] rounded-[1.2rem] p-3 shadow-[0_22px_46px_rgba(15,23,42,0.12)]"
            >
              <div className="app-control-muted flex items-center gap-2 rounded-[0.95rem] px-3 py-2.5">
                <Search className="h-4 w-4 text-[color:var(--app-muted)]" />
                <input
                  ref={inputRef}
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={handleInputKeyDown}
                  role="combobox"
                  aria-expanded={open}
                  aria-controls={listboxId}
                  aria-autocomplete="list"
                  aria-activedescendant={highlightedIndex >= 0 ? `${listboxId}-option-${highlightedIndex}` : undefined}
                  className="w-full border-none bg-transparent text-[15px] text-[color:var(--app-text)] outline-none placeholder:text-[color:var(--app-muted)]"
                  placeholder={t('common.searchFor', 'Search {{label}}', { label: label.toLowerCase() })}
                />
              </div>

              <div
                id={listboxId}
                role="listbox"
                ref={listRef}
                onScroll={handleScroll}
                style={{ maxHeight: Math.max(dropdownStyle.maxHeight - 72, 112) }}
                className="mt-3 overflow-y-auto"
              >
                <button
                  type="button"
                  onPointerDown={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    commitSelection(null)
                  }}
                  className="flex w-full items-center gap-3 rounded-[0.95rem] px-3 py-2.5 text-left text-[15px] text-[color:var(--app-muted)] transition hover:bg-[color:var(--app-hover-surface)]"
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-[color:var(--app-control-border)] text-[10px]">
                    x
                  </span>
                  {t('common.clearSelection', 'Clear selection')}
                </button>

                {isLoading && !options.length ? (
                  <div className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-[color:var(--app-muted)]">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    {t('common.loadingOptions', 'Loading options...')}
                  </div>
                ) : options.length ? (
                  options.map((option) => {
                    const isSelected = option.id === value?.id
                    const optionIndex = options.findIndex((item) => item.id === option.id)
                    const isHighlighted = optionIndex === highlightedIndex
                    return (
                      <button
                        id={`${listboxId}-option-${optionIndex}`}
                        key={option.id || option.label}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        data-option-index={optionIndex}
                        onMouseEnter={() => setHighlightedIndex(optionIndex)}
                        onPointerDown={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          commitSelection(option)
                        }}
                        className={[
                          'flex w-full items-start justify-between gap-3 rounded-[0.95rem] px-3 py-2.5 text-left text-[15px] transition hover:bg-[color:var(--app-hover-surface)]',
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
                  <div className="px-3 py-6 text-center text-[15px] text-[color:var(--app-muted)]">{t('common.noResults', 'No results found.')}</div>
                )}

                {isLoading && options.length ? (
                  <div className="flex items-center justify-center gap-2 px-3 py-3 text-xs text-[color:var(--app-muted)]">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    {t('common.loadingMoreOptions', 'Loading more options...')}
                  </div>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
