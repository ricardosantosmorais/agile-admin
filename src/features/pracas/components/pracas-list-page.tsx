'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { PRACAS_CONFIG } from '@/src/features/pracas/services/pracas-config'
import { pracasClient } from '@/src/features/pracas/services/pracas-client'

export function PracasListPage() {
  return <CrudListPage config={PRACAS_CONFIG} client={pracasClient} />
}
