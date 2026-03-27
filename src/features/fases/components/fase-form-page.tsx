'use client'

import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import { FASES_CONFIG } from '@/src/features/fases/services/fases-config'
import { fasesClient } from '@/src/features/fases/services/fases-client'

export function FaseFormPage({ id }: { id?: string }) {
  return <CrudFormPage config={FASES_CONFIG} client={fasesClient} id={id} />
}
