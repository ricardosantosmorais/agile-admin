'use client'

import { cloneElement, isValidElement, useId, useRef, useState, type ReactElement, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

const TOOLTIP_MARGIN = 16
const TOOLTIP_MAX_WIDTH = 352

type TooltipIconButtonProps = {
  label: string
  children: ReactNode
}

export function TooltipIconButton({ label, children }: TooltipIconButtonProps) {
  const triggerRef = useRef<HTMLDivElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ left: 0, top: 0 })
  const tooltipId = useId()

  function updatePosition() {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return

    const viewportWidth = window.innerWidth
    const width = Math.min(TOOLTIP_MAX_WIDTH, viewportWidth - TOOLTIP_MARGIN * 2)
    const halfWidth = width / 2
    const preferredLeft = rect.left + (rect.width / 2)
    const safeLeft = Math.min(Math.max(preferredLeft, TOOLTIP_MARGIN + halfWidth), viewportWidth - TOOLTIP_MARGIN - halfWidth)

    setPosition({
      left: safeLeft,
      top: rect.bottom + 8,
    })
  }

  return (
    <div
      ref={triggerRef}
      className="relative"
      onMouseEnter={() => {
        updatePosition()
        setIsOpen(true)
      }}
      onMouseLeave={() => setIsOpen(false)}
      onFocusCapture={() => {
        updatePosition()
        setIsOpen(true)
      }}
      onBlurCapture={() => setIsOpen(false)}
    >
      {isValidElement(children)
        ? cloneElement(children as ReactElement<{ 'aria-describedby'?: string }>, {
            'aria-describedby': isOpen ? tooltipId : undefined,
          })
        : children}
      {typeof document !== 'undefined' && isOpen
        ? createPortal(
            <div
              id={tooltipId}
              role="tooltip"
              className="pointer-events-none fixed z-[120] max-w-[calc(100vw-2rem)] -translate-x-1/2 whitespace-normal rounded-lg bg-slate-950 px-2.5 py-1.5 text-left text-[11px] font-semibold leading-snug text-white shadow-xl sm:max-w-[22rem]"
              style={{ left: `${position.left}px`, top: `${position.top}px` }}
            >
              {label}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
