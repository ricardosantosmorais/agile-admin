'use client'

import { inputClasses } from '@/src/components/ui/input-styles'
import { currencyMask } from '@/src/lib/input-masks'

type CurrencyInputProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  prefix?: string
  placeholder?: string
}

export function CurrencyInput({
  value,
  onChange,
  disabled = false,
  prefix = 'R$',
  placeholder,
}: CurrencyInputProps) {
  return (
    <div
      className="flex overflow-hidden rounded-[0.9rem] border border-[#e6dfd3] bg-white"
      onClick={(event) => event.stopPropagation()}
    >
      <span className="inline-flex items-center border-r border-[#e6dfd3] bg-[#fcfaf5] px-3 text-sm font-semibold text-slate-600">
        {prefix}
      </span>
      <div className="min-w-0 flex-1 [&>input]:rounded-none [&>input]:border-0 [&>input]:shadow-none [&>input]:focus:ring-0">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(currencyMask(event.target.value))}
          className={inputClasses()}
          disabled={disabled}
          placeholder={placeholder}
          onClick={(event) => event.stopPropagation()}
        />
      </div>
    </div>
  )
}
