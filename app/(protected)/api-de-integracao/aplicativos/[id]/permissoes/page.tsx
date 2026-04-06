import { AplicativoPermissoesPage } from '@/src/features/integracao-aplicativos/components/aplicativo-permissoes-page'
import { ParamsBridge } from '@/src/next/params-bridge'

export default function PermissoesApiIntegracaoAplicativoRoutePage() {
  return (
    <ParamsBridge>
      <AplicativoPermissoesPage />
    </ParamsBridge>
  )
}

