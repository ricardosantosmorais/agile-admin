import { describe, expect, it } from 'vitest'
import { buildClientSavePayload, mapClientDetail, mapClientListResponse } from '@/src/features/clientes/services/clientes-mappers'

describe('clientes-mappers', () => {
  it('maps list payload into table items and meta', () => {
    const response = mapClientListResponse({
      data: [
        {
          id: '100',
          codigo: 'CLI-100',
          codigo_ativacao: 'ATV-100',
          cnpj_cpf: '12345678000199',
          inscricao_estadual: 'ISENTO',
          razao_social: 'XPTO LTDA',
          data_ativacao: '2026-03-01 00:00:00',
          ultimo_pedido: '2026-03-10 00:00:00',
          qtd_pedidos: 3,
          bloqueado: 0,
          bloqueado_plataforma: 1,
          ativo: 1,
        },
      ],
      meta: {
        page: 1,
        pages: 1,
        perpage: 15,
        total: 1,
        from: 1,
        to: 1,
      },
    })

    expect(response.meta.total).toBe(1)
    expect(response.data[0]).toMatchObject({
      id: '100',
      codigo: 'CLI-100',
      nomeRazaoSocial: 'XPTO LTDA',
      qtdPedidos: 3,
      bloqueado: false,
      bloqueadoPlataforma: true,
      ativo: true,
    })
  })

  it('maps customer detail and serializes the write payload', () => {
    const form = mapClientDetail({
      id: '100',
      id_classe: '2',
      ativo: 1,
      bloqueado: 0,
      bloqueado_plataforma: 1,
      liberado: 1,
      contribuinte: 1,
      codigo: 'CLI-100',
      codigo_ativacao: 'ATV-100',
      tipo: 'PJ',
      cnpj_cpf: '12345678000199',
      razao_social: 'XPTO LTDA',
      nome_fantasia: 'Loja XPTO',
      inscricao_estadual: 'ISENTO',
      limite_credito: 1500.5,
      limite_disponivel: 500.25,
      email: 'cliente@example.com',
      ddd1: '85',
      telefone1: '33334444',
      ddd_celular: '85',
      celular: '999998888',
      rede: { id: '7', nome: 'Rede Norte' },
      segmento: { id: '8', nome: 'Farmácia' },
      canal_distribuicao: { id: '9', nome: 'Atacado' },
      filial: { id: '10', nome_fantasia: 'Matriz' },
      vendedor: { id: '11', nome: 'Maria Silva' },
    })

    expect(form).not.toBeNull()
    expect(form).toMatchObject({
      id: '100',
      tipo: 'PJ',
      cnpj: '12.345.678/0001-99',
      razaoSocial: 'XPTO LTDA',
      nomeFantasia: 'Loja XPTO',
      isentoIe: true,
      telefone1: '(85) 3333-4444',
      celular: '(85) 99999-8888',
      classificacao: {
        rede: { id: '7', label: 'Rede Norte' },
        segmento: { id: '8', label: 'Farmácia' },
      },
    })

    const payload = buildClientSavePayload(form!)
    expect(payload).toMatchObject({
      id: '100',
      id_classe: '2',
      ativo: true,
      bloqueado: false,
      contribuinte: true,
      tipo: 'PJ',
      cnpj_cpf: '12345678000199',
      nome_fantasia: 'Loja XPTO',
      razao_social: 'XPTO LTDA',
      inscricao_estadual: 'ISENTO',
      id_rede: '7',
      id_segmento: '8',
      id_canal_distribuicao: '9',
      id_filial: '10',
      id_vendedor: '11',
      ddd1: '85',
      telefone1: '33334444',
      ddd_celular: '85',
      celular: '999998888',
    })
  })
})
