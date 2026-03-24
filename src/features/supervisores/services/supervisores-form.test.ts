import { describe, expect, it } from 'vitest'
import { mapSupervisorDetail, toSupervisorPayload } from '@/src/features/supervisores/services/supervisores-form'

describe('supervisores-form', () => {
  it('maps supervisor details from the api to form state', () => {
    const mapped = mapSupervisorDetail({
      id: '9',
      ativo: 1,
      bloqueado: 1,
      codigo: 'SUP-9',
      codigo_ativacao: 'ATV-9',
      tipo: 'PF',
      cnpj_cpf: '12345678901',
      nome: 'Supervisor Nove',
      filial: { id: '4', nome_fantasia: 'Filial Sul' },
      canal_distribuicao: { id: '5', nome: 'Marketplace' },
      email: 'supervisor@example.com',
      ddd: '11',
      telefone: '33334444',
      ddd_celular: '11',
      celular: '999998888',
    })

    expect(mapped).toMatchObject({
      id: '9',
      ativo: true,
      bloqueado: true,
      tipo: 'PF',
      cpf: '123.456.789-01',
      nome: 'Supervisor Nove',
      id_filial: { id: '4', label: 'Filial Sul' },
      id_canal_distribuicao: { id: '5', label: 'Marketplace' },
      email: 'supervisor@example.com',
      telefone: '(11) 3333-4444',
      celular: '(11) 99999-8888',
    })
  })

  it('falls back to raw relation ids when the api does not embed lookup objects', () => {
    const mapped = mapSupervisorDetail({
      id: '9',
      tipo: 'PF',
      cnpj_cpf: '12345678901',
      nome: 'Supervisor Nove',
      id_filial: '4',
      id_canal_distribuicao: '5',
    })

    expect(mapped.id_filial).toEqual({ id: '4', label: '4' })
    expect(mapped.id_canal_distribuicao).toEqual({ id: '5', label: '5' })
  })

  it('serializes supervisor form back to the api payload', () => {
    const payload = toSupervisorPayload({
      id: '9',
      ativo: true,
      bloqueado: true,
      codigo: 'SUP-9',
      codigo_ativacao: 'ATV-9',
      tipo: 'PJ',
      cpf: '',
      cnpj: '12.345.678/0001-99',
      nome: '',
      nome_fantasia: 'Supervisor PJ',
      id_filial: { id: '4', label: 'Filial Sul' },
      id_canal_distribuicao: { id: '5', label: 'Marketplace' },
      email: 'supervisor@example.com',
      telefone: '(11) 3333-4444',
      celular: '(11) 99999-8888',
    })

    expect(payload).toEqual({
      id: '9',
      ativo: true,
      bloqueado: true,
      codigo: 'SUP-9',
      codigo_ativacao: 'ATV-9',
      tipo: 'PJ',
      cnpj_cpf: '12345678000199',
      nome: 'Supervisor PJ',
      id_filial: '4',
      id_canal_distribuicao: '5',
      email: 'supervisor@example.com',
      ddd: '11',
      telefone: '33334444',
      ddd_celular: '11',
      celular: '999998888',
    })
  })
})
