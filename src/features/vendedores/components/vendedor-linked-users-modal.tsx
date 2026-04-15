'use client';

import { Trash2 } from 'lucide-react';
import { AsyncState } from '@/src/components/ui/async-state';
import { OverlayModal } from '@/src/components/ui/overlay-modal';
import { useI18n } from '@/src/i18n/use-i18n';
import type { VendedorLinkedUser } from '@/src/features/vendedores/types/vendedores';

type VendedorLinkedUsersModalProps = {
	open: boolean;
	vendedorNome: string | null;
	users: VendedorLinkedUser[];
	isLoading: boolean;
	error?: string;
	canDelete: boolean;
	onClose: () => void;
	onRemove: (userId: string) => void;
};

export function VendedorLinkedUsersModal({ open, vendedorNome, users, isLoading, error, canDelete, onClose, onRemove }: VendedorLinkedUsersModalProps) {
	const { t } = useI18n();

	return (
		<OverlayModal
			open={open}
			title={
				vendedorNome
					? `${t('people.sellers.modals.linkedUsersTitle', 'Usuários vinculados')} - ${vendedorNome}`
					: t('people.sellers.modals.linkedUsersTitle', 'Usuários vinculados')
			}
			onClose={onClose}
		>
			<AsyncState isLoading={isLoading} error={error}>
				<div className="space-y-3">
					{users.length ? (
						users.map((user) => (
							<div key={user.idUsuario} className="app-pane-muted flex flex-col gap-3 rounded-[1.1rem] border px-4 py-3 md:flex-row md:items-center md:justify-between">
								<div>
									<p className="text-sm font-semibold text-[var(--app-text)]">{user.email || '-'}</p>
									<p className="mt-1 text-xs text-[var(--app-muted)]">{user.nome || '-'}</p>
								</div>
								{canDelete ? (
									<button
										type="button"
										onClick={() => onRemove(user.idUsuario)}
										className="app-button-danger inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
									>
										<Trash2 className="h-4 w-4" />
										{t('common.remove', 'Remover')}
									</button>
								) : null}
							</div>
						))
					) : (
						<div className="rounded-[1rem] border border-dashed border-[var(--app-border)] px-4 py-6 text-center text-sm text-[var(--app-muted)]">
							{t('people.sellers.modals.linkedUsersEmpty', 'Não há usuários vinculados a este vendedor.')}
						</div>
					)}
				</div>
			</AsyncState>
		</OverlayModal>
	);
}
