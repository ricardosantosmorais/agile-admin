import { describe, expect, it } from 'vitest'
import { PRODUTOS_FILIAIS_CONFIG } from '@/src/features/produtos-filiais/services/produtos-filiais-config'

describe('produtos filiais config', () => {
  it('normalizes lookups, values and dates for editing', () => {
    const record = PRODUTOS_FILIAIS_CONFIG.normalizeRecord?.({
      id_produto: '1',
      id_filial: '2',
      id_tabela_preco: '3',
      id_canal_distribuicao_cliente: '4',
      produto: { id: '1', nome: 'Produto A' },
      filial: { id: '2', nome_fantasia: 'Filial B' },
      tabela_preco: { id: '3', nome: 'Tabela C' },
      canal_distribuicao: { id: '4', nome: 'Canal D' },
      preco: 12.5,
      desconto: 3.25,
      data_inicio_promocao: '2026-03-01 00:00:00',
      data_fim_promocao: '2026-03-10 23:59:59',
    })

    expect(record).toMatchObject({
      id_produto_lookup: { id: '1', label: 'Produto A' },
      id_filial_lookup: { id: '2', label: 'Filial B' },
      id_tabela_preco_lookup: { id: '3', label: 'Tabela C' },
      id_canal_distribuicao_lookup: { id: '4', label: 'Canal D' },
      preco: '12,50',
      desconto: '3,25',
      data_inicio_promocao: '2026-03-01',
      data_fim_promocao: '2026-03-10',
    })
  })

  it('serializes keys, numbers and date ranges to api payload', () => {
    const payload = PRODUTOS_FILIAIS_CONFIG.beforeSave?.({
      id_produto_lookup: { id: '1', label: 'Produto A' },
      id_filial_lookup: { id: '2', label: 'Filial B' },
      id_tabela_preco_lookup: { id: '3', label: 'Tabela C' },
      id_canal_distribuicao_lookup: { id: '4', label: 'Canal D' },
      preco: '12,50',
      desconto: '3,25',
      prazo_entrega: '7',
      data_inicio_promocao: '2026-03-01',
      data_fim_promocao: '2026-03-10',
    })

    expect(payload).toMatchObject({
      id_produto: '1',
      id_filial: '2',
      id_tabela_preco: '3',
      id_canal_distribuicao_cliente: '4',
      tipo_preco: null,
      preco: 12.5,
      desconto: 3.25,
      prazo_entrega: 7,
      data_inicio_promocao: '2026-03-01 00:00:00',
      data_fim_promocao: '2026-03-10 23:59:59',
    })
  })

  it('serializes tipo_preco when selected', () => {
    const payload = PRODUTOS_FILIAIS_CONFIG.beforeSave?.({
      id_produto_lookup: { id: '1', label: 'Produto A' },
      id_filial_lookup: { id: '2', label: 'Filial B' },
      status: 'disponivel',
      tipo_preco: 'm2',
    })

    expect(payload).toMatchObject({
      id_produto: '1',
      id_filial: '2',
      tipo_preco: 'm2',
    })
  })
})
