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
      className="app-control flex overflow-hidden rounded-[0.9rem]"
      onClick={(event) => event.stopPropagation()}
    >
      <span className="app-control-muted inline-flex items-center border-r border-[color:var(--app-control-border)] px-3 text-sm font-semibold text-[color:var(--app-muted)]">
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
