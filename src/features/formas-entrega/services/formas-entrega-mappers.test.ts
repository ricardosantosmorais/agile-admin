import { describe, expect, it } from 'vitest'
import {
  buildFormaEntregaLocalidadePayload,
  createFormaEntregaDataPayload,
  createEmptyFormaEntregaRegraDraft,
  mapFormaEntregaRegraToDraft,
  normalizeFormaEntregaRecord,
  serializeFormaEntregaRecord,
  serializeFormaEntregaRegraDraft,
} from '@/src/features/formas-entrega/services/formas-entrega-mappers'

describe('formas-entrega mappers', () => {
  it('normalizes transport restrictions and related lookups for the form', () => {
    const record = normalizeFormaEntregaRecord({
      restrito_transporte: 'S,R',
      desconto: 12.5,
      acrescimo: '8.4',
      frete_gratis: '99.9',
      data_inicio: '2026-03-24 00:00:00',
      filial: { id: '1', nome_fantasia: 'Matriz' },
      tabela_preco: { id: '2', nome: 'Tabela A' },
    })

    expect(record.restrito_transporte_inflamavel).toBe(true)
    expect(record.restrito_transporte_resfriado).toBe(true)
    expect(record.restrito_transporte_transportadora).toBe(false)
    expect(record.data_inicio).toBe('2026-03-24')
    expect(record.id_filial_lookup).toEqual({ id: '1', label: 'Matriz' })
    expect(record.id_tabela_preco_lookup).toEqual({ id: '2', label: 'Tabela A' })
  })

  it('serializes the main record to the API payload', () => {
    const payload = serializeFormaEntregaRecord({
      nome: 'Entrega teste',
      tipo: 'retira',
      perfil: 'cliente',
      posicao: 7,
      prioridade: 2,
      desconto: '12,50',
      acrescimo: '8,40',
      frete_gratis: '99,90',
      data_inicio: '2026-03-24',
      data_fim: '2026-03-30',
      agendamento_horario_corte: '18:15',
      restrito_transporte_inflamavel: true,
      restrito_transporte_resfriado: false,
      restrito_transporte_transportadora: true,
    })

    expect(payload.restrito_transporte).toBe('S,T')
    expect(payload.desconto).toBe(12.5)
    expect(payload.acrescimo).toBe(8.4)
    expect(payload.frete_gratis).toBe(99.9)
    expect(payload.data_inicio).toBe('2026-03-24 00:00:00')
    expect(payload.data_fim).toBe('2026-03-30 23:59:59')
    expect(payload.agendamento_horario_corte).toBe('18:15:00')
  })

  it('serializes rule payloads and prioritizes the deepest locality level', () => {
    const draft = {
      ...createEmptyFormaEntregaRegraDraft(),
      nome: 'Regra local',
      tipo: 'local' as const,
      perimetro_maximo: '234',
      maximo_produtos: '12',
      valor: '15,90',
      ad_valorem: '1,20',
      kg_adicional: '3,40',
      localidades: {
        estados: ['CE'],
        cidades: ['2304400'],
        bairros: ['123'],
      },
    }

    const regraPayload = serializeFormaEntregaRegraDraft(draft, 'forma-1')
    const localidadePayload = buildFormaEntregaLocalidadePayload('regra-1', draft.localidades, {
      cidades: [{ id_cidade: '2304400', uf: 'CE' }],
      bairros: [{ id_bairro: '123', id_cidade: '2304400' }],
    })

    expect(regraPayload).toMatchObject({
      id_forma_entrega: 'forma-1',
      nome: 'Regra local',
      tipo: 'local',
      perimetro_maximo: 234,
      maximo_produtos: 12,
      valor: 15.9,
      ad_valorem: 1.2,
      kg_adicional: 3.4,
    })
    expect(localidadePayload).toEqual([
      {
        id_forma_entrega_regra: 'regra-1',
        id_uf: 'CE',
        id_cidade: '2304400',
        id_bairro: '123',
      },
    ])
  })

  it('rehydrates parent locality selections when editing a bairro-based rule', () => {
    const draft = mapFormaEntregaRegraToDraft({
      id: 'regra-1',
      tipo: 'local',
      nome: 'Regra local',
      ceps: [
        {
          id: 'cep-1',
          id_bairro: '123',
          cidade: { id_cidade: '2304400', cidade: 'Fortaleza', uf: 'CE' },
          bairro: { id_bairro: '123', bairro: 'Centro', id_cidade: '2304400' },
        },
      ],
    })

    expect(draft.localidades).toEqual({
      estados: ['CE'],
      cidades: ['2304400'],
      bairros: ['123'],
    })
  })

  it('serializes exceptional dates for create and edit flows', () => {
    expect(createFormaEntregaDataPayload('forma-1', {
      data: '2026-12-24',
      descricao: 'Natal',
      restricao: true,
    })).toEqual({
      id: null,
      id_forma_entrega: 'forma-1',
      data: '2026-12-24 00:00:00',
      descricao: 'Natal',
      restricao: true,
    })

    expect(createFormaEntregaDataPayload('forma-1', {
      id: 'data-1',
      data: '2026-12-31',
      descricao: 'Virada',
      restricao: false,
    })).toEqual({
      id: 'data-1',
      id_forma_entrega: 'forma-1',
      data: '2026-12-31 00:00:00',
      descricao: 'Virada',
      restricao: false,
    })
  })
})
