import { describe, expect, it } from 'vitest'
import {
  buildApiInQuery,
  extractParameterValues,
  buildLookupPath,
  buildCompanyParametersPath,
} from '@/src/lib/company-parameters-query'

describe('company-parameters-query', () => {
  it('builds an in query with unique trimmed values', () => {
    expect(buildApiInQuery('chave', [' versao ', 'campo_1', 'campo_1'])).toBe("chave in('versao','campo_1')")
  })

  it('builds the filtered parameter endpoint for a configuracoes page', () => {
    expect(buildCompanyParametersPath('tenant-1', ['campo_1', 'campo_2'])).toBe(
      "empresas/parametros?id_empresa=tenant-1&order=chave%2Cposicao&perpage=1000&q=chave+in%28%27campo_1%27%2C%27campo_2%27%29",
    )
  })

  it('builds lookup endpoints with minimal fields', () => {
    expect(buildLookupPath('formas_pagamento', 'tenant-1', { order: 'nome', fields: ['id', 'nome'] })).toBe(
      'formas_pagamento?id_empresa=tenant-1&order=nome&perpage=1000&ativo=1&fields=id%2Cnome',
    )
  })

  it('allows hydrating saved lookups without forcing only active records', () => {
    expect(buildLookupPath('formas_pagamento', 'tenant-1', {
      order: 'nome',
      fields: ['id', 'nome'],
      includeActiveOnly: false,
    })).toBe(
      'formas_pagamento?id_empresa=tenant-1&order=nome&perpage=1000&fields=id%2Cnome',
    )
  })

  it('extracts only the requested parameter values', () => {
    expect(extractParameterValues({
      data: [
        { chave: 'campo_1', parametros: '10' },
        { chave: 'campo_2', parametros: '20' },
        { chave: 'campo_1', parametros: '10' },
      ],
    }, ['campo_1', 'campo_3'])).toEqual(['10'])
  })
})



