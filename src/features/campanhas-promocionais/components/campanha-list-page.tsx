'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { campanhasClient } from '@/src/features/campanhas-promocionais/services/campanhas-client'
import type { CrudModuleConfig } from '@/src/components/crud-base/types'

export function CampanhaListPage({ config }: { config: CrudModuleConfig }) {
  return <CrudListPage config={config} client={campanhasClient} />
}
