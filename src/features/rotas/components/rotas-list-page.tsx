'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { ROTAS_CONFIG } from '@/src/features/rotas/services/rotas-config'
import { rotasClient } from '@/src/features/rotas/services/rotas-client'

export function RotasListPage() {
  return <CrudListPage config={ROTAS_CONFIG} client={rotasClient} />
}
