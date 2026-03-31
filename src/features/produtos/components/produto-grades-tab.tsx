'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { FormField } from '@/src/components/ui/form-field'
import { SectionCard } from '@/src/components/ui/section-card'
import { TooltipIconButton } from '@/src/components/ui/tooltip-icon-button'
import type { CrudRecord } from '@/src/components/crud-base/types'
import { useI18n } from '@/src/i18n/use-i18n'
import { httpClient } from '@/src/services/http/http-client'

type GradeValue = {
  id: string
  valor?: string | null
}

type GradeRecord = {
  id: string
  nome?: string | null
  valores?: GradeValue[]
}

type ProdutoGradeSelection = {
  id_grade: string
  id_valor: string
}

function normalizeSelections(form: CrudRecord) {
  const raw = Array.isArray(form.produtos_grades_valores) ? form.produtos_grades_valores as Array<Record<string, unknown>> : []
  return raw
    .map((item) => ({
      id_grade: String(item.id_grade || ''),
      id_valor: String(item.id_valor || ''),
    }))
    .filter((item) => item.id_grade || item.id_valor)
}

export function ProdutoGradesTab({
  form,
  patch,
  readOnly,
}: {
  form: CrudRecord
  patch: (key: string, value: unknown) => void
  readOnly: boolean
}) {
  const { t } = useI18n()
  const [grades, setGrades] = useState<GradeRecord[]>([])

  const selections = useMemo(() => {
    const normalized = normalizeSelections(form)
    return normalized.length > 0 ? normalized : [{ id_grade: '', id_valor: '' }]
  }, [form])

  useEffect(() => {
    let active = true
    void httpClient<{ data: GradeRecord[] }>('/api/grades?page=1&perPage=1000&orderBy=nome&sort=asc&embed=valores', {
      method: 'GET',
      cache: 'no-store',
    }).then((payload) => {
      if (active) {
        setGrades(Array.isArray(payload.data) ? payload.data : [])
      }
    }).catch(() => {
      if (active) {
        setGrades([])
      }
    })
    return () => {
      active = false
    }
  }, [])

  function updateSelections(nextSelections: ProdutoGradeSelection[]) {
    patch('produtos_grades_valores', nextSelections)
  }

  function updateSelection(index: number, key: keyof ProdutoGradeSelection, value: string) {
    const next = [...selections]
    next[index] = {
      ...next[index],
      [key]: value,
      ...(key === 'id_grade' ? { id_valor: '' } : null),
    }
    updateSelections(next)
  }

  return (
    <SectionCard
      title={t('catalog.produtos.tabs.grades.dynamicTitle', 'Grades dinâmicas')}
      action={!readOnly ? (
        <button type="button" onClick={() => updateSelections([...selections, { id_grade: '', id_valor: '' }])} className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-slate-700">
          <Plus className="h-4 w-4" />
          {t('catalog.produtos.tabs.grades.add', 'Adicionar grade')}
        </button>
      ) : null}
    >
      <div className="space-y-4">
        {selections.map((selection, index) => {
          const selectedGrade = grades.find((grade) => grade.id === selection.id_grade)
          const values = Array.isArray(selectedGrade?.valores) ? selectedGrade.valores : []
          return (
            <div key={`${selection.id_grade}-${selection.id_valor}-${index}`} className="rounded-[1.1rem] border border-line bg-[#fcfaf5] p-4">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                <FormField label={`${t('catalog.produtos.tabs.grades.label', 'Grade')} ${index + 1}`}>
                  <select value={selection.id_grade} onChange={(event) => updateSelection(index, 'id_grade', event.target.value)} disabled={readOnly} className="h-[46px] w-full rounded-[1rem] border border-[#e6dfd3] bg-white px-3.5 text-sm text-slate-900">
                    <option value="">{t('common.select', 'Selecione')}</option>
                    {grades.map((grade) => (
                      <option key={grade.id} value={grade.id}>{grade.nome || grade.id}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label={`${t('catalog.grades.values.value', 'Valor')} ${index + 1}`}>
                  <select value={selection.id_valor} onChange={(event) => updateSelection(index, 'id_valor', event.target.value)} disabled={readOnly || !selection.id_grade} className="h-[46px] w-full rounded-[1rem] border border-[#e6dfd3] bg-white px-3.5 text-sm text-slate-900">
                    <option value="">{t('common.select', 'Selecione')}</option>
                    {values.map((value) => (
                      <option key={value.id} value={value.id}>{value.valor || value.id}</option>
                    ))}
                  </select>
                </FormField>
                {!readOnly ? (
                  <div className="flex items-end justify-end">
                    <TooltipIconButton label={t('simpleCrud.actions.delete', 'Excluir')}>
                      <button
                        type="button"
                        onClick={() => {
                          const next = selections.filter((_, currentIndex) => currentIndex !== index)
                          updateSelections(next.length > 0 ? next : [{ id_grade: '', id_valor: '' }])
                        }}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </TooltipIconButton>
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}
