'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { gruposFiliaisClient } from '@/src/features/grupos-filiais/services/grupos-filiais-client'
import { GRUPOS_FILIAIS_CONFIG } from '@/src/features/grupos-filiais/services/grupos-filiais-config'

export function GruposFiliaisListPage() {
  return <CrudListPage config={GRUPOS_FILIAIS_CONFIG} client={gruposFiliaisClient} />
}
