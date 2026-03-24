import { describe, expect, it } from 'vitest'
import { mapAvisemeDetailsPayload, mapAvisemeListPayload } from '@/src/features/produtos-aviseme/services/produtos-aviseme-mappers'

describe('produtos-aviseme-mappers', () => {
  it('maps the aggregated aviseme list response', () => {
    const response = mapAvisemeListPayload({
      data: [
        {
          id_produto: '10',
          nome_produto: 'Sabonete',
          id_filial: '2',
          nome_filial: 'Matriz',
          quantidade_solicitacoes: 3,
          ultima_data_solicitacao: '2026-03-20 09:00:00',
        },
      ],
      meta: { page: 1, pages: 1, perpage: 30, from: 1, to: 1, total: 1 },
    })

    expect(response.data[0]).toMatchObject({
      id_produto: '10',
      nome_produto: 'Sabonete',
      id_filial: '2',
      nome_filial: 'Matriz',
      quantidade_solicitacoes: 3,
    })
    expect(response.meta.total).toBe(1)
  })

  it('maps the aviseme details payload', () => {
    const details = mapAvisemeDetailsPayload({
      data: [
        {
          id: '1',
          id_embalagem: 'CX',
          email: 'cliente@teste.com',
          data: '2026-03-20 09:00:00',
          produto: { id: '10', nome: 'Sabonete' },
          filial: { nome_fantasia: 'Matriz' },
          cliente: { nome_fantasia: 'Cliente XPTO' },
        },
      ],
    })

    expect(details[0]).toMatchObject({
      produto: '10 - Sabonete',
      embalagem: 'CX',
      filial: 'Matriz',
      cliente: 'Cliente XPTO',
      email: 'cliente@teste.com',
    })
  })
})
