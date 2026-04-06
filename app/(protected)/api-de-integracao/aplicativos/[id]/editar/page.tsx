import { AplicativoFormPage } from '@/src/features/integracao-aplicativos/components/aplicativo-form-page'
import { ParamsBridge } from '@/src/next/params-bridge'

export default function EditarApiIntegracaoAplicativoRoutePage() {
  return (
    <ParamsBridge>
      <AplicativoFormPage />
    </ParamsBridge>
  )
}

