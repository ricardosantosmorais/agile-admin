import { AdministradorPasswordPage } from '@/src/features/administradores/components/administrador-password-page'
import { ParamsBridge } from '@/src/next/params-bridge'

export default function AlterarSenhaAdministradorRoutePage() {
  return (
    <ParamsBridge>
      <AdministradorPasswordPage />
    </ParamsBridge>
  )
}
