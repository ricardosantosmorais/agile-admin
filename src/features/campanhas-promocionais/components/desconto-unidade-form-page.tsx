'use client'

import { CampaignFormPage, DESCONTO_UNIDADE_DEFINITION } from '@/src/features/campanhas-promocionais/services/campanhas-config'

export function DescontoUnidadeFormPage({ id }: { id?: string }) {
  return <CampaignFormPage id={id} definition={DESCONTO_UNIDADE_DEFINITION} />
}
