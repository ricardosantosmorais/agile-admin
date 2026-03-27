import { describe, expect, it } from 'vitest'
import { TRIBUTOS_CONFIG } from '@/src/features/tributos/services/tributos-config'

describe('tributos config', () => {
  it('normalizes embeds and decimal fields for editing', () => {
    const record = TRIBUTOS_CONFIG.normalizeRecord?.({
      id_filial: '10',
      filial: { id: '10', nome_fantasia: 'Filial Teste' },
      id_produto: '20',
      id_tabela_preco: '30',
      produto: { id: '20', nome: 'Produto XPTO' },
      tabela_preco: { id: '30', nome: 'Tabela A' },
      iva: 12.3456,
      valor_pauta: 55.9,
    })

    expect(record).toMatchObject({
      id_filial_lookup: { id: '10', label: 'Filial Teste' },
      id_produto_lookup: { id: '20', label: 'Produto XPTO' },
      id_tabela_preco_lookup: { id: '30', label: 'Tabela A' },
      iva: '12,3456',
      valor_pauta: '55,90',
    })
  })

  it('serializes lookup values and decimal fields to api payload', () => {
    const payload = TRIBUTOS_CONFIG.beforeSave?.({
      id_filial_lookup: { id: '10', label: 'Filial 10' },
      id_produto_lookup: { id: '20', label: 'Produto XPTO' },
      id_tabela_preco_lookup: { id: '30', label: 'Tabela A' },
      iva: '12,3456',
      valor_pauta: '55,90',
    })

    expect(payload).toMatchObject({
      id_filial: '10',
      id_produto: '20',
      id_tabela_preco: '30',
      iva: 12.3456,
      valor_pauta: 55.9,
    })
    expect(payload?.id_filial_lookup).toBeUndefined()
  })
})
