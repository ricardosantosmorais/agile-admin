import { describe, expect, it } from 'vitest'
import { buildIntegracaoClientesSavePayload, normalizeIntegracaoClientesRecord } from './integracao-clientes-mappers'

describe('integracao-clientes-mappers', () => {
  it('normaliza a chave CFO e salva como parametro criptografado quando editada', () => {
    const record = normalizeIntegracaoClientesRecord({
      parameters: {
        data: [
          {
            chave: 'cro_apikey',
            parametros: 'api-key-mascarada',
            created_at: '2026-04-09 14:51:00',
            usuario: { nome: 'Admin Teste' },
          },
        ],
      },
      branches: { data: [] },
    })

    expect(record.values.croApiKey).toBe('api-key-mascarada')
    expect(record.metadata.croApiKey).toEqual({
      updatedAt: '2026-04-09 14:51:00',
      updatedBy: 'Admin Teste',
    })

    const payload = buildIntegracaoClientesSavePayload(
      { ...record.values, croApiKey: 'nova-chave-cfo' },
      record.branches,
      { includeCroApiKey: true },
    )

    expect(payload).toContainEqual({
      id_filial: null,
      chave: 'cro_apikey',
      parametros: 'nova-chave-cfo',
      integracao: 0,
      criptografado: 1,
    })
  })
})
