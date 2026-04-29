'use client'

type BooleanChoiceProps = {
  value: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
  trueLabel?: string
  falseLabel?: string
}

export function BooleanChoice({
  value,
  onChange,
  disabled = false,
  trueLabel = 'Sim',
  falseLabel = 'Nao',
}: BooleanChoiceProps) {
  return (
    <div className="app-control inline-flex rounded-[1rem] p-1">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(true)}
        className={[
          'rounded-[0.8rem] px-5 py-2 text-[15px] font-semibold transition',
          value ? 'bg-emerald-600 text-white shadow-sm' : 'text-[color:var(--app-text-muted)] hover:text-[color:var(--app-text)]',
          disabled ? 'cursor-not-allowed opacity-60' : '',
        ].join(' ')}
      >
        {trueLabel}
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(false)}
        className={[
          'rounded-[0.8rem] px-5 py-2 text-[15px] font-semibold transition',
          !value ? 'app-button-secondary text-[color:var(--app-text)] shadow-none' : 'text-[color:var(--app-text-muted)] hover:text-[color:var(--app-text)]',
          disabled ? 'cursor-not-allowed opacity-60' : '',
        ].join(' ')}
      >
        {falseLabel}
      </button>
    </div>
  )
}
