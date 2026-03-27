'use client'

import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import { sequenciaisClient } from '@/src/features/sequenciais/services/sequenciais-client'
import { SEQUENCIAIS_CONFIG } from '@/src/features/sequenciais/services/sequenciais-config'

export function SequencialFormPage({ id }: { id?: string }) {
  return <CrudFormPage config={SEQUENCIAIS_CONFIG} client={sequenciaisClient} id={id} />
}
