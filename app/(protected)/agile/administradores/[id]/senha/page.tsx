import { AgileAdministradorPasswordPage } from '@/src/features/agile-administradores/components/agile-administrador-password-page'
import { ParamsBridge } from '@/src/next/params-bridge'

export default function AgileAdministradorSenhaRoutePage() {
  return (
    <ParamsBridge>
      <AgileAdministradorPasswordPage />
    </ParamsBridge>
  )
}
