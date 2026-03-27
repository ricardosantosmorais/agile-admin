'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { tributosClient } from '@/src/features/tributos/services/tributos-client'
import { TRIBUTOS_CONFIG } from '@/src/features/tributos/services/tributos-config'

export function TributosListPage() {
  return <CrudListPage config={TRIBUTOS_CONFIG} client={tributosClient} />
}
