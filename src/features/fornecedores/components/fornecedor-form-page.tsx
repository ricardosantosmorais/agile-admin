'use client'

import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import { FORNECEDORES_CONFIG } from '@/src/features/fornecedores/services/fornecedores-config'
import { fornecedoresClient } from '@/src/features/fornecedores/services/fornecedores-client'

export function FornecedorFormPage({ id }: { id?: string }) {
  return <CrudFormPage config={FORNECEDORES_CONFIG} client={fornecedoresClient} id={id} />
}
