import { describe, expect, it } from 'vitest'
import { MARCAS_CONFIG } from '@/src/features/marcas/services/marcas-config'

describe('marcas config', () => {
  it('keeps the brand form sections aligned with the migrated module', () => {
    expect(MARCAS_CONFIG.resource).toBe('marcas')
    expect(MARCAS_CONFIG.routeBase).toBe('/marcas')
    expect(MARCAS_CONFIG.columns.map((column) => column.id)).toEqual(['id', 'codigo', 'nome', 'ativo'])
    expect(MARCAS_CONFIG.sections.map((section) => section.id)).toEqual(['general', 'seo'])
    expect(MARCAS_CONFIG.sections[0]?.fields.map((field) => field.key)).toEqual([
      'ativo',
      'menu',
      'feed',
      'codigo',
      'nome',
      'imagem',
      'imagem_mobile',
      'link',
      'target',
      'descricao',
    ])
    expect(MARCAS_CONFIG.sections[1]?.fields.map((field) => field.key)).toEqual([
      'titulo',
      'palavras_chave',
      'meta_descricao',
    ])
  })
})
