'use client'

import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import { termosPesquisaClient } from '@/src/features/termos-pesquisa/services/termos-pesquisa-client'
import { TERMOS_PESQUISA_CONFIG } from '@/src/features/termos-pesquisa/services/termos-pesquisa-config'

export function TermoPesquisaFormPage({ id }: { id?: string }) {
  return <CrudFormPage config={TERMOS_PESQUISA_CONFIG} client={termosPesquisaClient} id={id} />
}

