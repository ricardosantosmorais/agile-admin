import { describe, expect, it } from 'vitest'
import { normalizeGatewaySavePayload } from '@/app/api/integracoes/gateways-pagamento/route'

describe('integracoes gateways-pagamento bridge', () => {
  it('normalizes Cielo 3DS fields before saving', () => {
    const payload = normalizeGatewaySavePayload({
      tipo: 'cartao_credito',
      gateway_cartao_credito: 'cielo',
      gateway_pix: 'itau',
      '3ds': '1',
      '3ds_nome': ' Loja Exemplo ',
      '3ds_codigo': ' CIELO-123 ',
      '3ds_mcc': '1234-999',
      client_id: 'client-id',
      client_secret: 'client-secret',
    })

    expect(payload.gateway).toBe('cielo')
    expect(payload['3ds']).toBe(true)
    expect(payload['3ds_nome']).toBe('Loja Exemplo')
    expect(payload['3ds_codigo']).toBe('CIELO-123')
    expect(payload['3ds_mcc']).toBe('1234')
    expect(payload.client_id).toBe('client-id')
    expect(payload.client_secret).toBe('client-secret')
  })

  it('clears 3DS fields when the selected gateway is not Cielo 3DS', () => {
    const payload = normalizeGatewaySavePayload({
      tipo: 'cartao_credito',
      gateway_cartao_credito: 'rede',
      '3ds': '1',
      '3ds_nome': ' Loja Exemplo ',
      '3ds_codigo': ' CIELO-123 ',
      '3ds_mcc': '1234',
      client_id: 'client-id',
      client_secret: 'client-secret',
    })

    expect(payload.gateway).toBe('rede')
    expect(payload['3ds']).toBe(false)
    expect(payload['3ds_nome']).toBeNull()
    expect(payload['3ds_codigo']).toBeNull()
    expect(payload['3ds_mcc']).toBeNull()
  })
})
