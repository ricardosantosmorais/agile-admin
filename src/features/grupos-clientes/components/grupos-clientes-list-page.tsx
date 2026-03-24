'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { GRUPOS_CLIENTES_CONFIG } from '@/src/features/grupos-clientes/services/grupos-clientes-config'
import { gruposClientesClient } from '@/src/features/grupos-clientes/services/grupos-clientes-client'

export function GruposClientesListPage() {
  return <CrudListPage config={GRUPOS_CLIENTES_CONFIG} client={gruposClientesClient} />
}
