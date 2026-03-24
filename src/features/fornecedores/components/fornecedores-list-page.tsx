'use client'

import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { FORNECEDORES_CONFIG } from '@/src/features/fornecedores/services/fornecedores-config'
import { fornecedoresClient } from '@/src/features/fornecedores/services/fornecedores-client'

export function FornecedoresListPage() {
  return <CrudListPage config={FORNECEDORES_CONFIG} client={fornecedoresClient} />
}
