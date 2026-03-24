'use client'

import { ParamsBridge } from '@/src/next/params-bridge'
import { SegmentoClienteFormPage } from '@/src/features/segmentos-clientes/components/segmento-cliente-form-page'

export default function Page() {
  return (
    <ParamsBridge>
      <SegmentoClienteFormPage />
    </ParamsBridge>
  )
}
