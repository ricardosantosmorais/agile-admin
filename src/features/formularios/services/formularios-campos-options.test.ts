import { describe, expect, it } from 'vitest'
import {
  parseFormularioCampoSelectorOptions,
  stringifyFormularioCampoSelectorOptions,
} from '@/src/features/formularios/services/formularios-campos-options'

describe('formularios-campos-options', () => {
  it('parses valid selector options json', () => {
    const parsed = parseFormularioCampoSelectorOptions('[{"titulo":"Loja","valor":"1"},{"titulo":"Distribuidor","valor":"2"}]')
    expect(parsed).toEqual([
      { titulo: 'Loja', valor: '1' },
      { titulo: 'Distribuidor', valor: '2' },
    ])
  })

  it('ignores invalid json payloads', () => {
    expect(parseFormularioCampoSelectorOptions('invalid')).toEqual([])
    expect(parseFormularioCampoSelectorOptions('{"titulo":"x"}')).toEqual([])
  })

  it('stringifies only non-empty selector options', () => {
    const serialized = stringifyFormularioCampoSelectorOptions([
      { titulo: ' Loja ', valor: ' 1 ' },
      { titulo: '', valor: '' },
    ])

    expect(serialized).toBe('[{"titulo":"Loja","valor":"1"}]')
    expect(stringifyFormularioCampoSelectorOptions([{ titulo: '', valor: '' }])).toBeNull()
  })
})
