import type { CrudFieldOption } from '@/src/components/crud-base/types'

export const EMAIL_PAYLOAD_TYPE_OPTIONS: CrudFieldOption[] = [
  { value: '', labelKey: 'common.select', label: 'Selecione' },
  { value: 'cadastro_cliente', labelKey: 'maintenance.emailPayloads.types.cadastro_cliente', label: 'Cadastro de Cliente' },
  { value: 'solicitacao_cadastro', labelKey: 'maintenance.emailPayloads.types.solicitacao_cadastro', label: 'Solicitacao de Cadastro' },
  { value: 'pedido_em_transporte', labelKey: 'maintenance.emailPayloads.types.pedido_em_transporte', label: 'Pedido em Transporte' },
  { value: 'pedido_entregue', labelKey: 'maintenance.emailPayloads.types.pedido_entregue', label: 'Pedido Entregue' },
  { value: 'orcamento_recebido', labelKey: 'maintenance.emailPayloads.types.orcamento_recebido', label: 'Orcamento Recebido' },
  { value: 'cliente_aprovado', labelKey: 'maintenance.emailPayloads.types.cliente_aprovado', label: 'Cliente Aprovado' },
  { value: 'cliente_reprovado', labelKey: 'maintenance.emailPayloads.types.cliente_reprovado', label: 'Cliente Reprovado' },
  { value: 'senha_ativacao', labelKey: 'maintenance.emailPayloads.types.senha_ativacao', label: 'Senha de Ativacao' },
  { value: 'pedido_coletado', labelKey: 'maintenance.emailPayloads.types.pedido_coletado', label: 'Pedido Coletado' },
  { value: 'pedido_pronto_retirada', labelKey: 'maintenance.emailPayloads.types.pedido_pronto_retirada', label: 'Pedido Pronto para Retirada' },
  { value: 'pedido_recebido', labelKey: 'maintenance.emailPayloads.types.pedido_recebido', label: 'Pedido Recebido' },
  { value: 'nova_senha', labelKey: 'maintenance.emailPayloads.types.nova_senha', label: 'Nova Senha' },
  { value: 'pedido_aprovado', labelKey: 'maintenance.emailPayloads.types.pedido_aprovado', label: 'Pedido Aprovado' },
  { value: 'pedido_reprovado', labelKey: 'maintenance.emailPayloads.types.pedido_reprovado', label: 'Pedido Reprovado' },
  { value: 'pedido_cancelado', labelKey: 'maintenance.emailPayloads.types.pedido_cancelado', label: 'Pedido Cancelado' },
  { value: 'pedido_carrinho', labelKey: 'maintenance.emailPayloads.types.pedido_carrinho', label: 'Pedido Carrinho' },
  { value: 'pedido_faturado', labelKey: 'maintenance.emailPayloads.types.pedido_faturado', label: 'Pedido Faturado' },
]

export function getEmailPayloadTypeLabel(value: unknown) {
  const normalized = String(value ?? '').trim()
  return EMAIL_PAYLOAD_TYPE_OPTIONS.find((option) => option.value === normalized && option.value)?.label || normalized || '-'
}
