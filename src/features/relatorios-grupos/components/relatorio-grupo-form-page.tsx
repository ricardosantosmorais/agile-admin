'use client'

import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import { relatoriosGruposClient } from '@/src/features/relatorios-grupos/services/relatorios-grupos-client'
import { RELATORIOS_GRUPOS_CONFIG } from '@/src/features/relatorios-grupos/services/relatorios-grupos-config'

export function RelatorioGrupoFormPage({ id }: { id?: string }) {
  return <CrudFormPage config={RELATORIOS_GRUPOS_CONFIG} client={relatoriosGruposClient} id={id} />
}
