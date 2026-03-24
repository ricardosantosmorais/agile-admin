'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { COLECOES_CONFIG } from '@/src/features/colecoes/services/colecoes-config'
import { colecoesClient } from '@/src/features/colecoes/services/colecoes-client'

export function ColecoesListPage() {
  return <CrudListPage config={COLECOES_CONFIG} client={colecoesClient} />
}
