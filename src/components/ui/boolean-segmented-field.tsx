'use client'

import { useI18n } from '@/src/i18n/use-i18n'

type BooleanSegmentedFieldProps = {
  value: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}

export function BooleanSegmentedField({ value, onChange, disabled = false }: BooleanSegmentedFieldProps) {
  const { t } = useI18n()

  return (
    <div className="app-control-muted inline-flex rounded-[1rem] p-1 shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(true)}
        className={[
          'rounded-[0.8rem] px-5 py-2 text-sm font-semibold transition',
          value ? 'bg-emerald-600 text-white shadow-[0_10px_18px_rgba(5,150,105,0.24)]' : 'text-[color:var(--app-muted)]',
          disabled ? 'cursor-not-allowed opacity-60' : '',
        ].join(' ')}
      >
        {t('common.yes', 'Yes')}
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(false)}
        className={[
          'rounded-[0.8rem] px-5 py-2 text-sm font-semibold transition',
          !value ? 'app-control text-[color:var(--app-text)] shadow-[0_8px_14px_rgba(15,23,42,0.08)]' : 'text-[color:var(--app-muted)]',
          disabled ? 'cursor-not-allowed opacity-60' : '',
        ].join(' ')}
      >
        {t('common.no', 'No')}
      </button>
    </div>
  )
}
