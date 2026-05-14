import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ConteudoArquivosPage } from '@/src/features/conteudo-arquivos/components/conteudo-arquivos-page'

const { listMock, createMock, deleteMock, tMock } = vi.hoisted(() => ({
	listMock: vi.fn(),
	createMock: vi.fn(),
	deleteMock: vi.fn(),
	tMock: vi.fn((_key: string, fallback?: string, values?: Record<string, unknown>) => {
		if (!fallback) return _key
		return Object.entries(values ?? {}).reduce((text, [key, value]) => text.replace(`{{${key}}}`, String(value)), fallback)
	}),
}))

vi.mock('@/src/features/conteudo-arquivos/services/conteudo-arquivos-client', () => ({
	conteudoArquivosClient: {
		create: createMock,
		delete: deleteMock,
		list: listMock,
	},
}))

vi.mock('@/src/features/auth/hooks/use-auth', () => ({
	useAuth: () => ({
		session: {
			currentTenant: {
				assetsBucketUrl: 'https://bucket.exemplo.com.br',
			},
		},
	}),
}))

vi.mock('@/src/features/auth/hooks/use-feature-access', () => ({
	useFeatureAccess: () => ({
		canCreate: true,
		canDelete: true,
		canList: true,
		canUpdate: true,
		featureLabel: 'Arquivos',
	}),
}))

vi.mock('@/src/i18n/use-i18n', () => ({
	useI18n: () => ({
		t: tMock,
	}),
}))

vi.mock('next/image', () => ({
	default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}))

const listResponse = {
	data: [
		{
			id: '1',
			arquivoUrl: 'https://bucket.exemplo.com.br/arquivos/planilhas/precos.xlsx',
			arquivoNome: 'precos.xlsx',
			pasta: 'planilhas',
			extensao: 'xlsx',
			isPreviewable: false,
			dataEnvio: '2026-04-15 10:30:00',
			dataEnvioLabel: '15/04/2026 10:30',
		},
		{
			id: '2',
			arquivoUrl: 'https://bucket.exemplo.com.br/arquivos/manuais/manual.pdf',
			arquivoNome: 'manual.pdf',
			pasta: 'manuais',
			extensao: 'pdf',
			isPreviewable: true,
			dataEnvio: '2026-04-16 08:00:00',
			dataEnvioLabel: '16/04/2026 08:00',
		},
	],
	meta: {
		from: 1,
		page: 1,
		pages: 1,
		perPage: 15,
		to: 2,
		total: 2,
	},
}

describe('ConteudoArquivosPage', () => {
	beforeEach(() => {
		listMock.mockReset()
		createMock.mockReset()
		deleteMock.mockReset()
		tMock.mockClear()
	})

	it('abre diretamente arquivos sem preview e mantém modal apenas para formatos previewáveis', async () => {
		listMock.mockResolvedValue(listResponse)
		const openSpy = vi.spyOn(window, 'open').mockReturnValue(null)

		render(<ConteudoArquivosPage />)

		expect((await screen.findAllByText('precos.xlsx')).length).toBeGreaterThan(0)

		fireEvent.click(screen.getAllByRole('button', { name: 'Abrir arquivo' })[0])

		expect(openSpy).toHaveBeenCalledWith('https://bucket.exemplo.com.br/arquivos/planilhas/precos.xlsx', '_blank', 'noopener,noreferrer')
		expect(screen.queryByRole('heading', { name: 'precos.xlsx' })).not.toBeInTheDocument()

		fireEvent.click(screen.getAllByRole('button', { name: 'Visualizar arquivo' })[0])

		expect(await screen.findByRole('heading', { name: 'manual.pdf' })).toBeInTheDocument()
		expect(screen.getByTitle('manual.pdf')).toHaveAttribute('src', 'https://bucket.exemplo.com.br/arquivos/manuais/manual.pdf')

		openSpy.mockRestore()
	})
})
