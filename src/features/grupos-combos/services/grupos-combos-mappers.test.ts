import { describe, expect, it } from 'vitest'
import { normalizeGrupoComboRecord, toGrupoComboPayload } from '@/src/features/grupos-combos/services/grupos-combos-mappers'

describe('grupos-combos-mappers', () => {
  it('normalizes api values for the form state', () => {
    const record = normalizeGrupoComboRecord({
      ativo: 1,
      codigo: ' GRP01 ',
      nome: ' Grupo principal ',
      imagem: ' /img/a.png ',
      descricao: '<p>descrição</p>',
    })

    expect(record.ativo).toBe(true)
    expect(record.codigo).toBe('GRP01')
    expect(record.nome).toBe('Grupo principal')
    expect(record.imagem).toBe('/img/a.png')
    expect(record.descricao).toBe('<p>descrição</p>')
  })

  it('builds payload with trimmed values and nullables', () => {
    const payload = toGrupoComboPayload({
      id: '9',
      ativo: '1',
      codigo: ' GRP02 ',
      nome: ' Grupo novo ',
      imagem: '',
      descricao: '<p>ok</p>',
    })

    expect(payload).toEqual({
      id: '9',
      ativo: true,
      codigo: 'GRP02',
      nome: 'Grupo novo',
      imagem: null,
      descricao: '<p>ok</p>',
    })
  })

  it('requires group name before save', () => {
    expect(() => toGrupoComboPayload({ nome: ' ' })).toThrow('Informe o nome do grupo de combos.')
  })
})
