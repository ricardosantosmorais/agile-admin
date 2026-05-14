import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CatalogosDigitaisListPage } from '@/src/features/catalogos-digitais/components/catalogos-digitais-list-page'

const {
  listMock,
  tMock,
} = vi.hoisted(() => ({
  listMock: vi.fn(),
  tMock: vi.fn((_key: string, fallback?: string) => fallback ?? _key),
}))

vi.mock('@/src/features/catalogos-digitais/services/catalogos-digitais-client', () => ({
  catalogosDigitaisClient: {
    list: listMock,
  },
}))

vi.mock('@/src/i18n/use-i18n', () => ({
  useI18n: () => ({ t: tMock }),
}))

vi.mock('@/src/features/auth/hooks/use-auth', () => ({
  useAuth: () => ({
    session: {
      user: {
        master: false,
        funcionalidades: [
          { id: '1', chave: 'CATALOGOS_DIGITAIS', componente: 'catalogos-studio', nome: 'Catálogos Digitais', slug: 'catalogos-digitais', ativo: true },
          { id: '2', chave: 'CATALOGOS_DIGITAIS_LISTAR', componente: 'catalogos-studio', nome: 'Listar catálogos', slug: 'catalogos-digitais-listar', acao: 'listar', ativo: true, idFuncionalidadePai: '1' },
        ],
      },
    },
  }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>,
}))

describe('CatalogosDigitaisListPage', () => {
  beforeEach(() => {
    listMock.mockReset()
    tMock.mockClear()
    listMock.mockResolvedValue({
      items: [{
        id: 'CAT-1',
        code: 'CAT-1',
        name: 'Campanha Maio',
        description: 'Ofertas para clientes',
        status: 'pronto',
        model: 'campanha_promocional',
        template: 'executivo',
        objective: 'promocional',
        publicationMode: 'publica',
        publicUrl: 'https://loja.test/catalogos/campanha-maio',
        validFrom: '2026-05-01',
        validTo: '2026-05-31',
        productCount: 12,
        sectionCount: 4,
        showPrice: true,
        published: true,
        active: true,
        updatedAt: '2026-05-12 10:00:00',
        createdAt: '2026-05-10 10:00:00',
      }],
      meta: { page: 1, perPage: 15, total: 1, pages: 1 },
      appStore: { moduleId: 'mod_catalogos_digitais', contracted: false, status: 'cancelado', error: '' },
    })
  })

  it('renders digital catalogs list and contract warning', async () => {
    render(<CatalogosDigitaisListPage />)

    expect(await screen.findByText('Catálogos Digitais')).toBeInTheDocument()
    expect(screen.getAllByText('Campanha Maio').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Pronto').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Pública').length).toBeGreaterThan(0)
    expect(screen.getByText('Atenção: o módulo Catálogos Digitais ainda não está contratado para sua loja.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Contratar na Agile Store' })).toHaveAttribute('href', '/agile-store/mod_catalogos_digitais')
    await waitFor(() => expect(listMock).toHaveBeenCalledWith({ page: 1, perpage: 15, q: '', status: '' }))
  })
})
