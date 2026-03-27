import { describe, expect, it } from 'vitest'
import { SEQUENCIAIS_CONFIG } from '@/src/features/sequenciais/services/sequenciais-config'
import { getSequencialModuleLabel } from '@/src/features/sequenciais/services/sequenciais-options'

describe('sequenciais config', () => {
  it('uses the legacy module labels for list rendering', () => {
    expect(getSequencialModuleLabel('FIL')).toBe('Filial')
    expect(SEQUENCIAIS_CONFIG.mobileTitle?.({ id: 'FIL' })).toBe('Filial')
  })

  it('serializes the module code and sequence before saving', () => {
    const payload = SEQUENCIAIS_CONFIG.beforeSave?.({
      id: ' FIL ',
      sequencial: ' 1200 ',
    })

    expect(payload).toEqual({
      id: 'FIL',
      sequencial: '1200',
    })
  })
})
