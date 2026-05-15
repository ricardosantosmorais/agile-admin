import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CatalogoDigitalFormPage } from '@/src/features/catalogos-digitais/components/catalogos-digitais-form-page'
import { createEmptyCatalogoDigitalForm } from '@/src/features/catalogos-digitais/services/catalogos-digitais-mappers'

const {
  detailMock,
  pushMock,
  replaceMock,
  saveMock,
  tMock,
} = vi.hoisted(() => ({
  detailMock: vi.fn(),
  pushMock: vi.fn(),
  replaceMock: vi.fn(),
  saveMock: vi.fn(),
  tMock: vi.fn((_key: string, fallback?: string) => fallback ?? _key),
}))

vi.mock('@/src/features/catalogos-digitais/services/catalogos-digitais-client', () => ({
  catalogosDigitaisClient: {
    detail: detailMock,
    save: saveMock,
  },
}))

vi.mock('@/src/i18n/use-i18n', () => ({
  useI18n: () => ({ t: tMock }),
}))

vi.mock('@/src/features/auth/hooks/use-auth', () => ({
  useAuth: () => ({
    session: {
      user: { master: true, funcionalidades: [] },
    },
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
  usePathname: () => '/catalogos-digitais/CAT-1/editar',
  useParams: () => ({}),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>,
}))

describe('CatalogoDigitalFormPage', () => {
  beforeEach(() => {
    detailMock.mockReset()
    pushMock.mockReset()
    replaceMock.mockReset()
    saveMock.mockReset()
    tMock.mockClear()
  })

  it('loads an existing catalog and saves the first studio slice without dropping snapshot data', async () => {
    detailMock.mockResolvedValue({
      ...createEmptyCatalogoDigitalForm(),
      id: 'CAT-1',
      code: 'CAT-1',
      name: 'Campanha Maio',
      coverCall: 'Ofertas atuais',
      publicationMode: 'publica',
      validFrom: '2026-05-01',
      validTo: '2026-05-31',
      products: [{ id: 'PROD-1' }],
      sections: [{ id: 'sec-1', tipo: 'titulo' }],
      snapshot: {
        produtos: [{ id: 'PROD-1' }],
        secoes: [{ id: 'sec-1', tipo: 'titulo' }],
      },
    })
    saveMock.mockResolvedValue({ id: 'CAT-1' })

    render(<CatalogoDigitalFormPage id="CAT-1" />)

    expect(await screen.findByDisplayValue('Campanha Maio')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Nome do catálogo'), { target: { value: 'Campanha Junho' } })
    fireEvent.change(screen.getByLabelText('Chamada de capa'), { target: { value: 'Ofertas renovadas' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar catálogo' }))

    await waitFor(() => expect(saveMock).toHaveBeenCalled())
    expect(saveMock.mock.calls[0][0]).toMatchObject({
      id: 'CAT-1',
      name: 'Campanha Junho',
      coverCall: 'Ofertas renovadas',
      products: [{ id: 'PROD-1' }],
      sections: [{ id: 'sec-1', tipo: 'titulo' }],
    })
    expect(pushMock).toHaveBeenCalledWith('/catalogos-digitais')
  })

  it('organizes catalog editing in the same three-step studio flow as the legacy screen', async () => {
    detailMock.mockResolvedValue({
      ...createEmptyCatalogoDigitalForm(),
      id: 'CAT-1',
      code: 'CAT-1',
      name: 'Campanha Maio',
      products: [{ id: 'PROD-1' }],
      sections: [{ id: 'sec-1', tipo: 'titulo' }],
    })

    render(<CatalogoDigitalFormPage id="CAT-1" />)

    expect(await screen.findByRole('button', { name: /Geral/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Blocos/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Resumo/ })).toBeInTheDocument()
    expect(screen.getByText('Dados básicos do catálogo')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Blocos/ }))
    expect(screen.getByText('Monte o catálogo com componentes visuais')).toBeInTheDocument()
    expect(screen.getByText('Produtos')).toBeInTheDocument()
    expect(screen.getAllByText('1').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: /Resumo/ }))
    expect(screen.getByText('Revise, salve e gere PDF')).toBeInTheDocument()
    expect(screen.getByText('Campanha Maio')).toBeInTheDocument()
  })

  it('creates a new catalog from the default studio form', async () => {
    saveMock.mockResolvedValue({ id: 'CAT-NEW' })

    render(<CatalogoDigitalFormPage />)

    fireEvent.change(screen.getByLabelText('Nome do catálogo'), { target: { value: 'Campanha Nova' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar catálogo' }))

    await waitFor(() => expect(saveMock).toHaveBeenCalled())
    expect(saveMock.mock.calls[0][0]).toMatchObject({
      id: '',
      name: 'Campanha Nova',
      publicationMode: 'nao_publicar',
    })
    expect(replaceMock).toHaveBeenCalledWith('/catalogos-digitais/CAT-NEW/editar')
  })
})
