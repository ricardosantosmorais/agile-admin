'use client'

import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import {
  INTEGRACAO_APLICATIVOS_CONFIG,
} from '@/src/features/integracao-aplicativos/services/integracao-aplicativos-config'
import { integracaoAplicativosCrudClient } from '@/src/features/integracao-aplicativos/services/integracao-aplicativos-crud-client'

export function AplicativoFormPage({ id }: { id?: string }) {
  return <CrudFormPage config={INTEGRACAO_APLICATIVOS_CONFIG} client={integracaoAplicativosCrudClient} id={id} />
}
