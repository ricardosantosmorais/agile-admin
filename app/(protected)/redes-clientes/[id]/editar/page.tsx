'use client'

import { ParamsBridge } from '@/src/next/params-bridge'
import { RedeClienteFormPage } from '@/src/features/redes-clientes/components/rede-cliente-form-page'

export default function Page() {
  return (
    <ParamsBridge>
      <RedeClienteFormPage />
    </ParamsBridge>
  )
}
