import { describe, expect, it } from 'vitest'
import { AREAS_BANNER_CONFIG } from '@/src/features/areas-banner/services/areas-banner-config'

describe('areas-banner config', () => {
  it('keeps the linear CRUD contract aligned with the migrated screen', () => {
    expect(AREAS_BANNER_CONFIG.resource).toBe('areas_banner')
    expect(AREAS_BANNER_CONFIG.routeBase).toBe('/areas-banner')
    expect(AREAS_BANNER_CONFIG.columns.map((column) => column.id)).toEqual(['id', 'codigo', 'nome', 'ativo'])
    expect(AREAS_BANNER_CONFIG.sections[0]?.fields.map((field) => field.key)).toEqual(['ativo', 'codigo', 'nome'])
  })
})
