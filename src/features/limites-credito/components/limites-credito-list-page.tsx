'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { LIMITES_CREDITO_CONFIG } from '@/src/features/limites-credito/services/limites-credito-config'
import { limitesCreditoClient } from '@/src/features/limites-credito/services/limites-credito-client'

export function LimitesCreditoListPage() {
  return <CrudListPage config={LIMITES_CREDITO_CONFIG} client={limitesCreditoClient} />
}
