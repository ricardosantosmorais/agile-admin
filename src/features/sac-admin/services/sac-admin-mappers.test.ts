import { describe, expect, it } from 'vitest'
import {
  getSacAdminPermissions,
  getSacStatusInfo,
  normalizeSacAreas,
  normalizeSacAreaResponsibles,
  normalizeSacModuleConfig,
  normalizeSacLookupOptions,
  normalizeSacSubjects,
  normalizeSacDashboard,
  normalizeSacTicketDetail,
  normalizeSacTicketListResponse,
} from '@/src/features/sac-admin/services/sac-admin-mappers'
import type { AuthSession } from '@/src/features/auth/types/auth'

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
          assuntos: [{ label: 'Pedido', total: '2' }],
          responsaveis: [{ label: 'Maria', total: '1' }],
          fechamentos: [{ label: 'Resolvido pelo cliente', total: '5' }],
          idade_backlog: [{ label: '8+ dias', total: '6' }],
        },
        rankings: {
          clientes: [{ id: 'cliente-1', nome: 'Cliente Alfa', total: '7' }],
          atuacao: [{ id: '10', protocolo: 'SAC-10', titulo: 'Atraso', area: 'Logistica', ultima_interacao_em: '2026-05-07 08:00:00' }],
        },
      },
    })

    expect(dashboard.period.start).toBe('2026-05-01')
    expect(dashboard.summary.opened).toBe(12)
    expect(dashboard.summary.firstResponseSlaPercent).toBe(91.4)
    expect(dashboard.charts.evolution).toEqual([{ date: '2026-05-07', label: '07/05', opened: 3, closed: 1 }])
    expect(dashboard.charts.subjects).toEqual([{ label: 'Pedido', total: 2 }])
    expect(dashboard.charts.responsibles).toEqual([{ label: 'Maria', total: 1 }])
    expect(dashboard.charts.closings).toEqual([{ label: 'Resolvido pelo cliente', total: 5 }])
    expect(dashboard.charts.backlogAge).toEqual([{ label: '8+ dias', total: 6 }])
    expect(dashboard.rankings.customers[0]).toMatchObject({ id: 'cliente-1', name: 'Cliente Alfa', total: 7 })
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

  it('normalizes lookup options from SAC areas, subjects and users payloads', () => {
    expect(normalizeSacLookupOptions({ data: [{ id: 1, nome: 'Financeiro', ativo: 1 }, { id: 2, nome: '', ativo: 1 }] })).toEqual([
      { id: '1', name: 'Financeiro', active: true },
    ])
  })

  it('normalizes SAC configuration entities for the admin settings surface', () => {
    expect(normalizeSacModuleConfig({
      data: {
        ativo: 1,
        contratado: true,
        emails_permitidos_texto: 'sac@empresa.com',
        fechamento_automatico_dias: '10',
        prazo_reabertura_dias: 3,
      },
    })).toEqual({
      active: true,
      contracted: true,
      allowedEmails: 'sac@empresa.com',
      autoCloseDays: 10,
      reopenDays: 3,
    })

    expect(normalizeSacAreas({ data: [{ id: 'a1', nome: 'Atendimento', ativo: 1, mostrar_nome_responsavel_cliente: 0, sla_horas: '24', total_chamados: '2' }] })[0]).toMatchObject({
      id: 'a1',
      name: 'Atendimento',
      active: true,
      showResponsibleName: false,
      slaHours: 24,
      totalTickets: 2,
    })

    expect(normalizeSacSubjects({ data: [{ id: 's1', id_sac_area: 'a1', nome: 'Pedido', permite_vinculo_pedido: 1, obriga_pedido: 0, ativo: 1, total_chamados: 0 }] })[0]).toMatchObject({
      id: 's1',
      areaId: 'a1',
      name: 'Pedido',
      allowOrderLink: true,
      requireOrder: false,
      active: true,
    })

    expect(normalizeSacAreaResponsibles({ data: [{ id: 'r1', id_sac_area: 'a1', id_usuario: 'u1', usuario_nome: 'Maria', usuario_email: 'maria@empresa.com', ativo: 1 }] })[0]).toMatchObject({
      id: 'r1',
      areaId: 'a1',
      userId: 'u1',
      userName: 'Maria',
      userEmail: 'maria@empresa.com',
      active: true,
    })
  })

  it('keeps SAC action permissions aligned with the legacy permission codes', () => {
    const session = {
      token: 'token',
      currentTenant: { id: 'empresa-1', nome: 'Empresa', codigo: '1', status: 'ativo' },
      tenants: [],
      user: {
        id: 'u1',
        nome: 'User',
        email: 'user@test.local',
        cargo: '',
        avatarFallback: 'U',
        ultimoAcesso: '',
        master: false,
        funcionalidades: [
          { id: 'sac', nome: 'SAC', chave: 'SAC', slug: 'sac', componente: 'sac-chamados', ativo: true },
          { id: 'list-all', nome: 'Listar todos', chave: 'SAC_FUNC_LISTAR_TODOS', slug: 'SAC_FUNC_LISTAR_TODOS', componente: 'sac-chamados', ativo: true, idFuncionalidadePai: 'sac' },
          { id: 'note', nome: 'Nota interna', chave: 'SAC_FUNC_NOTA_INTERNA', slug: 'SAC_FUNC_NOTA_INTERNA', componente: 'sac-chamados', ativo: true, idFuncionalidadePai: 'sac' },
          { id: 'assign', nome: 'Atribuir responsável', chave: 'SAC_FUNC_ATRIBUIR_RESPONSAVEL', slug: 'SAC_FUNC_ATRIBUIR_RESPONSAVEL', componente: 'sac-chamados', ativo: true, idFuncionalidadePai: 'sac' },
          { id: 'transfer', nome: 'Transferir', chave: 'SAC_FUNC_TRANSFERIR', slug: 'SAC_FUNC_TRANSFERIR', componente: 'sac-chamados', ativo: true, idFuncionalidadePai: 'sac' },
        ],
      },
    } satisfies AuthSession

    expect(getSacAdminPermissions(session)).toMatchObject({
      canListAll: true,
      canAddInternalNote: true,
      canAssign: true,
      canTransfer: true,
      canRespond: false,
    })
  })
})
