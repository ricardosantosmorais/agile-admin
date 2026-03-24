import { describe, expect, it } from 'vitest'
import {
  mapUsuarioAccessResponse,
  mapUsuarioLinkedClients,
  mapUsuarioLinkedSeller,
  mapUsuariosListResponse,
} from '@/src/features/usuarios/services/usuarios-mappers'

describe('usuarios-mappers', () => {
  it('maps the list response with seller and meta data', () => {
    const response = mapUsuariosListResponse({
      data: [
        {
          id: '7',
          email: 'seller@example.com',
          perfil: 'vendedor',
          ultimo_acesso: '2026-03-24 10:00:00',
          ip_ultimo_acesso: '127.0.0.1',
          ultimo_pedido: '2026-03-23 08:00:00',
          ativo: 1,
          vendedor: {
            id: '22',
            codigo: 'VND-22',
          },
        },
      ],
      meta: {
        page: 2,
        pages: 3,
        perpage: 15,
        from: 16,
        to: 30,
        total: 40,
      },
    })

    expect(response.meta).toEqual({
      page: 2,
      pages: 3,
      perPage: 15,
      from: 16,
      to: 30,
      total: 40,
    })
    expect(response.data[0]).toMatchObject({
      id: '7',
      email: 'seller@example.com',
      perfil: 'vendedor',
      perfilLabel: 'Vendedor',
      codigoVendedor: 'VND-22',
      ipUltimoAcesso: '127.0.0.1',
      ativo: true,
      vendedorId: '22',
    })
  })

  it('maps linked clients and seller details', () => {
    const clients = mapUsuarioLinkedClients({
      data: [
        {
          id_cliente: '10',
          data_ativacao: '2026-03-01 11:00:00',
          cliente: {
            id: '10',
            codigo: 'CLI-10',
            codigo_ativacao: 'ATV-10',
            cnpj_cpf: '12345678000199',
            nome_fantasia: 'Loja XPTO',
            razao_social: 'XPTO LTDA',
          },
        },
      ],
    })

    expect(clients).toHaveLength(1)
    expect(clients[0]).toMatchObject({
      idCliente: '10',
      codigo: 'CLI-10',
      codigoAtivacao: 'ATV-10',
      cnpjCpf: '12345678000199',
      nomeFantasia: 'Loja XPTO',
      razaoSocial: 'XPTO LTDA',
    })

    expect(mapUsuarioLinkedSeller({
      id: '22',
      codigo: 'VND-22',
      codigo_ativacao: 'ATV-22',
      cnpj_cpf: '12345678901',
      nome: 'Maria Silva',
    })).toEqual({
      id: '22',
      codigo: 'VND-22',
      codigoAtivacao: 'ATV-22',
      cnpjCpf: '12345678901',
      nome: 'Maria Silva',
    })
  })

  it('maps user access history', () => {
    const response = mapUsuarioAccessResponse({
      data: [
        {
          id_usuario: '7',
          ultimo_acesso: '2026-03-24 10:00:00',
          ip_ultimo_acesso: '127.0.0.1',
        },
      ],
      meta: {
        page: 1,
        pages: 1,
        perPage: 10,
        from: 1,
        to: 1,
        total: 1,
      },
    })

    expect(response.meta.total).toBe(1)
    expect(response.data[0]).toMatchObject({
      id: '7-2026-03-24 10:00:00-127.0.0.1',
      ipUltimoAcesso: '127.0.0.1',
    })
  })
})
