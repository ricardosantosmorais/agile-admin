import { describe, expect, it } from 'vitest'
import { buildAssistenteVendasIaPayload } from '@/src/features/configuracoes-assistente-vendas-ia/services/assistente-vendas-ia-embed'

describe('assistente-vendas-ia-embed', () => {
  it('monta payload de admin para o tenant root agileecommerce', () => {
    const result = buildAssistenteVendasIaPayload(
      {
        token: 'token-root',
        currentTenantId: 'agileecommerce',
      },
      {
        userId: '123',
        userEmail: 'root@agile.com',
      },
    )

    expect(result).toEqual({
      id_usuario: '123',
      email_usuario: 'root@agile.com',
      apiv3_token_usuario: 'token-root',
      rota: '/admin',
    })
  })

  it('monta payload de company para tenants comuns', () => {
    const result = buildAssistenteVendasIaPayload(
      {
        token: 'token-tenant',
        currentTenantId: '1698203521854804',
      },
      {
        userId: '456',
        userEmail: 'tenant@agile.com',
      },
    )

    expect(result).toEqual({
      id_empresa: '1698203521854804',
      id_usuario: '456',
      email_usuario: 'tenant@agile.com',
      apiv3_token_usuario: 'token-tenant',
      rota: '/company/1698203521854804',
    })
  })
})
