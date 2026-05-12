import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SacAdminPage } from '@/src/features/sac-admin/components/sac-admin-page'

const {
  actionMock,
  areaResponsiblesMock,
  dashboardMock,
  detailMock,
  areasMock,
  listMock,
  moduleConfigMock,
  respondMock,
  saveAreaMock,
  saveAreaResponsibleMock,
  saveConfigMock,
  saveSubjectMock,
  subjectsMock,
  tMock,
  usersMock,
} = vi.hoisted(() => ({
  actionMock: vi.fn(),
  areaResponsiblesMock: vi.fn(),
  dashboardMock: vi.fn(),
  detailMock: vi.fn(),
  areasMock: vi.fn(),
  listMock: vi.fn(),
  moduleConfigMock: vi.fn(),
  respondMock: vi.fn(),
  saveAreaMock: vi.fn(),
  saveAreaResponsibleMock: vi.fn(),
  saveConfigMock: vi.fn(),
  saveSubjectMock: vi.fn(),
  subjectsMock: vi.fn(),
  tMock: vi.fn((_key: string, fallback?: string) => fallback ?? _key),
  usersMock: vi.fn(),
}))

vi.mock('@/src/features/sac-admin/services/sac-admin-client', () => ({
  sacAdminClient: {
    action: actionMock,
    areaResponsibles: areaResponsiblesMock,
    areas: areasMock,
    dashboard: dashboardMock,
    detail: detailMock,
    list: listMock,
    moduleConfig: moduleConfigMock,
    respond: respondMock,
    saveArea: saveAreaMock,
    saveAreaResponsible: saveAreaResponsibleMock,
    saveConfig: saveConfigMock,
    saveSubject: saveSubjectMock,
    subjects: subjectsMock,
    users: usersMock,
  },
}))

vi.mock('@/src/i18n/use-i18n', () => ({
  useI18n: () => ({ t: tMock }),
}))

vi.mock('@/src/features/auth/hooks/use-auth', () => ({
  useAuth: () => ({ session: null }),
}))

const dashboardFixture = {
  period: { start: '2026-05-01', end: '2026-05-07' },
  summary: {
    opened: 12,
    closed: 5,
    backlog: 9,
    pendingAction: 4,
    firstResponseMinutes: 32,
    resolutionHours: 7,
    firstResponseSlaPercent: 91,
    resolutionSlaPercent: 80,
    reopened: 2,
    closedByCustomer: 3,
    closedByInactivity: 2,
  },
  charts: {
    evolution: [{ date: '2026-05-07', label: '07/05', opened: 4, closed: 2 }],
    status: [{ label: 'Em atendimento', total: 4 }],
    areas: [{ label: 'Atendimento', total: 8 }],
    subjects: [{ label: 'Pedido', total: 3 }],
    closings: [{ label: 'Resolvido pelo cliente', total: 5 }],
    backlogAge: [{ label: '8+ dias', total: 6 }],
    responsibles: [{ label: 'Maria', total: 2 }],
  },
  rankings: {
    customers: [{ id: 'cliente-1', name: 'Cliente Alfa', total: 7 }],
    pending: [{ id: '42', protocol: 'SAC-42', title: 'Pedido com atraso', areaName: 'Atendimento', lastInteractionAt: '2026-05-07 10:20:00' }],
  },
}

const ticketFixture = {
  id: '42',
  protocol: 'SAC-42',
  title: 'Pedido com atraso',
  status: 'em_atendimento',
  description: 'Cliente relatou atraso.',
  customerName: 'Cliente Alfa',
  customerDocument: '',
  areaName: 'Atendimento',
  subjectName: 'Pedido',
  orderCode: '1001',
  assigneeName: 'Maria',
  createdAt: '2026-05-06 09:00:00',
  updatedAt: '2026-05-07 10:00:00',
  lastInteractionAt: '2026-05-07 10:20:00',
  canReopen: false,
  reopenUntil: '',
}

const fullPermissions = {
  canViewDashboard: true,
  canList: true,
  canListAll: true,
  canView: true,
  canRespond: true,
  canAddInternalNote: true,
  canChangeStatus: true,
  canAssign: true,
  canTransfer: true,
  canConfigureModule: true,
  canConfigureAreas: true,
}

describe('SacAdminPage', () => {
  beforeEach(() => {
    actionMock.mockReset()
    areaResponsiblesMock.mockReset()
    areasMock.mockReset()
    dashboardMock.mockReset()
    detailMock.mockReset()
    listMock.mockReset()
    moduleConfigMock.mockReset()
    respondMock.mockReset()
    saveAreaMock.mockReset()
    saveAreaResponsibleMock.mockReset()
    saveConfigMock.mockReset()
    saveSubjectMock.mockReset()
    subjectsMock.mockReset()
    tMock.mockClear()
    usersMock.mockReset()
    areaResponsiblesMock.mockResolvedValue([{ id: 'resp-1', areaId: 'area-1', userId: 'user-1', userName: 'Maria', userEmail: 'maria@empresa.com', active: true }])
    areasMock.mockResolvedValue([{ id: 'area-1', name: 'Atendimento', active: true, showResponsibleName: true, slaHours: 24, totalTickets: 0 }])
    moduleConfigMock.mockResolvedValue({ active: true, contracted: true, allowedEmails: 'sac@empresa.com', autoCloseDays: 7, reopenDays: 3 })
    saveAreaMock.mockResolvedValue({ success: true })
    saveAreaResponsibleMock.mockResolvedValue({ success: true })
    saveConfigMock.mockResolvedValue({ success: true })
    saveSubjectMock.mockResolvedValue({ success: true })
    subjectsMock.mockResolvedValue([{ id: 'subject-1', areaId: 'area-1', name: 'Pedido', active: true, allowOrderLink: true, requireOrder: false, totalTickets: 0 }])
    usersMock.mockResolvedValue([{ id: 'user-1', name: 'Maria', active: true }])
    dashboardMock.mockResolvedValue(dashboardFixture)
    listMock.mockResolvedValue({
      items: [ticketFixture],
      meta: { page: 1, perPage: 15, total: 1, pages: 1 },
    })
    detailMock.mockResolvedValue({
      ticket: ticketFixture,
      messages: [{
        id: 'm1',
        authorType: 'cliente',
        authorName: 'Cliente Alfa',
        message: 'Preciso de ajuda',
        createdAt: '2026-05-07 09:00:00',
        attachments: [{ id: 'a1', name: 'foto-produto.png', url: 'https://arquivos.local/foto-produto.png' }],
      }],
      events: [],
      items: [],
      attachments: [],
    })
  })

  it('renders the SAC dashboard with the same analysis blocks exposed by legacy', async () => {
    render(<SacAdminPage view="dashboard" permissions={fullPermissions} />)

    expect(await screen.findByRole('heading', { name: 'Pulso do atendimento' })).toBeInTheDocument()
    expect(await screen.findByText('12')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Abertos x Fechados' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Status' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Fechamentos' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Volume por .*rea/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Volume por Assunto' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Pendentes Mais Antigos' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Backlog por Idade' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Top Clientes' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Respons/ })).toBeInTheDocument()
    expect(screen.getByTestId('sac-open-closed-line-chart')).toBeInTheDocument()
    expect(screen.getByTestId('sac-backlog-age-bar-chart')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Fila operacional' })).not.toBeInTheDocument()
    expect(listMock).not.toHaveBeenCalled()
  })

  it('shows the legacy contract warning when SAC is not contracted', async () => {
    moduleConfigMock.mockResolvedValue({ active: false, contracted: false, allowedEmails: '', autoCloseDays: 7, reopenDays: 3 })

    render(<SacAdminPage view="tickets" permissions={fullPermissions} />)

    expect(await screen.findByText('Atenção: O módulo SAC ainda não está contratado para sua loja.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Contratar na Agile Store/ })).toHaveAttribute('href', '/agile-store/mod_sac')
  })

  it('renders the SAC ticket list without dashboard cards', async () => {
    render(<SacAdminPage view="tickets" permissions={fullPermissions} />)

    expect(await screen.findByRole('heading', { name: 'Fila operacional' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filtros' })).toBeInTheDocument()
    expect(await screen.findAllByText('SAC-42')).toHaveLength(2)
    expect(screen.getAllByText('Pedido com atraso').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Cliente Alfa').length).toBeGreaterThan(0)
    expect(screen.queryByRole('heading', { name: 'Pulso do atendimento' })).not.toBeInTheDocument()
    expect(dashboardMock).not.toHaveBeenCalled()
  })

  it('applies the same SAC ticket filters used by legacy', async () => {
    render(<SacAdminPage view="tickets" permissions={fullPermissions} />)

    fireEvent.click(await screen.findByRole('button', { name: 'Filtros' }))

    fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: 'Cliente Alfa' } })
    fireEvent.change(screen.getByLabelText('Protocolo'), { target: { value: 'SAC-42' } })
    fireEvent.change(screen.getByLabelText('Abertura inicial'), { target: { value: '2026-05-01' } })
    fireEvent.change(screen.getByLabelText('Abertura final'), { target: { value: '2026-05-12' } })
    fireEvent.change(screen.getByLabelText('Área'), { target: { value: 'area-1' } })
    fireEvent.change(screen.getByLabelText('Assunto'), { target: { value: 'subject-1' } })
    fireEvent.change(screen.getByLabelText(/Respons/), { target: { value: 'user-1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))

    await waitFor(() => expect(listMock).toHaveBeenLastCalledWith(expect.objectContaining({
      status: 'pendentes_atuacao',
      cliente: 'Cliente Alfa',
      protocolo: 'SAC-42',
      data_inicial: '2026-05-01',
      data_final: '2026-05-12',
      id_sac_area: 'area-1',
      id_sac_assunto: 'subject-1',
      id_usuario_responsavel: 'user-1',
    })))
  })

  it('opens ticket detail and sends a customer response through the client', async () => {
    respondMock.mockResolvedValue({ success: true })
    render(<SacAdminPage view="tickets" permissions={fullPermissions} />)

    fireEvent.click(await screen.findByRole('button', { name: /abrir SAC-42/i }))
    expect(await screen.findByRole('heading', { name: 'SAC-42' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'foto-produto.png' })).toHaveAttribute('href', 'https://arquivos.local/foto-produto.png')

    const file = new File(['conteudo-pdf'], 'comprovante.pdf', { type: 'application/pdf' })
    fireEvent.change(screen.getByLabelText('Resposta ao cliente'), { target: { value: 'Resposta ao cliente' } })
    fireEvent.change(screen.getByLabelText('Anexos'), { target: { files: [file] } })
    expect(screen.getByText('1 arquivo(s) selecionado(s).')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Responder' }))

    await waitFor(() => expect(respondMock).toHaveBeenCalledWith('42', expect.objectContaining({
      mensagem: 'Resposta ao cliente',
      status: 'aguardando_cliente',
      updated_at: '2026-05-07 10:00:00',
    }), [file]))
  })

  it('hides response actions when the user cannot respond', async () => {
    render(<SacAdminPage view="tickets" permissions={{ ...fullPermissions, canRespond: false, canAddInternalNote: false, canChangeStatus: false }} />)

    fireEvent.click(await screen.findByRole('button', { name: /abrir SAC-42/i }))

    expect(await screen.findByRole('heading', { name: 'SAC-42' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Responder' })).not.toBeInTheDocument()
    expect(screen.getByText(/visualizar o chamado/)).toBeInTheDocument()
  })

  it('runs advanced SAC actions with the same updated_at guard used by legacy', async () => {
    actionMock.mockResolvedValue({ success: true })
    render(<SacAdminPage view="tickets" permissions={{ ...fullPermissions, canRespond: false }} />)

    fireEvent.click(await screen.findByRole('button', { name: /abrir SAC-42/i }))
    expect(await screen.findByRole('heading', { name: 'SAC-42' })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Nota interna'), { target: { value: 'Registro interno' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar nota' }))
    await waitFor(() => expect(actionMock).toHaveBeenCalledWith('42', 'internal-note', expect.objectContaining({
      mensagem: 'Registro interno',
      updated_at: '2026-05-07 10:00:00',
    })))

    fireEvent.change(screen.getByLabelText('Novo status'), { target: { value: 'solucao_proposta' } })
    fireEvent.change(screen.getByLabelText('Mensagem de status'), { target: { value: 'Proposta enviada' } })
    fireEvent.click(screen.getByRole('button', { name: 'Alterar status' }))
    await waitFor(() => expect(actionMock).toHaveBeenCalledWith('42', 'status', expect.objectContaining({
      status: 'solucao_proposta',
      mensagem: 'Proposta enviada',
      updated_at: '2026-05-07 10:00:00',
    })))

    fireEvent.change(screen.getByLabelText(/Respons/), { target: { value: 'user-1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Atribuir' }))
    await waitFor(() => expect(actionMock).toHaveBeenCalledWith('42', 'assign', expect.objectContaining({
      id_usuario_responsavel: 'user-1',
      updated_at: '2026-05-07 10:00:00',
    })))

    fireEvent.change(screen.getByLabelText(/rea de destino/), { target: { value: 'area-1' } })
    fireEvent.change(screen.getByLabelText('Assunto de destino'), { target: { value: 'subject-1' } })
    fireEvent.change(screen.getByLabelText(/Motivo da transfer/), { target: { value: 'Encaminhar para atendimento' } })
    fireEvent.click(screen.getByRole('button', { name: 'Transferir' }))
    await waitFor(() => expect(actionMock).toHaveBeenCalledWith('42', 'transfer', expect.objectContaining({
      id_sac_area: 'area-1',
      id_sac_assunto: 'subject-1',
      motivo: 'Encaminhar para atendimento',
      updated_at: '2026-05-07 10:00:00',
    })))
  })

  it('manages SAC module configuration on its own surface', async () => {
    render(<SacAdminPage view="settings" permissions={fullPermissions} />)

    expect(await screen.findByRole('heading', { name: /Configura/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Status do módulo' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Acesso do cliente' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Prazos operacionais' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Sim' }).length).toBeGreaterThan(0)
    expect(screen.getByText('Quando inativo, o menu e as telas de SAC não ficam disponíveis para clientes na loja.')).toBeInTheDocument()
    expect(screen.getByText('Prazo global para fechar chamados por inatividade.')).toBeInTheDocument()
    expect(screen.getByText('Prazo global para o cliente reabrir chamados fechados.')).toBeInTheDocument()
    expect(screen.getByText('Se preenchido, apenas esses e-mails de usuários do cliente poderão ver e acessar o SAC no front.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /reas e assuntos/ })).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('E-mails permitidos'), { target: { value: 'sac@empresa.com\nsuporte@empresa.com' } })
    fireEvent.change(screen.getByLabelText(/Fechamento/), { target: { value: '10' } })
    fireEvent.change(screen.getByLabelText(/Prazo para reabertura/), { target: { value: '4' } })
    fireEvent.click(screen.getByRole('button', { name: /Salvar configura/ }))

    await waitFor(() => expect(saveConfigMock).toHaveBeenCalledWith({
      ativo: 1,
      emails_permitidos: 'sac@empresa.com\nsuporte@empresa.com',
      fechamento_automatico_dias: 10,
      prazo_reabertura_dias: 4,
    }))
  })

  it('manages SAC areas and subjects on their own surface', async () => {
    render(<SacAdminPage view="areas-subjects" permissions={fullPermissions} />)

    expect(await screen.findByRole('heading', { name: /reas e assuntos/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Dados da área' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Regras do assunto' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Responsável pela área' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Sim' }).length).toBeGreaterThan(0)
    expect(screen.queryByRole('heading', { name: /Configura/ })).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getByLabelText(/Nome da .*rea/)).toHaveValue('Atendimento'))
    fireEvent.change(screen.getByLabelText(/Nome da .*rea/), { target: { value: 'Suporte tecnico' } })
    fireEvent.change(screen.getByLabelText(/SLA da .*rea/), { target: { value: '12' } })
    fireEvent.click(screen.getByRole('button', { name: /Salvar .*rea/ }))

    await waitFor(() => expect(saveAreaMock).toHaveBeenCalledWith(expect.objectContaining({
      nome: 'Suporte tecnico',
      sla_horas: 12,
      ativo: 1,
    })))

    fireEvent.change(screen.getByLabelText('Nome do assunto'), { target: { value: 'Troca' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar assunto' }))

    await waitFor(() => expect(saveSubjectMock).toHaveBeenCalledWith(expect.objectContaining({
      id_sac_area: 'area-1',
      nome: 'Troca',
      permite_vinculo_pedido: 1,
      obriga_pedido: 0,
      ativo: 1,
    })))

    fireEvent.change(screen.getByLabelText(/Usu.*rio respons/), { target: { value: 'user-1' } })
    fireEvent.click(screen.getByRole('button', { name: /Salvar respons/ }))

    await waitFor(() => expect(saveAreaResponsibleMock).toHaveBeenCalledWith('area-1', expect.objectContaining({
      id_usuario: 'user-1',
      ativo: 1,
    })))
  })
})
