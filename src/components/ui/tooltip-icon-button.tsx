'use client'

import { cloneElement, isValidElement, useId, useRef, useState, type ReactElement, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

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

    setPosition({
      left: rect.left + (rect.width / 2),
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
              className="pointer-events-none fixed z-[120] -translate-x-1/2 rounded-lg bg-slate-950 px-2.5 py-1 text-[11px] font-semibold text-white shadow-xl"
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
