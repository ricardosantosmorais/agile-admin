'use client'

import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import { ROTAS_CONFIG } from '@/src/features/rotas/services/rotas-config'
import { rotasClient } from '@/src/features/rotas/services/rotas-client'

export function RotaFormPage({ id }: { id?: string }) {
  return <CrudFormPage id={id} config={ROTAS_CONFIG} client={rotasClient} />
}
