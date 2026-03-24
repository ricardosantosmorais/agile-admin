'use client'

import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import { PORTOS_CONFIG } from '@/src/features/portos/services/portos-config'
import { portosClient } from '@/src/features/portos/services/portos-client'

export function PortoFormPage({ id }: { id?: string }) {
  return <CrudFormPage config={PORTOS_CONFIG} client={portosClient} id={id} />
}
