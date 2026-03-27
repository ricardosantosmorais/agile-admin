import { describe, expect, it } from 'vitest'
import { CANAIS_DISTRIBUICAO_CONFIG } from '@/src/features/canais-distribuicao/services/canais-distribuicao-config'

describe('canais distribuicao config', () => {
  it('keeps the linear CRUD contract aligned with legacy', () => {
    expect(CANAIS_DISTRIBUICAO_CONFIG.resource).toBe('canais_distribuicao')
    expect(CANAIS_DISTRIBUICAO_CONFIG.routeBase).toBe('/canais-de-distribuicao')
    expect(CANAIS_DISTRIBUICAO_CONFIG.columns.map((column) => column.id)).toEqual(['id', 'codigo', 'nome', 'ativo'])
    expect(CANAIS_DISTRIBUICAO_CONFIG.sections[0]?.fields.map((field) => field.key)).toEqual(['ativo', 'codigo', 'nome'])
  })
})
