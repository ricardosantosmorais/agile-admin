'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { CORES_CONFIG } from '@/src/features/cores/services/cores-config'
import { coresClient } from '@/src/features/cores/services/cores-client'

export function CoresListPage() {
  return <CrudListPage config={CORES_CONFIG} client={coresClient} />
}
