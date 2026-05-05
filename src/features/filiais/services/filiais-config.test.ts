import { describe, expect, it } from 'vitest'
import { FILIAIS_CONFIG } from '@/src/features/filiais/services/filiais-config'

describe('filiais config', () => {
  it('normalizes masked values and group lookup for editing', () => {
    const record = FILIAIS_CONFIG.normalizeRecord?.({
      cnpj: '12345678000199',
      ddd: '85',
      telefone: '33334444',
      ddd_celular: '85',
      celular: '912345678',
      cep: '60123456',
      pedido_minimo: 1234.56,
      peso_minimo: 12.345,
      desconto_retira: 5,
      acrescimo_retira: 2.5,
      id_grupo: '10',
      grupo: { id: '10', nome: 'Grupo CE' },
      id_tabela_preco: '7',
      tabela_preco: { id: '7', nome: 'Tabela varejo' },
      variacao: 1.5,
      distancia_maxima: 25,
      ufs_excecao: 'ce, pe',
      ufs_restricao: 'SP,RJ',
    })

    expect(record).toMatchObject({
      cnpj: '12.345.678/0001-99',
      pessoa_contato: '',
      telefone: '(85) 3333-4444',
      celular: '(85) 91234-5678',
      cep: '60123-456',
      pedido_minimo: '1.234,56',
      peso_minimo: '12,345',
      desconto_retira: '5,00',
      acrescimo_retira: '2,50',
      id_grupo_lookup: { id: '10', label: 'Grupo CE' },
      id_tabela_preco_lookup: { id: '7', label: 'Tabela varejo' },
      variacao: '1,50',
      distancia_maxima: '25',
      ufs_excecao: 'CE,PE',
      ufs_restricao: 'SP,RJ',
    })
  })

  it('serializes branch payload to the API contract', () => {
    const payload = FILIAIS_CONFIG.beforeSave?.({
      id_grupo: '10',
      cnpj: '12.345.678/0001-99',
      telefone: '(85) 3333-4444',
      celular: '(85) 91234-5678',
      cep: '60123-456',
      pedido_minimo: '1.234,56',
      peso_minimo: '12,345',
      desconto_retira: '5,00',
      acrescimo_retira: '2,50',
      limite_itens_pedido: '20',
      posicao: 3,
      contato: 'Equipe filial',
      id_grupo_lookup: { id: '10', label: 'Grupo 10' },
      id_tabela_preco_lookup: { id: '7', label: 'Tabela varejo' },
      selecionavel: true,
      variacao: '1,50',
      distancia_maxima: '25',
      ufs_excecao: ' ce, PE, pe, invalido, RJ ',
      ufs_restricao: 'sp, rj',
    })

    expect(payload).toMatchObject({
      id_grupo: '10',
      id_tabela_preco: '7',
      cnpj: '12345678000199',
      ddd: '85',
      telefone: '33334444',
      ddd_celular: '85',
      celular: '912345678',
      cep: '60123456',
      pedido_minimo: 1234.56,
      peso_minimo: 12.345,
      desconto_retira: 5,
      acrescimo_retira: 2.5,
      limite_itens_pedido: 20,
      posicao: 3,
      contato: 'Equipe filial',
      selecionavel: true,
      variacao: 1.5,
      distancia_maxima: 25,
      ufs_excecao: 'CE,PE,RJ',
      ufs_restricao: 'SP,RJ',
    })
    expect(payload?.id_grupo_lookup).toBeUndefined()
    expect(payload?.id_tabela_preco_lookup).toBeUndefined()
    expect(payload).not.toHaveProperty('pessoa_contato')
  })

  it('accepts pessoa_contato as legacy alias on save', () => {
    const payload = FILIAIS_CONFIG.beforeSave?.({
      pessoa_contato: 'Contato legado',
    })

    expect(payload).toMatchObject({
      contato: 'Contato legado',
    })
    expect(payload).not.toHaveProperty('pessoa_contato')
  })
})
