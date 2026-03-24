import { ConfiguracaoFormPage } from '@/src/features/configuracoes/components/configuracao-form-page'
import { ParamsBridge } from '@/src/next/params-bridge'

export default function ConfiguracaoRoutePage() {
  return (
    <ParamsBridge>
      <ConfiguracaoFormPage />
    </ParamsBridge>
  )
}
