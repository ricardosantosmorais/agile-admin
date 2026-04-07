import { describe, expect, it } from 'vitest'
import {
  createEmptyAplicativoIntegracaoForm,
  mapAplicativoIntegracaoDetail,
  mapAplicativoIntegracaoListResponse,
  mapAplicativoIntegracaoPermissoesResponse,
  toAplicativoIntegracaoPayload,
} from '@/src/features/integracao-aplicativos/services/integracao-aplicativos-mappers'

describe('integracao-aplicativos-mappers', () => {
  it('mapeia resposta de listagem', () => {
    const response = mapAplicativoIntegracaoListResponse({
      data: [
        {
          id: '10',
          codigo: 'APP-ERP',
          nome: 'ERP Connector',
          email: 'erp@empresa.com.br',
          ativo: 1,
          login: 'client-id',
          senha: 'client-secret',
        },
      ],
      meta: {
        page: 1,
        pages: 3,
        perpage: 15,
        from: 1,
        to: 15,
        total: 32,
      },
    })

    expect(response.data).toEqual([
      {
        id: '10',
        codigo: 'APP-ERP',
        nome: 'ERP Connector',
        email: 'erp@empresa.com.br',
        ativo: true,
        login: 'client-id',
        senha: 'client-secret',
      },
    ])
    expect(response.meta).toMatchObject({
      page: 1,
      pages: 3,
      perPage: 15,
      total: 32,
    })
  })

  it('usa fallback de id quando a API retorna apenas codigo/login', () => {
    const response = mapAplicativoIntegracaoListResponse({
      data: [
        {
          id: '',
          codigo: '0978132632607096',
          nome: 'App sem id',
          email: 'app@empresa.com.br',
          ativo: 1,
          login: 'client-fallback',
          senha: 'secret',
        },
      ],
      meta: {},
    })

    expect(response.data[0]).toMatchObject({
      id: '0978132632607096',
      codigo: '0978132632607096',
    })
  })

  it('mapeia detalhe do aplicativo', () => {
    expect(mapAplicativoIntegracaoDetail({
      id: '55',
      codigo: 'APP-55',
      nome: 'Aplicativo 55',
      email: 'app55@empresa.com.br',
      ativo: '1',
    })).toEqual({
      id: '55',
      codigo: 'APP-55',
      nome: 'Aplicativo 55',
      email: 'app55@empresa.com.br',
      ativo: true,
    })
  })

  it('mapeia permissões do aplicativo', () => {
    const response = mapAplicativoIntegracaoPermissoesResponse({
      usuario: {
        id: '55',
        nome: 'Aplicativo 55',
        email: 'app55@empresa.com.br',
      },
      rows: [
        {
          tabelaNome: 'administradores',
          verboGet: 1,
          verboPost: 0,
          verboPut: 1,
          verboDelete: 0,
        },
      ],
    })

    expect(response.usuario).toEqual({
      id: '55',
      nome: 'Aplicativo 55',
      email: 'app55@empresa.com.br',
    })
    expect(response.rows).toEqual([
      {
        tabelaNome: 'administradores',
        verboGet: true,
        verboPost: false,
        verboPut: true,
        verboDelete: false,
      },
    ])
  })

  it('gera payload de escrita mantendo id e normalizando textos', () => {
    const payload = toAplicativoIntegracaoPayload({
      id: '90',
      ativo: false,
      codigo: '  APP-90  ',
      nome: '  App 90 ',
      email: '  app90@empresa.com.br  ',
    })

    expect(payload).toEqual({
      id: '90',
      ativo: false,
      codigo: 'APP-90',
      nome: 'App 90',
      email: 'app90@empresa.com.br',
    })
  })

  it('cria formulário vazio padrão', () => {
    expect(createEmptyAplicativoIntegracaoForm()).toEqual({
      id: '',
      codigo: '',
      nome: '',
      email: '',
      ativo: true,
    })
  })
})
