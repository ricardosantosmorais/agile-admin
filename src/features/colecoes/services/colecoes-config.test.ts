import { describe, expect, it } from 'vitest'
import { COLECOES_CONFIG } from '@/src/features/colecoes/services/colecoes-config'

describe('colecoes config', () => {
  it('keeps the catalog form fields and list columns aligned with the current module', () => {
    expect(COLECOES_CONFIG.resource).toBe('colecoes')
    expect(COLECOES_CONFIG.routeBase).toBe('/colecoes')
    expect(COLECOES_CONFIG.columns.map((column) => column.id)).toEqual(['id', 'codigo', 'nome', 'id_filial', 'restrito', 'ativo'])
    expect(COLECOES_CONFIG.sections[0]?.fields.map((field) => field.key)).toEqual([
      'ativo',
      'restrito',
      'codigo',
      'id_filial',
      'nome',
      'selo',
      'imagem',
      'imagem_mobile',
      'link',
      'target',
      'descricao',
    ])
  })

  it('normalizes filial lookup data for edit mode', () => {
    expect(COLECOES_CONFIG.normalizeRecord?.({
      id_filial: '12',
      filial: { nome_fantasia: 'Filial Centro' },
    })).toMatchObject({
      id_filial_lookup: {
        id: '12',
        label: 'Filial Centro',
      },
    })
  })
})
