import { describe, expect, it } from 'vitest'
import {
  buildCampoPayload,
  buildComponentePayload,
  normalizeCampos,
  normalizeComponenteRecord,
  parseCampoOptions,
} from '@/src/features/componentes/services/componentes-mappers'

describe('componentes mappers', () => {
  it('normalizes component fields sorted by legacy position', () => {
    const record = normalizeComponenteRecord({
      ativo: '1',
      codigo: null,
      nome: 'Banner home',
      campos: [
        { id: 2, nome: 'segundo', posicao: 2, ativo: 0 },
        { id: 1, nome: 'primeiro', posicao: 1, ativo: 1 },
      ],
    })

    expect(record.ativo).toBe(true)
    expect(record.codigo).toBe('')
    expect(normalizeCampos(record.campos).map((campo) => campo.id)).toEqual(['1', '2'])
  })

  it('converts empty component payload values to null like the legacy controller', () => {
    const payload = buildComponentePayload({
      ativo: false,
      codigo: '',
      tipo: '',
      imagem: '',
      json: '',
      nome: 'Vitrine',
    })

    expect(payload).toMatchObject({
      ativo: false,
      codigo: null,
      tipo: null,
      imagem: null,
      json: null,
      nome: 'Vitrine',
    })
  })

  it('builds selector field payload with custom options JSON', () => {
    const payload = buildCampoPayload({
      id: '',
      id_componente: '10',
      ativo: true,
      obrigatorio: false,
      nome: 'cor',
      titulo: 'Cor',
      tipo: 'seletor',
      tipo_seletor: 'personalizado',
      posicao: '1',
    }, [
      { titulo: 'Azul', valor: 'blue' },
      { titulo: '', valor: '' },
    ])

    expect(payload.id).toBe('')
    expect(payload.json_seletor).toBe('[{"titulo":"Azul","valor":"blue"}]')
    expect(payload.tipo_seletor).toBe('personalizado')
  })

  it('parses legacy selector JSON safely', () => {
    expect(parseCampoOptions('[{"titulo":"Um","valor":"1"}]')).toEqual([{ titulo: 'Um', valor: '1' }])
    expect(parseCampoOptions('not-json')).toEqual([])
  })
})
