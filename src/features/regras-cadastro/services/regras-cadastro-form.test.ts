import { describe, expect, it } from 'vitest'
import { mapRegraCadastroDetail, toRegraCadastroPayload } from '@/src/features/regras-cadastro/services/regras-cadastro-form'

describe('regras-cadastro-form', () => {
  it('maps api detail to form state with masked and lookup values', () => {
    const mapped = mapRegraCadastroDetail({
      id: '77',
      ativo: 1,
      nome: 'Regra Nordeste',
      codigo: 'REG-77',
      contribuinte: true,
      tipo: 'PJ',
      tipo_cliente: 'R',
      inscricao_estadual: 'ISENTO',
      uf: 'ce',
      cep_de: '60000000',
      cep_ate: '60999999',
      codigo_cnae: '4711301',
      valida_limite: 1,
      valida_multiplo: 0,
      filial: { id: '1', nome_fantasia: 'Matriz Fortaleza' },
      vendedor: { id: '9', nome: 'Ana Paula' },
      limite_credito: 1500.5,
    })

    expect(mapped).toMatchObject({
      id: '77',
      ativo: true,
      nome: 'Regra Nordeste',
      codigo: 'REG-77',
      contribuinte: '1',
      tipo: 'PJ',
      tipo_cliente: 'R',
      inscricao_estadual: 'ISENTO',
      uf: 'CE',
      cep_de: '60000-000',
      cep_ate: '60999-999',
      codigo_cnae: '4711301',
      valida_limite: true,
      valida_multiplo: false,
      id_filial_lookup: { id: '1', label: 'Matriz Fortaleza' },
      id_vendedor_lookup: { id: '9', label: 'Ana Paula' },
      limite_credito: '1.500,50',
    })
  })

  it('serializes form state back to the api payload', () => {
    const payload = toRegraCadastroPayload({
      id: '77',
      ativo: true,
      nome: 'Regra Nordeste',
      codigo: 'REG-77',
      contribuinte: '0',
      tipo: 'PF',
      tipo_cliente: 'C',
      inscricao_estadual: 'NAO_ISENTO',
      uf: 'CE',
      cep_de: '60000-000',
      cep_ate: '60999-999',
      codigo_cnae: '4711301',
      valida_limite: true,
      valida_multiplo: false,
      id_filial_lookup: { id: '1', label: 'Matriz Fortaleza' },
      id_vendedor_lookup: { id: '9', label: 'Ana Paula' },
      limite_credito: '1.500,50',
    })

    expect(payload).toMatchObject({
      id: '77',
      ativo: true,
      nome: 'Regra Nordeste',
      codigo: 'REG-77',
      contribuinte: false,
      tipo: 'PF',
      tipo_cliente: 'C',
      inscricao_estadual: 'NAO_ISENTO',
      uf: 'CE',
      cep_de: '60000000',
      cep_ate: '60999999',
      codigo_cnae: '4711301',
      valida_limite: true,
      valida_multiplo: false,
      id_filial: '1',
      id_vendedor: '9',
      limite_credito: 1500.5,
    })
  })

  it('maps raw relation ids when the api returns no embedded lookup payloads', () => {
    const mapped = mapRegraCadastroDetail({
      id: '99',
      nome: 'Regra sem embed',
      id_filial: '1',
      id_canal_distribuicao: '2',
      id_vendedor: '3',
      id_tabela_canal_distribuicao: '4',
    })

    expect(mapped.id_filial_lookup).toEqual({ id: '1', label: '1' })
    expect(mapped.id_canal_distribuicao_lookup).toEqual({ id: '2', label: '2' })
    expect(mapped.id_vendedor_lookup).toEqual({ id: '3', label: '3' })
    expect(mapped.id_tabela_canal_distribuicao_lookup).toEqual({ id: '4', label: '4' })
  })

  it('does not serialize unsupported relations removed from the current model', () => {
    const payload = toRegraCadastroPayload({
      id: '100',
      ativo: true,
      nome: 'Regra alinhada',
      id_tabela_canal_distribuicao_lookup: { id: '7', label: 'Canal Sul' },
      id_vendedor_canal_distribuicao_lookup: { id: '8', label: 'Campo legado' },
      id_cliente_vendedor_lookup: { id: '9', label: 'Campo legado' },
    })

    expect(payload).toMatchObject({
      id: '100',
      ativo: true,
      nome: 'Regra alinhada',
      id_tabela_canal_distribuicao: '7',
    })
    expect(payload).not.toHaveProperty('id_vendedor_canal_distribuicao')
    expect(payload).not.toHaveProperty('id_cliente_vendedor')
  })
})
