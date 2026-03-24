'use client'

import { SectionCard } from '@/src/components/ui/section-card'
import type { ClientFormRecord } from '@/src/features/clientes/types/clientes'
import { useI18n } from '@/src/i18n/use-i18n'

type ClienteAdicionaisTabProps = {
  formularios: ClientFormRecord['formularios']
}

export function ClienteAdicionaisTab({ formularios }: ClienteAdicionaisTabProps) {
  const { t } = useI18n()

  return (
    <SectionCard title={t('clientes.form.additional.title', 'Additional data')}>
      <div className="space-y-4">
        {formularios.map((formulario) => (
          <div key={`${formulario.id}-${formulario.title}`} className="rounded-[1.3rem] border border-[#ebe4d8] bg-[#fcfaf5] p-4">
            <h3 className="text-base font-black tracking-tight text-slate-950">{formulario.title}</h3>
            <p className="mb-4 text-sm text-slate-500">{formulario.date || '-'}</p>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {formulario.fields.map((field) => (
                <div key={`${formulario.id}-${field.label}`} className="rounded-[1rem] border border-white bg-white px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{field.label}</p>
                  {field.type === 'arquivo' && field.fileUrl ? (
                    <a href={field.fileUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm font-semibold text-accent">
                      {t('clientes.form.additional.viewFile', 'View file')}
                    </a>
                  ) : (
                    <p className="mt-2 text-sm text-slate-700">{field.value || '-'}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
