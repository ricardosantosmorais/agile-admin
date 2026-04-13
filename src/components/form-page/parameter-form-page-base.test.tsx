import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ParameterFormPageBase } from '@/src/components/form-page/parameter-form-page-base';
import { renderWithProviders } from '@/src/test/render';

const useFeatureAccessMock = vi.fn();
const useAuthMock = vi.fn();
const useFooterActionsVisibilityMock = vi.fn();

vi.mock('@/src/features/auth/hooks/use-feature-access', () => ({
	useFeatureAccess: () => useFeatureAccessMock(),
}));

vi.mock('@/src/features/auth/hooks/use-auth', () => ({
	useAuth: () => useAuthMock(),
}));

vi.mock('@/src/hooks/use-footer-actions-visibility', () => ({
	useFooterActionsVisibility: () => useFooterActionsVisibilityMock(),
}));

describe('ParameterFormPageBase', () => {
	const getMock = vi.fn();
	const saveMock = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();

		useFeatureAccessMock.mockReturnValue({
			canOpen: true,
			canEdit: true,
		});

		useAuthMock.mockReturnValue({
			session: { currentTenant: { id: 'tenant-1' } },
			user: { master: false },
		});

		useFooterActionsVisibilityMock.mockReturnValue({
			footerRef: { current: null },
			isFooterVisible: false,
		});

		getMock.mockResolvedValue({
			values: {
				codigo: 'ABC',
			},
			metadata: {},
		});

		saveMock.mockResolvedValue({});
	});

	it('keeps the save action disabled until the form changes and then submits successfully', async () => {
		renderWithProviders(
			<ParameterFormPageBase
				featureKey="configuracoesClientes"
				moduleTitle="Configurações > Clientes"
				modulePath="/configuracoes/clientes"
				moduleDescription="Descrição do módulo"
				contextTitle="Contexto"
				contextValue="Tenant XPTO"
				contextDescription="Descrição do contexto"
				loadErrorMessage="Erro ao carregar"
				saveErrorMessage="Erro ao salvar"
				saveSuccessMessage="Salvo com sucesso"
				sectionOrder={[
					{
						key: 'principal',
						title: 'Principal',
						description: 'Campos principais',
					},
				]}
				fieldDefinitions={[
					{
						key: 'codigo',
						section: 'principal',
						type: 'text',
						label: 'Código',
					},
				]}
				createEmptyValues={() => ({ codigo: '' })}
				emptyLookups={{}}
				client={{
					get: getMock,
					save: saveMock,
				}}
			/>,
		);

		const saveButtons = await screen.findAllByRole('button', { name: 'Salvar' });
		expect(saveButtons[0]).toBeDisabled();

		const input = screen.getByDisplayValue('ABC');
		fireEvent.change(input, { target: { value: 'XYZ' } });

		await waitFor(() => {
			expect(screen.getAllByRole('button', { name: 'Salvar' })[0]).toBeEnabled();
		});

		fireEvent.click(screen.getAllByRole('button', { name: 'Salvar' })[0]);

		await waitFor(() => {
			expect(saveMock).toHaveBeenCalledWith({ codigo: 'ABC' }, { codigo: 'XYZ' }, undefined);
		});

		expect(await screen.findByText('Salvo com sucesso')).toBeInTheDocument();
	});

	it('renders section complementary content once per section', async () => {
		getMock.mockResolvedValue({
			values: {
				codigo: 'ABC',
				nome: 'Nome',
			},
			metadata: {},
		});

		renderWithProviders(
			<ParameterFormPageBase
				featureKey="configuracoesClientes"
				moduleTitle="Configurações > Clientes"
				modulePath="/configuracoes/clientes"
				moduleDescription="Descrição do módulo"
				contextTitle="Contexto"
				contextValue="Tenant XPTO"
				contextDescription="Descrição do contexto"
				loadErrorMessage="Erro ao carregar"
				saveErrorMessage="Erro ao salvar"
				saveSuccessMessage="Salvo com sucesso"
				sectionOrder={[
					{
						key: 'principal',
						title: 'Principal',
						description: 'Campos principais',
					},
				]}
				fieldDefinitions={[
					{
						key: 'codigo',
						section: 'principal',
						type: 'text',
						label: 'Código',
					},
					{
						key: 'nome',
						section: 'principal',
						type: 'text',
						label: 'Nome',
					},
				]}
				renderSectionContent={() => <div>Conteúdo complementar</div>}
				createEmptyValues={() => ({ codigo: '', nome: '' })}
				emptyLookups={{}}
				client={{
					get: getMock,
					save: saveMock,
				}}
			/>,
		);

		expect(await screen.findAllByText('Conteúdo complementar')).toHaveLength(1);
	});
});
