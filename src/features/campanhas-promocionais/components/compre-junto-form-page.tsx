'use client'

import { CampaignFormPage, COMPRE_JUNTO_DEFINITION } from '@/src/features/campanhas-promocionais/services/campanhas-config'

export function CompreJuntoFormPage({ id }: { id?: string }) {
  return <CampaignFormPage id={id} definition={COMPRE_JUNTO_DEFINITION} />
}
