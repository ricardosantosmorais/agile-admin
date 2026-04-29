import { describe, expect, it } from 'vitest'
import { RELATORIOS_GRUPOS_CONFIG } from '@/src/features/relatorios-grupos/services/relatorios-grupos-config'

describe('relatorios grupos config', () => {
  it('keeps the legacy list and form fields', () => {
    expect(RELATORIOS_GRUPOS_CONFIG.resource).toBe('relatorios/grupos')
    expect(RELATORIOS_GRUPOS_CONFIG.routeBase).toBe('/cadastros/relatorios-grupos')
    expect(RELATORIOS_GRUPOS_CONFIG.columns.map((column) => column.id)).toEqual(['id', 'codigo', 'nome', 'ativo'])
    expect(RELATORIOS_GRUPOS_CONFIG.sections[0]?.fields.map((field) => field.key)).toEqual(['ativo', 'codigo', 'nome', 'icone'])
  })
})
