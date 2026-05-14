import { ParamsBridge } from '@/src/next/params-bridge'
import { CatalogoDigitalFormPage } from '@/src/features/catalogos-digitais/components/catalogos-digitais-form-page'

export default function Page() {
  return (
    <ParamsBridge>
      <CatalogoDigitalFormPage />
    </ParamsBridge>
  )
}
