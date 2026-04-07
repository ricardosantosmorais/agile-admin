'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { ADMINISTRADORES_CONFIG } from '@/src/features/administradores/services/administradores-config'
import { administradoresCrudClient } from '@/src/features/administradores/services/administradores-crud-client'

export function AdministradoresListPage() {
  return <CrudListPage config={ADMINISTRADORES_CONFIG} client={administradoresCrudClient} />
}
