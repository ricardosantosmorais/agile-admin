import { ParametroFormPage } from '@/src/features/parametros/components/parametro-form-page'
import { ParamsBridge } from '@/src/next/params-bridge'

export default function EditarParametroRoutePage() {
  return (
    <ParamsBridge>
      <ParametroFormPage />
    </ParamsBridge>
  )
}
