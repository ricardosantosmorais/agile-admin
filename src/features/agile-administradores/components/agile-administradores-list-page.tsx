'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { AGILE_ADMINISTRADORES_CONFIG } from '@/src/features/agile-administradores/services/agile-administradores-config'
import { agileAdministradoresCrudClient } from '@/src/features/agile-administradores/services/agile-administradores-crud-client'

export function AgileAdministradoresListPage() {
  return <CrudListPage config={AGILE_ADMINISTRADORES_CONFIG} client={agileAdministradoresCrudClient} />
}
