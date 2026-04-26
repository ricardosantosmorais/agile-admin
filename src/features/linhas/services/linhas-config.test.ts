import { describe, expect, it } from 'vitest'
import { LINHAS_CONFIG } from '@/src/features/linhas/services/linhas-config'

describe('linhas config', () => {
  it('keeps the linear CRUD contract aligned with the migrated screen', () => {
    expect(LINHAS_CONFIG.resource).toBe('linhas')
    expect(LINHAS_CONFIG.routeBase).toBe('/linhas')
    expect(LINHAS_CONFIG.columns.map((column) => column.id)).toEqual(['id', 'codigo', 'nome', 'ativo'])
    expect(LINHAS_CONFIG.sections[0]?.fields.map((field) => field.key)).toEqual(['ativo', 'codigo', 'nome'])
  })
})
