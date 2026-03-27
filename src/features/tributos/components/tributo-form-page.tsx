'use client'

import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import { tributosClient } from '@/src/features/tributos/services/tributos-client'
import { TRIBUTOS_CONFIG } from '@/src/features/tributos/services/tributos-config'

export function TributoFormPage({ id }: { id?: string }) {
  return <CrudFormPage config={TRIBUTOS_CONFIG} client={tributosClient} id={id} />
}
