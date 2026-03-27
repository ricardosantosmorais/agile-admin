'use client'

import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import { gruposFiliaisClient } from '@/src/features/grupos-filiais/services/grupos-filiais-client'
import { GRUPOS_FILIAIS_CONFIG } from '@/src/features/grupos-filiais/services/grupos-filiais-config'

export function GrupoFilialFormPage({ id }: { id?: string }) {
  return <CrudFormPage config={GRUPOS_FILIAIS_CONFIG} client={gruposFiliaisClient} id={id} />
}
