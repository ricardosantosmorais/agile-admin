'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { PRODUTOS_CONFIG } from '@/src/features/produtos/services/produtos-config'
import { produtosClient } from '@/src/features/produtos/services/produtos-client'

export function ProdutosListPage() {
  return <CrudListPage config={PRODUTOS_CONFIG} client={produtosClient} />
}

