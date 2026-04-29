import { describe, expect, it } from 'vitest'
import { COMPONENTES_CONFIG } from '@/src/features/componentes/services/componentes-config'

describe('componentes config', () => {
  it('keeps the legacy list and form fields', () => {
    expect(COMPONENTES_CONFIG.resource).toBe('componentes')
    expect(COMPONENTES_CONFIG.routeBase).toBe('/componentes')
    expect(COMPONENTES_CONFIG.formEmbed).toBe('campos')
    expect(COMPONENTES_CONFIG.columns.map((column) => column.id)).toEqual(['id', 'codigo', 'nome', 'tipo', 'ativo'])
    expect(COMPONENTES_CONFIG.sections[0]?.fields.map((field) => field.key)).toEqual(['ativo', 'codigo', 'nome', 'tipo', 'arquivo', 'imagem', 'json'])
  })
})
