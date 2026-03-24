'use client'

import { ParamsBridge } from '@/src/next/params-bridge'
import { VendedorFormPage } from '@/src/features/vendedores/components/vendedor-form-page'

export default function Page() {
  return (
    <ParamsBridge>
      <VendedorFormPage />
    </ParamsBridge>
  )
}
