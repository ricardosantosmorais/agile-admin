'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { TRANSPORTADORAS_CONFIG } from '@/src/features/transportadoras/services/transportadoras-config'
import { transportadorasClient } from '@/src/features/transportadoras/services/transportadoras-client'

export function TransportadorasListPage() {
  return <CrudListPage config={TRANSPORTADORAS_CONFIG} client={transportadorasClient} />
}
