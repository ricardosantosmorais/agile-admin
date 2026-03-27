'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { tabelasPrecoClient } from '@/src/features/tabelas-preco/services/tabelas-preco-client'
import { TABELAS_PRECO_CONFIG } from '@/src/features/tabelas-preco/services/tabelas-preco-config'

export function TabelasPrecoListPage() {
  return <CrudListPage config={TABELAS_PRECO_CONFIG} client={tabelasPrecoClient} />
}
