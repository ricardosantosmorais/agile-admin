import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TabbedParameterPageShell } from '@/src/components/form-page/tabbed-parameter-page-shell';
import { renderWithProviders } from '@/src/test/render';

const useFooterActionsVisibilityMock = vi.fn();

vi.mock('@/src/hooks/use-footer-actions-visibility', () => ({
	useFooterActionsVisibility: () => useFooterActionsVisibilityMock(),
}));

describe('TabbedParameterPageShell', () => {
	const onRefresh = vi.fn();
	const onCloseFeedback = vi.fn();
	const onSubmit = vi.fn((event: React.FormEvent<HTMLFormElement>) => event.preventDefault());
	const onTabChange = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		useFooterActionsVisibilityMock.mockReturnValue({
			footerRef: { current: null },
			isFooterVisible: false,
		});
	});

	it('submits from the header action only when there are changes', async () => {
		renderWithProviders(
			<TabbedParameterPageShell
				title="Clientes"
				description="Descrição"
				breadcrumbs={[{ label: 'Início', href: '/dashboard' }, { label: 'Clientes' }]}
				formId="tabbed-shell-form"
				loading={false}
				feedback={null}
				onCloseFeedback={onCloseFeedback}
				onRefresh={onRefresh}
				tabs={[
					{ key: 'a', label: 'Aba A' },
					{ key: 'b', label: 'Aba B' },
				]}
				activeTab="a"
				onTabChange={onTabChange}
				canSave
				hasChanges
				saving={false}
				backHref="/dashboard"
				onSubmit={onSubmit}
			>
				<div>Conteúdo</div>
			</TabbedParameterPageShell>,
		);

		const saveButtons = screen.getAllByRole('button', { name: 'Salvar' });
		fireEvent.click(saveButtons[0]);

		await waitFor(() => {
			expect(onSubmit).toHaveBeenCalledTimes(1);
		});
	});

	it('renders feedback and dispatches refresh and tab change actions', () => {
		renderWithProviders(
			<TabbedParameterPageShell
				title="Scripts"
				description="Descrição"
				breadcrumbs={[{ label: 'Início', href: '/dashboard' }, { label: 'Scripts' }]}
				formId="tabbed-shell-form"
				loading={false}
				feedback={{ tone: 'success', message: 'Salvo com sucesso' }}
				onCloseFeedback={onCloseFeedback}
				onRefresh={onRefresh}
				tabs={[
					{ key: 'head', label: 'Head' },
					{ key: 'footer', label: 'Footer' },
				]}
				activeTab="head"
				onTabChange={onTabChange}
				canSave
				hasChanges={false}
				saving={false}
				backHref="/dashboard"
				onSubmit={onSubmit}
			>
				<div>Conteúdo</div>
			</TabbedParameterPageShell>,
		);

		expect(screen.getByText('Salvo com sucesso')).toBeInTheDocument();

		fireEvent.click(screen.getAllByRole('button', { name: 'Atualizar' })[0]);
		expect(onRefresh).toHaveBeenCalledTimes(1);

		fireEvent.click(screen.getByRole('button', { name: 'Footer' }));
		expect(onTabChange).toHaveBeenCalledWith('footer');
	});
});
