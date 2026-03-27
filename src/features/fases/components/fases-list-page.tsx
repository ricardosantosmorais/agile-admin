'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { fasesClient } from '@/src/features/fases/services/fases-client'
import { FASES_CONFIG } from '@/src/features/fases/services/fases-config'

export function FasesListPage() {
  return <CrudListPage config={FASES_CONFIG} client={fasesClient} />
}
