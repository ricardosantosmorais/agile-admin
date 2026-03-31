import { describe, expect, it } from 'vitest'
import { buildProdutoPayload, normalizeProdutoRecord } from '@/src/features/produtos/services/produtos-mappers'

describe('produtos mappers', () => {
  it('normalizes lookup state, booleans and masked values for editing', () => {
    const record = normalizeProdutoRecord({
      ativo: 1,
      feed: '1',
      vende_sem_estoque: 0,
      controla_estoque: 'true',
      ipi: 15.5,
      peso: 12.345,
      quantidade_embalagem: 3.5,
      prazo_entrega: 7,
      horas_cronometro: 12,
      posicao: 9,
      id_produto_pai: '10',
      produto_pai: { id: '10', nome: 'Produto pai' },
      id_departamento: '20',
      departamento: { id: '20', nome: 'Mercearia' },
      id_marca: '30',
      marca: { id: '30', nome: 'Marca A' },
      id_canal_distribuicao: '40',
      canal_distribuicao: { id: '40', nome: 'Canal Norte' },
      id_fornecedor: '50',
      fornecedor: { id: '50', nome_fantasia: 'Fornecedor XPTO' },
    })

    expect(record).toMatchObject({
      ativo: true,
      feed: true,
      vende_sem_estoque: false,
      controla_estoque: true,
      ipi: '15,50',
      peso: '12,345',
      quantidade_embalagem: '3.5',
      prazo_entrega: '7',
      horas_cronometro: '12',
      posicao: '9',
      id_produto_pai_lookup: { id: '10', label: 'Produto pai' },
      id_departamento_lookup: { id: '20', label: 'Mercearia' },
      id_marca_lookup: { id: '30', label: 'Marca A' },
      id_canal_distribuicao_lookup: { id: '40', label: 'Canal Norte' },
      id_fornecedor_lookup: { id: '50', label: 'Fornecedor XPTO' },
    })
  })

  it('serializes payload to API contract', () => {
    const payload = buildProdutoPayload({
      ativo: true,
      feed: false,
      vende_sem_estoque: true,
      controla_estoque: false,
      ipi: '15,50',
      peso: '12,345',
      altura: '10',
      largura: '20',
      comprimento: '30',
      quantidade_embalagem: '3,5',
      prazo_entrega: '7',
      horas_cronometro: '12',
      posicao: '9',
      id_produto_pai_lookup: { id: '10', label: 'Produto pai' },
      id_departamento_lookup: { id: '20', label: 'Mercearia' },
      id_marca_lookup: { id: '30', label: 'Marca A' },
      id_canal_distribuicao_lookup: { id: '40', label: 'Canal Norte' },
      id_fornecedor_lookup: { id: '50', label: 'Fornecedor XPTO' },
      produtos_grades_valores: [
        { id_grade: '100', id_valor: '1000' },
        { id_grade: '200', id_valor: '2000' },
      ],
    })

    expect(payload).toMatchObject({
      ativo: true,
      feed: false,
      vende_sem_estoque: true,
      controla_estoque: false,
      ipi: 15.5,
      peso: 12.345,
      altura: 10,
      largura: 20,
      comprimento: 30,
      quantidade_embalagem: 3.5,
      prazo_entrega: 7,
      horas_cronometro: 12,
      posicao: 9,
      id_produto_pai: '10',
      id_departamento: '20',
      id_marca: '30',
      id_canal_distribuicao: '40',
      id_fornecedor: '50',
    })

    expect(payload.ids_grades_json).toBe(JSON.stringify([
      { id_grade: '100', id_valor: '1000' },
      { id_grade: '200', id_valor: '2000' },
    ]))
  })
})
