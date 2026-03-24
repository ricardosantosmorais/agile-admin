import { UsuarioPasswordPage } from '@/src/features/usuarios/components/usuario-password-page'
import { ParamsBridge } from '@/src/next/params-bridge'

export default function AlterarSenhaUsuarioRoutePage() {
  return (
    <ParamsBridge>
      <UsuarioPasswordPage />
    </ParamsBridge>
  )
}
