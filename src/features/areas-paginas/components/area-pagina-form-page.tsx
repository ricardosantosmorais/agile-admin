'use client'

import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import { AREAS_PAGINAS_CONFIG } from '@/src/features/areas-paginas/services/areas-paginas-config'
import { areasPaginasClient } from '@/src/features/areas-paginas/services/areas-paginas-client'

export function AreasPaginaFormPage({ id }: { id?: string }) {
  return <CrudFormPage config={AREAS_PAGINAS_CONFIG} client={areasPaginasClient} id={id} />
}
