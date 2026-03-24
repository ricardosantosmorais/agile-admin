import { describe, expect, it } from 'vitest'
import { createEmptyGrupoClienteForm, GRUPOS_CLIENTES_CONFIG, mapGrupoClienteDetail } from '@/src/features/grupos-clientes/services/grupos-clientes-config'

describe('grupos-clientes-config', () => {
  it('returns an empty form as default fallback', () => {
    expect(createEmptyGrupoClienteForm()).toEqual({
      id: '',
      ativo: true,
      codigo: '',
      nome: '',
      clientes: [],
    })
  })

  it('maps the api detail and serializes the save payload', () => {
    const form = mapGrupoClienteDetail({
      id: '5',
      ativo: 1,
      codigo: 'GRP-5',
      nome: 'Clientes Ouro',
      clientes: [{ id_grupo: '5', id_cliente: '10' }],
    })

    expect(form).toEqual({
      id: '5',
      ativo: true,
      codigo: 'GRP-5',
      nome: 'Clientes Ouro',
      clientes: [{ id_grupo: '5', id_cliente: '10' }],
    })

    expect(GRUPOS_CLIENTES_CONFIG.beforeSave?.(form)).toEqual({
      id: '5',
      ativo: true,
      codigo: 'GRP-5',
      nome: 'Clientes Ouro',
    })
  })
})
