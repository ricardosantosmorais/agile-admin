'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { MARCAS_CONFIG } from '@/src/features/marcas/services/marcas-config'
import { marcasClient } from '@/src/features/marcas/services/marcas-client'

export function MarcasListPage() {
  return <CrudListPage config={MARCAS_CONFIG} client={marcasClient} />
}
