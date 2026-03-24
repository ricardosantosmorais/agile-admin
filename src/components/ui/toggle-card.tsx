'use client'

type ToggleCardProps = {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
  hint?: string
}

export function ToggleCard({
  label,
  checked,
  onChange,
  disabled = false,
  hint,
}: ToggleCardProps) {
  return (
    <div className="rounded-[0.95rem] border border-[#ebe4d8] bg-[#fcfaf5] px-3.5 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          {hint ? <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p> : null}
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className={[
            'relative inline-flex h-7 w-12 shrink-0 rounded-full transition',
            checked ? 'bg-emerald-600' : 'bg-slate-300',
            disabled ? 'cursor-not-allowed opacity-60' : '',
          ].join(' ')}
        >
          <span
            className={[
              'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition',
              checked ? 'left-[1.45rem]' : 'left-0.5',
            ].join(' ')}
          />
        </button>
      </div>
    </div>
  )
}
