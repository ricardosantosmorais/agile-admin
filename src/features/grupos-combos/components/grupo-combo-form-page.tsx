'use client'

import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import { gruposCombosClient } from '@/src/features/grupos-combos/services/grupos-combos-client'
import { GRUPOS_COMBOS_CONFIG } from '@/src/features/grupos-combos/services/grupos-combos-config'

export function GrupoComboFormPage({ id }: { id?: string }) {
  return <CrudFormPage config={GRUPOS_COMBOS_CONFIG} client={gruposCombosClient} id={id} />
}
