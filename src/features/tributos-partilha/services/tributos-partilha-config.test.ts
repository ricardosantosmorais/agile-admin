import { describe, expect, it } from 'vitest'
import { TRIBUTOS_PARTILHA_CONFIG } from '@/src/features/tributos-partilha/services/tributos-partilha-config'

describe('tributos partilha config', () => {
  it('normalizes product lookup and decimal fields', () => {
    const record = TRIBUTOS_PARTILHA_CONFIG.normalizeRecord?.({
      id_filial: '11',
      filial: { id: '11', nome_fantasia: 'Filial 11' },
      id_produto: '21',
      produto: { id: '21', nome: 'Produto Partilha' },
      icms_interno: 17.5,
      reducao_base: 3.25,
    })

    expect(record).toMatchObject({
      id_filial_lookup: { id: '11', label: 'Filial 11' },
      id_produto_lookup: { id: '21', label: 'Produto Partilha' },
      icms_interno: '17,5000',
      reducao_base: '3,2500',
    })
  })

  it('serializes decimal fields to backend contract', () => {
    const payload = TRIBUTOS_PARTILHA_CONFIG.beforeSave?.({
      id_filial_lookup: { id: '11', label: 'Filial 11' },
      id_produto_lookup: { id: '21', label: 'Produto Partilha' },
      icms_interno: '17,5000',
      reducao_base: '3,2500',
    })

    expect(payload).toMatchObject({
      id_filial: '11',
      id_produto: '21',
      icms_interno: 17.5,
      reducao_base: 3.25,
    })
  })
})
