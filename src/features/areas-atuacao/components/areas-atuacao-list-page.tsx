'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { AREAS_ATUACAO_CONFIG } from '@/src/features/areas-atuacao/services/areas-atuacao-config'
import { areasAtuacaoClient } from '@/src/features/areas-atuacao/services/areas-atuacao-client'

export function AreasAtuacaoListPage() {
  return <CrudListPage config={AREAS_ATUACAO_CONFIG} client={areasAtuacaoClient} />
}
