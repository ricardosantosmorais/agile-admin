'use client'

import { createCrudClient } from '@/src/components/crud-base/crud-client'
import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import { SEGMENTOS_CLIENTES_CONFIG } from '@/src/features/segmentos-clientes/services/segmentos-clientes-config'

const segmentosClientesClient = createCrudClient('/api/segmentos')

export function SegmentoClienteFormPage({ id }: { id?: string }) {
  return <CrudFormPage config={SEGMENTOS_CLIENTES_CONFIG} client={segmentosClientesClient} id={id} />
}
