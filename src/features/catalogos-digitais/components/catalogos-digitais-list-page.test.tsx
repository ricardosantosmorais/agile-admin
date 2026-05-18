import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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
  useI18n: () => ({ locale: 'pt-BR', t: tMock }),
}))

vi.mock('@/src/features/auth/hooks/use-auth', () => ({
  useAuth: () => ({
    session: {
      user: {
        master: false,
        funcionalidades: [
          { id: '1', chave: 'CATALOGOS_DIGITAIS', componente: 'catalogos-studio', nome: 'Catálogos Digitais', slug: 'catalogos-digitais', ativo: true },
          { id: '2', chave: 'CATALOGOS_DIGITAIS_LISTAR', componente: 'catalogos-studio', nome: 'Listar catálogos', slug: 'catalogos-digitais-listar', acao: 'listar', ativo: true, idFuncionalidadePai: '1' },
          { id: '3', chave: 'CATALOGOS_DIGITAIS_CRIAR', componente: 'catalogos-studio', nome: 'Criar catálogos', slug: 'catalogos-digitais-criar', acao: 'criar', ativo: true, idFuncionalidadePai: '1' },
          { id: '4', chave: 'CATALOGOS_DIGITAIS_EDITAR', componente: 'catalogos-studio', nome: 'Editar catálogos', slug: 'catalogos-digitais-editar', acao: 'editar', ativo: true, idFuncionalidadePai: '1' },
        ],
      },
    },
  }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>,
}))

function mockListResponse(contracted = false) {
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
    appStore: { moduleId: 'mod_catalogos_digitais', contracted, status: contracted ? 'ativo' : 'cancelado', error: '' },
  })
}

describe('CatalogosDigitaisListPage', () => {
  beforeEach(() => {
    listMock.mockReset()
    tMock.mockClear()
    mockListResponse(false)
  })

  it('matches the legacy list columns and keeps creation blocked when the module is not contracted', async () => {
    render(<CatalogosDigitaisListPage />)

    expect(await screen.findByText('Catálogos Digitais')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Código' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Nome' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Vigência' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Publicação' })).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Produtos' })).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Blocos' })).not.toBeInTheDocument()
    expect(screen.getAllByText('CAT-1').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Campanha Maio').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Pronto').length).toBeGreaterThan(0)
    expect(screen.getAllByText('01/05/2026 até 31/05/2026').length).toBeGreaterThan(0)
    expect(screen.getByTestId('catalogos-digitais-contract-warning')).toHaveClass('text-slate-900')
    expect(screen.getByText('Atenção: o módulo Catálogos Digitais ainda não está contratado para sua loja.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Contratar na Agile Store' })).toHaveAttribute('href', '/agile-store/mod_catalogos_digitais')
    expect(screen.queryByRole('link', { name: 'Novo catálogo' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Novo catálogo' })).toBeDisabled()
    expect(screen.getAllByRole('link', { name: 'Editar catálogo Campanha Maio' })[0]).toHaveAttribute('href', '/catalogos-digitais/CAT-1/editar')
    await waitFor(() => expect(listMock).toHaveBeenCalledWith({ page: 1, perpage: 15, code: '', name: '', status: '', validFrom: '', validTo: '' }))
  })

  it('uses collapsed v2 filters with the legacy filter fields', async () => {
    render(<CatalogosDigitaisListPage />)

    await waitFor(() => expect(screen.getAllByText('Campanha Maio').length).toBeGreaterThan(0))
    expect(screen.queryByLabelText('Código')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Filtros/ }))

    expect(screen.getByLabelText('Código')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome')).toBeInTheDocument()
    expect(screen.getByLabelText('Vigência')).toBeInTheDocument()
    expect(screen.getByLabelText('Status')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Código'), { target: { value: 'CAT-1' } })
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Maio' } })
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'pronto' } })
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }))

    await waitFor(() => expect(listMock).toHaveBeenLastCalledWith({
      page: 1,
      perpage: 15,
      code: 'CAT-1',
      name: 'Maio',
      status: 'pronto',
      validFrom: '',
      validTo: '',
    }))
  })

  it('enables the new catalog action only when the module is contracted', async () => {
    mockListResponse(true)

    render(<CatalogosDigitaisListPage />)

    expect(await screen.findByRole('link', { name: 'Novo catálogo' })).toHaveAttribute('href', '/catalogos-digitais/novo')
    expect(screen.queryByTestId('catalogos-digitais-contract-warning')).not.toBeInTheDocument()
  })
})
