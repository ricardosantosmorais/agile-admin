'use client'

import { Minus, Plus } from 'lucide-react'
import { SectionCard } from '@/src/components/ui/section-card'
import { FormRow } from '@/src/components/ui/form-row'
import { inputClasses } from '@/src/components/ui/input-styles'
import { useI18n } from '@/src/i18n/use-i18n'

type GradeOptionsSectionProps = {
  values: string[]
  readOnly: boolean
  onChange: (nextValues: string[]) => void
}

export function GradeOptionsSection({
  values,
  readOnly,
  onChange,
}: GradeOptionsSectionProps) {
  const { t } = useI18n()

  function updateOption(index: number, value: string) {
    const next = [...values]
    next[index] = value
    onChange(next)
  }

  function addOption() {
    onChange([...values, ''])
  }

  function removeOption() {
    if (values.length <= 1) {
      return
    }
    onChange(values.slice(0, -1))
  }

  return (
    <SectionCard
      title={t('catalog.grades.options.title', 'Options')}
      action={!readOnly ? (
        <div className="flex gap-2">
          <button type="button" onClick={removeOption} className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-semibold text-slate-700">
            <Minus className="h-4 w-4" />
            {t('common.remove', 'Remove')}
          </button>
          <button type="button" onClick={addOption} className="inline-flex h-10 items-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-semibold text-white">
            <Plus className="h-4 w-4" />
            {t('common.add', 'Add')}
          </button>
        </div>
      ) : null}
    >
      <div className="space-y-7">
        {values.map((value, index) => (
          <FormRow key={`opcao-${index + 1}`} label={t('catalog.grades.options.option', 'Option {{index}}', { index: index + 1 })}>
            <input
              type="text"
              value={value}
              onChange={(event) => updateOption(index, event.target.value)}
              className={inputClasses()}
              disabled={readOnly}
              maxLength={32}
            />
          </FormRow>
        ))}
      </div>
    </SectionCard>
  )
}
