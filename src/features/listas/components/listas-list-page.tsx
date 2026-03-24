'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { LISTAS_CONFIG } from '@/src/features/listas/services/listas-config'
import { listasClient } from '@/src/features/listas/services/listas-client'

export function ListasListPage() {
  return <CrudListPage config={LISTAS_CONFIG} client={listasClient} />
}
