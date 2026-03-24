'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { combosClient } from '@/src/features/combos/services/combos-client'
import { COMBOS_CONFIG } from '@/src/features/combos/services/combos-config'

export function CombosListPage() {
  return <CrudListPage config={COMBOS_CONFIG} client={combosClient} />
}
