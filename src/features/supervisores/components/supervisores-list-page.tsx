'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { SUPERVISORES_CONFIG } from '@/src/features/supervisores/services/supervisores-config'
import { supervisoresClient } from '@/src/features/supervisores/services/supervisores-client'

export function SupervisoresListPage() {
  return <CrudListPage config={SUPERVISORES_CONFIG} client={supervisoresClient} />
}
