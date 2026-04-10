import { ParamsBridge } from '@/src/next/params-bridge'
import { SupervisorFormPage } from '@/src/features/supervisores/components/supervisor-form-page'

export default function Page() {
  return (
    <ParamsBridge>
      <SupervisorFormPage />
    </ParamsBridge>
  )
}
