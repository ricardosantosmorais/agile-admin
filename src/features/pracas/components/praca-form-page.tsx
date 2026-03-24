'use client'

import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import { PRACAS_CONFIG } from '@/src/features/pracas/services/pracas-config'
import { pracasClient } from '@/src/features/pracas/services/pracas-client'

export function PracaFormPage({ id }: { id?: string }) {
  return <CrudFormPage id={id} config={PRACAS_CONFIG} client={pracasClient} />
}
