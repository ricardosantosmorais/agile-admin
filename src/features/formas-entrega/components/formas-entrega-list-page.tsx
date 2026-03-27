'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { FORMAS_ENTREGA_CONFIG } from '@/src/features/formas-entrega/services/formas-entrega-config'
import { formasEntregaClient } from '@/src/features/formas-entrega/services/formas-entrega-client'

export function FormasEntregaListPage() {
  return <CrudListPage config={FORMAS_ENTREGA_CONFIG} client={formasEntregaClient} />
}
