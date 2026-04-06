import { PerfilFormPage } from '@/src/features/perfis/components/perfil-form-page'
import { ParamsBridge } from '@/src/next/params-bridge'

export default function EditarPerfilRoutePage() {
  return (
    <ParamsBridge>
      <PerfilFormPage />
    </ParamsBridge>
  )
}
