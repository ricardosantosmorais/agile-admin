'use client'

import { CampanhaListPage } from '@/src/features/campanhas-promocionais/components/campanha-list-page'
import { COMPRE_JUNTO_CONFIG } from '@/src/features/campanhas-promocionais/services/campanhas-config'

export function CompreJuntoListPage() {
  return <CampanhaListPage config={COMPRE_JUNTO_CONFIG} />
}
