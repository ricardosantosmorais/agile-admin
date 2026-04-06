import { describe, expect, it } from 'vitest'
import {
  buildDirtyConfiguracoesPrecosPayload,
  normalizeConfiguracoesPrecosRecord,
} from '@/src/features/configuracoes-precos/services/configuracoes-precos-mappers'

describe('configuracoes-precos-mappers', () => {
  it('normaliza parÃ¢metros e lookups de preÃ§os', () => {
    const result = normalizeConfiguracoesPrecosRecord({
      parameters: {
        data: [
          {
            chave: 'preco_base',
            parametros: 'tabela',
            created_at: '2026-04-02 11:00:00',
            usuario: { nome: 'Administrador' },
          },
        ],
      },
      paymentMethods: { data: [{ id: '1', nome: 'PIX' }] },
      paymentConditions: { data: [{ id: '2', nome: '30 dias' }] },
      priceTables: { data: [{ id: '3', nome: 'Tabela padrÃ£o' }] },
    })

    expect(result.values.preco_base).toBe('tabela')
    expect(result.lookups.paymentMethods[0]).toEqual({ value: '1', label: 'PIX - 1' })
    expect(result.lookups.paymentConditions[0]).toEqual({ value: '2', label: '30 dias - 2' })
    expect(result.lookups.priceTables[0]).toEqual({ value: '3', label: 'Tabela padrÃ£o - 3' })
    expect(result.metadata.preco_base?.updatedBy).toBe('Administrador')
  })

  it('envia apenas os parÃ¢metros de preÃ§o alterados', () => {
    const initialValues = {
      aplica_partilha_contribuinte: '',
      aplica_tributo_revenda: '',
      aplicacao_cupom_desconto: '',
      arredonda_valores_embalagem: '',
      arredonda_valores_financeiro: '',
      calculo_reverso_fecoep: '',
      calculo_reverso_ipi: '',
      calculo_reverso_st: '',
      icms_externo_fixo: '',
      id_condicao_pagamento_padrao: '',
      id_forma_pagamento_padrao: '',
      id_tabela_preco_padrao: '',
      id_tabela_preco_pf: '',
      id_tabela_preco_pj: '',
      modo_arredondamento: '',
      precisao_round: '',
      precisao_tributos: '',
      precisao_valor: '',
      preco_base: '',
      versao_precificador: '',
    }

    const currentValues = {
      ...initialValues,
      preco_base: 'filial',
      id_tabela_preco_padrao: '88',
    }

    expect(buildDirtyConfiguracoesPrecosPayload(initialValues, currentValues, '2026-04-02 11:10:00')).toEqual([
      { id_filial: null, chave: 'versao', parametros: '2026-04-02 11:10:00' },
      { id_filial: null, chave: 'id_tabela_preco_padrao', parametros: '88' },
      { id_filial: null, chave: 'preco_base', parametros: 'filial' },
    ])
  })
})


