'use client'

import { CalendarDays } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'
import { inputClasses } from '@/src/components/ui/input-styles'

type DateInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  className?: string
}

export function DateInput({ className = '', ...props }: DateInputProps) {
  return (
    <div className="relative">
      <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        {...props}
        type="date"
        className={`${inputClasses()} pl-11 ${className}`.trim()}
      />
    </div>
  )
}
