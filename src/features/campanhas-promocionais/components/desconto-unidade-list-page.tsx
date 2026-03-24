'use client'

import { CampanhaListPage } from '@/src/features/campanhas-promocionais/components/campanha-list-page'
import { DESCONTO_UNIDADE_CONFIG } from '@/src/features/campanhas-promocionais/services/campanhas-config'

export function DescontoUnidadeListPage() {
  return <CampanhaListPage config={DESCONTO_UNIDADE_CONFIG} />
}
