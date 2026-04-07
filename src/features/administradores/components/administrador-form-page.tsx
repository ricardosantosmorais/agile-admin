'use client'

import { CrudFormPage } from '@/src/components/crud-base/crud-form-page'
import { ADMINISTRADORES_CONFIG } from '@/src/features/administradores/services/administradores-config'
import { administradoresCrudClient } from '@/src/features/administradores/services/administradores-crud-client'

export function AdministradorFormPage({ id }: { id?: string }) {
  return <CrudFormPage config={ADMINISTRADORES_CONFIG} client={administradoresCrudClient} id={id} />
}
