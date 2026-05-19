import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CatalogoDigitalFormPage } from '@/src/features/catalogos-digitais/components/catalogos-digitais-form-page'
import { createEmptyCatalogoDigitalForm } from '@/src/features/catalogos-digitais/services/catalogos-digitais-mappers'

const {
  detailMock,
  importCollectionMock,
  previewDraftMock,
  pricingOptionsMock,
  pushMock,
  recalculateSnapshotMock,
  replaceMock,
  saveMock,
  searchProductsMock,
  tMock,
  uploadSectionImageMock,
} = vi.hoisted(() => ({
  detailMock: vi.fn(),
  importCollectionMock: vi.fn(),
  previewDraftMock: vi.fn(),
  pricingOptionsMock: vi.fn(),
  pushMock: vi.fn(),
  recalculateSnapshotMock: vi.fn(),
  replaceMock: vi.fn(),
  saveMock: vi.fn(),
  searchProductsMock: vi.fn(),
  tMock: vi.fn((_key: string, fallback?: string) => fallback ?? _key),
  uploadSectionImageMock: vi.fn(),
}))

vi.mock('@/src/features/catalogos-digitais/services/catalogos-digitais-client', () => ({
  catalogosDigitaisClient: {
    detail: detailMock,
    importCollection: importCollectionMock,
    previewDraft: previewDraftMock,
    pricingOptions: pricingOptionsMock,
    recalculateSnapshot: recalculateSnapshotMock,
    save: saveMock,
    searchProducts: searchProductsMock,
    uploadSectionImage: uploadSectionImageMock,
  },
}))

vi.mock('@/src/i18n/use-i18n', () => ({
  useI18n: () => ({ t: tMock }),
}))

vi.mock('@/src/features/auth/hooks/use-auth', () => ({
  useAuth: () => ({
    session: {
      user: { master: true, funcionalidades: [] },
      currentTenant: {
        id: 'tenant-123',
        assetsBucketUrl: 'https://tenant-assets.agilecdn.com.br',
      },
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
    importCollectionMock.mockReset()
    previewDraftMock.mockReset()
    pricingOptionsMock.mockReset()
    pushMock.mockReset()
    recalculateSnapshotMock.mockReset()
    replaceMock.mockReset()
    searchProductsMock.mockReset()
    saveMock.mockReset()
    uploadSectionImageMock.mockReset()
    tMock.mockClear()
    pricingOptionsMock.mockResolvedValue({
      data: {
        filiais: [{ id: 'FIL-1', nome: 'Filial Centro' }],
        formas_pagamento: [{ id: 'FP-1', nome: 'Boleto' }],
        condicoes_pagamento: [{ id: 'CP-1', nome: '30 dias', indice: '1.00' }],
        tabelas_preco: [{ id: 'TP-1', nome: 'Atacado' }],
        modo_ecommerce: 'b2b',
        cliente_padrao_codigo: '',
      },
    })
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

  it('adds a visual block in the studio and saves it in the catalog snapshot', async () => {
    saveMock.mockResolvedValue({ id: 'CAT-NEW' })
    uploadSectionImageMock.mockResolvedValue({
      value: 'https://cdn.example.com/banner.jpg',
      previewValue: 'https://cdn.example.com/banner.jpg',
    })

    render(<CatalogoDigitalFormPage />)

    fireEvent.change(screen.getByLabelText(/Nome do catálogo/), { target: { value: 'Campanha com blocos' } })
    fireEvent.click(screen.getByRole('button', { name: /Blocos/ }))
    fireEvent.click(screen.getByRole('button', { name: /Banner/ }))

    const titleAndSubtitleFields = await screen.findAllByLabelText(/tulo do bloco/i)
    fireEvent.change(titleAndSubtitleFields[0], { target: { value: 'Abertura comercial' } })
    fireEvent.change(screen.getByLabelText(/sub.*tulo do bloco/i), { target: { value: 'Condições especiais do mês' } })
    const imageInput = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(imageInput, { target: { files: [new File(['image'], 'banner.jpg', { type: 'image/jpeg' })] } })
    await waitFor(() => expect(uploadSectionImageMock).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('button', { name: 'Salvar bloco' }))

    expect(screen.getByText('Abertura comercial')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Salvar catálogo/ }))

    await waitFor(() => expect(saveMock).toHaveBeenCalled())
    expect(saveMock.mock.calls[0][0].sections).toEqual([
      expect.objectContaining({
        tipo: 'banner',
        modelo_secao: 'banner_full',
        titulo: 'Abertura comercial',
        subtitulo: 'Condições especiais do mês',
        banner_url: 'https://cdn.example.com/banner.jpg',
      }),
    ])
  })

  it('uploads a block image with the active tenant context and stores the returned URL in the section', async () => {
    saveMock.mockResolvedValue({ id: 'CAT-NEW' })
    uploadSectionImageMock.mockResolvedValue({
      value: 'https://tenant-assets.agilecdn.com.br/catalogos-digitais/tenant-123/banner.jpg',
      previewValue: 'https://tenant-assets.agilecdn.com.br/catalogos-digitais/tenant-123/banner.jpg',
    })

    const { container } = render(<CatalogoDigitalFormPage />)

    fireEvent.change(screen.getByLabelText(/Nome do cat.logo/), { target: { value: 'Campanha com imagem' } })
    fireEvent.click(screen.getByRole('button', { name: /Blocos/ }))
    fireEvent.click(screen.getByRole('button', { name: /Banner/ }))

    const imageInput = container.querySelector('input[type="file"]') as HTMLInputElement | null
    expect(imageInput).not.toBeNull()

    const file = new File(['image'], 'banner.jpg', { type: 'image/jpeg' })
    fireEvent.change(imageInput!, { target: { files: [file] } })

    await waitFor(() => expect(uploadSectionImageMock).toHaveBeenCalledWith(file, {
      catalogId: '',
      tenantBucketUrl: 'https://tenant-assets.agilecdn.com.br',
      tenantId: 'tenant-123',
    }))
    expect(await screen.findByAltText('')).toHaveAttribute('src', 'https://tenant-assets.agilecdn.com.br/catalogos-digitais/tenant-123/banner.jpg')

    fireEvent.click(screen.getByRole('button', { name: 'Salvar bloco' }))
    fireEvent.click(screen.getByRole('button', { name: /Salvar cat.logo/ }))

    await waitFor(() => expect(saveMock).toHaveBeenCalled())
    expect(saveMock.mock.calls[0][0].sections).toEqual([
      expect.objectContaining({
        banner_url: 'https://tenant-assets.agilecdn.com.br/catalogos-digitais/tenant-123/banner.jpg',
      }),
    ])
  })

  it('blocks unsupported block image formats before calling the upload bridge', async () => {
    render(<CatalogoDigitalFormPage />)

    fireEvent.click(screen.getByRole('button', { name: /Blocos/ }))
    fireEvent.click(screen.getByRole('button', { name: /Banner/ }))

    const svgFile = new File(['<svg />'], 'banner.svg', { type: 'image/svg+xml' })
    const imageInput = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(imageInput, { target: { files: [svgFile] } })

    expect(await screen.findByText('Envie uma imagem JPG, PNG, GIF ou WEBP.')).toBeInTheDocument()
    expect(uploadSectionImageMock).not.toHaveBeenCalled()
  })

  it('searches and adds products to a product block without dropping the product snapshot', async () => {
    saveMock.mockResolvedValue({ id: 'CAT-NEW' })
    searchProductsMock.mockResolvedValue({
      data: [{ id: 'PROD-1', codigo: 'SKU-1', nome: 'Produto Integrado', marca: 'Marca A' }],
      not_found: [],
    })

    render(<CatalogoDigitalFormPage />)

    fireEvent.change(screen.getByLabelText(/Nome do cat.logo/), { target: { value: 'Campanha com produtos' } })
    fireEvent.click(screen.getByRole('button', { name: /Blocos/ }))
    fireEvent.click(screen.getByRole('button', { name: /Produtos em grid/ }))

    fireEvent.change(screen.getByLabelText('Buscar produtos'), { target: { value: 'Produto' } })
    fireEvent.click(screen.getByRole('button', { name: 'Buscar produtos' }))

    expect(await screen.findByText('Produto Integrado')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar Produto Integrado' }))
    fireEvent.click(screen.getByRole('button', { name: 'Salvar bloco' }))
    fireEvent.click(screen.getByRole('button', { name: /Salvar cat.logo/ }))

    await waitFor(() => expect(saveMock).toHaveBeenCalled())
    expect(searchProductsMock).toHaveBeenCalledWith({ q: 'Produto', perpage: 18 })
    expect(saveMock.mock.calls[0][0].products).toEqual([
      expect.objectContaining({ id: 'PROD-1', codigo: 'SKU-1', nome: 'Produto Integrado' }),
    ])
    expect(saveMock.mock.calls[0][0].sections).toEqual([
      expect.objectContaining({
        tipo: 'produtos_grid',
        produtos: ['PROD-1'],
      }),
    ])
  })

  it('opens a draft preview from the summary step using the current unsaved builder state', async () => {
    let previewDraftStarted = false
    const writeMock = vi.fn()
    const closeMock = vi.fn()
    const focusMock = vi.fn()
    const openMock = vi.spyOn(window, 'open').mockReturnValue({
      document: { open: vi.fn(), write: writeMock, close: closeMock },
      focus: focusMock,
    } as unknown as Window)
    previewDraftMock.mockImplementation(() => {
      previewDraftStarted = true
      return Promise.resolve('<!doctype html><html><body>Preview</body></html>')
    })

    render(<CatalogoDigitalFormPage />)

    fireEvent.change(screen.getByLabelText(/Nome do cat.logo/), { target: { value: 'Rascunho de preview' } })
    fireEvent.click(screen.getByRole('button', { name: /Resumo/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Prévia do rascunho' }))

    expect(openMock).toHaveBeenCalledWith('about:blank', '_blank')
    expect(openMock.mock.invocationCallOrder[0]).toBeLessThan(previewDraftMock.mock.invocationCallOrder[0])
    expect(previewDraftStarted).toBe(true)
    await waitFor(() => expect(previewDraftMock).toHaveBeenCalled())
    expect(previewDraftMock.mock.calls[0][0]).toEqual(expect.objectContaining({
      nome: 'Rascunho de preview',
      secoes: [],
    }))
    expect(writeMock).toHaveBeenCalledWith('<!doctype html><html><body>Preview</body></html>')
    expect(closeMock).toHaveBeenCalled()
    expect(focusMock).toHaveBeenCalled()

    openMock.mockRestore()
  })

  it('recalculates product prices from the summary step and preserves the priced snapshot before saving', async () => {
    saveMock.mockResolvedValue({ id: 'CAT-NEW' })
    recalculateSnapshotMock.mockResolvedValue({
      payload: {
        nome: 'Campanha com precos',
        produtos: [{ id: 'PROD-1', codigo: 'SKU-1', nome: 'Produto Integrado', preco_valor: '99.9', preco_label: 'R$ 99,90' }],
        secoes: [{ id: 'sec-1', tipo: 'produtos_grid', produtos: ['PROD-1'], mostrar_preco: true }],
        precificacao: {
          id_filial: 'FIL-1',
          id_forma_pagamento: 'FP-1',
          id_condicao_pagamento: 'CP-1',
          cliente_busca: 'C001',
        },
        precos_dinamicos: true,
      },
      meta: { precificados: 1 },
    })

    render(<CatalogoDigitalFormPage />)

    fireEvent.change(screen.getByLabelText(/Nome do cat.logo/), { target: { value: 'Campanha com precos' } })
    fireEvent.click(screen.getByRole('button', { name: /Blocos/ }))
    fireEvent.click(screen.getByRole('button', { name: /Produtos em grid/ }))
    fireEvent.change(screen.getByLabelText('Produtos do bloco'), { target: { value: 'PROD-1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar bloco' }))

    fireEvent.click(screen.getByRole('button', { name: /Resumo/ }))
    await screen.findByLabelText('Filial')
    fireEvent.change(screen.getByLabelText('Filial'), { target: { value: 'FIL-1' } })
    fireEvent.change(screen.getByLabelText('Forma de pagamento'), { target: { value: 'FP-1' } })
    fireEvent.change(screen.getByLabelText('Prazo de pagamento'), { target: { value: 'CP-1' } })
    fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: 'C001' } })
    fireEvent.click(screen.getByRole('button', { name: 'Recalcular preços' }))

    await waitFor(() => expect(recalculateSnapshotMock).toHaveBeenCalled())
    expect(recalculateSnapshotMock.mock.calls[0][0]).toEqual(expect.objectContaining({
      nome: 'Campanha com precos',
      secoes: [expect.objectContaining({ produtos: ['PROD-1'], mostrar_preco: true })],
      precificacao: expect.objectContaining({
        id_filial: 'FIL-1',
        id_forma_pagamento: 'FP-1',
        id_condicao_pagamento: 'CP-1',
        cliente_busca: 'C001',
      }),
    }))
    expect(await screen.findByText('1 produto precificado.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Salvar cat.logo/ }))

    await waitFor(() => expect(saveMock).toHaveBeenCalled())
    expect(saveMock.mock.calls[0][0].products).toEqual([
      expect.objectContaining({ id: 'PROD-1', preco_valor: '99.9', preco_label: 'R$ 99,90' }),
    ])
    expect(saveMock.mock.calls[0][0].snapshot).toEqual(expect.objectContaining({ precos_dinamicos: true }))
  })
})
