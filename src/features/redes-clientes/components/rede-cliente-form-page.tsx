'use client'

import { createCrudClient } from '@/src/components/crud-base/crud-client'
import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import { REDES_CLIENTES_CONFIG } from '@/src/features/redes-clientes/services/redes-clientes-config'

const redesClientesClient = createCrudClient('/api/redes')

export function RedeClienteFormPage({ id }: { id?: string }) {
  return <CrudFormPage config={REDES_CLIENTES_CONFIG} client={redesClientesClient} id={id} />
}
