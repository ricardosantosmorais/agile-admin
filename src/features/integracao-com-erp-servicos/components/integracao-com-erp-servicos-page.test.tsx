import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IntegracaoComErpServicosPage } from '@/src/features/integracao-com-erp-servicos/components/integracao-com-erp-servicos-page';
import type { IntegracaoComErpServicoRecord, IntegracaoComErpServicosResponse } from '@/src/features/integracao-com-erp-servicos/services/integracao-com-erp-servicos-types';

const { listMock, listInactiveMock, tMock } = vi.hoisted(() => ({
	listMock: vi.fn(),
	listInactiveMock: vi.fn(),
	tMock: vi.fn((_key: string, fallback?: string, values?: Record<string, unknown>) => {
		if (!fallback) return _key;
		return Object.entries(values ?? {}).reduce((text, [key, value]) => text.replace(`{{${key}}}`, String(value)), fallback);
	}),
}));

vi.mock('@/src/features/integracao-com-erp-servicos/services/integracao-com-erp-servicos-client', () => ({
	integracaoComErpServicosClient: {
		activate: vi.fn(),
		execute: vi.fn(),
		list: listMock,
		listInactive: listInactiveMock,
		reload: vi.fn(),
	},
}));

vi.mock('@/src/features/auth/hooks/use-auth', () => ({
	useAuth: () => ({
		user: {
			master: true,
		},
	}),
}));

vi.mock('@/src/features/auth/hooks/use-feature-access', () => ({
	useFeatureAccess: () => ({
		canCreate: true,
		canDelete: true,
		canEdit: true,
		canList: true,
		canView: true,
		featureLabel: 'Serviços',
	}),
}));

vi.mock('@/src/i18n/use-i18n', () => ({
	useI18n: () => ({
		t: tMock,
	}),
}));

vi.mock('next/link', () => ({
	default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a>,
}));

const emptyResponse: IntegracaoComErpServicosResponse = {
	data: [],
	meta: {
		total: 0,
		from: 0,
		to: 0,
		page: 1,
		pages: 1,
		perPage: 15,
	},
};

const inactiveService: IntegracaoComErpServicoRecord = {
	id: '77',
	idServico: '77',
	idServicoEmpresa: '7007',
	nome: 'Carga de clientes inativa',
	intervaloExecucao: '30',
	ultimaExecucao: '-',
	proximaExecucao: '-',
	status: 'void',
	statusLabel: 'Inativo',
	statusTone: 'neutral',
	ativo: false,
	metadataEntries: [],
	caracteristicas: {
		natureza: { key: 'extracao', label: 'Extração' },
		motorExecucao: { key: 'agilesync', label: 'Agilesync' },
		tipoServico: { key: 'query', label: 'Query' },
		modoExecucao: { key: 'comparacao', label: 'Comparação' },
		objeto: { key: 'clientes', label: 'clientes' },
	},
};

describe('IntegracaoComErpServicosPage', () => {
	beforeEach(() => {
		listMock.mockReset();
		listInactiveMock.mockReset();
		tMock.mockClear();
		listMock.mockResolvedValue(emptyResponse);
		listInactiveMock.mockResolvedValue({
			data: [inactiveService],
			meta: {
				total: 1,
				from: 1,
				to: 1,
				page: 1,
				pages: 1,
				perPage: 10,
			},
		} satisfies IntegracaoComErpServicosResponse);
	});

	it('mantem detalhes disponiveis para servicos inativos no modal de ativacao', async () => {
		render(<IntegracaoComErpServicosPage />);

		fireEvent.click(await screen.findByRole('button', { name: 'Ativar Serviço' }));

		expect((await screen.findAllByText('Carga de clientes inativa')).length).toBeGreaterThan(0);
		const detailLinks = screen.getAllByRole('link', { name: 'Editar' });
		expect(detailLinks.length).toBeGreaterThan(0);
		for (const detailLink of detailLinks) {
			expect(detailLink).toHaveAttribute('href', '/integracao-com-erp/servicos/77/editar');
		}
		await waitFor(() => expect(listInactiveMock).toHaveBeenCalledWith(expect.objectContaining({ page: 1, perPage: 10 })));
	});
});
