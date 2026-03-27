'use client'

import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import { LIMITES_CREDITO_CONFIG } from '@/src/features/limites-credito/services/limites-credito-config'
import { limitesCreditoClient } from '@/src/features/limites-credito/services/limites-credito-client'

export function LimiteCreditoFormPage({ id }: { id?: string }) {
  return <CrudFormPage config={LIMITES_CREDITO_CONFIG} client={limitesCreditoClient} id={id} />
}
