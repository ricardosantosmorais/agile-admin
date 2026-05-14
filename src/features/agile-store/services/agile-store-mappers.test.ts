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

  it('normalizes enveloped detail payload from the API bridge', () => {
    const module = normalizeAgileStoreDetail({
      data: {
        id: 'mod_sac',
        nome: 'SAC',
        tipo: 'Atendimento',
        resumo: 'Centralize chamados e SLA.',
        preco: '490.00',
        moeda: 'BRL',
        ciclo_cobranca: 'mensal',
        metadata: {
          beneficios: ['Fallback'],
          beneficios_detalhe: ['Chamados organizados'],
        },
        teste_gratis: { disponivel: true, dias: 15 },
        contratacao: { status: 'cancelado' },
        midias: [
          {
            tipo: 'video',
            url: 'https://cdn.test/sac.mp4',
            titulo: 'Demonstração',
            poster_url: 'https://cdn.test/sac-poster.png',
          },
        ],
        historico: [
          {
            id: 'hist-1',
            acao: 'contratar',
            status: 'falha',
            created_at: '2026-05-07 10:00:00',
            message: 'Falha ao executar script.',
            usuario: 'Joao',
            ip: '127.0.0.1',
            valor: '490.00',
            moeda: 'BRL',
            teste_gratis_ate: '2026-05-22',
            erro: 'Erro de integração',
            feedback_motivo: 'Melhorar operação',
            feedback_mensagem: 'Comentário de contratação.',
          },
        ],
      },
    } as unknown as Parameters<typeof normalizeAgileStoreDetail>[0])

    expect(module).toMatchObject({
      id: 'mod_sac',
      name: 'SAC',
      type: 'Atendimento',
      summary: 'Centralize chamados e SLA.',
      price: 490,
      billingCycle: 'mensal',
      benefits: ['Chamados organizados'],
      trial: { available: true, days: 15 },
      contractStatus: 'cancelado',
    })
    expect(module.media[0]).toMatchObject({
      posterUrl: 'https://cdn.test/sac-poster.png',
    })
    expect(module.history[0]).toMatchObject({
      userName: 'Joao',
      ip: '127.0.0.1',
      value: 490,
      trialUntil: '2026-05-22',
      error: 'Erro de integração',
      feedbackMotive: 'Melhorar operação',
      feedbackMessage: 'Comentário de contratação.',
    })
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
