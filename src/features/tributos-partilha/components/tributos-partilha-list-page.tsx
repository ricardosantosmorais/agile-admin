'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { tributosPartilhaClient } from '@/src/features/tributos-partilha/services/tributos-partilha-client'
import { TRIBUTOS_PARTILHA_CONFIG } from '@/src/features/tributos-partilha/services/tributos-partilha-config'

export function TributosPartilhaListPage() {
  return <CrudListPage config={TRIBUTOS_PARTILHA_CONFIG} client={tributosPartilhaClient} />
}
