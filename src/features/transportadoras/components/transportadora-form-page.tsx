'use client'

import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import { TRANSPORTADORAS_CONFIG } from '@/src/features/transportadoras/services/transportadoras-config'
import { transportadorasClient } from '@/src/features/transportadoras/services/transportadoras-client'

export function TransportadoraFormPage({ id }: { id?: string }) {
  return <CrudFormPage config={TRANSPORTADORAS_CONFIG} client={transportadorasClient} id={id} />
}
