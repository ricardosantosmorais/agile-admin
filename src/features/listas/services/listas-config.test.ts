import { describe, expect, it } from 'vitest'
import { LISTAS_CONFIG } from '@/src/features/listas/services/listas-config'

describe('listas config', () => {
  it('keeps the catalog list/form contract aligned with the current module', () => {
    expect(LISTAS_CONFIG.resource).toBe('listas')
    expect(LISTAS_CONFIG.routeBase).toBe('/listas')
    expect(LISTAS_CONFIG.columns.map((column) => column.id)).toEqual(['id', 'codigo', 'nome', 'ativo'])
    expect(LISTAS_CONFIG.sections[0]?.fields.map((field) => field.key)).toEqual([
      'ativo',
      'codigo',
      'nome',
      'imagem',
      'imagem_mobile',
      'link',
      'target',
      'descricao',
    ])
  })
})
