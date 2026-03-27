import { describe, expect, it } from 'vitest'
import { asArray, asBoolean, asNumber, asRecord, asString } from '@/src/lib/api-payload'
import { toBooleanChoiceValue } from '@/src/lib/boolean-utils'
import { formatApiDateTimeToInput, formatInputDateTimeToApi } from '@/src/lib/date-time-input'
import { nullableLookupId, normalizeLookupState, toLookupOption } from '@/src/lib/lookup-options'
import { normalizeActionHref } from '@/src/lib/url'
import { validateCepLength } from '@/src/lib/validators'
import {
  digitsOnly,
  formatLocalizedDecimal,
  normalizeCurrencyInputValue,
  normalizeInteger,
  parseInteger,
  parseLocalizedNumber,
  splitPhone,
} from '@/src/lib/value-parsers'

describe('shared helpers', () => {
  it('normalizes API payload primitives safely', () => {
    expect(asRecord(null)).toEqual({})
    expect(asArray('x')).toEqual([])
    expect(asString(10, 'fallback')).toBe('fallback')
    expect(asBoolean('1')).toBe(true)
    expect(asNumber('12.5')).toBe(12.5)
    expect(asNumber('x', undefined)).toBeUndefined()
  })

  it('builds and resolves lookup options consistently', () => {
    expect(toLookupOption({ id: 10, nome_fantasia: 'Filial Centro' }, ['nome_fantasia', 'nome'])).toEqual({
      id: '10',
      label: 'Filial Centro',
    })
    expect(nullableLookupId({ id: 22 })).toBe('22')
    expect(
      normalizeLookupState(
        { id_praca: '5', praca: { id: '5', nome: 'Capital' } },
        'id_praca',
        'praca',
        'id_praca_lookup',
      ),
    ).toEqual({
      id_praca_lookup: { id: '5', label: 'Capital' },
    })
  })

  it('parses localized numeric values and phones', () => {
    expect(digitsOnly('(31) 99999-0000')).toBe('31999990000')
    expect(splitPhone('(31) 3333-4444')).toEqual({ ddd: '31', number: '33334444' })
    expect(parseLocalizedNumber('1.234,56')).toBe(1234.56)
    expect(parseInteger('R$ 45')).toBe(45)
    expect(normalizeInteger('abc123')).toBe('123')
    expect(formatLocalizedDecimal('34.34', 3)).toBe('34,340')
    expect(normalizeCurrencyInputValue(12.5)).toBe('12,50')
  })

  it('normalizes date-time and URL helpers', () => {
    expect(formatApiDateTimeToInput('2026-03-20 14:30:00')).toBe('2026-03-20T14:30')
    expect(formatInputDateTimeToApi('2026-03-20T14:30')).toBe('2026-03-20 14:30:00')
    expect(normalizeActionHref('cadastros/clientes')).toBe('/cadastros/clientes')
    expect(normalizeActionHref('https://example.com')).toBe('https://example.com')
  })

  it('covers validation and boolean choice helpers', () => {
    expect(validateCepLength('30140-071')).toBeNull()
    expect(validateCepLength('12345-67')).toBe('common.validZipCode')
    expect(toBooleanChoiceValue('S')).toBe('1')
    expect(toBooleanChoiceValue('N')).toBe('0')
    expect(toBooleanChoiceValue(null)).toBe('')
  })
})
