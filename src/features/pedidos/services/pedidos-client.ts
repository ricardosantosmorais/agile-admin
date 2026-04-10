import { httpClient } from '@/src/services/http/http-client'
import type { PedidoDetail, PedidoListFilters, PedidoListResponse } from '@/src/features/pedidos/services/pedidos-types'

export const PEDIDOS_DETAIL_EMBED = [
  'canal_distribuicao',
  'cliente',
  'cupom_desconto',
  'entrega',
  'entrega.transportadora',
  'eventos',
  'filial',
  'filial_nf',
  'filial_estoque',
  'filial_retira',
  'logs',
  'pagamento',
  'produtos',
  'produtos.cupom_automatico',
  'produtos.produto',
  'produtos.embalagem',
  'vendedor',
  'usuario',
].join(',')

export const pedidosClient = {
  list(filters: PedidoListFilters) {
    const params = new URLSearchParams({
      page: String(filters.page),
      perPage: String(filters.perPage),
      orderBy: filters.orderBy,
      sort: filters.sort,
    })

    for (const [key, value] of Object.entries(filters)) {
      if (['page', 'perPage', 'orderBy', 'sort'].includes(key) || key.endsWith('_label')) continue
      const normalized = String(value || '').trim()
      if (!normalized) continue
      params.set(key, normalized)
    }

    return httpClient<PedidoListResponse>(`/api/pedidos?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
  getById(id: string) {
    return httpClient<PedidoDetail>(`/api/pedidos/${encodeURIComponent(id)}?embed=${encodeURIComponent(PEDIDOS_DETAIL_EMBED)}`, {
      method: 'GET',
      cache: 'no-store',
    })
  },
  approve(id: string) {
    return httpClient<{ success: boolean; id: string }>(`/api/pedidos/${encodeURIComponent(id)}/aprovar`, {
      method: 'POST',
      cache: 'no-store',
    })
  },
  cancel(id: string, descricao: string) {
    return httpClient<{ success: boolean; id: string }>(`/api/pedidos/${encodeURIComponent(id)}/cancelar`, {
      method: 'POST',
      cache: 'no-store',
      body: JSON.stringify({ descricao }),
    })
  },
  saveInternalNotes(id: string, observacoes_internas: string) {
    return httpClient<{ success: boolean; id: string }>(`/api/pedidos/${encodeURIComponent(id)}/observacoes-internas`, {
      method: 'POST',
      cache: 'no-store',
      body: JSON.stringify({ observacoes_internas }),
    })
  },
  updateDelivery(
    id: string,
    payload: {
      entregaId: string
      status: string
      rastreamento: string
      codigo: string
      prazo: string
    },
  ) {
    return httpClient<{ success: boolean; id: string }>(`/api/pedidos/${encodeURIComponent(id)}/entrega`, {
      method: 'POST',
      cache: 'no-store',
      body: JSON.stringify({
        id: payload.entregaId,
        status: payload.status,
        rastreamento: payload.rastreamento,
        codigo: payload.codigo,
        prazo: payload.prazo,
      }),
    })
  },
}
