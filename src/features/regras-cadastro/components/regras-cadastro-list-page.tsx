'use client'

import { createCrudClient } from '@/src/components/crud-base/crud-client'
import { CrudListPage } from '@/src/components/crud-base/crud-list-page'
import { REGRAS_CADASTRO_CONFIG } from '@/src/features/regras-cadastro/services/regras-cadastro-config'

const regrasCadastroClient = createCrudClient('/api/regras-cadastro')

export function RegrasCadastroListPage() {
  return <CrudListPage config={REGRAS_CADASTRO_CONFIG} client={regrasCadastroClient} />
}
