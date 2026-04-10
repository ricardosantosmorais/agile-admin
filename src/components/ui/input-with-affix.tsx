'use client'

import type { InputHTMLAttributes } from 'react'
import { inputClasses } from '@/src/components/ui/input-styles'

type InputWithAffixProps = InputHTMLAttributes<HTMLInputElement> & {
  prefix?: string
  suffix?: string
}

export function InputWithAffix({
  prefix,
  suffix,
  className = '',
  ...props
}: InputWithAffixProps) {
  return (
    <div className="app-control flex w-full overflow-hidden rounded-[0.9rem]">
      {prefix ? (
        <span className="app-control-muted inline-flex items-center border-r border-[color:var(--app-control-border)] px-3 text-sm font-semibold text-[color:var(--app-muted)]">
          {prefix}
        </span>
      ) : null}
      <input
        {...props}
        className={[
          inputClasses(),
          'rounded-none border-0 shadow-none focus:ring-0',
          className,
        ].join(' ').trim()}
      />
      {suffix ? (
        <span className="app-control-muted inline-flex items-center border-l border-[color:var(--app-control-border)] px-3 text-sm font-semibold text-[color:var(--app-muted)]">
          {suffix}
        </span>
      ) : null}
    </div>
  )
}
