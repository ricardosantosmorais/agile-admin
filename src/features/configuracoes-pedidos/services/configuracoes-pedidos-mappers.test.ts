import { describe, expect, it } from 'vitest'
import {
  buildDirtyConfiguracoesPedidosPayload,
  getConfiguracoesPedidosFieldDefinitions,
  normalizeConfiguracoesPedidosRecord,
} from '@/src/features/configuracoes-pedidos/services/configuracoes-pedidos-mappers'

describe('configuracoes-pedidos-mappers', () => {
  it('normaliza parÃ¢metros e metadata dos pedidos', () => {
    const result = normalizeConfiguracoesPedidosRecord({
      data: [
        {
          chave: 'checkout_unificado',
          parametros: '1',
          created_at: '2026-04-02 10:00:00',
          usuario: { nome: 'Administrador' },
        },
        {
          chave: 'codigo_vendedor',
          parametros: 'C',
        },
      ],
    })

    expect(result.values.checkout_unificado).toBe('1')
    expect(result.values.codigo_vendedor).toBe('C')
    expect(result.metadata.checkout_unificado).toEqual({
      updatedAt: '2026-04-02 10:00:00',
      updatedBy: 'Administrador',
    })
  })

  it('envia apenas os campos alterados', () => {
    const initialValues = {
      checkout_unificado: '1',
      codigo_vendedor: '',
      exige_vendedor: '',
      atualizar_carrinho: '',
      bloqueia_pedidos: '',
      exibe_impostos: '',
      exibe_juros_parcelas: '',
      exige_pagamento_total: '',
      filial_cliente: '',
      forca_tabela_preco: '',
      forma_condicao_pagamento_filial_pedido: '',
      gera_brindes: '',
      importar_carrinho: '',
      inclui_tributos: '',
      internaliza_brinde: '',
      internalizar_orcamentos: '',
      mensagem_aceite_pedidos: '',
      mensagem_bloqueio_pedidos: '',
      multi_embalagem: '',
      multi_filial: '',
      observacoes: '',
      oculta_timeline: '',
      opcoes_falta: '',
      ordem_compra: '',
      ordem_compra_pedido: '',
      permite_pedido_recorrente: '',
      pix_unico: '',
      precisao_difal: '',
      reenvia_email_carrinho: '',
      split_encomenda: '',
      split_pedidos: '',
      split_visual: '',
      tentativas_pagamento: '',
      validade_link_pagamento_horas: '',
    }

    const currentValues = {
      ...initialValues,
      codigo_vendedor: 'C',
      exibe_juros_parcelas: '1',
      tentativas_pagamento: '3',
    }

    expect(buildDirtyConfiguracoesPedidosPayload(initialValues, currentValues, '2026-04-02 10:10:00')).toEqual([
      { id_filial: null, chave: 'versao', parametros: '2026-04-02 10:10:00' },
      { id_filial: null, chave: 'codigo_vendedor', parametros: 'C' },
      { id_filial: null, chave: 'exibe_juros_parcelas', parametros: '1' },
      { id_filial: null, chave: 'tentativas_pagamento', parametros: '3' },
    ])
  })

  it('mantem a configuracao legada para exibir juros das condicoes nas parcelas', () => {
    const field = getConfiguracoesPedidosFieldDefinitions((_, fallback) => fallback)
      .find((definition) => definition.key === 'exibe_juros_parcelas')

    expect(field).toEqual(expect.objectContaining({
      key: 'exibe_juros_parcelas',
      section: 'payment',
      label: 'Exibe juros das condições',
      helper: 'Indica se a plataforma exibe a informação de juros das condições de pagamento nas parcelas do cartão no checkout.',
      options: [
        { value: '1', label: 'Sim' },
        { value: '0', label: 'Não' },
      ],
    }))
  })
})


