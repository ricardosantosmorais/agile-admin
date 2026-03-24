import { describe, expect, it } from 'vitest'
import { AREAS_ATUACAO_CONFIG } from '@/src/features/areas-atuacao/services/areas-atuacao-config'
import { PRACAS_CONFIG } from '@/src/features/pracas/services/pracas-config'
import { ROTAS_CONFIG } from '@/src/features/rotas/services/rotas-config'
import { TRANSPORTADORAS_CONFIG } from '@/src/features/transportadoras/services/transportadoras-config'

describe('logistica configs', () => {
  it('maps transportadora PF helper fields into API payload', () => {
    const payload = TRANSPORTADORAS_CONFIG.beforeSave?.({
      tipo: 'PF',
      cpf: '123.456.789-09',
      nome: 'Transportadora PF',
      telefone1: '(11) 3456-7890',
      celular: '(11) 91234-5678',
      cep: '60123-456',
    })

    expect(payload).toMatchObject({
      cnpj_cpf: '12345678909',
      nome_fantasia: 'Transportadora PF',
      razao_social: '',
      pessoa_contato: '',
      ddd1: '11',
      telefone1: '34567890',
      ddd_celular: '11',
      celular: '912345678',
      cep: '60123456',
    })
  })

  it('normalizes area de atuacao CEPs and nullable lookup payload', () => {
    const payload = AREAS_ATUACAO_CONFIG.beforeSave?.({
      id_praca: '',
      codigo: '',
      cep_de: '60000-000',
      cep_ate: '60199-999',
    })

    expect(payload).toMatchObject({
      id_praca: null,
      codigo: null,
      cep_de: '60000000',
      cep_ate: '60199999',
    })
  })

  it('normalizes praca monetary fields and lookup payloads', () => {
    const payload = PRACAS_CONFIG.beforeSave?.({
      id_rota: '10',
      id_tabela_preco: '',
      pedido_minimo: '1.234,56',
      peso_minimo: '12,345',
      cep_de: '60000-000',
    })

    expect(payload).toMatchObject({
      id_rota: '10',
      id_tabela_preco: null,
      pedido_minimo: 1234.56,
      peso_minimo: 12.345,
      cep_de: '60000000',
    })
  })

  it('keeps decimal peso_minimo values readable in praca normalization', () => {
    const record = PRACAS_CONFIG.normalizeRecord?.({
      peso_minimo: 34.34,
    })

    expect(record).toMatchObject({
      peso_minimo: '34,340',
    })
  })

  it('enables all delivery days by default on rotas form', () => {
    const defaults = Object.fromEntries(
      ROTAS_CONFIG.sections
        .flatMap((section) => section.fields)
        .filter((field) => ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'].includes(field.key))
        .map((field) => [field.key, field.defaultValue]),
    )

    expect(defaults).toEqual({
      seg: true,
      ter: true,
      qua: true,
      qui: true,
      sex: true,
      sab: true,
      dom: true,
    })
  })

  it('serializes rota limits and booleans correctly', () => {
    const payload = ROTAS_CONFIG.beforeSave?.({
      codigo: '',
      horario_corte: '',
      limite_peso: '1,250',
      seg: 1,
      dom: '',
    })

    expect(payload).toMatchObject({
      codigo: null,
      horario_corte: null,
      limite_peso: 1.25,
      seg: true,
      dom: false,
    })
  })
})
