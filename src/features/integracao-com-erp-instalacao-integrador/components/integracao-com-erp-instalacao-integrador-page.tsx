'use client';

import Link from 'next/link';
import { Copy, Download, KeyRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AsyncState } from '@/src/components/ui/async-state';
import { PageHeader } from '@/src/components/ui/page-header';
import { PageToast } from '@/src/components/ui/page-toast';
import { SectionCard } from '@/src/components/ui/section-card';
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state';
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access';
import {
	integracaoComErpInstalacaoIntegradorClient,
	type IntegracaoComErpInstalacaoIntegradorPayload,
} from '@/src/features/integracao-com-erp-instalacao-integrador/services/integracao-com-erp-instalacao-integrador-client';
import { useI18n } from '@/src/i18n/use-i18n';
import { copyTextToClipboard } from '@/src/lib/clipboard';

export function IntegracaoComErpInstalacaoIntegradorPage() {
	const { t } = useI18n();
	const access = useFeatureAccess('erpInstalacaoIntegrador');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [feedback, setFeedback] = useState<string | null>(null);
	const [payload, setPayload] = useState<IntegracaoComErpInstalacaoIntegradorPayload>({ token: '', downloadUrl: '' });

	useEffect(() => {
		let active = true;

		async function load() {
			try {
				const result = await integracaoComErpInstalacaoIntegradorClient.get();

				if (!active) {
					return;
				}

				setPayload(result);
				setError(null);
			} catch (loadError) {
				if (!active) {
					return;
				}

				setError(
					loadError instanceof Error ? loadError.message : t('maintenance.erpIntegration.installation.feedback.loadError', 'Não foi possível carregar os dados do integrador.'),
				);
			} finally {
				if (active) {
					setLoading(false);
				}
			}
		}

		void load();

		return () => {
			active = false;
		};
	}, [t]);

	if (!access.canOpen) {
		return <AccessDeniedState title={t('maintenance.erpIntegration.modules.installation.title', 'Instalação do Integrador')} backHref="/dashboard" />;
	}

	return (
		<div className="space-y-5">
			<PageHeader
				breadcrumbs={[
					{ label: t('routes.dashboard', 'Início'), href: '/dashboard' },
					{ label: t('menuKeys.integracao-erp', 'Integração com ERP'), href: '/integracao-com-erp/dashboard' },
					{ label: t('maintenance.erpIntegration.modules.installation.breadcrumb', 'Instalação do Integrador') },
				]}
				actions={
					<Link href="/integracao-com-erp/dashboard" className="app-button-secondary inline-flex items-center rounded-full px-4 py-3 text-sm font-semibold">
						{t('common.back', 'Voltar')}
					</Link>
				}
			/>

			<AsyncState isLoading={loading} error={error}>
				<PageToast message={feedback} onClose={() => setFeedback(null)} />

				<SectionCard
					title={t('maintenance.erpIntegration.modules.installation.title', 'Instalação do Integrador')}
					description={t('maintenance.erpIntegration.modules.installation.description', 'Baixe o AgileSync e copie o token de ativação do tenant atual.')}
				>
					<div className="grid gap-4 lg:grid-cols-2">
						<div className="app-pane-muted space-y-4 rounded-[1.25rem] p-5">
							<div className="flex items-start gap-3">
								<Download className="mt-0.5 h-5 w-5 shrink-0 text-(--app-muted)" />
								<div className="space-y-1">
									<p className="text-(--app-text) text-sm font-semibold">{t('maintenance.erpIntegration.installation.downloadTitle', 'Download')}</p>
									<p className="text-(--app-muted) text-sm leading-6">
										{t('maintenance.erpIntegration.installation.downloadDescription', 'Use o instalador oficial do AgileSync e siga o assistente até a etapa de ativação.')}
									</p>
								</div>
							</div>
							<a
								href={payload.downloadUrl}
								target="_blank"
								rel="noreferrer"
								className="app-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
							>
								<Download className="h-4 w-4" />
								{t('maintenance.erpIntegration.installation.downloadButton', 'Baixar AgileSync')}
							</a>
						</div>

						<div className="app-pane-muted space-y-4 rounded-[1.25rem] p-5">
							<div className="flex items-start gap-3">
								<KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-(--app-muted)" />
								<div className="space-y-1">
									<p className="text-(--app-text) text-sm font-semibold">{t('maintenance.erpIntegration.installation.activationTitle', 'Ativação')}</p>
									<p className="text-(--app-muted) text-sm leading-6">
										{t('maintenance.erpIntegration.installation.activationDescription', 'Copie o token abaixo e cole no instalador do AgileSync para registrar o tenant atual.')}
									</p>
								</div>
							</div>
							<div className="app-control flex flex-col gap-3 rounded-2xl p-4">
								<div>
									<div className="text-(--app-muted) text-[11px] font-semibold uppercase tracking-[0.14em]">{t('maintenance.erpIntegration.installation.tokenLabel', 'Token')}</div>
									<div className="text-(--app-text) mt-2 break-all text-sm font-medium">
										{payload.token || t('maintenance.erpIntegration.installation.emptyToken', 'Token indisponível para este tenant.')}
									</div>
								</div>
								<button
									type="button"
									disabled={!payload.token}
									className="app-button-secondary inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
									onClick={() => {
										void copyTextToClipboard(payload.token)
											.then(() => setFeedback(t('maintenance.erpIntegration.installation.feedback.copySuccess', 'Token copiado com sucesso.')))
											.catch(() => setFeedback(t('maintenance.erpIntegration.installation.feedback.copyError', 'Não foi possível copiar o token.')));
									}}
								>
									<Copy className="h-4 w-4" />
									{t('maintenance.erpIntegration.installation.copyButton', 'Copiar token')}
								</button>
							</div>
						</div>
					</div>
				</SectionCard>
			</AsyncState>
		</div>
	);
}
