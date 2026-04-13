'use client';

import Link from 'next/link';
import { RefreshCcw, Save } from 'lucide-react';
import type { ReactNode } from 'react';
import { AsyncState } from '@/src/components/ui/async-state';
import { PageHeader } from '@/src/components/ui/page-header';
import { PageToast } from '@/src/components/ui/page-toast';
import { SectionCard } from '@/src/components/ui/section-card';
import { TabButton } from '@/src/components/ui/tab-button';
import { useFooterActionsVisibility } from '@/src/hooks/use-footer-actions-visibility';
import { useI18n } from '@/src/i18n/use-i18n';

type Breadcrumb = {
	label: string;
	href?: string;
};

type TabItem<TTabKey extends string> = {
	key: TTabKey;
	label: string;
};

type Props<TTabKey extends string> = {
	title: string;
	description: string;
	breadcrumbs: Breadcrumb[];
	formId: string;
	loading: boolean;
	error?: string | null;
	loadingTitle?: string;
	errorTitle?: string;
	feedback?: { tone: 'success' | 'error'; message: string } | null;
	onCloseFeedback: () => void;
	onRefresh: () => void | Promise<void>;
	refreshDisabled?: boolean;
	tabs: TabItem<TTabKey>[];
	activeTab: TTabKey;
	onTabChange: (tab: TTabKey) => void;
	canSave: boolean;
	hasChanges: boolean;
	saving: boolean;
	backHref: string;
	children: ReactNode;
	onSubmit: (event: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
};

export function TabbedParameterPageShell<TTabKey extends string>({
	title,
	description,
	breadcrumbs,
	formId,
	loading,
	error,
	loadingTitle,
	errorTitle,
	feedback,
	onCloseFeedback,
	onRefresh,
	refreshDisabled = false,
	tabs,
	activeTab,
	onTabChange,
	canSave,
	hasChanges,
	saving,
	backHref,
	children,
	onSubmit,
}: Props<TTabKey>) {
	const { t } = useI18n();
	const { footerRef, isFooterVisible } = useFooterActionsVisibility<HTMLDivElement>();

	return (
		<div className="space-y-6">
			{feedback ? <PageToast tone={feedback.tone} message={feedback.message} onClose={onCloseFeedback} /> : null}

			<PageHeader
				title={title}
				description={description}
				breadcrumbs={breadcrumbs}
				actions={
					<>
						<button
							type="button"
							className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"
							onClick={() => void onRefresh()}
							disabled={refreshDisabled || loading || saving}
						>
							<RefreshCcw className="h-4 w-4" />
							{t('common.refresh', 'Atualizar')}
						</button>
						{!isFooterVisible && canSave ? (
							<button
								type="button"
								className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
								onClick={() => {
									const form = document.getElementById(formId);
									if (form instanceof HTMLFormElement) {
										form.requestSubmit();
									}
								}}
								disabled={loading || saving || !hasChanges}
							>
								<Save className="h-4 w-4" />
								{saving ? t('common.saving', 'Salvando...') : t('common.save', 'Salvar')}
							</button>
						) : null}
					</>
				}
			/>

			<AsyncState isLoading={loading} error={error ?? undefined} loadingTitle={loadingTitle} errorTitle={errorTitle}>
				<form id={formId} onSubmit={(event) => void onSubmit(event)} className="space-y-5">
					<SectionCard className="px-4 py-4 md:px-5 md:py-5">
						<div className="overflow-x-auto">
							<div className="flex min-w-max items-center gap-2">
								{tabs.map((tab) => (
									<TabButton key={tab.key} active={activeTab === tab.key} label={tab.label} onClick={() => onTabChange(tab.key)} />
								))}
							</div>
						</div>
					</SectionCard>

					{children}

					<div ref={footerRef} className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-line pt-5">
						<Link href={backHref} className="app-button-secondary inline-flex items-center rounded-full px-4 py-2.5 text-sm font-semibold">
							{t('common.back', 'Voltar')}
						</Link>
						<button
							type="submit"
							className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
							disabled={!canSave || saving || !hasChanges}
						>
							<Save className="h-4 w-4" />
							{saving ? t('common.saving', 'Salvando...') : t('common.save', 'Salvar')}
						</button>
					</div>
				</form>
			</AsyncState>
		</div>
	);
}
