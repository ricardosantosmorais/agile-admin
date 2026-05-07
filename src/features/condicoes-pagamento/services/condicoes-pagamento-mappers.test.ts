import { describe, expect, it } from 'vitest'
import {
  CONDICAO_PAGAMENTO_EXCECAO_OCCURRENCES,
  CONDICAO_PAGAMENTO_RESTRICAO_OCCURRENCES,
  formatCondicaoPagamentoOccurrenceLabel,
  isCondicaoPagamentoOccurrenceSynced,
  occurrenceLookupValue,
} from '@/src/features/condicoes-pagamento/services/condicoes-pagamento-mappers'

describe('condicoes pagamento occurrence mappers', () => {
  it('keeps the legacy occurrence scopes for restrictions and exceptions', () => {
    expect(CONDICAO_PAGAMENTO_RESTRICAO_OCCURRENCES).toContain('praca')
    expect(CONDICAO_PAGAMENTO_RESTRICAO_OCCURRENCES).toContain('rede')
    expect(CONDICAO_PAGAMENTO_RESTRICAO_OCCURRENCES).toContain('supervisor')
    expect(CONDICAO_PAGAMENTO_RESTRICAO_OCCURRENCES).toContain('tabela_preco')
    expect(CONDICAO_PAGAMENTO_RESTRICAO_OCCURRENCES).not.toContain('produto')

    expect(CONDICAO_PAGAMENTO_EXCECAO_OCCURRENCES).toContain('produto')
    expect(CONDICAO_PAGAMENTO_EXCECAO_OCCURRENCES).toContain('produto_pai')
    expect(CONDICAO_PAGAMENTO_EXCECAO_OCCURRENCES).toContain('todos')
  })

  it('formats legacy occurrence labels and lookup values', () => {
    expect(formatCondicaoPagamentoOccurrenceLabel({
      id: '1',
      id_condicao_pagamento: '10',
      ocorrencia: 'contribuinte',
      id_objeto: '1',
    })).toBe('Sim')

    expect(formatCondicaoPagamentoOccurrenceLabel({
      id: '2',
      id_condicao_pagamento: '10',
      ocorrencia: 'tipo_cliente',
      id_objeto: 'PJ',
    })).toBe('Pessoa juridica')

    expect(formatCondicaoPagamentoOccurrenceLabel({
      id: '3',
      id_condicao_pagamento: '10',
      ocorrencia: 'tabela_preco',
      id_objeto: '99',
      tabela_preco: { id: '99', nome: 'Atacado' },
    })).toBe('Atacado')

    expect(occurrenceLookupValue({
      id: '4',
      id_condicao_pagamento: '10',
      ocorrencia: 'produto_pai',
      id_objeto: '77',
      produto_pai: { id: '77', nome: 'Produto base' },
    })).toEqual({ id: '77', label: 'Produto base' })
  })

  it('identifies synchronized records protected by the legacy controller', () => {
    expect(isCondicaoPagamentoOccurrenceSynced({ id: '1', id_condicao_pagamento: '10', ocorrencia: 'cliente', id_sync: 'erp-1' })).toBe(true)
    expect(isCondicaoPagamentoOccurrenceSynced({ id: '2', id_condicao_pagamento: '10', ocorrencia: 'cliente', id_sync: '' })).toBe(false)
  })
})
