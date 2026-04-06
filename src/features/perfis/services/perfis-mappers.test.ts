import { describe, expect, it } from 'vitest'
import {
  mapPerfilDetail,
  mapPerfilListResponse,
  mapPerfilPermissionTree,
  toPerfilPayload,
} from '@/src/features/perfis/services/perfis-mappers'

describe('perfis-mappers', () => {
  it('mapeia a resposta da listagem', () => {
    const response = mapPerfilListResponse({
      data: [
        {
          id: '10',
          codigo: 'GESTAO',
          nome: 'Gestão',
          ativo: 1,
        },
      ],
      meta: {
        page: 1,
        pages: 2,
        perpage: 15,
        from: 1,
        to: 15,
        total: 20,
      },
    })

    expect(response.data[0]).toEqual({
      id: '10',
      codigo: 'GESTAO',
      nome: 'Gestão',
      ativo: true,
    })
    expect(response.meta.total).toBe(20)
  })

  it('mapeia o detalhe do perfil', () => {
    expect(mapPerfilDetail({
      id: '3',
      ativo: '1',
      codigo: 'MASTER',
      nome: 'Master',
    })).toEqual({
      id: '3',
      ativo: true,
      codigo: 'MASTER',
      nome: 'Master',
      selectedPermissionIds: [],
    })
  })

  it('mapeia a árvore de permissões', () => {
    const result = mapPerfilPermissionTree({
      nodes: [{ id: '1', label: 'Administração', children: [] }],
      selectedIds: ['1', '2'],
    })

    expect(result.nodes).toHaveLength(1)
    expect(result.selectedIds).toEqual(['1', '2'])
  })

  it('gera payload com acessos serializados', () => {
    const payload = toPerfilPayload({
      id: '4',
      ativo: true,
      codigo: 'COMERCIAL',
      nome: 'Comercial',
      selectedPermissionIds: ['filhos-clientes'],
    }, [
      {
        id: 'cadastros',
        label: 'Cadastros',
        children: [
          { id: 'filhos-clientes', label: 'Clientes', children: [] },
        ],
      },
    ])

    expect(payload).toMatchObject({
      id: '4',
      ativo: true,
      codigo: 'COMERCIAL',
      nome: 'Comercial',
    })
    expect(payload.id_funcionalidades).toContain('cadastros')
    expect(payload.id_funcionalidades).toContain('filhos-clientes')
  })
})
