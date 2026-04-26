import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CORES_CONFIG } from '@/src/features/cores/services/cores-config'

describe('cores config', () => {
  it('keeps the color crud contract aligned with the migrated screen', () => {
    expect(CORES_CONFIG.resource).toBe('cores')
    expect(CORES_CONFIG.routeBase).toBe('/cores')
    expect(CORES_CONFIG.columns.map((column) => column.id)).toEqual(['id', 'codigo', 'nome', 'ativo'])
    expect(CORES_CONFIG.sections[0]?.fields.map((field) => field.key)).toEqual(['ativo', 'codigo', 'nome', 'hexa1', 'hexa2'])
  })

  it('renders the gradient swatch using both hex values when present', () => {
    const colorColumn = CORES_CONFIG.columns.find((column) => column.id === 'nome')
    const html = renderToStaticMarkup(colorColumn?.render?.({
      nome: 'Azul degradê',
      hexa1: '#0000ff',
      hexa2: '#00ffff',
    }, {} as never) as React.ReactElement)

    expect(html).toContain('Azul degradê')
    expect(html).toContain('linear-gradient(145deg, #0000ff 50%, #00ffff 50%)')
  })
})
