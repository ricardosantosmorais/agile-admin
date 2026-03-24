'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { DEPARTAMENTOS_CONFIG } from '@/src/features/departamentos/services/departamentos-config'
import { departamentosClient } from '@/src/features/departamentos/services/departamentos-client'

export function DepartamentosListPage() {
  return <CrudListPage config={DEPARTAMENTOS_CONFIG} client={departamentosClient} />
}
