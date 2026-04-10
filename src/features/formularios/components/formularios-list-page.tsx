'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { formulariosClient } from '@/src/features/formularios/services/formularios-client'
import { FORMULARIOS_CONFIG } from '@/src/features/formularios/services/formularios-config'

export function FormulariosListPage() {
  return <CrudListPage config={FORMULARIOS_CONFIG} client={formulariosClient} />
}
