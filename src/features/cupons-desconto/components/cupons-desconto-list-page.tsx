'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { cuponsDescontoClient } from '@/src/features/cupons-desconto/services/cupons-desconto-client'
import { CUPONS_DESCONTO_CONFIG } from '@/src/features/cupons-desconto/services/cupons-desconto-config'

export function CuponsDescontoListPage() {
  return <CrudListPage config={CUPONS_DESCONTO_CONFIG} client={cuponsDescontoClient} />
}
