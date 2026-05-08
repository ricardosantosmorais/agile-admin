import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AgileStoreListPage } from '@/src/features/agile-store/components/agile-store-list-page'
import { AgileStoreDetailPage } from '@/src/features/agile-store/components/agile-store-detail-page'

const {
  actionMock,
  adminCancelContractMock,
  adminDashboardMock,
  adminUpdateBillingStatusMock,
  detailMock,
  listMock,
  tMock,
} = vi.hoisted(() => ({
  actionMock: vi.fn(),
  adminCancelContractMock: vi.fn(),
  adminDashboardMock: vi.fn(),
  adminUpdateBillingStatusMock: vi.fn(),
  detailMock: vi.fn(),
  listMock: vi.fn(),
  tMock: vi.fn((_key: string, fallback?: string) => fallback ?? _key),
}))

vi.mock('@/src/features/agile-store/services/agile-store-client', () => ({
  agileStoreClient: {
    action: actionMock,
    adminCancelContract: adminCancelContractMock,
    adminDashboard: adminDashboardMock,
    adminUpdateBillingStatus: adminUpdateBillingStatusMock,
    detail: detailMock,
    list: listMock,
  },
}))

vi.mock('@/src/i18n/use-i18n', () => ({
  useI18n: () => ({
    t: tMock,
  }),
}))

vi.mock('@/src/features/auth/hooks/use-auth', () => ({
  useAuth: () => ({
    session: null,
  }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>,
}))

const moduleFixture = {
  id: 'mod_sac',
  name: 'SAC',
  type: 'Atendimento',
  summary: 'Central de atendimento integrada.',
  description: 'Organize chamados e atendimento.',
  price: 149.9,
  currency: 'BRL',
  billingCycle: 'mensal',
  primaryColor: '#2f5bea',
  icon: 'far fa-headset',
  coverImageUrl: '',
  benefits: ['Chamados', 'Dashboard'],
  trial: { available: true, days: 15 },
  contractStatus: 'cancelado' as const,
  actions: {},
  media: [],
  history: [],
}

describe('agile-store pages', () => {
  beforeEach(() => {
    actionMock.mockReset()
    adminCancelContractMock.mockReset()
    adminDashboardMock.mockReset()
    adminUpdateBillingStatusMock.mockReset()
    detailMock.mockReset()
    listMock.mockReset()
    tMock.mockClear()
  })

  it('renders module cards from the Agile Store list', async () => {
    listMock.mockResolvedValue({
      items: [moduleFixture],
      summary: { totalModules: 1, activeContracts: 0 },
      filters: { types: ['Atendimento'] },
      meta: { page: 1, perPage: 12, total: 1, pages: 1 },
    })

    render(<AgileStoreListPage />)

    expect(await screen.findByRole('heading', { name: 'Módulos para ampliar a operação' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Agile Store' })).not.toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'SAC' })).toBeInTheDocument()
    expect(screen.getByText('Central de atendimento integrada.')).toBeInTheDocument()
    expect(screen.getByText('15 dias grátis')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /SAC/i })).toHaveAttribute('href', '/agile-store/mod_sac')
  })

  it('uses the shared skeleton loading state in the Agile Store list', () => {
    listMock.mockReturnValue(new Promise(() => undefined))

    render(<AgileStoreListPage />)

    expect(screen.getByRole('heading', { name: 'Carregando módulos' })).toBeInTheDocument()
    expect(screen.getByText('Preparando o catálogo de módulos da Agile Store.')).toBeInTheDocument()
  })

  it('renders pagination controls and loads the selected Agile Store page', async () => {
    listMock.mockResolvedValue({
      items: [moduleFixture],
      summary: { totalModules: 25, activeContracts: 0 },
      filters: { types: ['Atendimento'] },
      meta: { page: 1, perPage: 12, total: 25, pages: 3 },
    })

    render(<AgileStoreListPage />)

    expect(await screen.findByRole('heading', { name: 'SAC' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Página 2' }))

    await waitFor(() => expect(listMock).toHaveBeenLastCalledWith({ page: 2, perpage: 12, q: '', tipo: '', status: '' }))
  })

  it('renders detail media, history and visible action restrictions from the legacy detail surface', async () => {
    detailMock.mockResolvedValue({
      ...moduleFixture,
      actions: {
        contratar: {
          permitido: false,
          message: 'Disponível apenas para empresas operando.',
        },
      },
      media: [
        { type: 'video', url: 'https://example.com/video', title: 'Demonstração', description: 'Fluxo completo' },
        { type: 'screenshot', url: 'https://example.com/image.png', title: 'Painel do SAC', description: 'Visão geral' },
        { type: 'manual', url: 'https://example.com/manual.pdf', title: 'Manual', description: 'Guia de uso' },
      ],
      history: [
        { id: 'hist-1', action: 'contratar', status: 'falha', createdAt: '2026-05-07 10:00:00', message: 'Falha ao executar script.' },
      ],
    })

    render(<AgileStoreDetailPage moduleId="mod_sac" permissions={{ canContract: true, canCancel: true }} />)

    expect(await screen.findByRole('heading', { name: 'SAC' })).toBeInTheDocument()
    expect(screen.getByText('Disponível apenas para empresas operando.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Vídeos' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Demonstração/i })).toHaveAttribute('href', 'https://example.com/video')
    expect(screen.getByRole('img', { name: 'Painel do SAC' })).toHaveAttribute('src', 'https://example.com/image.png')
    expect(screen.getByRole('link', { name: /Manual/i })).toHaveAttribute('href', 'https://example.com/manual.pdf')
    expect(screen.getByRole('heading', { name: 'Histórico' })).toBeInTheDocument()
    expect(screen.getByText('Falha ao executar script.')).toBeInTheDocument()
  })

  it('uses the shared skeleton loading state in the Agile Store detail', () => {
    detailMock.mockReturnValue(new Promise(() => undefined))

    render(<AgileStoreDetailPage moduleId="mod_sac" permissions={{ canContract: true, canCancel: true }} />)

    expect(screen.getByRole('heading', { name: 'Carregando módulo' })).toBeInTheDocument()
    expect(screen.getByText('Buscando as informações comerciais e materiais do módulo.')).toBeInTheDocument()
  })

  it('renders a blocked action message in detail instead of calling the API', async () => {
    detailMock.mockResolvedValue({
      ...moduleFixture,
      actions: {
        contratar: {
          permitido: false,
          message: 'Disponivel apenas para empresas operando.',
        },
      },
    })

    render(<AgileStoreDetailPage moduleId="mod_sac" permissions={{ canContract: true, canCancel: true }} />)

    expect(await screen.findByRole('heading', { name: 'SAC' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Contratar módulo' }))

    expect(actionMock).not.toHaveBeenCalled()
    expect(screen.getByText('Disponivel apenas para empresas operando.')).toBeInTheDocument()
  })

  it('confirms before running contract action when enabled', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    detailMock.mockResolvedValue(moduleFixture)
    actionMock.mockResolvedValue({ success: true })

    render(<AgileStoreDetailPage moduleId="mod_sac" permissions={{ canContract: true, canCancel: true }} />)

    expect(await screen.findByRole('heading', { name: 'SAC' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Contratar módulo' }))

    expect(confirmSpy).toHaveBeenCalledWith('Confirme a contratação deste módulo para a empresa atual.')
    await waitFor(() => expect(actionMock).toHaveBeenCalledWith('mod_sac', 'contract'))
    confirmSpy.mockRestore()
  })

  it('renders the Agile Store admin backoffice and runs billing actions', async () => {
    const { AgileStoreAdminPage } = await import('@/src/features/agile-store/components/agile-store-admin-page')
    adminDashboardMock.mockResolvedValue({
      period: { scope: 'periodo', start: '2026-05-01', end: '2026-05-07', granularity: 'dia' },
      summary: { modules: 1, visits: 120, visitorCompanies: 40, periodContracts: 12, periodCancellations: 3, activeContracts: 20, freeContracts: 4, failures: 1, mrr: 1990.5 },
      moduleOptions: [{ id: 'mod_sac', name: 'SAC' }],
      modules: [{ id: 'mod_sac', name: 'SAC', type: 'Atendimento', status: 'publicado', highlighted: true, icon: 'far fa-headset', primaryColor: '#39aba4', visits: 80, periodContracts: 10, periodCancellations: 2, activeContracts: 15, freeContracts: 3, failures: 1, mrr: 1490.5, conversion: 13, growth: 8 }],
      trend: [{ label: '07/05', visits: 9, conversions: 2, cancellations: 1 }],
      visits: [{ id: 'visit-1', companyName: 'Cliente Alfa', companyDocument: '00.000.000/0001-00', moduleName: 'SAC', moduleType: 'Atendimento', userName: 'Maria', userEmail: 'maria@empresa.com', visitedAt: '2026-05-07 09:00:00', ip: '127.0.0.1', conversionStatus: 'convertido' }],
      customers: [{ id: 'contract-1', companyName: 'Cliente Alfa', companyDocument: '00.000.000/0001-00', moduleName: 'SAC', moduleType: 'Atendimento', status: 'ativo', value: 149.9, currency: 'BRL', billingCycle: 'mensal', trialDays: 15, trialUntil: '2026-05-20', firstBillingAt: '2026-06-01', billingDay: '1', billingStatus: 'pendente', expectedBillingStatus: 'faturado', contractedAt: '2026-05-07 10:00:00', contractedBy: 'Joao', canCancelContract: true }],
      events: [{ id: 'event-1', action: 'contratar', moduleName: 'SAC', companyName: 'Cliente Alfa', userName: 'Joao', createdAt: '2026-05-07 10:00:00', ip: '127.0.0.1' }],
    })
    adminUpdateBillingStatusMock.mockResolvedValue({ success: true })
    adminCancelContractMock.mockResolvedValue({ success: true })

    render(<AgileStoreAdminPage />)

    expect(await screen.findByRole('heading', { name: 'Gestão da Agile Store' })).toBeInTheDocument()
    expect(screen.getByText('MRR contratado')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Performance por módulo' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Contratações e faturamento' })).toBeInTheDocument()
    expect((await screen.findAllByText('Cliente Alfa')).length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: 'Marcar faturado' }))
    await waitFor(() => expect(adminUpdateBillingStatusMock).toHaveBeenCalledWith('contract-1', 'faturado'))

    fireEvent.click(screen.getByRole('button', { name: 'Descontratar módulo' }))
    await waitFor(() => expect(adminCancelContractMock).toHaveBeenCalledWith('contract-1'))
  })
})
