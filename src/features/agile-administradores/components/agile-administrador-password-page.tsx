'use client'

import { EntityPasswordPage } from '@/src/components/form-page/entity-password-page'
import { agileAdministradoresClient } from '@/src/features/agile-administradores/services/agile-administradores-client'
import { createEmptyAgileAdministradorPassword } from '@/src/features/agile-administradores/services/agile-administradores-mappers'

export function AgileAdministradorPasswordPage() {
  return (
    <EntityPasswordPage
      featureKey="administradores"
      i18nPrefix="administradores"
      sectionRouteKey="routes.administration"
      modulePath="/agile/administradores"
      moduleRouteKey="administradores.title"
      formId="agile-administrador-password-form"
      createEmpty={createEmptyAgileAdministradorPassword}
      loadById={(id) => agileAdministradoresClient.getPasswordById(id)}
      savePassword={(payload) => agileAdministradoresClient.changePassword(payload)}
    />
  )
}
