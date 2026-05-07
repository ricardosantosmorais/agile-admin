export type PedidoStatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

export const PEDIDO_STATUS_META: Record<string, { label: string; tone: PedidoStatusTone }> = {
  pagamento_aprovado: { label: 'Pagamento aprovado', tone: 'success' },
  aprovado: { label: 'Aprovado', tone: 'success' },
  concluido: { label: 'Concluído', tone: 'success' },
  estornado: { label: 'Estornado', tone: 'success' },
  faturado: { label: 'Faturado', tone: 'success' },
  coletado: { label: 'Coletado', tone: 'success' },
  entregue: { label: 'Entregue', tone: 'success' },
  pronto_retirada: { label: 'Pronto para retirada', tone: 'success' },
  pagamento_em_analise: { label: 'Pagamento em análise', tone: 'warning' },
  em_analise: { label: 'Pedido em análise', tone: 'warning' },
  aguardando_faturamento: { label: 'Aguardando faturamento', tone: 'warning' },
  aguardando_pagamento: { label: 'Aguardando pagamento', tone: 'warning' },
  carrinho: { label: 'Carrinho', tone: 'warning' },
  separado: { label: 'Separado', tone: 'warning' },
  devolvido: { label: 'Devolvido', tone: 'warning' },
  devolvido_parcial: { label: 'Devolvido parcial', tone: 'warning' },
  aguardando_recepcao: { label: 'Aguardando recepção', tone: 'warning' },
  pendente: { label: 'Pendente', tone: 'warning' },
  rejeitado: { label: 'Rejeitado', tone: 'danger' },
  reprovado: { label: 'Reprovado', tone: 'danger' },
  pagamento_reprovado: { label: 'Pagamento reprovado', tone: 'danger' },
  cancelado: { label: 'Cancelado', tone: 'danger' },
  bloqueio_financeiro: { label: 'Bloqueio financeiro', tone: 'danger' },
  bloqueio_comercial: { label: 'Bloqueio comercial', tone: 'danger' },
  bloqueio_sefaz: { label: 'Bloqueio Sefaz', tone: 'danger' },
  recebido: { label: 'Recebido', tone: 'info' },
  em_conferencia: { label: 'Em conferência', tone: 'info' },
  conferido: { label: 'Conferido', tone: 'info' },
  aguardando_separacao: { label: 'Aguardando separação', tone: 'info' },
  em_separacao: { label: 'Em separação', tone: 'info' },
  em_transporte: { label: 'Em transporte', tone: 'info' },
  reentrega: { label: 'Reentrega', tone: 'info' },
  rascunho: { label: 'Rascunho', tone: 'info' },
}

export function getPedidoStatusMeta(value: unknown) {
  const key = String(value || '').trim().toLowerCase()
  return PEDIDO_STATUS_META[key] ?? {
    label: key ? key.replace(/_/g, ' ') : '-',
    tone: 'neutral' as const,
  }
}

export const PEDIDO_STATUS_OPTIONS = Object.entries(PEDIDO_STATUS_META).map(([value, meta]) => ({
  value,
  label: meta.label,
}))

export const PEDIDO_DELIVERY_STATUS_OPTIONS = [
  { value: 'aguardando', labelKey: 'orders.deliveryStatusOptions.waiting', fallback: 'Aguardando' },
  { value: 'pronto_retirada', labelKey: 'orders.deliveryStatusOptions.readyForPickup', fallback: 'Pronto para retirada' },
  { value: 'coletado', labelKey: 'orders.deliveryStatusOptions.collected', fallback: 'Coletado' },
  { value: 'devolvido', labelKey: 'orders.deliveryStatusOptions.returned', fallback: 'Devolvido' },
  { value: 'em_transporte', labelKey: 'orders.deliveryStatusOptions.inTransit', fallback: 'Em transporte' },
  { value: 'entregue', labelKey: 'orders.deliveryStatusOptions.delivered', fallback: 'Entregue' },
  { value: 'solicitado', labelKey: 'orders.deliveryStatusOptions.requested', fallback: 'Solicitado' },
] as const
