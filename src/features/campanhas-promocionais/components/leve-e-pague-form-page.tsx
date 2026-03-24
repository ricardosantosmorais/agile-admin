'use client'

import { CampaignFormPage, LEVE_E_PAGUE_DEFINITION } from '@/src/features/campanhas-promocionais/services/campanhas-config'

export function LeveEPagueFormPage({ id }: { id?: string }) {
  return <CampaignFormPage id={id} definition={LEVE_E_PAGUE_DEFINITION} />
}
