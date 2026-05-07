'use client';

import { Bell, BookOpenText, Check, ChevronDown, Copy, History, LogOut, Mail, Menu, MoonStar, Search, ShieldCheck, SunMedium, UserRound, Waves } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AsyncState } from '@/src/components/ui/async-state';
import { flattenMenuItems, getMenuItems } from '@/src/components/navigation/menu-items';
import { useSessionLifecycle } from '@/src/contexts/session-lifecycle-context';
import { useAuth } from '@/src/features/auth/hooks/use-auth';
import type { NotificationReadReceipt, TopbarNotification } from '@/src/features/notifications/types/notifications';
import { useTenant } from '@/src/contexts/tenant-context';
import { useUi } from '@/src/contexts/ui-context';
import { useAsyncData } from '@/src/hooks/use-async-data';
import { SUPPORTED_LOCALES } from '@/src/i18n/config';
import { useI18n } from '@/src/i18n/use-i18n';
import { normalizeSearchValue } from '@/src/lib/text-normalization';
import { appData } from '@/src/services/app-data';

type TopbarPanel = 'none' | 'search' | 'tenant' | 'history' | 'notifications' | 'user';

function getTenantOptionLabel(nome: string, id: string, isMaster: boolean) {
	return isMaster && id ? `${nome} - ${id}` : nome;
}

function IconTooltipButton({ label, onClick, children, className = '' }: { label: string; onClick?: () => void; children: React.ReactNode; className?: string }) {
	return (
		<div className="group relative">
			<button
				type="button"
				onClick={onClick}
				className={[
					'app-button-secondary flex h-10 w-10 items-center justify-center rounded-2xl text-[color:var(--app-muted)] transition hover:border-accent/20 hover:text-accent',
					className,
				].join(' ')}
				aria-label={label}
			>
				{children}
			</button>
			<div className="pointer-events-none absolute left-1/2 top-[calc(100%+0.5rem)] hidden -translate-x-1/2 rounded-xl bg-slate-950 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-xl group-hover:block">
				{label}
			</div>
		</div>
	);
}

function InfoCopyRow({ label, value }: { label: string; value?: string }) {
	const { t } = useI18n();
	const [copied, setCopied] = useState(false);

	if (!value) {
		return null;
	}

	return (
		<div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
			<div className="min-w-0">
				<p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</p>
				<p className="truncate text-xs font-semibold text-slate-100">{value}</p>
			</div>
			<button
				type="button"
				onClick={() => {
					void navigator.clipboard.writeText(value);
					setCopied(true);
					window.setTimeout(() => setCopied(false), 1200);
				}}
				className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-slate-200 transition hover:border-white/30 hover:bg-white/10"
				aria-label={t('shell.copyLabel', 'Copiar {{label}}', { label })}
				title={copied ? t('shell.copied', 'Copiado') : t('shell.copyLabel', 'Copiar {{label}}', { label })}
			>
				<Copy className="h-3.5 w-3.5" />
			</button>
		</div>
	);
}

export function Topbar() {
	const router = useRouter();
	const { logout, session, user } = useAuth();
	const { shouldBlockUnauthenticatedRedirect } = useSessionLifecycle();
	const { currentTenant, isSwitchingTenant, switchTenant, tenants } = useTenant();
	const { theme, toggleTheme, toggleSidebar } = useUi();
	const { locale, setLocale, t } = useI18n();
	const [activePanel, setActivePanel] = useState<TopbarPanel>('none');
	const [integrationEnabled, setIntegrationEnabled] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [tenantSearchTerm, setTenantSearchTerm] = useState('');
	const [notifications, setNotifications] = useState<TopbarNotification[]>([]);
	const [pendingReadReceipts, setPendingReadReceipts] = useState<NotificationReadReceipt[]>([]);
	const [notificationsLoading, setNotificationsLoading] = useState(true);
	const [notificationsError, setNotificationsError] = useState('');
	const [tenantDebugInfo, setTenantDebugInfo] = useState<{ tenantId: string; platformToken: string } | null>(null);
	const hasLoadedNotificationsRef = useRef(false);
	const rootRef = useRef<HTMLDivElement | null>(null);
	const tenantSearchInputRef = useRef<HTMLInputElement | null>(null);
	const hasMarkedNotificationsRef = useRef(false);
	const isMarkingNotificationsRef = useRef(false);
	const tenantDebugInfoRequestRef = useRef('');
	const changelogState = useAsyncData(() => appData.shell.getChangelog(), []);
	const changelog = useMemo(() => changelogState.data ?? [], [changelogState.data]);
	const unreadNotifications = useMemo(() => notifications.filter((item) => !item.lida).length, [notifications]);
	const menuItems = useMemo(() => getMenuItems(session, locale), [locale, session]);
	const quickAccessItems = useMemo(() => flattenMenuItems(menuItems), [menuItems]);
	const filteredQuickAccessItems = useMemo(() => {
		const normalizedTerm = normalizeSearchValue(searchTerm.trim());
		if (!normalizedTerm) {
			return quickAccessItems;
		}

		return quickAccessItems.filter((item) => normalizeSearchValue(`${item.groupLabel} ${item.label}`).includes(normalizedTerm));
	}, [quickAccessItems, searchTerm]);
	const filteredTenants = useMemo(() => {
		const normalizedTerm = normalizeSearchValue(tenantSearchTerm.trim());
		if (!normalizedTerm) {
			return tenants;
		}

		return tenants.filter((tenant) => normalizeSearchValue(`${tenant.nome} ${tenant.id} ${tenant.codigo}`).includes(normalizedTerm));
	}, [tenantSearchTerm, tenants]);

	useEffect(() => {
		function handlePointerDown(event: PointerEvent) {
			if (activePanel === 'notifications') {
				return;
			}

			if (!rootRef.current?.contains(event.target as Node)) {
				setActivePanel('none');
			}
		}

		document.addEventListener('pointerdown', handlePointerDown, true);
		return () => document.removeEventListener('pointerdown', handlePointerDown, true);
	}, [activePanel]);

	useEffect(() => {
		hasLoadedNotificationsRef.current = false;
	}, [currentTenant.id, session?.currentTenant.id, user?.id]);

	useEffect(() => {
		setTenantDebugInfo(null);
		tenantDebugInfoRequestRef.current = '';
	}, [currentTenant.id, user?.id]);

	useEffect(() => {
		let isMounted = true;

		async function loadNotifications() {
			if (shouldBlockUnauthenticatedRedirect || !session) {
				if (isMounted) {
					setNotifications([]);
					setPendingReadReceipts([]);
					setNotificationsError('');
					setNotificationsLoading(false);
				}
				return;
			}

			if (activePanel !== 'notifications' && hasLoadedNotificationsRef.current) {
				if (isMounted) {
					setNotificationsLoading(false);
				}
				return;
			}

			setNotificationsLoading(true);
			setNotificationsError('');

			try {
				const response = await appData.shell.getNotifications(currentTenant.id);

				if (!isMounted) {
					return;
				}

				hasLoadedNotificationsRef.current = true;
				hasMarkedNotificationsRef.current = false;
				setNotifications(response.items);
				setPendingReadReceipts(response.pendingReadReceipts);
			} catch (error) {
				if (!isMounted) {
					return;
				}

				setNotifications([]);
				setPendingReadReceipts([]);
				setNotificationsError(error instanceof Error ? error.message : t('shell.notificationsLoadError', 'Não foi possível carregar as notificações.'));
			} finally {
				if (isMounted) {
					setNotificationsLoading(false);
				}
			}
		}

		void loadNotifications();

		return () => {
			isMounted = false;
		};
	}, [activePanel, currentTenant.id, session, shouldBlockUnauthenticatedRedirect, t]);

	useEffect(() => {
		if (activePanel !== 'tenant') {
			return;
		}

		// Aguarda o painel montar para garantir foco no campo de busca da empresa.
		window.requestAnimationFrame(() => {
			tenantSearchInputRef.current?.focus();
		});
	}, [activePanel]);

	useEffect(() => {
		let isMounted = true;

		if (activePanel !== 'user' || !user?.master || !currentTenant.id || shouldBlockUnauthenticatedRedirect) {
			return () => {
				isMounted = false;
			};
		}

		if (tenantDebugInfo?.tenantId === currentTenant.id || tenantDebugInfoRequestRef.current === currentTenant.id) {
			return () => {
				isMounted = false;
			};
		}

		tenantDebugInfoRequestRef.current = currentTenant.id;

		void appData.shell
			.getTenantDebugInfo(currentTenant.id)
			.then((info) => {
				if (!isMounted) {
					return;
				}

				setTenantDebugInfo({
					tenantId: currentTenant.id,
					platformToken: info.platformToken,
				});
			})
			.catch(() => {
				if (!isMounted) {
					return;
				}

				setTenantDebugInfo({
					tenantId: currentTenant.id,
					platformToken: '',
				});
			});

		return () => {
			isMounted = false;
		};
	}, [activePanel, currentTenant.id, shouldBlockUnauthenticatedRedirect, tenantDebugInfo?.tenantId, user?.master]);

	useEffect(() => {
		if (shouldBlockUnauthenticatedRedirect) {
			return;
		}

		if (activePanel !== 'notifications' || !pendingReadReceipts.length || hasMarkedNotificationsRef.current || isMarkingNotificationsRef.current) {
			return;
		}

		let isMounted = true;
		hasMarkedNotificationsRef.current = true;
		isMarkingNotificationsRef.current = true;

		void appData.shell
			.markNotificationsAsRead(pendingReadReceipts, currentTenant.id)
			.then(() => {
				if (!isMounted) {
					return;
				}

				const pendingIds = new Set(pendingReadReceipts.map((receipt) => receipt.id));
				setNotifications((current) => current.map((item) => (pendingIds.has(item.id) ? { ...item, lida: true } : item)));
				setPendingReadReceipts([]);
			})
			.catch(() => {
				hasMarkedNotificationsRef.current = false;
			})
			.finally(() => {
				isMarkingNotificationsRef.current = false;
			});

		return () => {
			isMounted = false;
		};
	}, [activePanel, currentTenant.id, pendingReadReceipts, shouldBlockUnauthenticatedRedirect]);

	function togglePanel(panel: TopbarPanel) {
		setActivePanel((current) => (current === panel ? 'none' : panel));
		if (panel !== 'tenant') {
			setTenantSearchTerm('');
		}
	}

	return (
		<>
			<header ref={rootRef} className="app-shell-card-modern relative z-[1] rounded-[1.45rem] px-3 py-3 lg:px-3.5">
				<div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
					<div className="flex min-w-0 items-start gap-2.5 lg:items-center xl:flex-1">
						<button
							type="button"
							onClick={toggleSidebar}
							className="app-button-secondary flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-[color:var(--app-muted)] transition hover:border-accent/20 hover:text-accent"
							aria-label={t('shell.toggleSidebar')}
						>
							<Menu className="h-4 w-4" />
						</button>

						<div className="relative min-w-0 flex-1 lg:max-w-[320px] xl:w-[320px]">
							<button
								type="button"
								onClick={() => togglePanel('tenant')}
								className="app-control-muted flex h-10 w-full items-center justify-between rounded-2xl px-3 text-left transition hover:border-accent/20"
							>
								<p className="truncate pr-3 text-[13px] font-semibold text-slate-900">{getTenantOptionLabel(currentTenant.nome, currentTenant.id, user?.master ?? false)}</p>
								<ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
							</button>

							{activePanel === 'tenant' ? (
								<div className="app-shell-card-modern absolute right-0 top-[calc(100%+0.5rem)] z-50 w-full overflow-hidden rounded-[1.5rem] p-2 shadow-2xl">
									<div className="px-2 pb-2">
										<div className="app-control-muted flex items-center gap-2 rounded-2xl px-3 py-2">
											<Search className="h-4 w-4 text-slate-400" />
											<input
												ref={tenantSearchInputRef}
												value={tenantSearchTerm}
												onChange={(event) => setTenantSearchTerm(event.target.value)}
												className="w-full border-none bg-transparent text-sm outline-none placeholder:text-slate-400"
												placeholder={t('shell.tenantSearchPlaceholder')}
											/>
										</div>
									</div>

									<div className="max-h-[320px] overflow-y-auto">
										{filteredTenants.map((tenant) => {
											const isActive = tenant.id === currentTenant.id;

											return (
												<button
													key={tenant.id}
													type="button"
													disabled={isSwitchingTenant}
													onClick={() => {
														if (tenant.id !== currentTenant.id) {
															void switchTenant(tenant.id).then(() => {
																router.push('/dashboard');
															});
														}
														setActivePanel('none');
														setTenantSearchTerm('');
													}}
													className={[
														'flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-3 text-left text-sm transition',
														isActive ? 'app-nav-group-active' : 'app-nav-hover',
													].join(' ')}
												>
													<div className="min-w-0">
														<p className="truncate font-semibold text-slate-900">{getTenantOptionLabel(tenant.nome, tenant.id, user?.master ?? false)}</p>
														<p className="truncate text-xs text-slate-500">
															{tenant.codigo} · {tenant.status || t('shell.operating', 'Operando')}
														</p>
													</div>
													{isActive ? <Check className="h-4 w-4 shrink-0" /> : null}
												</button>
											);
										})}

										{!filteredTenants.length ? <div className="px-3 py-4 text-sm text-slate-500">{t('shell.tenantEmpty')}</div> : null}
									</div>
								</div>
							) : null}
						</div>

						<div className="relative hidden min-w-0 flex-1 lg:block xl:max-w-[420px]">
							<div className="app-control-muted flex min-w-0 items-center gap-3 rounded-2xl px-3.5 py-2.5">
								<Search className="h-4 w-4 shrink-0 text-slate-400" />
								<input
									value={searchTerm}
									onChange={(event) => {
										setSearchTerm(event.target.value);
										setActivePanel('search');
									}}
									onFocus={() => setActivePanel('search')}
									className="w-full border-none bg-transparent text-[13px] outline-none placeholder:text-slate-400"
									placeholder={t('shell.quickAccessPlaceholder')}
								/>
							</div>

							{activePanel === 'search' ? (
								<div className="app-shell-card-modern absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-[1.5rem] p-2 shadow-2xl">
									<div className="max-h-[360px] overflow-y-auto">
										{filteredQuickAccessItems.length ? (
											filteredQuickAccessItems.map((item) => {
												const commonClassName = 'flex items-center justify-between gap-3 rounded-2xl px-3 py-3 text-sm transition hover:bg-surface';
												const content = (
													<>
														<div className="min-w-0">
															<p className="truncate font-semibold text-slate-900">{item.label}</p>
															{item.groupLabel ? <p className="truncate text-xs text-slate-500">{item.groupLabel}</p> : null}
														</div>
														<span className="rounded-full bg-[#eff7f3] px-2.5 py-1 text-[11px] font-semibold text-accent">{t('common.open')}</span>
													</>
												);

												const closeSearchPanel = () => {
													setActivePanel('none');
													setSearchTerm('');
												};

												if (item.action === 'logout') {
													return (
														<button
															key={`${item.groupLabel}-${item.key}`}
															type="button"
															onClick={() => {
																closeSearchPanel();
																void logout();
															}}
															className={commonClassName}
														>
															{content}
														</button>
													);
												}

												if (item.external) {
													return (
														<a key={`${item.groupLabel}-${item.key}`} href={item.to ?? '#'} target="_blank" rel="noreferrer" onClick={closeSearchPanel} className={commonClassName}>
															{content}
														</a>
													);
												}

												return (
													<Link key={`${item.groupLabel}-${item.key}`} href={item.to ?? '/'} onClick={closeSearchPanel} className={commonClassName}>
														{content}
													</Link>
												);
											})
										) : (
											<div className="px-3 py-4 text-sm text-slate-500">{t('shell.quickAccessEmpty')}</div>
										)}
									</div>
								</div>
							) : null}
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-2 sm:flex-nowrap xl:ml-4 xl:shrink-0">
						<div className="app-control flex items-center overflow-hidden rounded-2xl p-1">
							{SUPPORTED_LOCALES.map((supportedLocale) => (
								<button
									key={supportedLocale}
									type="button"
									onClick={() => setLocale(supportedLocale)}
									className={[
										'rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition',
										locale === supportedLocale ? 'bg-accent text-white' : 'text-slate-500 hover:text-slate-950',
									].join(' ')}
								>
									{t(`locales.${supportedLocale}`, supportedLocale)}
								</button>
							))}
						</div>

						<IconTooltipButton
							label={integrationEnabled ? t('shell.integrationOnline') : t('shell.integrationPaused')}
							onClick={() => setIntegrationEnabled((current) => !current)}
						>
							<span className={['inline-flex h-3 w-3 rounded-full', integrationEnabled ? 'bg-emerald-500' : 'bg-rose-500'].join(' ')} />
						</IconTooltipButton>

						<div className="hidden lg:block">
							<IconTooltipButton label={t('shell.history')} onClick={() => togglePanel('history')}>
								<History className="h-4 w-4" />
							</IconTooltipButton>
						</div>

						<IconTooltipButton label={theme === 'light' ? t('shell.enableDarkMode') : t('shell.enableLightMode')} onClick={toggleTheme}>
							{theme === 'light' ? <MoonStar className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
						</IconTooltipButton>

						<IconTooltipButton label={t('shell.notifications')} onClick={() => togglePanel('notifications')} className="relative">
							<>
								<Bell className="h-4 w-4" />
								{unreadNotifications > 0 ? (
									<span className="absolute right-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white">
										{unreadNotifications}
									</span>
								) : null}
							</>
						</IconTooltipButton>

						<div className="relative ml-auto sm:ml-0">
							<button
								type="button"
								onClick={() => togglePanel('user')}
								className="app-control flex h-10 items-center gap-2 rounded-2xl px-2 text-left text-[color:var(--app-text)] transition hover:border-accent/20 sm:px-3"
							>
								<div className="app-accent-panel flex h-8 w-8 items-center justify-center rounded-xl text-[13px] font-extrabold text-accent">{user?.avatarFallback ?? 'U'}</div>
								<div className="hidden min-w-0 xl:block">
									<p className="truncate text-[13px] font-bold leading-4">{user?.nome}</p>
									<p className="truncate text-[11px] text-slate-500">{user?.cargo}</p>
								</div>
								<ChevronDown className="hidden h-4 w-4 text-slate-400 xl:block" />
							</button>

							{activePanel === 'history' ? (
								<div className="app-shell-card-modern absolute right-[7.5rem] top-12 z-50 w-[320px] rounded-[1.5rem] p-4 shadow-2xl">
									<div className="mb-3 flex items-center gap-3">
										<div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accentSoft text-accent">
											<History className="h-4 w-4" />
										</div>
										<div>
											<p className="text-sm font-bold text-slate-950">{t('shell.latestChanges')}</p>
											<p className="text-xs text-slate-500">{t('shell.latestChangesDescription')}</p>
										</div>
									</div>

									<div className="space-y-3">
										<AsyncState isLoading={changelogState.isLoading} error={changelogState.error}>
											{changelog.map((item) => (
												<div key={item.id} className="rounded-[1.25rem] border border-line bg-surface px-4 py-3">
													<p className="text-sm font-semibold text-slate-950">{item.titulo}</p>
													<p className="mt-1 text-sm leading-6 text-slate-600">{item.descricao}</p>
												</div>
											))}
										</AsyncState>
									</div>
								</div>
							) : null}

							{activePanel === 'user' ? (
								<div className="app-shell-card-modern absolute right-0 top-12 z-50 w-[min(92vw,360px)] rounded-[1.5rem] p-4 shadow-2xl">
									<div className="rounded-[1.25rem] bg-slate-950 px-4 py-4 text-white">
										<p className="text-base font-bold">{user?.nome}</p>
										<p className="mt-1 text-sm text-slate-300">{user?.email}</p>
										<p className="mt-3 text-sm text-slate-200">{currentTenant.nome}</p>

										<div className="mt-4 flex flex-wrap gap-2 text-xs">
											<span className="rounded-full border border-white/15 px-3 py-1">{user?.cargo}</span>
											<span className="rounded-full border border-white/15 px-3 py-1">{currentTenant.codigo}</span>
											{user?.master ? <span className="rounded-full border border-white/15 px-3 py-1">{currentTenant.id}</span> : null}
										</div>

										<div className="mt-4 space-y-2">
											<InfoCopyRow label={t('shell.userCompanyCode')} value={currentTenant.codigo} />
											<InfoCopyRow label={t('shell.userCompanyId')} value={currentTenant.id} />
											<InfoCopyRow label={t('shell.userClusterHost')} value={currentTenant.clusterHost} />
											<InfoCopyRow label={t('shell.userClusterApi')} value={currentTenant.clusterApi} />
											{user?.master ? <InfoCopyRow label={t('shell.userPlatformToken')} value={tenantDebugInfo?.platformToken} /> : null}
											<InfoCopyRow label={t('shell.userLastAccess')} value={user?.ultimoAcesso} />
										</div>
									</div>

									<div className="mt-4 space-y-2 text-sm">
										<button
											type="button"
											className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-medium text-slate-700 transition hover:bg-surface hover:text-slate-950"
										>
											<ShieldCheck className="h-4 w-4" />
											{t('shell.changePassword')}
										</button>
										<button
											type="button"
											className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-medium text-slate-700 transition hover:bg-surface hover:text-slate-950"
										>
											<Mail className="h-4 w-4" />
											{t('shell.changeEmail')}
										</button>
										<button
											type="button"
											className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-medium text-slate-700 transition hover:bg-surface hover:text-slate-950"
										>
											<UserRound className="h-4 w-4" />
											{t('shell.myTickets')}
										</button>
										<button
											type="button"
											className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-medium text-slate-700 transition hover:bg-surface hover:text-slate-950"
										>
											<BookOpenText className="h-4 w-4" />
											{t('shell.knowledgeBase')}
										</button>
										<button
											type="button"
											className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-medium text-slate-700 transition hover:bg-surface hover:text-slate-950"
										>
											<Waves className="h-4 w-4" />
											{t('shell.companyActivations')}
										</button>
									</div>

									<button
										type="button"
										onClick={() => {
											void logout().finally(() => {
												router.replace('/login');
											});
										}}
										className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
									>
										<LogOut className="h-4 w-4" />
										{t('shell.logout')}
									</button>
								</div>
							) : null}
						</div>
					</div>
				</div>
			</header>

			{activePanel === 'notifications' ? (
				<div className="fixed inset-0 z-[60] flex items-start justify-end bg-slate-950/30 p-4 backdrop-blur-sm" onClick={() => setActivePanel('none')}>
					<div className="app-shell-card-modern w-full max-w-[420px] rounded-[2rem] p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
						<div className="flex items-center justify-between gap-3">
							<div>
								<p className="text-lg font-extrabold text-slate-950">{t('shell.notifications')}</p>
								<p className="text-sm text-slate-500">{t('shell.notificationsSummary')}</p>
							</div>
							<span className="rounded-full bg-accentSoft px-3 py-1 text-xs font-semibold text-accent">
								{t('shell.newNotifications', undefined, { count: unreadNotifications })}
							</span>
						</div>

						<div className="mt-5 space-y-3">
							<AsyncState isLoading={notificationsLoading} error={notificationsError}>
								{notifications.length ? (
									notifications.map((notification) => (
										<Link
											key={notification.id}
											href={`/notificacoes/${notification.id}`}
											onClick={() => setActivePanel('none')}
											className={[
												'block rounded-[1.5rem] border px-4 py-4 transition hover:border-accent/20 hover:shadow-sm',
												notification.lida ? 'border-line bg-white' : 'border-accent/20 bg-accentSoft/60',
											].join(' ')}
										>
											<div className="flex items-start justify-between gap-3">
												<p className="text-sm font-semibold text-slate-950">{notification.titulo}</p>
												<span className="text-xs font-medium text-slate-500">{notification.data}</span>
											</div>
											<p className="mt-2 text-sm leading-6 text-slate-600">{notification.descricao}</p>
										</Link>
									))
								) : (
									<div className="rounded-[1.5rem] border border-dashed border-line bg-surface px-4 py-6 text-center text-sm text-slate-500">{t('shell.notificationsEmpty')}</div>
								)}
							</AsyncState>
						</div>
					</div>
				</div>
			) : null}
		</>
	);
}
