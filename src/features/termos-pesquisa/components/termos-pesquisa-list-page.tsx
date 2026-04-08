'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { termosPesquisaClient } from '@/src/features/termos-pesquisa/services/termos-pesquisa-client'
import { TERMOS_PESQUISA_CONFIG } from '@/src/features/termos-pesquisa/services/termos-pesquisa-config'

export function TermosPesquisaListPage() {
  return <CrudListPage config={TERMOS_PESQUISA_CONFIG} client={termosPesquisaClient} />
}

