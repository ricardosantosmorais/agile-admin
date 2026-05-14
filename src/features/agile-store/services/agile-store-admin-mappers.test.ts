import { describe, expect, it } from 'vitest'
import { normalizeAgileStoreAdminDashboard } from '@/src/features/agile-store/services/agile-store-admin-mappers'

describe('agile store admin mappers', () => {
  it('normalizes dashboard metrics, modules, visits and customer billing rows', () => {
    const result = normalizeAgileStoreAdminDashboard({
      data: {
        periodo: { escopo: 'periodo', inicio: '2026-05-01', fim: '2026-05-07', granularidade: 'dia' },
        summary: {
          modulos: '2',
          visitas: '120',
          empresas_visitantes: '45',
          contratacoes_periodo: '12',
          descontratacoes_periodo: '3',
          contratos_ativos: '20',
          gratuitos_ativos: '4',
          falhas: '1',
          mrr: '1990.5',
        },
        module_options: [{ id: 'mod_sac', nome: 'SAC' }],
        modules: [{
          id: 'mod_sac',
          nome: 'SAC',
          tipo: 'Atendimento',
          status: 'publicado',
          destaque: 1,
          icone: 'far fa-headset',
          cor_primaria: '#39aba4',
          visitas: '80',
          contratacoes_periodo: '10',
          descontratacoes_periodo: '2',
          contratos_ativos: '15',
          gratuitos_ativos: '3',
          falhas: '1',
          mrr: '1490.5',
          conversao: '13',
          crescimento: '8',
        }],
        trend: [{ label: '07/05', visitas: '9', conversoes: '2', cancelamentos: '1' }],
        visits: [{
          id: 'visit-1',
          id_empresa: 'empresa-1',
          empresa_nome: 'Cliente Alfa',
          modulo_nome: 'SAC',
          usuario: 'Maria',
          email_usuario: 'maria@empresa.com',
          visitado_em: '2026-05-07 09:00:00',
          ip: '127.0.0.1',
          convertido: 1,
          cancelado: 0,
          status_conversao: 'convertido',
        }],
        customers: [{
          id: 'contract-1',
          id_empresa: 'empresa-1',
          empresa_nome: 'Cliente Alfa',
          empresa_cnpj: '00.000.000/0001-00',
          modulo_nome: 'SAC',
          modulo_tipo: 'Atendimento',
          status: 'ativo',
          valor_contratado: '149.9',
          moeda: 'BRL',
          ciclo_cobranca: 'mensal',
          teste_gratis_dias: '15',
          teste_gratis_ate: '2026-05-20',
          primeira_cobranca_em: '2026-06-01',
          dia_faturamento: '1',
          faturamento_status: 'pendente',
          faturamento_status_efetivo: 'pendente',
          contratado_em: '2026-05-07 10:00:00',
          contratado_por: 'Joao',
          feedback_motivo: 'Melhorar operação',
          feedback_mensagem: 'Solicitação interna.',
        }],
        events: [{
          id: 'event-1',
          acao: 'contratar',
          modulo_nome: 'SAC',
          empresa_nome: 'Cliente Alfa',
          usuario: 'Joao',
          created_at: '2026-05-07 10:00:00',
          ip: '127.0.0.1',
          feedback_motivo: 'Melhorar operação',
          feedback_mensagem: 'Solicitação interna.',
        }],
      },
    })

    expect(result.summary).toEqual(expect.objectContaining({
      modules: 2,
      visits: 120,
      activeContracts: 20,
      freeContracts: 4,
      mrr: 1990.5,
    }))
    expect(result.modules[0]).toEqual(expect.objectContaining({
      id: 'mod_sac',
      name: 'SAC',
      visits: 80,
      conversion: 13,
      growth: 8,
    }))
    expect(result.customers[0]).toEqual(expect.objectContaining({
      id: 'contract-1',
      companyName: 'Cliente Alfa',
      billingStatus: 'pendente',
      expectedBillingStatus: 'faturado',
      canCancelContract: true,
      feedbackMotive: 'Melhorar operação',
      feedbackMessage: 'Solicitação interna.',
    }))
    expect(result.events[0]).toEqual(expect.objectContaining({
      feedbackMotive: 'Melhorar operação',
      feedbackMessage: 'Solicitação interna.',
    }))
    expect(result.visits[0]).toEqual(expect.objectContaining({
      companyName: 'Cliente Alfa',
      conversionStatus: 'convertido',
    }))
  })
})
