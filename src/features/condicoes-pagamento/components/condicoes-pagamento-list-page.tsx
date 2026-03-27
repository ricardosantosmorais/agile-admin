'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { condicoesPagamentoClient } from '@/src/features/condicoes-pagamento/services/condicoes-pagamento-client'
import { CONDICOES_PAGAMENTO_CONFIG } from '@/src/features/condicoes-pagamento/services/condicoes-pagamento-config'

export function CondicoesPagamentoListPage() {
  return <CrudListPage config={CONDICOES_PAGAMENTO_CONFIG} client={condicoesPagamentoClient} />
}
