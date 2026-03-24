'use client'

import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import { AREAS_ATUACAO_CONFIG } from '@/src/features/areas-atuacao/services/areas-atuacao-config'
import { areasAtuacaoClient } from '@/src/features/areas-atuacao/services/areas-atuacao-client'

export function AreaAtuacaoFormPage({ id }: { id?: string }) {
  return <CrudFormPage id={id} config={AREAS_ATUACAO_CONFIG} client={areasAtuacaoClient} />
}
