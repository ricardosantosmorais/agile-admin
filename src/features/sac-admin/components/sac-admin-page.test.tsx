import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SacAdminPage } from '@/src/features/sac-admin/components/sac-admin-page'

const {
  actionMock,
  dashboardMock,
  detailMock,
  listMock,
  tMock,
} = vi.hoisted(() => ({
  actionMock: vi.fn(),
  dashboardMock: vi.fn(),
  detailMock: vi.fn(),
  listMock: vi.fn(),
  tMock: vi.fn((_key: string, fallback?: string) => fallback ?? _key),
}))

vi.mock('@/src/features/sac-admin/services/sac-admin-client', () => ({
  sacAdminClient: {
    action: actionMock,
    dashboard: dashboardMock,
    detail: detailMock,
    list: listMock,
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
    dashboardMock.mockReset()
    detailMock.mockReset()
    listMock.mockReset()
    tMock.mockClear()
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
})
