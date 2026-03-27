'use client'

import { createCrudClient, resolveCrudLookupOption } from '@/src/components/crud-base/crud-client'

const baseClient = createCrudClient('/api/tributos-partilha')

export const tributosPartilhaClient = {
  ...baseClient,
  async getById(id: string, embed?: string) {
    const record = await baseClient.getById(id, embed)
    if (!record.id_filial || record.id_filial_lookup) {
      return record
    }

    const filial = await resolveCrudLookupOption('filiais', String(record.id_filial))
    if (!filial) {
      return record
    }

    return {
      ...record,
      id_filial_lookup: { id: filial.value, label: filial.label },
    }
  },
}
