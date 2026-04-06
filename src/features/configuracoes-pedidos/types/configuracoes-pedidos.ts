export type ConfiguracoesPedidosFieldKey =
  | 'atualizar_carrinho'
  | 'bloqueia_pedidos'
  | 'checkout_unificado'
  | 'codigo_vendedor'
  | 'exibe_impostos'
  | 'exige_pagamento_total'
  | 'exige_vendedor'
  | 'filial_cliente'
  | 'forca_tabela_preco'
  | 'forma_condicao_pagamento_filial_pedido'
  | 'gera_brindes'
  | 'importar_carrinho'
  | 'inclui_tributos'
  | 'internaliza_brinde'
  | 'internalizar_orcamentos'
  | 'mensagem_aceite_pedidos'
  | 'mensagem_bloqueio_pedidos'
  | 'multi_embalagem'
  | 'multi_filial'
  | 'observacoes'
  | 'oculta_timeline'
  | 'opcoes_falta'
  | 'ordem_compra'
  | 'ordem_compra_pedido'
  | 'permite_pedido_recorrente'
  | 'pix_unico'
  | 'precisao_difal'
  | 'reenvia_email_carrinho'
  | 'split_encomenda'
  | 'split_pedidos'
  | 'split_visual'
  | 'tentativas_pagamento'
  | 'validade_link_pagamento_horas'

export type ConfiguracoesPedidosSectionKey =
  | 'checkout'
  | 'split'
  | 'payment'
  | 'experience'

export type ConfiguracoesPedidosFormValues = Record<ConfiguracoesPedidosFieldKey, string>

export type ConfiguracoesPedidosFieldMeta = {
  updatedAt: string
  updatedBy: string
}

export type ConfiguracoesPedidosOption = {
  value: string
  label: string
}

export type ConfiguracoesPedidosRecord = {
  values: ConfiguracoesPedidosFormValues
  metadata: Partial<Record<ConfiguracoesPedidosFieldKey, ConfiguracoesPedidosFieldMeta>>
}

export type ConfiguracoesPedidosFieldDefinition = {
  key: ConfiguracoesPedidosFieldKey
  section: ConfiguracoesPedidosSectionKey
  type: 'text' | 'enum'
  label: string
  helper?: string
  inputMode?: 'text' | 'numeric' | 'decimal'
  options?: ConfiguracoesPedidosOption[]
}
