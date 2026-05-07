import { describe, expect, it } from 'vitest'
import { buildContatoEditPayload, mapContatoDetailToEditForm } from '@/src/features/contatos/services/contatos-mappers'

describe('contatos-mappers', () => {
  it('normaliza detalhe para edicao e serializa payload administrativo', () => {
    const form = mapContatoDetailToEditForm({
      id: '77',
      status: 'recebido',
      tipo: 'PJ',
      cnpj_cpf: '12345678000199',
      nome_fantasia: 'Loja XPTO',
      razao_social: 'XPTO LTDA',
      data_nascimento: '1990-05-20 00:00:00',
      id_segmento: '5',
      segmento: { id: '5', nome: 'Varejo' },
      ddd1: '85',
      telefone1: '33334444',
      whatsapp: 1,
      news: 0,
      ativo: 1,
      codigo_ibge: '2304400',
    })

    expect(form).toMatchObject({
      id: '77',
      status: 'recebido',
      tipo: 'PJ',
      cnpj_cpf: '12345678000199',
      data_nascimento: '1990-05-20',
      id_segmento: '5',
      whatsapp: true,
      news: false,
      ativo: true,
    })

    const payload = buildContatoEditPayload({
      ...form,
      cnpj_cpf: '12.345.678/0001-99',
      ddd1: '(85)',
      telefone1: '3333-4444',
      cep: '60.000-000',
      codigo_ibge: '2304400',
      whatsapp: true,
      news: false,
      ativo: false,
      razao_social: '  XPTO LTDA  ',
      complemento: '',
    })

    expect(payload).toMatchObject({
      id: '77',
      edicao_admin: true,
      status: 'recebido',
      cnpj_cpf: '12345678000199',
      ddd1: '85',
      telefone1: '33334444',
      cep: '60000000',
      codigo_ibge: 2304400,
      whatsapp: true,
      news: false,
      ativo: false,
      razao_social: 'XPTO LTDA',
      complemento: null,
      logs: {
        descricao: 'Contato editado no Admin v2',
      },
    })
  })
})
