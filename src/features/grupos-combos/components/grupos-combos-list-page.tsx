'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { gruposCombosClient } from '@/src/features/grupos-combos/services/grupos-combos-client'
import { GRUPOS_COMBOS_CONFIG } from '@/src/features/grupos-combos/services/grupos-combos-config'

export function GruposCombosListPage() {
  return <CrudListPage config={GRUPOS_COMBOS_CONFIG} client={gruposCombosClient} />
}
