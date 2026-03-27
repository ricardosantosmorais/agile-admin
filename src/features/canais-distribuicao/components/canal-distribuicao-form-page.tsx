'use client'

import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import { canaisDistribuicaoClient } from '@/src/features/canais-distribuicao/services/canais-distribuicao-client'
import { CANAIS_DISTRIBUICAO_CONFIG } from '@/src/features/canais-distribuicao/services/canais-distribuicao-config'

export function CanalDistribuicaoFormPage({ id }: { id?: string }) {
  return <CrudFormPage config={CANAIS_DISTRIBUICAO_CONFIG} client={canaisDistribuicaoClient} id={id} />
}
