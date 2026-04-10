import { describe, expect, it } from 'vitest'
import { TERMOS_PESQUISA_CONFIG } from '@/src/features/termos-pesquisa/services/termos-pesquisa-config'

describe('termos pesquisa config', () => {
  it('uses the legacy resource and expected list/form fields', () => {
    expect(TERMOS_PESQUISA_CONFIG.resource).toBe('termos_pesquisa')
    expect(TERMOS_PESQUISA_CONFIG.routeBase).toBe('/termos-de-pesquisa')
    expect(TERMOS_PESQUISA_CONFIG.columns.map((column) => column.id)).toEqual(['id', 'termos', 'resultado', 'ativo'])
    expect(TERMOS_PESQUISA_CONFIG.sections[0]?.fields.map((field) => field.key)).toEqual(['ativo', 'termos', 'resultado'])
  })

  it('trims terms and result before save', () => {
    const payload = TERMOS_PESQUISA_CONFIG.beforeSave?.({
      termos: ' ?? piso, porcelanato ?? ',
      resultado: ' ?? piso porcelanato ?? ',
    })

    expect(payload).toEqual({
      termos: 'piso, porcelanato',
      resultado: 'piso porcelanato',
    })
  })
})

