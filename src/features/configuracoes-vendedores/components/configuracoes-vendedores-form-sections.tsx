'use client'

import { FormField } from '@/src/components/ui/form-field'
import { inputClasses } from '@/src/components/ui/input-styles'
import { SectionCard } from '@/src/components/ui/section-card'
import { configuracoesTimeOptionsFrom, configuracoesTimeOptionsTo } from '@/src/features/configuracoes-vendedores/services/configuracoes-time-options'
import type {
  ConfiguracoesVendedoresFieldDefinition,
  ConfiguracoesVendedoresFormValues,
  ConfiguracoesVendedoresScheduleDay,
} from '@/src/features/configuracoes-vendedores/types/configuracoes-vendedores'
import { formatDateTime } from '@/src/lib/date-time'

type FieldMetadata = {
  updatedAt: string
  updatedBy: string
}

type SectionMeta = {
  key: string
  title: string
  description: string
}

type Props = {
  sectionOrder: SectionMeta[]
  fieldDefinitions: ConfiguracoesVendedoresFieldDefinition[]
  scheduleDays: ConfiguracoesVendedoresScheduleDay[]
  values: ConfiguracoesVendedoresFormValues
  metadata: Partial<Record<keyof ConfiguracoesVendedoresFormValues, FieldMetadata>>
  canSave: boolean
  isMasterUser: boolean
  patch: <K extends keyof ConfiguracoesVendedoresFormValues>(key: K, value: ConfiguracoesVendedoresFormValues[K]) => void
  t: (key: string, fallback: string, params?: Record<string, string>) => string
}

export function ConfiguracoesVendedoresFormSections({
  sectionOrder,
  fieldDefinitions,
  scheduleDays,
  values,
  metadata,
  canSave,
  isMasterUser,
  patch,
  t,
}: Props) {
  return (
    <>
      {sectionOrder.map((section) => (
        <SectionCard key={section.key} title={section.title} description={section.description}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {fieldDefinitions.filter((field) => field.section === section.key).map((field) => {
              if (field.masterOnly && !isMasterUser) {
                return null
              }
              if (field.visibleWhenAreaV2 && values.area_representante !== 'v2') {
                return null
              }

              const fieldMeta = metadata[field.key]
              const disabled = !canSave || (field.masterOnlyEdit && !isMasterUser)

              return (
                <div key={field.key} className="app-control-muted rounded-[1.15rem] p-4">
                  <FormField label={field.label} asLabel={false}>
                    {field.type === 'enum' ? (
                      <select
                        value={values[field.key] ?? ''}
                        onChange={(event) => patch(field.key, event.target.value)}
                        disabled={disabled}
                        className={inputClasses()}
                      >
                        <option value="">{t('common.select', 'Selecione')}</option>
                        {(field.options ?? []).map((option) => (
                          <option key={`${field.key}-${option.value}`} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={values[field.key] ?? ''}
                        onChange={(event) => patch(field.key, event.target.value)}
                        disabled={disabled}
                        className={inputClasses()}
                        inputMode={field.type === 'integer' ? 'numeric' : 'decimal'}
                        min={field.type === 'integer' ? 0 : undefined}
                        step={field.type === 'integer' ? 1 : undefined}
                        type={field.type === 'integer' ? 'number' : 'text'}
                      />
                    )}
                  </FormField>

                  {field.helper ? <p className="mt-2 text-xs leading-5 text-[color:var(--app-muted)]">{field.helper}</p> : null}
                  {field.masterOnlyEdit && !isMasterUser ? <p className="mt-2 text-xs leading-5 text-[color:var(--app-muted)]">{t('configuracoes.sellers.masterOnlyEdit', 'Somente usuário master pode alterar este valor.')}</p> : null}
                  {fieldMeta ? (
                    <p className="mt-2 text-xs leading-5 text-[color:var(--app-muted)]">
                      {t('configuracoes.home.lastUpdated', 'Ãšltima alteraÃ§Ã£o: {{date}} por {{user}}', {
                        date: formatDateTime(fieldMeta.updatedAt),
                        user: fieldMeta.updatedBy,
                      })}
                    </p>
                  ) : null}
                </div>
              )
            })}
          </div>
        </SectionCard>
      ))}

      <SectionCard
        title={t('configuracoes.sellers.availabilityTitle', 'Disponibilidade')}
        description={t('configuracoes.sellers.availabilityDescription', 'Defina em quais dias e horÃ¡rios o vendedor pode acessar a plataforma.')}
      >
        <div className="grid gap-4 xl:grid-cols-2">
          {scheduleDays.map((day) => (
            <div key={day.toggleKey} className="app-control-muted rounded-[1.15rem] p-4">
              <div className="grid gap-4 md:grid-cols-[1.2fr_1fr_1fr]">
                <div>
                  <FormField label={day.label} asLabel={false}>
                    <select
                      value={values[day.toggleKey] ?? ''}
                      onChange={(event) => patch(day.toggleKey, event.target.value)}
                      disabled={!canSave}
                      className={inputClasses()}
                    >
                      <option value="">{t('common.select', 'Selecione')}</option>
                      <option value="1">{t('common.yes', 'Sim')}</option>
                      <option value="0">{t('common.no', 'NÃ£o')}</option>
                    </select>
                  </FormField>
                  <p className="mt-2 text-xs leading-5 text-[color:var(--app-muted)]">{day.helper}</p>
                </div>
                <div>
                  <FormField label={t('common.from', 'De')} asLabel={false}>
                    <select
                      value={values[day.fromKey] ?? ''}
                      onChange={(event) => patch(day.fromKey, event.target.value)}
                      disabled={!canSave || values[day.toggleKey] !== '1'}
                      className={inputClasses()}
                    >
                      <option value="">{t('common.select', 'Selecione')}</option>
                      {configuracoesTimeOptionsFrom.map((option) => (
                        <option key={`${day.fromKey}-${option.value}`} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>
                <div>
                  <FormField label={t('common.to', 'AtÃ©')} asLabel={false}>
                    <select
                      value={values[day.toKey] ?? ''}
                      onChange={(event) => patch(day.toKey, event.target.value)}
                      disabled={!canSave || values[day.toggleKey] !== '1'}
                      className={inputClasses()}
                    >
                      <option value="">{t('common.select', 'Selecione')}</option>
                      {configuracoesTimeOptionsTo.map((option) => (
                        <option key={`${day.toKey}-${option.value}`} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </>
  )
}

