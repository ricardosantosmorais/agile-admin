import { describe, expect, it } from 'vitest'
import { DEPARTAMENTOS_CONFIG } from '@/src/features/departamentos/services/departamentos-config'

describe('departamentos config', () => {
  it('keeps parent department filters and sections aligned with the current form', () => {
    expect(DEPARTAMENTOS_CONFIG.resource).toBe('departamentos')
    expect(DEPARTAMENTOS_CONFIG.routeBase).toBe('/departamentos')
    expect(DEPARTAMENTOS_CONFIG.columns.map((column) => column.id)).toEqual([
      'id',
      'departamento_pai',
      'nome',
      'posicao',
      'disponivel',
      'ativo',
    ])
    expect(DEPARTAMENTOS_CONFIG.sections.map((section) => section.id)).toEqual(['general', 'seo'])
  })

  it('normalizes the parent department lookup for edit mode', () => {
    expect(DEPARTAMENTOS_CONFIG.normalizeRecord?.({
      id_departamento_pai: '9',
      departamento_pai: { nome: 'Departamento Pai' },
    })).toMatchObject({
      id_departamento_pai_lookup: {
        id: '9',
        label: 'Departamento Pai',
      },
    })
  })
})
