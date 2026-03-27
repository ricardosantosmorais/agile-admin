'use client'

import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import { filiaisClient } from '@/src/features/filiais/services/filiais-client'
import { FILIAIS_CONFIG } from '@/src/features/filiais/services/filiais-config'

export function FilialFormPage({ id }: { id?: string }) {
  return <CrudFormPage config={FILIAIS_CONFIG} client={filiaisClient} id={id} />
}
