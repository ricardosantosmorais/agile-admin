import { describe, expect, it } from 'vitest'
import { normalizeProcessoImagemDetail, normalizeProcessamentoImagensResponse } from '@/src/features/processamento-imagens/services/processamento-imagens-mappers'

describe('processamento-imagens-mappers', () => {
  it('normalizes list response with status and pagination', () => {
    const result = normalizeProcessamentoImagensResponse({
      data: [
        {
          id: '10',
          created_at: '2026-03-01 12:30:00',
          status: 'criado',
          usuario: { nome: 'Maria' },
        },
      ],
      meta: {
        page: 2,
        pages: 4,
        perpage: 15,
        total: 44,
        from: 16,
        to: 30,
      },
    }, { page: 1, perPage: 15 })

    expect(result.data[0].id).toBe('10')
    expect(result.data[0].usuarioNome).toBe('Maria')
    expect(result.data[0].statusLabel).toBe('Criado')
    expect(result.meta.page).toBe(2)
    expect(result.meta.pages).toBe(4)
  })

  it('normalizes detail with logs', () => {
    const result = normalizeProcessoImagemDetail({
      id: '99',
      status: 'erro',
      processado: 0,
      data_processado: '',
      usuario: { nome: 'João' },
      logs: [
        { id: '1', tipo: 'erro', created_at: '2026-03-01 13:00:00', mensagem: 'Falha no processamento' },
      ],
    })

    expect(result.id).toBe('99')
    expect(result.statusLabel).toBe('Erro')
    expect(result.logs).toHaveLength(1)
    expect(result.logs[0].tipoLabel).toBe('Erro')
  })
})
