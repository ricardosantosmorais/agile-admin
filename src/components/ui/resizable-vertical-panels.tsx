'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

type ResizableVerticalPanelsProps = {
  top: ReactNode
  bottom: ReactNode
  initialTopPercentage?: number
  topPercentage?: number
  onTopPercentageChange?: (value: number) => void
  minTopPx?: number
  minBottomPx?: number
  height?: string
  className?: string
  minHeightClassName?: string
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function ResizableVerticalPanels({
  top,
  bottom,
  initialTopPercentage = 42,
  topPercentage,
  onTopPercentageChange,
  minTopPx = 180,
  minBottomPx = 220,
  height = 'calc(100vh - 270px)',
  className = '',
  minHeightClassName = 'min-h-[620px]',
}: ResizableVerticalPanelsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [internalTopPercentage, setInternalTopPercentage] = useState(initialTopPercentage)
  const [isDragging, setIsDragging] = useState(false)
  const resolvedTopPercentage = topPercentage ?? internalTopPercentage

  useEffect(() => {
    if (!isDragging) {
      return
    }

    function handlePointerMove(event: PointerEvent) {
      const container = containerRef.current
      if (!container) {
        return
      }

      const bounds = container.getBoundingClientRect()
      const availableHeight = bounds.height
      const nextTopPx = event.clientY - bounds.top
      const minTopPercentage = (minTopPx / availableHeight) * 100
      const maxTopPercentage = 100 - (minBottomPx / availableHeight) * 100
      const nextPercentage = clamp((nextTopPx / availableHeight) * 100, minTopPercentage, maxTopPercentage)

      if (topPercentage === undefined) {
        setInternalTopPercentage(nextPercentage)
      }
      onTopPercentageChange?.(nextPercentage)
    }

    function handlePointerUp() {
      setIsDragging(false)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    document.body.style.userSelect = 'none'

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      document.body.style.userSelect = ''
    }
  }, [isDragging, minBottomPx, minTopPx, onTopPercentageChange, topPercentage])

  return (
    <div
      ref={containerRef}
      className={`app-pane-muted flex ${minHeightClassName} flex-col overflow-hidden rounded-[1.2rem] ${className}`.trim()}
      style={{ height }}
    >
      <div className="min-h-0 overflow-hidden" style={{ flexBasis: `${resolvedTopPercentage}%` }}>
        {top}
      </div>

      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label="Redimensionar painéis"
        onPointerDown={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        className={[
          'group relative flex h-4 cursor-row-resize items-center justify-center bg-[color:var(--app-control-muted-bg)]',
          isDragging ? 'before:bg-slate-950' : 'before:bg-[color:var(--app-control-border)]',
          'before:h-[2px] before:w-full before:rounded-full before:content-[\'\']',
        ].join(' ')}
      >
        <span className="app-control absolute inline-flex h-2.5 w-14 items-center justify-center rounded-full shadow-sm">
          <span className="h-1 w-6 rounded-full bg-[color:var(--app-control-border)]" />
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {bottom}
      </div>
    </div>
  )
}
