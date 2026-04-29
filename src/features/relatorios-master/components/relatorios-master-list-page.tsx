'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { relatoriosMasterClient } from '@/src/features/relatorios-master/services/relatorios-master-client'
import { RELATORIOS_MASTER_CONFIG } from '@/src/features/relatorios-master/services/relatorios-master-config'

export function RelatoriosMasterListPage() {
  return <CrudListPage config={RELATORIOS_MASTER_CONFIG} client={relatoriosMasterClient} />
}
