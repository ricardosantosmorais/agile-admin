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
    <div className="flex w-full overflow-hidden rounded-[0.9rem] border border-[#e6dfd3] bg-white">
      {prefix ? (
        <span className="inline-flex items-center border-r border-[#e6dfd3] bg-[#fcfaf5] px-3 text-sm font-semibold text-slate-600">
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
        <span className="inline-flex items-center border-l border-[#e6dfd3] bg-[#fcfaf5] px-3 text-sm font-semibold text-slate-600">
          {suffix}
        </span>
      ) : null}
    </div>
  )
}
