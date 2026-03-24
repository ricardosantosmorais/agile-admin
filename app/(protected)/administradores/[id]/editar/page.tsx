import { AdministradorFormPage } from '@/src/features/administradores/components/administrador-form-page'
import { ParamsBridge } from '@/src/next/params-bridge'

export default function EditarAdministradorRoutePage() {
  return (
    <ParamsBridge>
      <AdministradorFormPage />
    </ParamsBridge>
  )
}
