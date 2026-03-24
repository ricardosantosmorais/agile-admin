'use client'

import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import { SUPERVISORES_CONFIG } from '@/src/features/supervisores/services/supervisores-config'
import { supervisoresClient } from '@/src/features/supervisores/services/supervisores-client'

export function SupervisorFormPage({ id }: { id?: string }) {
  return <CrudFormPage config={SUPERVISORES_CONFIG} client={supervisoresClient} id={id} />
}
