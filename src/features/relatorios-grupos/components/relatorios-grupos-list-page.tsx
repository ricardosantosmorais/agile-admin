'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { relatoriosGruposClient } from '@/src/features/relatorios-grupos/services/relatorios-grupos-client'
import { RELATORIOS_GRUPOS_CONFIG } from '@/src/features/relatorios-grupos/services/relatorios-grupos-config'

export function RelatoriosGruposListPage() {
  return <CrudListPage config={RELATORIOS_GRUPOS_CONFIG} client={relatoriosGruposClient} />
}
