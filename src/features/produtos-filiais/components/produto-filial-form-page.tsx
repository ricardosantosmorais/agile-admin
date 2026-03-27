'use client'

import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import { produtosFiliaisClient } from '@/src/features/produtos-filiais/services/produtos-filiais-client'
import { PRODUTOS_FILIAIS_CONFIG } from '@/src/features/produtos-filiais/services/produtos-filiais-config'

export function ProdutoFilialFormPage({ id }: { id?: string }) {
  return <CrudFormPage config={PRODUTOS_FILIAIS_CONFIG} client={produtosFiliaisClient} id={id} />
}
