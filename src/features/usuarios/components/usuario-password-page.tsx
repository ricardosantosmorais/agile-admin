'use client'

import { EntityPasswordPage } from '@/src/components/form-page/entity-password-page'
import { usuariosClient } from '@/src/features/usuarios/services/usuarios-client'
import { createEmptyUsuarioPassword } from '@/src/features/usuarios/services/usuarios-mappers'

export function UsuarioPasswordPage() {
  return (
    <EntityPasswordPage
      featureKey="usuarios"
      i18nPrefix="usuarios"
      sectionRouteKey="routes.people"
      modulePath="/usuarios"
      moduleRouteKey="usuarios.title"
      formId="usuario-password-form"
      createEmpty={createEmptyUsuarioPassword}
      loadById={(id) => usuariosClient.getPasswordById(id)}
      savePassword={(payload) => usuariosClient.changePassword(payload)}
    />
  )
}
