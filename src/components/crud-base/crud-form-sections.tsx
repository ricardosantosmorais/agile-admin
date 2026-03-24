'use client'

import { BooleanChoice } from '@/src/components/ui/boolean-choice'
import { DateInput } from '@/src/components/ui/date-input'
import { FormField } from '@/src/components/ui/form-field'
import { IconPickerField } from '@/src/components/ui/icon-picker-field'
import { ImageUploadField } from '@/src/components/ui/image-upload-field'
import { inputClasses } from '@/src/components/ui/input-styles'
import { LookupSelect } from '@/src/components/ui/lookup-select'
import { RichTextEditor } from '@/src/components/ui/rich-text-editor'
import { SectionCard } from '@/src/components/ui/section-card'
import { TimeInput } from '@/src/components/ui/time-input'
import { loadCrudLookupOptions } from '@/src/components/crud-base/crud-client'
import type { CrudFieldOption, CrudModuleConfig, CrudOption, CrudRecord } from '@/src/components/crud-base/types'
import { useI18n } from '@/src/i18n/use-i18n'
import { cepMask, cnpjMask, cpfMask, currencyMask, decimalMask, phoneMask } from '@/src/lib/input-masks'

function resolveOptionLabel(option: CrudFieldOption, t: ReturnType<typeof useI18n>['t']) {
  return 'labelKey' in option ? t(option.labelKey, option.label) : option.label
}

function applyMask(mask: NonNullable<CrudModuleConfig['sections'][number]['fields'][number]['mask']>, value: string) {
  switch (mask) {
    case 'cpf':
      return cpfMask(value)
    case 'cnpj':
      return cnpjMask(value)
    case 'phone':
      return phoneMask(value)
    case 'mobile':
      return phoneMask(value, true)
    case 'cep':
      return cepMask(value)
    case 'currency':
      return currencyMask(value)
    case 'decimal':
      return decimalMask(value)
    default:
      return value
  }
}

function renderBooleanField({
  value,
  readOnly,
  onChange,
  t,
}: {
  value: unknown
  readOnly: boolean
  onChange: (value: boolean) => void
  t: ReturnType<typeof useI18n>['t']
}) {
  const checked = value === true || value === 1 || value === '1'

  return (
    <BooleanChoice
      value={checked}
      onChange={onChange}
      disabled={readOnly}
      trueLabel={t('common.yes', 'Yes')}
      falseLabel={t('common.no', 'No')}
    />
  )
}

function withAdornment(control: React.ReactNode, prefixText?: string, suffixText?: string) {
  if (!prefixText && !suffixText) {
    return control
  }

  return (
    <div className="flex overflow-hidden rounded-[0.9rem] border border-[#e6dfd3] bg-white">
      {prefixText ? <span className="inline-flex items-center border-r border-[#e6dfd3] bg-[#fcfaf5] px-3 text-sm font-semibold text-slate-600">{prefixText}</span> : null}
      <div className="min-w-0 flex-1 [&>input]:rounded-none [&>input]:border-0 [&>input]:shadow-none [&>input]:focus:ring-0">{control}</div>
      {suffixText ? <span className="inline-flex items-center border-l border-[#e6dfd3] bg-[#fcfaf5] px-3 text-sm font-semibold text-slate-600">{suffixText}</span> : null}
    </div>
  )
}

type CrudFormSectionsProps = {
  config: CrudModuleConfig
  form: CrudRecord
  readOnly: boolean
  patch: (key: string, value: unknown) => void
  optionsMap: Record<string, CrudOption[]>
  sectionIds?: string[]
}

export function CrudFormSections({
  config,
  form,
  readOnly,
  patch,
  optionsMap,
  sectionIds,
}: CrudFormSectionsProps) {
  const { t } = useI18n()
  const sections = sectionIds?.length
    ? config.sections.filter((section) => sectionIds.includes(section.id))
    : config.sections

  return (
    <>
      {sections.map((section) => (
        <SectionCard key={section.id} title={t(section.titleKey, section.title)}>
          <div
            className={
              section.layout === 'stacked'
                ? 'flex max-w-4xl flex-col gap-4'
                : section.layout === 'rows'
                  ? 'max-w-none space-y-7'
                  : 'grid gap-3 md:grid-cols-12'
            }
          >
            {section.fields.filter((field) => !(field.hidden?.({ form, isEditing: Boolean(form.id) }) ?? false)).map((field) => {
              const label = t(field.labelKey, field.label)
              const value = form[field.key]
              const disabled = typeof field.disabled === 'function'
                ? field.disabled({ form, isEditing: Boolean(form.id) })
                : Boolean(field.disabled)
              const fieldClassName = field.layoutClassName ?? (
                section.layout === 'rows'
                  ? 'w-full'
                  : section.layout === 'stacked'
                    ? 'w-full'
                    : field.type === 'textarea'
                      ? 'md:col-span-12'
                      : field.type === 'toggle'
                        ? 'md:col-span-4 xl:col-span-3'
                        : field.type === 'number' || field.key === 'codigo' || field.type === 'color'
                          ? 'md:col-span-4'
                          : field.type === 'email'
                            ? 'md:col-span-6'
                            : 'md:col-span-8 lg:col-span-6'
              )

              if (field.type === 'toggle') {
                if (section.layout === 'rows') {
                  return (
                    <div key={field.key} className="grid items-center gap-3 md:grid-cols-[180px_minmax(0,360px)] md:gap-8">
                      <div className="text-[13px] font-medium text-slate-700">{label}</div>
                      <div className={fieldClassName}>
                        {renderBooleanField({
                          value,
                          readOnly: readOnly || disabled,
                          onChange: (nextValue) => patch(field.key, nextValue),
                          t,
                        })}
                        {field.helperTextKey || field.helperText ? (
                          <p className="mt-1.5 text-xs text-slate-500">
                            {field.helperTextKey ? t(field.helperTextKey, field.helperText || '') : field.helperText}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={field.key} className={fieldClassName}>
                    {renderBooleanField({
                      value,
                      readOnly: readOnly || disabled,
                      onChange: (nextValue) => patch(field.key, nextValue),
                      t,
                    })}
                  </div>
                )
              }

              const options = field.options?.map((option) => ({ value: option.value, label: resolveOptionLabel(option, t) })) ?? optionsMap[field.key] ?? []
              const fieldControl = field.type === 'textarea' ? (
                <textarea rows={field.rows ?? 10} value={String(value ?? '')} onChange={(event) => patch(field.key, event.target.value)} className={`${inputClasses()} min-h-[220px] resize-y`} disabled={readOnly || disabled} placeholder={field.placeholder} />
              ) : field.type === 'richtext' ? (
                <RichTextEditor value={String(value ?? '')} onChange={(nextValue) => patch(field.key, nextValue)} disabled={readOnly || disabled} />
              ) : field.type === 'lookup' ? (
                <LookupSelect
                  label={label}
                  value={
                    (() => {
                      const stateKey = field.lookupStateKey ?? `${field.key}_lookup`
                      const selected = form[stateKey]
                      if (selected && typeof selected === 'object' && selected !== null && 'id' in selected && 'label' in selected) {
                        return {
                          id: String((selected as { id: unknown }).id ?? ''),
                          label: String((selected as { label: unknown }).label ?? ''),
                        }
                      }

                      const matched = options.find((option) => option.value === String(value ?? ''))
                      if (matched) {
                        return { id: matched.value, label: matched.label }
                      }

                      if (value !== '' && value !== null && value !== undefined) {
                        return { id: String(value), label: String(value) }
                      }

                      return null
                    })()
                  }
                  onChange={(nextValue) => {
                    patch(field.key, nextValue?.id ?? '')
                    patch(field.lookupStateKey ?? `${field.key}_lookup`, nextValue ? { id: nextValue.id, label: nextValue.label } : null)
                  }}
                  loadOptions={async (query, page, perPage) => {
                    if (field.optionsResource) {
                      const remoteOptions = await loadCrudLookupOptions(field.optionsResource, query, page, perPage)
                      return remoteOptions.map((option) => ({
                        id: option.value,
                        label: option.label,
                      }))
                    }

                    const normalizedQuery = query.trim().toLowerCase()
                    const filtered = normalizedQuery
                      ? options.filter((option) => option.label.toLowerCase().includes(normalizedQuery))
                      : options
                    const start = (page - 1) * perPage
                    return filtered.slice(start, start + perPage).map((option) => ({
                      id: option.value,
                      label: option.label,
                    }))
                  }}
                  disabled={readOnly || disabled}
                />
              ) : field.type === 'select' ? (
                <>
                  <select value={String(value ?? '')} onChange={(event) => patch(field.key, event.target.value)} className={inputClasses()} disabled={readOnly || disabled}>
                    <option value="">{t('common.select', 'Select')}</option>
                    {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  {field.helperTextKey || field.helperText ? <span className="text-xs text-slate-500">{field.helperTextKey ? t(field.helperTextKey, field.helperText || '') : field.helperText}</span> : null}
                </>
              ) : field.type === 'color' ? (
                <div className="flex max-w-md items-center gap-3.5">
                  <input
                    type="text"
                    value={String(value ?? '')}
                    onChange={(event) => patch(field.key, event.target.value)}
                    className={inputClasses()}
                    disabled={readOnly || disabled}
                    placeholder={field.placeholder}
                    inputMode={field.inputMode}
                  />
                  <label className="relative inline-flex h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-[0.9rem] border border-[#e6dfd3] bg-white p-1">
                    <input
                      type="color"
                      value={typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value) ? value : '#000000'}
                      onChange={(event) => patch(field.key, event.target.value.toUpperCase())}
                      disabled={readOnly || disabled}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                    <span className="block h-full w-full rounded-[0.65rem] border border-black/5" style={{ backgroundColor: typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value) ? value : '#d4d4d8' }} />
                  </label>
                </div>
              ) : field.type === 'image' ? (
                <div className="max-w-3xl">
                  <ImageUploadField
                    value={String(value ?? '')}
                    onChange={(nextValue) => patch(field.key, nextValue)}
                    disabled={readOnly || disabled}
                  />
                </div>
              ) : field.type === 'icon' ? (
                <div className="max-w-3xl">
                  <IconPickerField
                    value={String(value ?? '')}
                    onChange={(nextValue) => patch(field.key, nextValue)}
                    disabled={readOnly || disabled}
                  />
                </div>
              ) : field.type === 'date' ? (
                <>
                  <DateInput
                    value={String(value ?? '')}
                    onChange={(event) => patch(field.key, event.target.value)}
                    disabled={readOnly || disabled}
                  />
                  {field.helperTextKey || field.helperText ? <span className="text-xs text-slate-500">{field.helperTextKey ? t(field.helperTextKey, field.helperText || '') : field.helperText}</span> : null}
                </>
              ) : field.type === 'time' ? (
                <>
                  <TimeInput
                    value={String(value ?? '')}
                    onChange={(event) => patch(field.key, event.target.value)}
                    disabled={readOnly || disabled}
                  />
                  {field.helperTextKey || field.helperText ? <span className="text-xs text-slate-500">{field.helperTextKey ? t(field.helperTextKey, field.helperText || '') : field.helperText}</span> : null}
                </>
              ) : (
                <>
                  {withAdornment(
                    <input
                      type={field.type}
                      value={String(value ?? '')}
                      onChange={(event) => patch(field.key, field.mask ? applyMask(field.mask, event.target.value) : event.target.value)}
                      className={inputClasses()}
                      disabled={readOnly || disabled}
                      placeholder={field.placeholder}
                      inputMode={field.inputMode}
                      maxLength={field.maxLength}
                    />,
                    field.prefixText,
                    field.suffixText,
                  )}
                  {field.helperTextKey || field.helperText ? <span className="text-xs text-slate-500">{field.helperTextKey ? t(field.helperTextKey, field.helperText || '') : field.helperText}</span> : null}
                </>
              )

              if (section.layout === 'rows') {
                return (
                  <div key={field.key} className="grid items-start gap-3 md:grid-cols-[180px_minmax(0,1fr)] md:gap-8">
                    <div className="pt-2.5 text-[13px] font-medium text-slate-700">{label}</div>
                    <div className={fieldClassName}>
                      {fieldControl}
                    </div>
                  </div>
                )
              }

              return (
                <FormField key={field.key} label={label} className={fieldClassName}>
                  {fieldControl}
                </FormField>
              )
            })}
          </div>
        </SectionCard>
      ))}
    </>
  )
}
