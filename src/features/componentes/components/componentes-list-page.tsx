'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { componentesClient } from '@/src/features/componentes/services/componentes-client'
import { COMPONENTES_CONFIG } from '@/src/features/componentes/services/componentes-config'

export function ComponentesListPage() {
  return <CrudListPage config={COMPONENTES_CONFIG} client={componentesClient} />
}
