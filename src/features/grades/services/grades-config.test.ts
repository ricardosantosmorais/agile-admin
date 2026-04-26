import { describe, expect, it } from 'vitest'
import { GRADES_CONFIG } from '@/src/features/grades/services/grades-config'

describe('grades config', () => {
  it('keeps the list/form contract aligned with the type selector rules', () => {
    expect(GRADES_CONFIG.resource).toBe('grades')
    expect(GRADES_CONFIG.routeBase).toBe('/grades')
    expect(GRADES_CONFIG.columns.map((column) => column.id)).toEqual(['id', 'codigo', 'nome', 'tipo', 'ativo'])
    expect(GRADES_CONFIG.sections[0]?.fields.map((field) => field.key)).toEqual([
      'ativo',
      'codigo',
      'nome',
      'id_classe',
      'tipo',
      'posicao',
    ])
  })

  it('renders the type column labels expected by the UI', () => {
    const typeColumn = GRADES_CONFIG.columns.find((column) => column.id === 'tipo')
    expect(typeColumn?.render?.({ tipo: 'tipo1' }, {} as never)).toBe('Tipo 1')
    expect(typeColumn?.render?.({ tipo: 'tipo2' }, {} as never)).toBe('Tipo 2')
  })

  it('removes UI-only option counters before saving grade options', () => {
    expect(GRADES_CONFIG.beforeSave?.({
      ativo: true,
      codigo: 'GRA-1',
      nome: 'Grade',
      tipo: 'tipo1',
      posicao: '',
      __opcoes_count: 1,
      opcao1: 'P',
      opcao2: '',
    })).toEqual({
      ativo: true,
      codigo: 'GRA-1',
      nome: 'Grade',
      tipo: 'tipo1',
      posicao: null,
      opcao1: 'P',
    })
  })
})
