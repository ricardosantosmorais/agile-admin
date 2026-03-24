import { ClienteFormPage } from '@/src/features/clientes/components/cliente-form-page'
import { ParamsBridge } from '@/src/next/params-bridge'

export default function EditarClienteRoutePage() {
  return (
    <ParamsBridge>
      <ClienteFormPage />
    </ParamsBridge>
  )
}
