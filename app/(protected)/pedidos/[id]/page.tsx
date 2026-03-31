import { PedidoDetailPage } from '@/src/features/pedidos/components/pedido-detail-page'
import { ParamsBridge } from '@/src/next/params-bridge'

export default function PedidoPage() {
  return (
    <ParamsBridge>
      <PedidoDetailPage />
    </ParamsBridge>
  )
}
