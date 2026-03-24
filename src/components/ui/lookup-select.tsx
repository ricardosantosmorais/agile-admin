'use client'

import { Check, ChevronDown, LoaderCircle, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '@/src/i18n/use-i18n'

export type LookupOption = {
  id: string
  label: string
  description?: string
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
  const containerRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const suppressFetchRef = useRef(false)
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
      return
    }

    if (suppressFetchRef.current) {
      suppressFetchRef.current = false
      return
    }

    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true)
      try {
        const result = await loadOptions(query, 1, pageSize)
        setOptions(result)
        setPage(1)
        setHasMore(result.length >= pageSize)
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
      const result = await loadOptions(query, nextPage, pageSize)
      setOptions((current) => [...current, ...result])
      setPage(nextPage)
      setHasMore(result.length >= pageSize)
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
    suppressFetchRef.current = true
    setOpen(false)
    setQuery('')
    setOptions([])
    setPage(1)
    setHasMore(true)
    onChange(nextValue)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 rounded-[1rem] border border-[#e6dfd3] bg-white px-3.5 py-3 text-left text-sm text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
      >
        <span className="min-w-0 truncate">{value?.label || `${t('clientes.form.general.select', 'Select')} ${label.toLowerCase()}`}</span>
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
              </div>

              <div
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
                  className="flex w-full items-center gap-3 rounded-[0.95rem] px-3 py-2.5 text-left text-sm text-slate-600 transition hover:bg-[#fcfaf5]"
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-slate-300 text-[10px]">
                    x
                  </span>
                  {t('common.clearSelection', 'Clear selection')}
                </button>

                {isLoading && !options.length ? (
                  <div className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-slate-500">
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    {t('common.loadingOptions', 'Loading options...')}
                  </div>
                ) : options.length ? (
                  options.map((option) => {
                    const isSelected = option.id === value?.id
                    return (
                      <button
                        key={option.id || option.label}
                        type="button"
                        onPointerDown={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          commitSelection(option)
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

                {isLoading && options.length ? (
                  <div className="flex items-center justify-center gap-2 px-3 py-3 text-xs text-slate-500">
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
