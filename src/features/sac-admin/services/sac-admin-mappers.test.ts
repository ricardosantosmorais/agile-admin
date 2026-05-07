import { describe, expect, it } from 'vitest'
import {
  getSacStatusInfo,
  normalizeSacDashboard,
  normalizeSacTicketDetail,
  normalizeSacTicketListResponse,
} from '@/src/features/sac-admin/services/sac-admin-mappers'

describe('sac-admin mappers', () => {
  it('normalizes the dashboard summary and chart series from api v3', () => {
    const dashboard = normalizeSacDashboard({
      data: {
        periodo: { data_inicial: '2026-05-01', data_final: '2026-05-07' },
        resumo: {
          abertos_periodo: '12',
          fechados_periodo: 5,
          backlog_atual: 9,
          pendentes_atuacao: 4,
          sla_primeira_resposta_percentual: '91.4',
          sla_resolucao_percentual: 80,
          tempo_primeira_resposta_minutos: '32.5',
          tempo_resolucao_horas: '7.25',
          reaberturas_periodo: 2,
        },
        graficos: {
          evolucao: [{ data: '2026-05-07', label: '07/05', abertos: '3', fechados: 1 }],
          status: [{ label: 'novo', total: '4' }],
          areas: [{ label: 'Financeiro', total: 3 }],
        },
        rankings: {
          atuacao: [{ id: '10', protocolo: 'SAC-10', titulo: 'Atraso', area: 'Logistica', ultima_interacao_em: '2026-05-07 08:00:00' }],
        },
      },
    })

    expect(dashboard.period.start).toBe('2026-05-01')
    expect(dashboard.summary.opened).toBe(12)
    expect(dashboard.summary.firstResponseSlaPercent).toBe(91.4)
    expect(dashboard.charts.evolution).toEqual([{ date: '2026-05-07', label: '07/05', opened: 3, closed: 1 }])
    expect(dashboard.rankings.pending[0]).toMatchObject({ id: '10', protocol: 'SAC-10', areaName: 'Logistica' })
  })

  it('normalizes ticket list rows and pagination metadata', () => {
    const list = normalizeSacTicketListResponse({
      meta: { page: '2', perpage: '15', total: '31' },
      data: [{
        id: 42,
        protocolo: 'SAC-42',
        titulo: 'Pedido com atraso',
        status: 'em_atendimento',
        cliente_nome: 'Cliente Alfa',
        area_nome: 'Atendimento',
        assunto_nome: 'Pedido',
        pedido: '1001',
        responsavel_nome: 'Maria',
        ultima_interacao_em: '2026-05-07 10:20:00',
        created_at: '2026-05-06 09:00:00',
      }],
    })

    expect(list.meta).toEqual({ page: 2, perPage: 15, total: 31, pages: 3 })
    expect(list.items[0]).toMatchObject({
      id: '42',
      protocol: 'SAC-42',
      title: 'Pedido com atraso',
      status: 'em_atendimento',
      customerName: 'Cliente Alfa',
      areaName: 'Atendimento',
      subjectName: 'Pedido',
      orderCode: '1001',
      assigneeName: 'Maria',
    })
  })

  it('normalizes ticket detail timeline, items and attachments', () => {
    const detail = normalizeSacTicketDetail({
      data: {
        chamado: { id: '42', protocolo: 'SAC-42', status: 'novo', titulo: 'Dúvida', cliente_nome: 'Cliente Alfa', updated_at: '2026-05-07 10:00:00' },
        mensagens: [{ id: 'm1', autor_tipo: 'cliente', autor_nome: 'Cliente Alfa', mensagem: 'Preciso de ajuda', created_at: '2026-05-07 09:00:00', anexos: [{ id: 'a1', nome_arquivo_original: 'nota.pdf', arquivo_url: 'https://files/nota.pdf' }] }],
        eventos: [{ id: 'e1', tipo_evento: 'mudanca_status', descricao: 'Status alterado', created_at: '2026-05-07 09:30:00' }],
        itens: [{ id: 'i1', sku: 'SKU-1', nome_produto: 'Produto 1', quantidade: '2' }],
        anexos: [{ id: 'a2', nome_arquivo_original: 'foto.png', arquivo_url: 'https://files/foto.png' }],
      },
    })

    expect(detail.ticket.protocol).toBe('SAC-42')
    expect(detail.messages[0]).toMatchObject({ id: 'm1', authorType: 'cliente', message: 'Preciso de ajuda' })
    expect(detail.messages[0].attachments[0]).toMatchObject({ id: 'a1', name: 'nota.pdf' })
    expect(detail.events[0]).toMatchObject({ id: 'e1', description: 'Status alterado' })
    expect(detail.items[0]).toMatchObject({ id: 'i1', sku: 'SKU-1', productName: 'Produto 1', quantity: 2 })
    expect(detail.attachments[0]).toMatchObject({ id: 'a2', name: 'foto.png' })
  })

  it('keeps the legacy SAC status vocabulary visible in v2', () => {
    expect(getSacStatusInfo('pendentes_atuacao')).toEqual({ label: 'Pendentes de atuação', tone: 'warning' })
    expect(getSacStatusInfo('resolvido_cliente')).toEqual({ label: 'Resolvido pelo cliente', tone: 'success' })
    expect(getSacStatusInfo('desconhecido')).toEqual({ label: 'Desconhecido', tone: 'muted' })
  })
})
