'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { filiaisClient } from '@/src/features/filiais/services/filiais-client'
import { FILIAIS_CONFIG } from '@/src/features/filiais/services/filiais-config'

export function FiliaisListPage() {
  return <CrudListPage config={FILIAIS_CONFIG} client={filiaisClient} />
}
