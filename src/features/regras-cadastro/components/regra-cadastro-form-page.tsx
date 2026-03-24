'use client'

import { createCrudClient } from '@/src/components/crud-base/crud-client'
import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import { REGRAS_CADASTRO_CONFIG } from '@/src/features/regras-cadastro/services/regras-cadastro-config'

const regrasCadastroClient = createCrudClient('/api/regras-cadastro')

export function RegraCadastroFormPage({ id }: { id?: string }) {
  return <CrudFormPage config={REGRAS_CADASTRO_CONFIG} client={regrasCadastroClient} id={id} />
}
