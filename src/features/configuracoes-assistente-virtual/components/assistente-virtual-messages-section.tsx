'use client'

import { FormField } from '@/src/components/ui/form-field'
import { inputClasses } from '@/src/components/ui/input-styles'
import type { ConfiguracoesAssistenteVirtualFormValues } from '@/src/features/configuracoes-assistente-virtual/types/configuracoes-assistente-virtual'
import { formatDateTime } from '@/src/lib/date-time'

type FieldMetadata = {
  updatedAt: string
  updatedBy: string
}

type Props = {
  values: ConfiguracoesAssistenteVirtualFormValues
  metadata: Partial<Record<keyof ConfiguracoesAssistenteVirtualFormValues, FieldMetadata>>
  canEdit: boolean
  fields: Array<keyof ConfiguracoesAssistenteVirtualFormValues>
  patch: <K extends keyof ConfiguracoesAssistenteVirtualFormValues>(key: K, value: ConfiguracoesAssistenteVirtualFormValues[K]) => void
  t: (key: string, fallback: string, params?: Record<string, string>) => string
}

export function AssistenteVirtualMessagesSection({
  values,
  metadata,
  canEdit,
  fields,
  patch,
  t,
}: Props) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {fields.map((fieldKey) => {
        const fieldMeta = metadata[fieldKey]

        return (
          <div key={fieldKey} className="rounded-[1.15rem] border border-[#ebe4d8] bg-[#fcfaf5] p-4">
            <FormField label={t(`configuracoes.virtualAssistant.fields.${fieldKey}.label`, fieldKey)} asLabel={false}>
              <textarea
                value={values[fieldKey]}
                onChange={(event) => patch(fieldKey, event.target.value)}
                readOnly={!canEdit}
                rows={5}
                maxLength={150}
                className={`${inputClasses()} resize-y`}
              />
            </FormField>

            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
              <p className="leading-5">
                {t(`configuracoes.virtualAssistant.fields.${fieldKey}.helper`, '')}
              </p>
              <span className="shrink-0 font-medium text-slate-400">
                {values[fieldKey].length}/150
              </span>
            </div>

            {fieldMeta ? (
              <p className="mt-3 text-xs leading-5 text-slate-500">
                {t('configuracoes.virtualAssistant.lastUpdated', 'Ãšltima alteraÃ§Ã£o: {{date}} por {{user}}', {
                  date: formatDateTime(fieldMeta.updatedAt),
                  user: fieldMeta.updatedBy,
                })}
              </p>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

