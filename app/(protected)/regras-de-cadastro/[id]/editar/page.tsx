'use client'

import { ParamsBridge } from '@/src/next/params-bridge'
import { RegraCadastroFormPage } from '@/src/features/regras-cadastro/components/regra-cadastro-form-page'

export default function Page() {
  return (
    <ParamsBridge>
      <RegraCadastroFormPage />
    </ParamsBridge>
  )
}
