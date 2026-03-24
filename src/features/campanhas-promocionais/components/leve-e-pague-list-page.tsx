'use client'

import { CampanhaListPage } from '@/src/features/campanhas-promocionais/components/campanha-list-page'
import { LEVE_E_PAGUE_CONFIG } from '@/src/features/campanhas-promocionais/services/campanhas-config'

export function LeveEPagueListPage() {
  return <CampanhaListPage config={LEVE_E_PAGUE_CONFIG} />
}
