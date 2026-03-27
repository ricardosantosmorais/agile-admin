'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { canaisDistribuicaoClient } from '@/src/features/canais-distribuicao/services/canais-distribuicao-client'
import { CANAIS_DISTRIBUICAO_CONFIG } from '@/src/features/canais-distribuicao/services/canais-distribuicao-config'

export function CanaisDistribuicaoListPage() {
  return <CrudListPage config={CANAIS_DISTRIBUICAO_CONFIG} client={canaisDistribuicaoClient} />
}
