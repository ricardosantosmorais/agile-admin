'use client';

import { ArrowLeft, RefreshCcw, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AsyncState } from '@/src/components/ui/async-state';
import { FormField } from '@/src/components/ui/form-field';
import { PageHeader } from '@/src/components/ui/page-header';
import { PageToast } from '@/src/components/ui/page-toast';
import { SectionCard } from '@/src/components/ui/section-card';
import { ToggleCard } from '@/src/components/ui/toggle-card';
import { inputClasses } from '@/src/components/ui/input-styles';
import { useAuth } from '@/src/features/auth/hooks/use-auth';
import { meusAtendimentosClient } from '@/src/features/meus-atendimentos/services/meus-atendimentos-client';
import type { IntercomBindingRecord } from '@/src/features/meus-atendimentos/services/meus-atendimentos-types';
import { useAsyncData } from '@/src/hooks/use-async-data';
import { useI18n } from '@/src/i18n/use-i18n';

const EMPTY_RECORD: IntercomBindingRecord = {
	configId: '',
	bindingId: '',
	enabled: false,
	providerAccountId: '',
	externalUserId: '',
	consentState: 'unknown',
	status: 'configured',
	bindingStatus: 'linked',
	accounts: [],
};

export function IntercomBindingPage() {
	const { t } = useI18n();
	const { session } = useAuth();
	const [form, setForm] = useState<IntercomBindingRecord>(EMPTY_RECORD);
	const [toast, setToast] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
	const [saving, setSaving] = useState(false);

	const state = useAsyncData(() => meusAtendimentosClient.getIntercomBinding(), []);

	useEffect(() => {
		if (state.data) {
			setForm(state.data);
		}
	}, [state.data]);

	function patch<K extends keyof IntercomBindingRecord>(key: K, value: IntercomBindingRecord[K]) {
		setForm((current) => ({ ...current, [key]: value }));
	}

	async function handleSave() {
		setSaving(true);
		setToast(null);

		try {
			const result = await meusAtendimentosClient.saveIntercomBinding({
				configId: form.configId,
				bindingId: form.bindingId,
				enabled: form.enabled,
				providerAccountId: form.providerAccountId,
				externalUserId: form.externalUserId,
				consentState: form.consentState,
				status: form.status,
				bindingStatus: form.bindingStatus,
			});
			setToast({ tone: 'success', message: result.message || t('clientMenu.myTickets.binding.saveSuccess', 'Vínculo do Intercom salvo com sucesso.') });
			state.reload();
		} catch (error) {
			setToast({
				tone: 'error',
				message: error instanceof Error ? error.message : t('clientMenu.myTickets.binding.saveError', 'Não foi possível salvar o vínculo do Intercom.'),
			});
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="space-y-5">
			<PageHeader
				breadcrumbs={[
					{ label: t('routes.dashboard', 'Início'), href: '/dashboard' },
					{ label: t('clientMenu.myTickets.title', 'Meus atendimentos'), href: '/meus-atendimentos' },
					{ label: t('clientMenu.myTickets.intercomBinding', 'Vínculo Intercom') },
				]}
				actions={
					<div className="flex items-center gap-2">
						<button type="button" onClick={state.reload} className="app-button-secondary inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold">
							<RefreshCcw className="h-4 w-4" />
							{t('common.refresh', 'Atualizar')}
						</button>
						<button
							type="button"
							onClick={() => window.history.back()}
							className="app-button-secondary inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold"
						>
							<ArrowLeft className="h-4 w-4" />
							{t('common.back', 'Voltar')}
						</button>
						<button
							type="button"
							onClick={() => void handleSave()}
							disabled={saving}
							className="app-button-primary inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold disabled:opacity-50"
						>
							<Save className="h-4 w-4" />
							{saving ? t('common.saving', 'Salvando...') : t('common.save', 'Salvar')}
						</button>
					</div>
				}
			/>

			{toast ? <PageToast tone={toast.tone} message={toast.message} onClose={() => setToast(null)} /> : null}

			<AsyncState isLoading={state.isLoading} error={state.error}>
				<SectionCard
					title={t('clientMenu.myTickets.binding.title', 'Vínculo operacional do Intercom')}
					description={t(
						'clientMenu.myTickets.binding.description',
						'Configura a conta do Intercom, o consentimento do canal e a identidade externa do administrador no fluxo do v2.',
					)}
				>
					<div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
						<div className="space-y-4">
							<FormField label={t('clientMenu.myTickets.binding.admin', 'Administrador')}>
								<input value={session?.user.email || session?.user.nome || ''} readOnly className={inputClasses()} />
							</FormField>

							<ToggleCard
								label={t('clientMenu.myTickets.binding.enabled', 'Canal habilitado')}
								checked={form.enabled}
								onChange={(value) => patch('enabled', value)}
								hint={t('clientMenu.myTickets.binding.enabledHint', 'Define se o canal Intercom fica ativo para o administrador atual.')}
							/>

							<FormField label={t('clientMenu.myTickets.binding.account', 'Workspace / conta')}>
								<select value={form.providerAccountId} onChange={(event) => patch('providerAccountId', event.target.value)} className={inputClasses()}>
									<option value="">{t('common.select', 'Selecione')}</option>
									{form.accounts.map((account) => (
										<option key={account.id} value={account.id}>
											{account.displayName}
										</option>
									))}
								</select>
							</FormField>

							<FormField label={t('clientMenu.myTickets.binding.externalIdentity', 'Identidade externa')}>
								<input value={form.externalUserId} onChange={(event) => patch('externalUserId', event.target.value)} placeholder="intercom-admin-123" className={inputClasses()} />
							</FormField>
						</div>

						<div className="space-y-4">
							<FormField label={t('clientMenu.myTickets.binding.consent', 'Consentimento')}>
								<select value={form.consentState} onChange={(event) => patch('consentState', event.target.value)} className={inputClasses()}>
									<option value="unknown">{t('clientMenu.myTickets.binding.consentOptions.unknown', 'Desconhecido')}</option>
									<option value="granted">{t('clientMenu.myTickets.binding.consentOptions.granted', 'Concedido')}</option>
									<option value="revoked">{t('clientMenu.myTickets.binding.consentOptions.revoked', 'Revogado')}</option>
								</select>
							</FormField>

							<FormField label={t('clientMenu.myTickets.binding.channelStatus', 'Status operacional')}>
								<select value={form.status} onChange={(event) => patch('status', event.target.value)} className={inputClasses()}>
									<option value="configured">{t('clientMenu.myTickets.binding.statusOptions.configured', 'Configurado')}</option>
									<option value="connected">{t('clientMenu.myTickets.binding.statusOptions.connected', 'Conectado')}</option>
									<option value="attention">{t('clientMenu.myTickets.binding.statusOptions.attention', 'Requer atenção')}</option>
								</select>
							</FormField>

							<FormField label={t('clientMenu.myTickets.binding.linkStatus', 'Status do vínculo')}>
								<select value={form.bindingStatus} onChange={(event) => patch('bindingStatus', event.target.value)} className={inputClasses()}>
									<option value="linked">{t('clientMenu.myTickets.binding.linkStatusOptions.linked', 'Vinculado')}</option>
									<option value="pending">{t('clientMenu.myTickets.binding.linkStatusOptions.pending', 'Pendente')}</option>
									<option value="inactive">{t('clientMenu.myTickets.binding.linkStatusOptions.inactive', 'Inativo')}</option>
								</select>
							</FormField>
						</div>
					</div>
				</SectionCard>
			</AsyncState>
		</div>
	);
}
