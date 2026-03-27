'use client'

import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import { tributosPartilhaClient } from '@/src/features/tributos-partilha/services/tributos-partilha-client'
import { TRIBUTOS_PARTILHA_CONFIG } from '@/src/features/tributos-partilha/services/tributos-partilha-config'

export function TributoPartilhaFormPage({ id }: { id?: string }) {
  return <CrudFormPage config={TRIBUTOS_PARTILHA_CONFIG} client={tributosPartilhaClient} id={id} />
}
