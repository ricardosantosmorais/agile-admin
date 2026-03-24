'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { linhasClient } from '@/src/features/linhas/services/linhas-client'
import { LINHAS_CONFIG } from '@/src/features/linhas/services/linhas-config'

export function LinhasListPage() {
  return <CrudListPage config={LINHAS_CONFIG} client={linhasClient} />
}
