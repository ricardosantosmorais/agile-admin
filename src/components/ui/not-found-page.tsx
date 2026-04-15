'use client';

import Link from 'next/link';
import { useI18n } from '@/src/i18n/use-i18n';

export function NotFoundPage() {
	const { t } = useI18n();

	return (
		<div className="flex min-h-screen items-center justify-center p-6">
			<div className="app-shell-card-modern max-w-lg rounded-3xl px-8 py-10 text-center">
				<p className="app-accent-panel inline-flex rounded-full px-3 py-1 text-sm font-semibold uppercase tracking-[0.22em] text-accent">404</p>
				<h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">{t('notFoundPage.title', 'Página não encontrada')}</h1>
				<p className="mt-4 text-sm leading-6 text-slate-600">
					{t('notFoundPage.description', 'Esta rota ainda não existe no admin novo. A base já está preparada para ampliarmos os módulos daqui em diante.')}
				</p>
				<Link href="/dashboard" className="app-button-primary mt-8 inline-flex rounded-full px-5 py-3 text-sm font-bold">
					{t('notFoundPage.back', 'Voltar para o dashboard')}
				</Link>
			</div>
		</div>
	);
}
