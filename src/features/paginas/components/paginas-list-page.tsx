'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { PAGINAS_CONFIG } from '@/src/features/paginas/services/paginas-config'
import { paginasClient } from '@/src/features/paginas/services/paginas-client'

export function PaginasListPage() {
  return <CrudListPage config={PAGINAS_CONFIG} client={paginasClient} />
}
