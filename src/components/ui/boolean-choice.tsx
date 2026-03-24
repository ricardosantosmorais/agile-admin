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
    <div className="inline-flex rounded-[1rem] border border-[#e6dfd3] bg-white p-1">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(true)}
        className={[
          'rounded-[0.8rem] px-5 py-2 text-sm font-semibold transition',
          value ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-700',
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
          'rounded-[0.8rem] px-5 py-2 text-sm font-semibold transition',
          !value ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-700',
          disabled ? 'cursor-not-allowed opacity-60' : '',
        ].join(' ')}
      >
        {falseLabel}
      </button>
    </div>
  )
}
