'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { empresasClient } from '@/src/features/empresas/services/empresas-client'
import { EMPRESAS_CONFIG } from '@/src/features/empresas/services/empresas-config'

export function EmpresasListPage() {
  return <CrudListPage config={EMPRESAS_CONFIG} client={empresasClient} />
}
