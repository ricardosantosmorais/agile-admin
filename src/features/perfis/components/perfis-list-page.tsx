'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { PERFIS_CONFIG } from '@/src/features/perfis/services/perfis-config'
import { perfisCrudClient } from '@/src/features/perfis/services/perfis-crud-client'

export function PerfisListPage() {
  return <CrudListPage config={PERFIS_CONFIG} client={perfisCrudClient} />
}
