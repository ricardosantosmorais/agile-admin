'use client'

import { Clock3 } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'
import { inputClasses } from '@/src/components/ui/input-styles'

type TimeInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  className?: string
}

export function TimeInput({ className = '', step = 60, ...props }: TimeInputProps) {
  return (
    <div className="relative">
      <Clock3 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        {...props}
        type="time"
        step={step}
        className={`${inputClasses()} pl-11 ${className}`.trim()}
      />
    </div>
  )
}
