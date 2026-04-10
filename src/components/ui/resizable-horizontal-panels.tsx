'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

type ResizableHorizontalPanelsProps = {
  left: ReactNode
  right: ReactNode
  initialLeftPercentage?: number
  leftPercentage?: number
  onLeftPercentageChange?: (value: number) => void
  minLeftPx?: number
  minRightPx?: number
  height?: string
  className?: string
  minHeightClassName?: string
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function ResizableHorizontalPanels({
  left,
  right,
  initialLeftPercentage = 32,
  leftPercentage,
  onLeftPercentageChange,
  minLeftPx = 260,
  minRightPx = 420,
  height = 'clamp(620px, 72vh, 860px)',
  className = '',
  minHeightClassName = 'min-h-[620px]',
}: ResizableHorizontalPanelsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [internalLeftPercentage, setInternalLeftPercentage] = useState(initialLeftPercentage)
  const [isDragging, setIsDragging] = useState(false)
  const resolvedLeftPercentage = leftPercentage ?? internalLeftPercentage

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
      const availableWidth = bounds.width
      const nextLeftPx = event.clientX - bounds.left
      const minLeftPercentage = (minLeftPx / availableWidth) * 100
      const maxLeftPercentage = 100 - (minRightPx / availableWidth) * 100
      const nextPercentage = clamp((nextLeftPx / availableWidth) * 100, minLeftPercentage, maxLeftPercentage)

      if (leftPercentage === undefined) {
        setInternalLeftPercentage(nextPercentage)
      }

      onLeftPercentageChange?.(nextPercentage)
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
  }, [isDragging, leftPercentage, minLeftPx, minRightPx, onLeftPercentageChange])

  return (
    <div
      ref={containerRef}
      className={`app-pane flex ${minHeightClassName} flex-row overflow-hidden rounded-[1.2rem] ${className}`.trim()}
      style={{ height }}
    >
      <div
        className="min-h-0 min-w-[280px] shrink-0 overflow-hidden"
        style={{ width: `${resolvedLeftPercentage}%` }}
      >
        {left}
      </div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Redimensionar painéis"
        onPointerDown={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        className={[
          'app-pane-muted group relative flex w-4 shrink-0 cursor-col-resize items-center justify-center',
          isDragging ? 'before:bg-[color:var(--app-text-muted)]' : 'before:bg-[color:var(--app-border)]',
          'before:h-full before:w-[2px] before:rounded-full before:content-[\'\']',
        ].join(' ')}
      >
        <span className="app-control absolute inline-flex h-14 w-2.5 items-center justify-center rounded-full shadow-sm">
          <span className="h-6 w-1 rounded-full bg-[color:var(--app-text-muted)]/50" />
        </span>
      </div>

      <div className="min-h-0 min-w-[420px] flex-1 overflow-hidden">
        {right}
      </div>
    </div>
  )
}
