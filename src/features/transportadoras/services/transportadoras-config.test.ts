import { describe, expect, it } from 'vitest'
import { TRANSPORTADORAS_CONFIG } from '@/src/features/transportadoras/services/transportadoras-config'

describe('transportadoras config', () => {
  it('normalizes pessoa de contato and masked fields for editing', () => {
    const record = TRANSPORTADORAS_CONFIG.normalizeRecord?.({
      cnpj_cpf: '01125797000701',
      nome_fantasia: 'ATIVA DISTRIBUICAO E LOGISTICA LTDA',
      razao_social: 'ATIVA DISTRIBUICAO E LOGISTICA LTDA',
      pessoa_contato: 'Equipe operacional',
      ddd1: '11',
      telefone1: '33334444',
      ddd_celular: '11',
      celular: '912345678',
      cep: '02190005',
    })

    expect(record).toMatchObject({
      tipo: 'PJ',
      cnpj: '01.125.797/0007-01',
      pessoa_contato: 'Equipe operacional',
      telefone1: '(11) 3333-4444',
      celular: '(11) 91234-5678',
      cep: '02190-005',
    })
  })

  it('serializes pj payload including contact person and normalized zip code', () => {
    const payload = TRANSPORTADORAS_CONFIG.beforeSave?.({
      tipo: 'PJ',
      cnpj: '01.125.797/0007-01',
      nome_fantasia: 'ATIVA DISTRIBUICAO E LOGISTICA LTDA',
      razao_social: 'ATIVA DISTRIBUICAO E LOGISTICA LTDA',
      pessoa_contato: 'eu',
      email: 'transportadora@example.com',
      telefone1: '(11) 3333-4444',
      telefone2: '(11) 4444-5555',
      celular: '(11) 91234-5678',
      cep: '02190-005',
      bairro: 'PARQUE NOVO MUNDO',
      cidade: 'SAO PAULO',
      uf: 'sp',
    })

    expect(payload).toMatchObject({
      cnpj_cpf: '01125797000701',
      nome_fantasia: 'ATIVA DISTRIBUICAO E LOGISTICA LTDA',
      razao_social: 'ATIVA DISTRIBUICAO E LOGISTICA LTDA',
      pessoa_contato: 'eu',
      email: 'transportadora@example.com',
      ddd1: '11',
      telefone1: '33334444',
      ddd2: '11',
      telefone2: '44445555',
      ddd_celular: '11',
      celular: '912345678',
      cep: '02190005',
      bairro: 'PARQUE NOVO MUNDO',
      cidade: 'SAO PAULO',
      uf: 'SP',
    })
    expect(payload?.tipo).toBeUndefined()
    expect(payload?.cnpj).toBeUndefined()
  })

  it('validates zip code length before save', () => {
    const cepField = TRANSPORTADORAS_CONFIG.sections
      .flatMap((section) => section.fields)
      .find((field) => field.key === 'cep')

    expect(cepField?.validate?.({ value: '02190-05', form: {}, isEditing: false })).toBe('common.validZipCode')
    expect(cepField?.validate?.({ value: '02190-005', form: {}, isEditing: false })).toBeNull()
  })
})
