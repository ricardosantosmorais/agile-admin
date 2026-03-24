'use client'

import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import { CORES_CONFIG } from '@/src/features/cores/services/cores-config'
import { coresClient } from '@/src/features/cores/services/cores-client'

export function CorFormPage({ id }: { id?: string }) {
  return <CrudFormPage config={CORES_CONFIG} client={coresClient} id={id} />
}
