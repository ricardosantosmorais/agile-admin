'use client'

import { createCrudClient } from '@/src/components/crud-base/crud-client'
import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { REDES_CLIENTES_CONFIG } from '@/src/features/redes-clientes/services/redes-clientes-config'

const redesClientesClient = createCrudClient('/api/redes')

export function RedesClientesListPage() {
  return <CrudListPage config={REDES_CLIENTES_CONFIG} client={redesClientesClient} />
}
