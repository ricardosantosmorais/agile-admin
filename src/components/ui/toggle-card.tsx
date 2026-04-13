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
    <div className="app-control-muted rounded-[0.95rem] px-3.5 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[color:var(--app-text)]">{label}</p>
          {hint ? <p className="mt-0.5 text-[11px] text-[color:var(--app-muted)]">{hint}</p> : null}
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className={[
            'relative inline-flex h-7 w-12 shrink-0 rounded-full transition',
            checked ? 'bg-emerald-600' : 'bg-[color:var(--app-control-border)]',
            disabled ? 'cursor-not-allowed opacity-60' : '',
          ].join(' ')}
        >
          <span
            className={[
              'absolute top-0.5 h-6 w-6 rounded-full bg-[color:var(--app-panel-solid)] shadow-sm transition',
              checked ? 'left-[1.45rem]' : 'left-0.5',
            ].join(' ')}
          />
        </button>
      </div>
    </div>
  )
}
