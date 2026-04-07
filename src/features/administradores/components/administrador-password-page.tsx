'use client'

import { EntityPasswordPage } from '@/src/components/form-page/entity-password-page'
import { administradoresClient } from '@/src/features/administradores/services/administradores-client'
import { createEmptyAdminPassword } from '@/src/features/administradores/services/administradores-mappers'

export function AdministradorPasswordPage() {
  return (
    <EntityPasswordPage
      featureKey="administradores"
      i18nPrefix="administradores"
      sectionRouteKey="routes.administration"
      modulePath="/administradores"
      moduleRouteKey="administradores.title"
      formId="administrador-password-form"
      createEmpty={createEmptyAdminPassword}
      loadById={(id) => administradoresClient.getPasswordById(id)}
      savePassword={(payload) => administradoresClient.changePassword(payload)}
    />
  )
}
