import { RelatorioPreviewPage } from '@/src/features/relatorios/components/relatorio-preview-page'
import { ParamsBridge } from '@/src/next/params-bridge'

export default function RelatorioRoutePage() {
  return (
    <ParamsBridge>
      <RelatorioPreviewPage />
    </ParamsBridge>
  )
}
