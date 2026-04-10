import { ParamsBridge } from '@/src/next/params-bridge'
import { GruposClientesFormPage } from '@/src/features/grupos-clientes/components/grupos-clientes-form-page'

export default function Page() {
  return (
    <ParamsBridge>
      <GruposClientesFormPage />
    </ParamsBridge>
  )
}
