import { describe, expect, it } from 'vitest'
import { frenetBooleans, frenetFields } from '@/src/features/integracoes-logistica/components/integracao-logistica-tab-shared'

describe('integracao-logistica-tab-shared', () => {
  it('mantem ocultos os campos Frenet removidos do formulario legado', () => {
    expect(frenetFields.map((field) => field.key)).toEqual(['frenet_token'])
    expect(frenetBooleans.map((field) => field.key)).toEqual([])
  })
})
