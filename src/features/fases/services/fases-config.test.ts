import { describe, expect, it } from 'vitest'
import { FASES_CONFIG } from '@/src/features/fases/services/fases-config'

describe('fases config', () => {
  it('targets the nested implementation resource and keeps the legacy fields', () => {
    expect(FASES_CONFIG.resource).toBe('implantacao/fases')
    expect(FASES_CONFIG.routeBase).toBe('/fases')
    expect(FASES_CONFIG.columns.map((column) => column.id)).toEqual(['id', 'codigo', 'nome', 'posicao', 'ativo'])
    expect(FASES_CONFIG.sections[0]?.fields.map((field) => field.key)).toEqual(['ativo', 'codigo', 'nome', 'posicao', 'icone'])
  })
})
