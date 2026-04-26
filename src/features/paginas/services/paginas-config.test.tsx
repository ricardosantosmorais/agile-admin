import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PAGINAS_CONFIG } from '@/src/features/paginas/services/paginas-config'

describe('paginas config', () => {
  it('keeps sections and embeds aligned with the current page module', () => {
    expect(PAGINAS_CONFIG.resource).toBe('paginas')
    expect(PAGINAS_CONFIG.routeBase).toBe('/paginas')
    expect(PAGINAS_CONFIG.sections.map((section) => section.id)).toEqual(['main', 'content'])
    expect(PAGINAS_CONFIG.listEmbed).toBe('area,url')
    expect(PAGINAS_CONFIG.formEmbed).toBe('area,url')
  })

  it('normalizes the area id and serializes optional fields before save', () => {
    expect(PAGINAS_CONFIG.normalizeRecord?.({
      area: { id: '13' },
    })).toMatchObject({
      id_area_pagina: '13',
      perfil: 'todos',
    })

    expect(PAGINAS_CONFIG.beforeSave?.({
      posicao: '',
      link_externo: '',
      texto: '',
    })).toMatchObject({
      posicao: null,
      link_externo: null,
      texto: null,
    })
  })

  it('renders an external tenant link when the page slug is available', () => {
    const titleColumn = PAGINAS_CONFIG.columns.find((column) => column.id === 'titulo')
    const html = renderToStaticMarkup(titleColumn?.render?.({
      titulo: 'Página institucional',
      url: { slug: '/institucional' },
    }, { tenantUrl: 'https://tenant.exemplo.com' } as never) as React.ReactElement)

    expect(html).toContain('Página institucional')
    expect(html).toContain('https://tenant.exemplo.com/institucional')
  })
})
