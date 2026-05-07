import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AgileStoreListPage } from '@/src/features/agile-store/components/agile-store-list-page'
import { AgileStoreDetailPage } from '@/src/features/agile-store/components/agile-store-detail-page'

const {
  actionMock,
  detailMock,
  listMock,
  tMock,
} = vi.hoisted(() => ({
  actionMock: vi.fn(),
  detailMock: vi.fn(),
  listMock: vi.fn(),
  tMock: vi.fn((_key: string, fallback?: string) => fallback ?? _key),
}))

vi.mock('@/src/features/agile-store/services/agile-store-client', () => ({
  agileStoreClient: {
    action: actionMock,
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

    expect(await screen.findByRole('heading', { name: 'Agile Store' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'SAC' })).toBeInTheDocument()
    expect(screen.getByText('Central de atendimento integrada.')).toBeInTheDocument()
    expect(screen.getByText('15 dias grátis')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /SAC/i })).toHaveAttribute('href', '/agile-store/mod_sac')
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

  it('runs contract action when enabled', async () => {
    detailMock.mockResolvedValue(moduleFixture)
    actionMock.mockResolvedValue({ success: true })

    render(<AgileStoreDetailPage moduleId="mod_sac" permissions={{ canContract: true, canCancel: true }} />)

    expect(await screen.findByRole('heading', { name: 'SAC' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Contratar módulo' }))

    await waitFor(() => expect(actionMock).toHaveBeenCalledWith('mod_sac', 'contract'))
  })
})
