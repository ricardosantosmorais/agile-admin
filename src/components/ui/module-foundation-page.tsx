'use client';

import Link from 'next/link';
import { Clock3, LayoutTemplate } from 'lucide-react';
import { PageHeader } from '@/src/components/ui/page-header';
import { SectionCard } from '@/src/components/ui/section-card';
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state';
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access';
import type { FeatureKey } from '@/src/features/auth/services/permissions';
import { useI18n } from '@/src/i18n/use-i18n';

type ModuleFoundationPageProps = {
	title: string;
	description: string;
	featureKey: FeatureKey;
	legacyComponent: string;
	breadcrumbLabel: string;
	moduleSectionLabel?: string;
	moduleSectionPath?: string;
	backHref?: string;
};

export function ModuleFoundationPage({
	title,
	description,
	featureKey,
	legacyComponent,
	breadcrumbLabel,
	moduleSectionLabel,
	moduleSectionPath,
	backHref = '/dashboard',
}: ModuleFoundationPageProps) {
	const { t } = useI18n();
	const access = useFeatureAccess(featureKey);

	if (!access.canOpen) {
		return <AccessDeniedState title={title} backHref="/dashboard" />;
	}

	const breadcrumbs = [{ label: t('routes.dashboard', 'Início'), href: '/dashboard' }];
	if (moduleSectionLabel) {
		breadcrumbs.push({ label: moduleSectionLabel, href: moduleSectionPath });
	}
	breadcrumbs.push({ label: breadcrumbLabel });

	return (
		<div className="space-y-5">
			<PageHeader
				breadcrumbs={breadcrumbs}
				actions={
					<Link href={backHref} className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold">
						{t('common.back', 'Voltar')}
					</Link>
				}
			/>

			<SectionCard title={title} description={description}>
				<div className="app-pane-muted space-y-4 rounded-[1.25rem] p-5">
					<div className="flex items-start gap-3">
						<LayoutTemplate className="mt-0.5 h-5 w-5 shrink-0 text-(--app-muted)" />
						<div className="space-y-1">
							<p className="text-(--app-text) text-sm font-semibold">Estrutura base da rota concluída</p>
							<p className="text-(--app-muted) text-sm leading-6">
								Esta tela já participa do menu, do controle de acesso e da navegação protegida do v2. A migração funcional entra nas próximas fases.
							</p>
						</div>
					</div>

					<div className="grid gap-3 md:grid-cols-2">
						<div className="app-control rounded-2xl px-4 py-3">
							<div className="text-(--app-muted) text-[11px] font-semibold uppercase tracking-[0.14em]">Componente legado mapeado</div>
							<div className="text-(--app-text) mt-2 text-sm font-semibold">{legacyComponent}</div>
						</div>
						<div className="app-control rounded-2xl px-4 py-3">
							<div className="text-(--app-muted) text-[11px] font-semibold uppercase tracking-[0.14em]">Status da fase</div>
							<div className="text-(--app-text) mt-2 inline-flex items-center gap-2 text-sm font-semibold">
								<Clock3 className="h-4 w-4 text-(--app-muted)" />
								Fundação pronta
							</div>
						</div>
					</div>

					<div className="text-(--app-muted) rounded-2xl border border-(--app-card-border) border-dashed px-4 py-3 text-sm">
						Quando a implementação funcional começar, esta rota passa a receber client, bridge e UI próprios, sem precisar refazer menu, permissão ou breadcrumbs.
					</div>
				</div>
			</SectionCard>
		</div>
	);
}
