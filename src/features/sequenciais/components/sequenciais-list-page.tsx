'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { sequenciaisClient } from '@/src/features/sequenciais/services/sequenciais-client'
import { SEQUENCIAIS_CONFIG } from '@/src/features/sequenciais/services/sequenciais-config'

export function SequenciaisListPage() {
  return <CrudListPage config={SEQUENCIAIS_CONFIG} client={sequenciaisClient} />
}
