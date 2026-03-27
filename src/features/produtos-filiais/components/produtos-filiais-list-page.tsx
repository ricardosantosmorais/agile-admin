'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { produtosFiliaisClient } from '@/src/features/produtos-filiais/services/produtos-filiais-client'
import { PRODUTOS_FILIAIS_CONFIG } from '@/src/features/produtos-filiais/services/produtos-filiais-config'

export function ProdutosFiliaisListPage() {
  return <CrudListPage config={PRODUTOS_FILIAIS_CONFIG} client={produtosFiliaisClient} />
}
