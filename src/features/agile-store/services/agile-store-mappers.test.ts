import { describe, expect, it } from 'vitest'
import {
  canRunAgileStoreAction,
  getAgileStoreActionStatus,
  getAgileStoreStatusInfo,
  normalizeAgileStoreDetail,
  normalizeAgileStoreListResponse,
} from '@/src/features/agile-store/services/agile-store-mappers'

describe('agile-store mappers', () => {
  it('normalizes legacy list payload with summary and filters', () => {
    const response = normalizeAgileStoreListResponse({
      data: [{
        id: 'mod_sac',
        nome: 'SAC',
        tipo: 'Atendimento',
        resumo: 'Central de atendimento',
        preco: '149.90',
        moeda: 'BRL',
        ciclo_cobranca: 'mensal',
        cor_primaria: '#2f5bea',
        icone: 'far fa-headset',
        imagem_capa_url: 'https://cdn.test/sac.png',
        metadata: { beneficios: ['Chamados', 'Dashboard'] },
        teste_gratis: { disponivel: true, dias: 15 },
        contratacao: { status: 'cancelado' },
      }],
      meta: {
        page: 2,
        perpage: 12,
        total: 1,
        pages: 1,
        summary: {
          total_modulos: 4,
          total_contratados: 1,
        },
      },
      filters: {
        tipos: ['Atendimento'],
      },
    })

    expect(response.items).toHaveLength(1)
    expect(response.items[0]).toMatchObject({
      id: 'mod_sac',
      name: 'SAC',
      type: 'Atendimento',
      price: 149.9,
      billingCycle: 'mensal',
      primaryColor: '#2f5bea',
      coverImageUrl: 'https://cdn.test/sac.png',
      benefits: ['Chamados', 'Dashboard'],
      trial: { available: true, days: 15 },
      contractStatus: 'cancelado',
    })
    expect(response.summary).toEqual({ totalModules: 4, activeContracts: 1 })
    expect(response.filters.types).toEqual(['Atendimento'])
    expect(response.meta).toEqual({ page: 2, perPage: 12, total: 1, pages: 1 })
  })

  it('uses action policy to block actions before permission checks', () => {
    const module = normalizeAgileStoreDetail({
      id: 'mod_sac',
      nome: 'SAC',
      contratacao: { status: 'cancelado' },
      acoes: {
        contratar: {
          permitido: false,
          message: 'Disponivel apenas para empresas operando.',
        },
      },
    })

    expect(canRunAgileStoreAction(module, 'contract', { canContract: true, canCancel: true })).toBe(false)
    expect(getAgileStoreActionStatus(module, 'contract', { canContract: true, canCancel: true })).toEqual({
      enabled: false,
      message: 'Disponivel apenas para empresas operando.',
    })
  })

  it('maps statuses and retry availability like the legacy detail', () => {
    const failed = normalizeAgileStoreDetail({
      id: 'mod_sac',
      nome: 'SAC',
      contratacao: { status: 'falha_ativacao' },
    })

    expect(getAgileStoreStatusInfo(failed.contractStatus)).toMatchObject({
      label: 'Falha na ativacao',
      tone: 'danger',
    })
    expect(canRunAgileStoreAction(failed, 'retry', { canContract: true, canCancel: true })).toBe(true)
    expect(canRunAgileStoreAction(failed, 'retry', { canContract: true, canCancel: false })).toBe(false)
  })
})
