import { describe, expect, it } from 'vitest'
import { SEGMENTOS_CLIENTES_CONFIG } from '@/src/features/segmentos-clientes/services/segmentos-clientes-config'

describe('SEGMENTOS_CLIENTES_CONFIG', () => {
  it('normalizes detail values to pt-BR decimal strings', () => {
    const normalized = SEGMENTOS_CLIENTES_CONFIG.normalizeRecord?.({
      id: '10',
      ativo: 1,
      codigo: 'SEG-01',
      nome: 'Atacado',
      pedido_minimo: 1234.5,
      peso_minimo: 25.125,
    })

    expect(normalized).toMatchObject({
      id: '10',
      ativo: true,
      codigo: 'SEG-01',
      nome: 'Atacado',
      pedido_minimo: '1.234,50',
      peso_minimo: '25,125',
    })
  })

  it('converts masked values back to api payload', () => {
    const payload = SEGMENTOS_CLIENTES_CONFIG.beforeSave?.({
      id: '10',
      ativo: true,
      codigo: 'SEG-01',
      nome: 'Atacado',
      pedido_minimo: '1.234,50',
      peso_minimo: '25,125',
    })

    expect(payload).toMatchObject({
      id: '10',
      ativo: true,
      codigo: 'SEG-01',
      nome: 'Atacado',
      pedido_minimo: 1234.5,
      peso_minimo: 25.125,
    })
  })
})
