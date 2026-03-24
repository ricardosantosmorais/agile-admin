'use client'

import { ListOrdered, PencilLine } from 'lucide-react'
import type { CrudRecord } from '@/src/components/crud-base/types'
import { TabbedCatalogFormPage } from '@/src/features/catalog/components/tabbed-catalog-form-page'
import type { GradeValueRecord } from '@/src/features/catalog/types/catalog-relations'
import { GradeOptionsSection } from '@/src/features/grades/components/grade-options-section'
import { GradeValuesTab } from '@/src/features/grades/components/grade-values-tab'
import { gradesClient } from '@/src/features/grades/services/grades-client'
import { GRADES_CONFIG } from '@/src/features/grades/services/grades-config'

function getGradeOptions(form: CrudRecord) {
  const rawValues: string[] = []

  for (let index = 1; index <= 50; index += 1) {
    const key = `opcao${index}`
    const value = form[key]
    if (typeof value === 'string') {
      rawValues.push(value)
    }
  }

  const explicitCount = typeof form.__opcoes_count === 'number'
    ? Math.max(1, Math.min(50, form.__opcoes_count))
    : null

  if (explicitCount) {
    const values = rawValues.slice(0, explicitCount)
    while (values.length < explicitCount) {
      values.push('')
    }
    return values.length ? values : ['']
  }

  let lastFilledIndex = -1
  rawValues.forEach((value, index) => {
    if (value.trim()) {
      lastFilledIndex = index
    }
  })

  if (lastFilledIndex === -1) {
    return ['']
  }

  return rawValues.slice(0, lastFilledIndex + 1)
}

function applyGradeOptions(patch: (key: string, value: unknown) => void, options: string[]) {
  patch('__opcoes_count', options.length)
  for (let index = 1; index <= 50; index += 1) {
    patch(`opcao${index}`, options[index - 1] ?? '')
  }
}

function getGradeValues(form: CrudRecord): GradeValueRecord[] {
  return Array.isArray(form.valores) ? (form.valores as GradeValueRecord[]) : []
}

export function GradeFormPage({ id }: { id?: string }) {
  return (
    <TabbedCatalogFormPage
      config={GRADES_CONFIG}
      client={gradesClient}
      id={id}
      formEmbed="valores"
      tabs={[
        {
          key: 'general',
          label: 'Dados gerais',
          icon: <PencilLine className="h-4 w-4" />,
          sectionIds: ['general'],
          render: ({ form, readOnly, patch }) =>
            form.tipo === 'tipo1' ? (
              <GradeOptionsSection
                values={getGradeOptions(form)}
                readOnly={readOnly}
                onChange={(values) => applyGradeOptions(patch, values)}
              />
            ) : null,
        },
        {
          key: 'values',
          label: 'Valores',
          icon: <ListOrdered className="h-4 w-4" />,
          hidden: ({ isEditing, form }) => !isEditing || form.tipo !== 'tipo2',
          render: ({ id: recordId, form, readOnly, refreshRecord, onFeedback }) => recordId ? (
            <GradeValuesTab
              gradeId={recordId}
              readOnly={readOnly}
              items={getGradeValues(form)}
              onRefresh={refreshRecord}
              onError={onFeedback}
              saveValue={gradesClient.saveValue}
              reorderValues={gradesClient.reorderValues}
              deleteValues={gradesClient.deleteValues}
            />
          ) : null,
        },
      ]}
    />
  )
}
