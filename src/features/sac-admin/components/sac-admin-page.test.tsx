import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SacAdminPage } from '@/src/features/sac-admin/components/sac-admin-page'

const {
  actionMock,
  dashboardMock,
  detailMock,
  areasMock,
  listMock,
  subjectsMock,
  tMock,
  usersMock,
} = vi.hoisted(() => ({
  actionMock: vi.fn(),
  dashboardMock: vi.fn(),
  detailMock: vi.fn(),
  areasMock: vi.fn(),
  listMock: vi.fn(),
  subjectsMock: vi.fn(),
  tMock: vi.fn((_key: string, fallback?: string) => fallback ?? _key),
  usersMock: vi.fn(),
}))

vi.mock('@/src/features/sac-admin/services/sac-admin-client', () => ({
  sacAdminClient: {
    action: actionMock,
    areas: areasMock,
    dashboard: dashboardMock,
    detail: detailMock,
    list: listMock,
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
  charts: { evolution: [], status: [], areas: [] },
  rankings: { pending: [] },
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

describe('SacAdminPage', () => {
  beforeEach(() => {
    actionMock.mockReset()
    areasMock.mockReset()
    dashboardMock.mockReset()
    detailMock.mockReset()
    listMock.mockReset()
    subjectsMock.mockReset()
    tMock.mockClear()
    usersMock.mockReset()
    areasMock.mockResolvedValue([{ id: 'area-1', name: 'Atendimento', active: true }])
    subjectsMock.mockResolvedValue([{ id: 'subject-1', name: 'Pedido', active: true }])
    usersMock.mockResolvedValue([{ id: 'user-1', name: 'Maria', active: true }])
    dashboardMock.mockResolvedValue(dashboardFixture)
    listMock.mockResolvedValue({
      items: [ticketFixture],
      meta: { page: 1, perPage: 15, total: 1, pages: 1 },
    })
    detailMock.mockResolvedValue({
      ticket: ticketFixture,
      messages: [{ id: 'm1', authorType: 'cliente', authorName: 'Cliente Alfa', message: 'Preciso de ajuda', createdAt: '2026-05-07 09:00:00', attachments: [] }],
      events: [],
      items: [],
      attachments: [],
    })
  })

  it('renders SAC dashboard cards and the operational ticket list', async () => {
    render(<SacAdminPage permissions={{ canViewDashboard: true, canList: true, canView: true, canRespond: true, canAddInternalNote: true, canChangeStatus: true }} />)

    expect(await screen.findByRole('heading', { name: 'SAC' })).toBeInTheDocument()
    expect(await screen.findByText('12')).toBeInTheDocument()
    expect(await screen.findByText('SAC-42')).toBeInTheDocument()
    expect(screen.getByText('Pedido com atraso')).toBeInTheDocument()
    expect(screen.getByText('Cliente Alfa')).toBeInTheDocument()
  })

  it('opens ticket detail and sends a customer response through the client', async () => {
    actionMock.mockResolvedValue({ success: true })

    render(<SacAdminPage permissions={{ canViewDashboard: true, canList: true, canView: true, canRespond: true, canAddInternalNote: false, canChangeStatus: true }} />)

    fireEvent.click(await screen.findByRole('button', { name: /abrir SAC-42/i }))
    expect(await screen.findByRole('heading', { name: 'SAC-42' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Resposta ao cliente'), { target: { value: 'Resposta ao cliente' } })
    fireEvent.click(screen.getByRole('button', { name: 'Responder' }))

    await waitFor(() => expect(actionMock).toHaveBeenCalledWith('42', 'respond', expect.objectContaining({
      mensagem: 'Resposta ao cliente',
      status: 'aguardando_cliente',
      updated_at: '2026-05-07 10:00:00',
    })))
  })

  it('hides response actions when the user cannot respond', async () => {
    render(<SacAdminPage permissions={{ canViewDashboard: true, canList: true, canView: true, canRespond: false, canAddInternalNote: false, canChangeStatus: false }} />)

    fireEvent.click(await screen.findByRole('button', { name: /abrir SAC-42/i }))

    expect(await screen.findByRole('heading', { name: 'SAC-42' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Responder' })).not.toBeInTheDocument()
    expect(screen.getByText('Você pode visualizar o chamado, mas não possui permissão para responder.')).toBeInTheDocument()
  })

  it('runs advanced SAC actions with the same updated_at guard used by legacy', async () => {
    actionMock.mockResolvedValue({ success: true })

    render(<SacAdminPage permissions={{
      canViewDashboard: true,
      canList: true,
      canListAll: true,
      canView: true,
      canRespond: false,
      canAddInternalNote: true,
      canChangeStatus: true,
      canAssign: true,
      canTransfer: true,
    }} />)

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

    fireEvent.change(screen.getByLabelText('Responsável'), { target: { value: 'user-1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Atribuir' }))
    await waitFor(() => expect(actionMock).toHaveBeenCalledWith('42', 'assign', expect.objectContaining({
      id_usuario_responsavel: 'user-1',
      updated_at: '2026-05-07 10:00:00',
    })))

    fireEvent.change(screen.getByLabelText('Área de destino'), { target: { value: 'area-1' } })
    fireEvent.change(screen.getByLabelText('Assunto de destino'), { target: { value: 'subject-1' } })
    fireEvent.change(screen.getByLabelText('Motivo da transferência'), { target: { value: 'Encaminhar para atendimento' } })
    fireEvent.click(screen.getByRole('button', { name: 'Transferir' }))
    await waitFor(() => expect(actionMock).toHaveBeenCalledWith('42', 'transfer', expect.objectContaining({
      id_sac_area: 'area-1',
      id_sac_assunto: 'subject-1',
      motivo: 'Encaminhar para atendimento',
      updated_at: '2026-05-07 10:00:00',
    })))
  })
})
