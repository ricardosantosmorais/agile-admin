'use client'

import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import { linhasClient } from '@/src/features/linhas/services/linhas-client'
import { LINHAS_CONFIG } from '@/src/features/linhas/services/linhas-config'

export function LinhaFormPage({ id }: { id?: string }) {
  return <CrudFormPage config={LINHAS_CONFIG} client={linhasClient} id={id} />
}
