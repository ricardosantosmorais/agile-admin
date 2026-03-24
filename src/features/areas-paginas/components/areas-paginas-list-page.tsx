'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { AREAS_PAGINAS_CONFIG } from '@/src/features/areas-paginas/services/areas-paginas-config'
import { areasPaginasClient } from '@/src/features/areas-paginas/services/areas-paginas-client'

export function AreasPaginasListPage() {
  return <CrudListPage config={AREAS_PAGINAS_CONFIG} client={areasPaginasClient} />
}
