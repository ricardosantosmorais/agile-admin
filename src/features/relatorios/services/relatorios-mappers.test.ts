import { describe, expect, it } from 'vitest'
import {
  createRelatorioFilterDraft,
  normalizeRelatorioDetail,
  normalizeRelatorioListResponse,
  normalizeRelatorioProcessosResponse,
} from '@/src/features/relatorios/services/relatorios-mappers'

describe('relatorios-mappers', () => {
  it('normaliza a listagem removendo html legado de ícones', () => {
    const result = normalizeRelatorioListResponse({
      data: [
        {
          id: 1,
          codigo: 'R001',
          nome: '<i class="far fa-chart-bar"></i> Clientes ativos',
          icone: '<i class="far fa-chart-bar"></i>',
          grupo: {
            nome: '<i class="far fa-users"></i> Clientes',
            icone: '<i class="far fa-users"></i>',
          },
        },
      ],
      meta: {
        total: 12,
        current_page: 2,
        per_page: 15,
        from: 16,
        to: 16,
        last_page: 1,
      },
    }, { page: 1, perPage: 15 })

    expect(result.data[0]).toMatchObject({
      id: '1',
      codigo: 'R001',
      grupo: 'Clientes',
      nome: 'Clientes ativos',
    })
    expect(result.meta.page).toBe(2)
    expect(result.meta.total).toBe(12)
  })

  it('normaliza o detalhe com filtros dinâmicos ordenáveis', () => {
    const result = normalizeRelatorioDetail(
      {
        id: 7,
        codigo: 'R007',
        nome: 'Financeiro',
        grupo: { nome: 'Financeiro' },
      },
      {
        header: [
          { campo: 'valor_total', titulo: 'Valor total', tipo: 'valor', posicao_ordenacao: 3 },
          { campo: 'data_emissao', titulo: 'Data de emissão', tipo: 'data', posicao_ordenacao: 1 },
        ],
      },
    )

    expect(result.id).toBe('7')
    expect(result.filtros).toHaveLength(2)
    expect(result.filtros[0]).toMatchObject({
      campo: 'valor_total',
      titulo: 'Valor total',
      tipo: 'valor',
    })
  })

  it('resume filtros de processo e traduz status', () => {
    const result = normalizeRelatorioProcessosResponse({
      data: [
        {
          id: 10,
          usuario: { nome: 'Ricardo' },
          created_at: '2026-04-01 10:20:00',
          status: 'erro',
          arquivo: 'processos/relatorio.csv',
          campos: [
            { campo: 'data_emissao', tipo: 'data', titulo: 'Data emissão', operador: 'ge', valor: '2026-03-01' },
            { campo: 'data_emissao', tipo: 'data', titulo: 'Data emissão', operador: 'le', valor: '2026-03-31' },
          ],
        },
      ],
      meta: {
        total: 1,
        current_page: 1,
        per_page: 50,
        from: 1,
        to: 1,
        last_page: 1,
      },
    }, { page: 1, perPage: 50 })

    expect(result.data[0].statusLabel).toBe('Erro')
    expect(result.data[0].canReprocess).toBe(true)
    expect(result.data[0].camposResumo).toContain('Data emissão: entre')
  })

  it('cria draft vazio para filtros simples e intervalos', () => {
    const draft = createRelatorioFilterDraft([
      { campo: 'cliente', titulo: 'Cliente', tipo: 'texto' },
      { campo: 'valor_total', titulo: 'Valor total', tipo: 'valor' },
      { campo: 'data_emissao', titulo: 'Data emissão', tipo: 'data' },
    ])

    expect(draft).toEqual({
      cliente: '',
      valor_total__start: '',
      valor_total__end: '',
      data_emissao__start: '',
      data_emissao__end: '',
    })
  })
})
