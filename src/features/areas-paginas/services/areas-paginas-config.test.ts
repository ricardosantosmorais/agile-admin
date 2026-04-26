import { describe, expect, it } from 'vitest'
import { AREAS_PAGINAS_CONFIG } from '@/src/features/areas-paginas/services/areas-paginas-config'

describe('areas-paginas config', () => {
  it('keeps the linear CRUD contract aligned with the migrated screen', () => {
    expect(AREAS_PAGINAS_CONFIG.resource).toBe('areas_pagina')
    expect(AREAS_PAGINAS_CONFIG.routeBase).toBe('/areas-paginas')
    expect(AREAS_PAGINAS_CONFIG.columns.map((column) => column.id)).toEqual(['id', 'codigo', 'nome', 'ativo'])
    expect(AREAS_PAGINAS_CONFIG.sections[0]?.fields.map((field) => field.key)).toEqual(['ativo', 'codigo', 'nome'])
  })
})
