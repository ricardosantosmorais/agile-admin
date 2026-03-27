import { describe, expect, it } from 'vitest'
import { GRUPOS_FILIAIS_CONFIG } from '@/src/features/grupos-filiais/services/grupos-filiais-config'

describe('grupos filiais config', () => {
  it('restores and serializes the default branch lookup', () => {
    const normalized = GRUPOS_FILIAIS_CONFIG.normalizeRecord?.({
      id_filial_padrao: '12',
      filial_padrao: { id: '12', nome_fantasia: 'Filial Fortaleza' },
    })

    expect(normalized).toMatchObject({
      id_filial_padrao_lookup: { id: '12', label: 'Filial Fortaleza' },
    })

    const payload = GRUPOS_FILIAIS_CONFIG.beforeSave?.({
      id_filial_padrao: '12',
      id_filial_padrao_lookup: { id: '12', label: 'Filial 12' },
    })

    expect(payload).toMatchObject({
      id_filial_padrao: '12',
    })
    expect(payload?.id_filial_padrao_lookup).toBeUndefined()
  })
})
