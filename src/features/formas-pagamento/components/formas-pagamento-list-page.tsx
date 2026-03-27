'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { FORMAS_PAGAMENTO_CONFIG } from '@/src/features/formas-pagamento/services/formas-pagamento-config'
import { formasPagamentoClient } from '@/src/features/formas-pagamento/services/formas-pagamento-client'

export function FormasPagamentoListPage() {
  return <CrudListPage config={FORMAS_PAGAMENTO_CONFIG} client={formasPagamentoClient} />
}
