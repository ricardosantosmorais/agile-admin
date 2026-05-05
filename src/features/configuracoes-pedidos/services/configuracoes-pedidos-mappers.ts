import type {
  ConfiguracoesPedidosFieldDefinition,
  ConfiguracoesPedidosFieldKey,
  ConfiguracoesPedidosFormValues,
  ConfiguracoesPedidosRecord,
} from '@/src/features/configuracoes-pedidos/types/configuracoes-pedidos'

type ApiRecord = Record<string, unknown>
type Translate = (key: string, fallback: string) => string

function asRecord(value: unknown): ApiRecord {
  return typeof value === 'object' && value !== null ? (value as ApiRecord) : {}
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : []
}

function toStringValue(value: unknown) {
  return String(value ?? '').trim()
}

export function getConfiguracoesPedidosFieldDefinitions(t: Translate): ConfiguracoesPedidosFieldDefinition[] {
  const yesNoOptions = [
    { value: '1', label: t('common.yes', 'Sim') },
    { value: '0', label: t('common.no', 'Não') },
  ] as const

  return [
    { key: 'atualizar_carrinho', section: 'checkout', type: 'enum', label: t('configuracoes.orders.fields.atualizar_carrinho.label', 'Atualizar preços'), helper: t('configuracoes.orders.fields.atualizar_carrinho.helper', 'Indica de que forma os preços serão atualizados no carrinho.'), options: [{ value: 'A', label: t('configuracoes.orders.options.atualizar_carrinho.auto', 'Automático') }, { value: 'M', label: t('configuracoes.orders.options.atualizar_carrinho.manual', 'Manual') }] },
    { key: 'checkout_unificado', section: 'checkout', type: 'enum', label: t('configuracoes.orders.fields.checkout_unificado.label', 'Checkout unificado'), helper: t('configuracoes.orders.fields.checkout_unificado.helper', 'Indica se o checkout fica em uma única etapa.'), options: [...yesNoOptions] },
    { key: 'exige_vendedor', section: 'checkout', type: 'enum', label: t('configuracoes.orders.fields.exige_vendedor.label', 'Exige vendedor'), helper: t('configuracoes.orders.fields.exige_vendedor.helper', 'Indica se o pedido exige um vendedor associado.'), options: [...yesNoOptions] },
    { key: 'codigo_vendedor', section: 'checkout', type: 'enum', label: t('configuracoes.orders.fields.codigo_vendedor.label', 'Informar vendedor'), helper: t('configuracoes.orders.fields.codigo_vendedor.helper', 'Controla como o vendedor é informado no checkout.'), options: [{ value: 'S', label: t('configuracoes.orders.options.codigo_vendedor.select', 'Selecionar existente') }, { value: 'C', label: t('configuracoes.orders.options.codigo_vendedor.code', 'Digitar código') }, { value: 'N', label: t('configuracoes.orders.options.codigo_vendedor.none', 'Não informar') }] },
    { key: 'filial_cliente', section: 'checkout', type: 'enum', label: t('configuracoes.orders.fields.filial_cliente.label', 'Força filial de navegação'), helper: t('configuracoes.orders.fields.filial_cliente.helper', 'Grava a filial de navegação como filial do pedido.'), options: [...yesNoOptions] },
    { key: 'forca_tabela_preco', section: 'checkout', type: 'enum', label: t('configuracoes.orders.fields.forca_tabela_preco.label', 'Força tabela de preço'), helper: t('configuracoes.orders.fields.forca_tabela_preco.helper', 'Grava a tabela de preço detectada na navegação.'), options: [...yesNoOptions] },
    { key: 'forma_condicao_pagamento_filial_pedido', section: 'payment', type: 'enum', label: t('configuracoes.orders.fields.forma_condicao_pagamento_filial_pedido.label', 'Formas e condições por filial'), helper: t('configuracoes.orders.fields.forma_condicao_pagamento_filial_pedido.helper', 'Filtra formas e condições pela filial do pedido.'), options: [...yesNoOptions] },
    { key: 'exige_pagamento_total', section: 'payment', type: 'enum', label: t('configuracoes.orders.fields.exige_pagamento_total.label', 'Exige pagamento total'), helper: t('configuracoes.orders.fields.exige_pagamento_total.helper', 'Exige autorização de pagamento de todos os pedidos para concluir a compra.'), options: [...yesNoOptions] },
    { key: 'pix_unico', section: 'payment', type: 'enum', label: t('configuracoes.orders.fields.pix_unico.label', 'PIX único'), helper: t('configuracoes.orders.fields.pix_unico.helper', 'Gera um código PIX único para múltiplas encomendas.'), options: [...yesNoOptions] },
    { key: 'exibe_juros_parcelas', section: 'payment', type: 'enum', label: t('configuracoes.orders.fields.exibe_juros_parcelas.label', 'Exibe juros das condições'), helper: t('configuracoes.orders.fields.exibe_juros_parcelas.helper', 'Indica se a plataforma exibe a informação de juros das condições de pagamento nas parcelas do cartão no checkout.'), options: [...yesNoOptions] },
    { key: 'tentativas_pagamento', section: 'payment', type: 'text', label: t('configuracoes.orders.fields.tentativas_pagamento.label', 'Tentativas de pagamento'), helper: t('configuracoes.orders.fields.tentativas_pagamento.helper', 'Bloqueia por uma hora após a quantidade definida de tentativas.'), inputMode: 'numeric' },
    { key: 'validade_link_pagamento_horas', section: 'payment', type: 'text', label: t('configuracoes.orders.fields.validade_link_pagamento_horas.label', 'Validade do link de pagamento (horas)'), helper: t('configuracoes.orders.fields.validade_link_pagamento_horas.helper', 'Se não informado, o padrão é de 24 horas.'), inputMode: 'numeric' },
    { key: 'internalizar_orcamentos', section: 'payment', type: 'enum', label: t('configuracoes.orders.fields.internalizar_orcamentos.label', 'Internalizar orçamentos'), helper: t('configuracoes.orders.fields.internalizar_orcamentos.helper', 'Marca pedidos de orçamento para internalização no ERP.'), options: [...yesNoOptions] },
    { key: 'internaliza_brinde', section: 'payment', type: 'enum', label: t('configuracoes.orders.fields.internaliza_brinde.label', 'Internalizar brindes'), helper: t('configuracoes.orders.fields.internaliza_brinde.helper', 'Marca pedidos de brinde para internalização no ERP.'), options: [...yesNoOptions] },
    { key: 'split_pedidos', section: 'split', type: 'enum', label: t('configuracoes.orders.fields.split_pedidos.label', 'Split'), helper: t('configuracoes.orders.fields.split_pedidos.helper', 'Tipo de quebra dos pedidos.'), options: [{ value: 'canal_distribuicao', label: t('configuracoes.orders.options.split_pedidos.channel', 'Canal de distribuição') }, { value: 'filial', label: t('configuracoes.orders.options.split_pedidos.branch', 'Filial') }, { value: 'vendedor', label: t('configuracoes.orders.options.split_pedidos.seller', 'Vendedor') }, { value: 'nenhum', label: t('configuracoes.orders.options.split_pedidos.none', 'Nenhum (sem quebra)') }] },
    { key: 'split_encomenda', section: 'split', type: 'enum', label: t('configuracoes.orders.fields.split_encomenda.label', 'Split encomenda'), helper: t('configuracoes.orders.fields.split_encomenda.helper', 'Quebra pedidos que tenham produtos para encomenda.'), options: [...yesNoOptions] },
    { key: 'split_visual', section: 'split', type: 'enum', label: t('configuracoes.orders.fields.split_visual.label', 'Split visual'), helper: t('configuracoes.orders.fields.split_visual.helper', 'Mostra em tela os pedidos quebrados.'), options: [...yesNoOptions] },
    { key: 'multi_filial', section: 'split', type: 'enum', label: t('configuracoes.orders.fields.multi_filial.label', 'Múltiplas filiais'), helper: t('configuracoes.orders.fields.multi_filial.helper', 'Permite pedidos envolvendo mais de uma filial.'), options: [...yesNoOptions] },
    { key: 'multi_embalagem', section: 'split', type: 'enum', label: t('configuracoes.orders.fields.multi_embalagem.label', 'Várias embalagens'), helper: t('configuracoes.orders.fields.multi_embalagem.helper', 'Permite embalagens diferentes de um mesmo produto no carrinho.'), options: [...yesNoOptions] },
    { key: 'gera_brindes', section: 'split', type: 'enum', label: t('configuracoes.orders.fields.gera_brindes.label', 'Gerar pedidos de brinde'), helper: t('configuracoes.orders.fields.gera_brindes.helper', 'Indica se a plataforma deve gerar pedidos de brinde.'), options: [...yesNoOptions] },
    { key: 'bloqueia_pedidos', section: 'experience', type: 'enum', label: t('configuracoes.orders.fields.bloqueia_pedidos.label', 'Bloqueada para pedidos'), helper: t('configuracoes.orders.fields.bloqueia_pedidos.helper', 'Indica se a plataforma está temporariamente bloqueada para pedidos.'), options: [...yesNoOptions] },
    { key: 'mensagem_bloqueio_pedidos', section: 'experience', type: 'text', label: t('configuracoes.orders.fields.mensagem_bloqueio_pedidos.label', 'Mensagem de bloqueio'), helper: t('configuracoes.orders.fields.mensagem_bloqueio_pedidos.helper', 'Texto exibido quando a loja estiver bloqueada para pedidos.') },
    { key: 'mensagem_aceite_pedidos', section: 'experience', type: 'text', label: t('configuracoes.orders.fields.mensagem_aceite_pedidos.label', 'Mensagem de aceite'), helper: t('configuracoes.orders.fields.mensagem_aceite_pedidos.helper', 'Texto exibido no aceite do pedido.') },
    { key: 'exibe_impostos', section: 'experience', type: 'enum', label: t('configuracoes.orders.fields.exibe_impostos.label', 'Exibe impostos'), helper: t('configuracoes.orders.fields.exibe_impostos.helper', 'Exibe os impostos dos produtos no pedido.'), options: [...yesNoOptions] },
    { key: 'inclui_tributos', section: 'experience', type: 'enum', label: t('configuracoes.orders.fields.inclui_tributos.label', 'Pedidos com tributos'), helper: t('configuracoes.orders.fields.inclui_tributos.helper', 'Soma os tributos no valor total do pedido.'), options: [...yesNoOptions] },
    { key: 'precisao_difal', section: 'experience', type: 'text', label: t('configuracoes.orders.fields.precisao_difal.label', 'Precisão DIFAL'), helper: t('configuracoes.orders.fields.precisao_difal.helper', 'Precisão decimal aplicada ao DIFAL.'), inputMode: 'numeric' },
    { key: 'observacoes', section: 'experience', type: 'enum', label: t('configuracoes.orders.fields.observacoes.label', 'Observações'), helper: t('configuracoes.orders.fields.observacoes.helper', 'Exibe campo de observações no checkout.'), options: [...yesNoOptions] },
    { key: 'oculta_timeline', section: 'experience', type: 'enum', label: t('configuracoes.orders.fields.oculta_timeline.label', 'Oculta timeline'), helper: t('configuracoes.orders.fields.oculta_timeline.helper', 'Oculta a timeline no detalhe do pedido.'), options: [...yesNoOptions] },
    { key: 'opcoes_falta', section: 'experience', type: 'enum', label: t('configuracoes.orders.fields.opcoes_falta.label', 'Opções de falta'), helper: t('configuracoes.orders.fields.opcoes_falta.helper', 'Mostra o campo para decidir o que fazer na falta de itens.'), options: [...yesNoOptions] },
    { key: 'ordem_compra_pedido', section: 'experience', type: 'enum', label: t('configuracoes.orders.fields.ordem_compra_pedido.label', 'Ordem de compra do pedido'), helper: t('configuracoes.orders.fields.ordem_compra_pedido.helper', 'Permite informar ordem de compra no pedido.'), options: [...yesNoOptions] },
    { key: 'ordem_compra', section: 'experience', type: 'enum', label: t('configuracoes.orders.fields.ordem_compra.label', 'Ordem de compra dos produtos'), helper: t('configuracoes.orders.fields.ordem_compra.helper', 'Permite informar ordem de compra por item.'), options: [...yesNoOptions] },
    { key: 'importar_carrinho', section: 'experience', type: 'enum', label: t('configuracoes.orders.fields.importar_carrinho.label', 'Importar carrinho'), helper: t('configuracoes.orders.fields.importar_carrinho.helper', 'Permite importar itens no carrinho por planilha.'), options: [...yesNoOptions] },
    { key: 'permite_pedido_recorrente', section: 'experience', type: 'enum', label: t('configuracoes.orders.fields.permite_pedido_recorrente.label', 'Recompra recorrente'), helper: t('configuracoes.orders.fields.permite_pedido_recorrente.helper', 'Ativa a recompra recorrente para toda a empresa.'), options: [...yesNoOptions] },
    { key: 'reenvia_email_carrinho', section: 'experience', type: 'enum', label: t('configuracoes.orders.fields.reenvia_email_carrinho.label', 'Reenvia e-mail de abandono'), helper: t('configuracoes.orders.fields.reenvia_email_carrinho.helper', 'Reenvia o e-mail de abandono a cada mudança no pedido.'), options: [...yesNoOptions] },
  ]
}

export const configuracoesPedidosFieldDefinitions = getConfiguracoesPedidosFieldDefinitions((_, fallback) => fallback)
export const configuracoesPedidosParameterKeys = configuracoesPedidosFieldDefinitions.map((field) => field.key)

export function createEmptyConfiguracoesPedidosForm(): ConfiguracoesPedidosFormValues {
  return configuracoesPedidosFieldDefinitions.reduce((accumulator, field) => {
    accumulator[field.key] = ''
    return accumulator
  }, {} as ConfiguracoesPedidosFormValues)
}

export function normalizeConfiguracoesPedidosRecord(payload: unknown): ConfiguracoesPedidosRecord {
  const rows = asArray(asRecord(payload).data)
  const values = createEmptyConfiguracoesPedidosForm()
  const metadata: ConfiguracoesPedidosRecord['metadata'] = {}

  for (const item of rows) {
    const parameter = asRecord(item)
    const key = toStringValue(parameter.chave) as ConfiguracoesPedidosFieldKey
    if (!(key in values)) {
      continue
    }

    values[key] = toStringValue(parameter.parametros)

    const updatedAt = toStringValue(parameter.created_at)
    const updatedBy = toStringValue(asRecord(parameter.usuario).nome)
    if (updatedAt && updatedBy) {
      metadata[key] = { updatedAt, updatedBy }
    }
  }

  return { values, metadata }
}

export function buildDirtyConfiguracoesPedidosPayload(
  initialValues: ConfiguracoesPedidosFormValues,
  currentValues: ConfiguracoesPedidosFormValues,
  version = new Date().toISOString().replace('T', ' ').slice(0, 19),
) {
  const changedFields = configuracoesPedidosFieldDefinitions.filter((field) => {
    const initialValue = String(initialValues[field.key] ?? '').trim()
    const currentValue = String(currentValues[field.key] ?? '').trim()
    return initialValue !== currentValue
  })

  if (!changedFields.length) {
    return []
  }

  return [
    { id_filial: null, chave: 'versao', parametros: version },
    ...changedFields.map((field) => ({
      id_filial: null,
      chave: field.key,
      parametros: String(currentValues[field.key] ?? '').trim(),
    })),
  ]
}

