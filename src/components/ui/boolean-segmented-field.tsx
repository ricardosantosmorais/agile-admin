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
        {t('common.yes', 'Yes')}
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
        {t('common.no', 'No')}
      </button>
    </div>
  )
}
