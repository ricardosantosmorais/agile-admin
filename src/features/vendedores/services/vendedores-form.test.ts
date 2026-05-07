import { describe, expect, it } from 'vitest'
import { createEmptyVendedorForm, mapVendedorDetail, toVendedorPayload } from '@/src/features/vendedores/services/vendedores-form'

describe('vendedores-form', () => {
  it('maps seller details from the api to form state', () => {
    const mapped = mapVendedorDetail({
      id: '12',
      ativo: 1,
      bloqueado: 0,
      area_vendedor: 1,
      codigo: 'VND-12',
      codigo_ativacao: 'ACT-12',
      tipo: 'PJ',
      tipo_vendedor: 'externo',
      cnpj_cpf: '12345678000199',
      nome: 'Distribuidora Sol',
      filial: { id: '1', nome_fantasia: 'Matriz' },
      supervisor: { id: '2', nome: 'Supervisor A' },
      canal_distribuicao: { id: '3', nome: 'Atacado' },
      email: 'vendedor@example.com',
      ddd: '85',
      telefone: '33334444',
      ddd_celular: '85',
      celular: '999998888',
      canais_distribuicao: [{ id_vendedor: '12', id_canal_distribuicao: '3' }],
    })

    expect(mapped).toMatchObject({
      id: '12',
      ativo: true,
      bloqueado: false,
      area_vendedor: true,
      tipo: 'PJ',
      tipo_vendedor: 'externo',
      cnpj: '12.345.678/0001-99',
      nome_fantasia: 'Distribuidora Sol',
      id_filial: { id: '1', label: 'Matriz' },
      id_supervisor: { id: '2', label: 'Supervisor A' },
      id_canal_distribuicao: { id: '3', label: 'Atacado' },
      email: 'vendedor@example.com',
      telefone: '(85) 3333-4444',
      celular: '(85) 99999-8888',
    })
    expect(mapped.canais_distribuicao).toHaveLength(1)
  })

  it('serializes the seller form back to the api payload', () => {
    const payload = toVendedorPayload({
      id: '12',
      ativo: true,
      bloqueado: false,
      area_vendedor: true,
      codigo: 'VND-12',
      codigo_ativacao: 'ACT-12',
      tipo: 'PF',
      tipo_vendedor: 'receptivo',
      cpf: '123.456.789-01',
      cnpj: '',
      nome: 'Maria Silva',
      nome_fantasia: '',
      id_filial: { id: '1', label: 'Matriz' },
      id_supervisor: { id: '2', label: 'Supervisor A' },
      id_canal_distribuicao: { id: '3', label: 'Atacado' },
      email: 'maria@example.com',
      telefone: '(85) 3333-4444',
      celular: '(85) 99999-8888',
      canais_distribuicao: [],
    })

    expect(payload).toEqual({
      id: '12',
      ativo: true,
      bloqueado: false,
      area_vendedor: true,
      codigo: 'VND-12',
      codigo_ativacao: 'ACT-12',
      tipo: 'PF',
      tipo_vendedor: 'receptivo',
      cnpj_cpf: '12345678901',
      nome: 'Maria Silva',
      id_filial: '1',
      id_supervisor: '2',
      id_canal_distribuicao: '3',
      email: 'maria@example.com',
      ddd: '85',
      telefone: '33334444',
      ddd_celular: '85',
      celular: '999998888',
    })
  })

  it('mapeia e serializa o uso da area vendedor v2 com os defaults do formulario', () => {
    expect(toVendedorPayload({
      ...createEmptyVendedorForm(),
      area_vendedor: true,
      cpf: '123.456.789-01',
      nome: 'Ana Vendedora',
    })).toMatchObject({
      area_vendedor: true,
      cnpj_cpf: '12345678901',
    })
  })
})
