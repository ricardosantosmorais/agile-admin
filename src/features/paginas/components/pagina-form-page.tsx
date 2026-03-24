'use client'

import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import { PAGINAS_CONFIG } from '@/src/features/paginas/services/paginas-config'
import { paginasClient } from '@/src/features/paginas/services/paginas-client'

export function PaginaFormPage({ id }: { id?: string }) {
  return <CrudFormPage config={PAGINAS_CONFIG} client={paginasClient} id={id} />
}
