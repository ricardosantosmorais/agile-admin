import { describe, expect, it } from 'vitest'
import { FORNECEDORES_CONFIG } from '@/src/features/fornecedores/services/fornecedores-config'

describe('fornecedores config', () => {
  it('normalizes supplier document and phone fields for edit mode', () => {
    const record = FORNECEDORES_CONFIG.normalizeRecord?.({
      cnpj_cpf: '01125797000701',
      nome_fantasia: 'Fornecedor XPTO',
      razao_social: 'Fornecedor XPTO LTDA',
      ddd1: '11',
      telefone1: '33334444',
      ddd2: '11',
      telefone2: '44445555',
      ddd_celular: '11',
      celular: '912345678',
      cep: '02190005',
    })

    expect(record).toMatchObject({
      tipo: 'PJ',
      cnpj: '01.125.797/0007-01',
      telefone1: '(11) 3333-4444',
      telefone2: '(11) 4444-5555',
      celular: '(11) 91234-5678',
      cep: '02190-005',
    })
  })

  it('serializes supplier payloads back to the legacy write contract', () => {
    const payload = FORNECEDORES_CONFIG.beforeSave?.({
      tipo: 'PF',
      cpf: '123.456.789-09',
      nome: 'Fornecedor PF',
      nome_fantasia: '',
      email: 'fornecedor@example.com',
      telefone1: '(11) 3333-4444',
      telefone2: '(11) 4444-5555',
      celular: '(11) 91234-5678',
      cep: '02190-005',
    })

    expect(payload).toMatchObject({
      cnpj_cpf: '12345678909',
      nome_fantasia: 'Fornecedor PF',
      ddd1: '11',
      telefone1: '33334444',
      ddd2: '11',
      telefone2: '44445555',
      ddd_celular: '11',
      celular: '912345678',
      cep: '02190005',
    })
  })
})
