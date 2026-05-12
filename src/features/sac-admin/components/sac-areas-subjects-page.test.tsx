import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SacAreaSubjectFormPage } from '@/src/features/sac-admin/components/sac-area-subject-form-page'
import { SacAreasSubjectsListPage } from '@/src/features/sac-admin/components/sac-areas-subjects-list-page'

const {
  areaResponsiblesMock,
  areasMock,
  deleteAreaMock,
  deleteAreaResponsibleMock,
  deleteSubjectMock,
  replaceMock,
  pushMock,
  saveAreaMock,
  saveAreaResponsibleMock,
  saveSubjectMock,
  sessionRef,
  subjectsMock,
  tMock,
  usersMock,
} = vi.hoisted(() => ({
  areaResponsiblesMock: vi.fn(),
  areasMock: vi.fn(),
  deleteAreaMock: vi.fn(),
  deleteAreaResponsibleMock: vi.fn(),
  deleteSubjectMock: vi.fn(),
  replaceMock: vi.fn(),
  pushMock: vi.fn(),
  saveAreaMock: vi.fn(),
  saveAreaResponsibleMock: vi.fn(),
  saveSubjectMock: vi.fn(),
  sessionRef: { current: null as unknown },
  subjectsMock: vi.fn(),
  tMock: vi.fn((_key: string, fallback?: string) => fallback ?? _key),
  usersMock: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/sac/areas-assuntos',
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
}))

vi.mock('@/src/next/route-context', () => ({
  useRouteParams: () => ({}),
}))

vi.mock('@/src/features/sac-admin/services/sac-admin-client', () => ({
  sacAdminClient: {
    areaResponsibles: areaResponsiblesMock,
    areas: areasMock,
    deleteArea: deleteAreaMock,
    deleteAreaResponsible: deleteAreaResponsibleMock,
    deleteSubject: deleteSubjectMock,
    saveArea: saveAreaMock,
    saveAreaResponsible: saveAreaResponsibleMock,
    saveSubject: saveSubjectMock,
    subjects: subjectsMock,
    users: usersMock,
  },
}))

vi.mock('@/src/i18n/use-i18n', () => ({
  useI18n: () => ({ t: tMock }),
}))

vi.mock('@/src/features/auth/hooks/use-auth', () => ({
  useAuth: () => ({ session: sessionRef.current }),
}))

vi.mock('@/src/contexts/auth-context', () => ({
  useAuth: () => ({ session: sessionRef.current }),
}))

describe('SAC areas and subjects CRUD pages', () => {
  beforeEach(() => {
    areaResponsiblesMock.mockReset()
    areasMock.mockReset()
    deleteAreaMock.mockReset()
    deleteAreaResponsibleMock.mockReset()
    deleteSubjectMock.mockReset()
    replaceMock.mockReset()
    pushMock.mockReset()
    saveAreaMock.mockReset()
    saveAreaResponsibleMock.mockReset()
    saveSubjectMock.mockReset()
    sessionRef.current = null
    subjectsMock.mockReset()
    tMock.mockClear()
    usersMock.mockReset()

    areasMock.mockResolvedValue([
      { id: 'area-1', name: 'Atendimento', active: true, showResponsibleName: true, slaHours: 24, totalTickets: 3 },
    ])
    subjectsMock.mockResolvedValue([
      { id: 'subject-1', areaId: 'area-1', name: 'Pedido', active: true, allowOrderLink: true, requireOrder: false, totalTickets: 2 },
    ])
    areaResponsiblesMock.mockResolvedValue([
      { id: 'resp-1', areaId: 'area-1', userId: 'user-1', userName: 'Maria', userEmail: 'maria@empresa.com', active: true },
    ])
    usersMock.mockResolvedValue([{ id: 'user-1', name: 'Maria', active: true }])
    saveAreaMock.mockResolvedValue({ data: { id: 'area-1' } })
    saveSubjectMock.mockResolvedValue({ success: true })
    saveAreaResponsibleMock.mockResolvedValue({ success: true })
  })

  it('renders areas as the standard v2 CRUD list with actions', async () => {
    render(<SacAreasSubjectsListPage />)

    expect((await screen.findAllByText('Atendimento')).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /Filtros/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'New' })).toHaveAttribute('href', '/sac/areas-assuntos/novo')
    expect(screen.getAllByText('24 h').length).toBeGreaterThan(0)
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(document.querySelector('a[href="/sac/areas-assuntos/area-1/editar"]')).toBeInTheDocument()
  })

  it('allows the legacy SAC area configuration permission to access the CRUD list', async () => {
    sessionRef.current = {
      currentTenant: { url: '', assetsBucketUrl: '' },
      user: {
        id: 'user-1',
        master: false,
        funcionalidades: [{ id: 'SAC_FUNC_CONFIGURAR_AREAS', nome: 'Configurar áreas do SAC', ativo: true }],
      },
    }

    render(<SacAreasSubjectsListPage />)

    expect((await screen.findAllByText('Atendimento')).length).toBeGreaterThan(0)
    expect(screen.queryByText('Acesso negado')).not.toBeInTheDocument()
  })

  it('renders the area form with related subjects and responsibles as tabs', async () => {
    render(<SacAreaSubjectFormPage id="area-1" />)

    expect(await screen.findByDisplayValue('Atendimento')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Dados da área' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Assuntos' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Responsáveis' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Assuntos' }))
    expect(await screen.findByText('Pedido')).toBeInTheDocument()
    expect(screen.getByText('Permite pedido')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Responsáveis' }))
    expect(await screen.findByText('Maria')).toBeInTheDocument()
    expect(screen.getByText('maria@empresa.com')).toBeInTheDocument()
  })

  it('saves the area through the legacy SAC area contract', async () => {
    render(<SacAreaSubjectFormPage id="area-1" />)

    fireEvent.change(await screen.findByDisplayValue('Atendimento'), { target: { value: 'Suporte técnico' } })
    fireEvent.change(screen.getByDisplayValue('24'), { target: { value: '12' } })
    fireEvent.click(screen.getAllByRole('button', { name: 'Save' })[0])

    await waitFor(() => expect(saveAreaMock).toHaveBeenCalledWith(expect.objectContaining({
      id: 'area-1',
      nome: 'Suporte técnico',
      sla_horas: 12,
      mostrar_nome_responsavel_cliente: 1,
      ativo: 1,
    })))
  })
})
