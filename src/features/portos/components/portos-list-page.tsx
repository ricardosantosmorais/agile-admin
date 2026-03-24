'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { PORTOS_CONFIG } from '@/src/features/portos/services/portos-config'
import { portosClient } from '@/src/features/portos/services/portos-client'

export function PortosListPage() {
  return <CrudListPage config={PORTOS_CONFIG} client={portosClient} />
}
