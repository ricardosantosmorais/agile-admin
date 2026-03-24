'use client'

import { createCrudClient } from '@/src/components/crud-base/crud-client'
import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { SEGMENTOS_CLIENTES_CONFIG } from '@/src/features/segmentos-clientes/services/segmentos-clientes-config'

const segmentosClientesClient = createCrudClient('/api/segmentos')

export function SegmentosClientesListPage() {
  return <CrudListPage config={SEGMENTOS_CLIENTES_CONFIG} client={segmentosClientesClient} />
}
