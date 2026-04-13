'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { TabbedParameterPageShell } from '@/src/components/form-page/tabbed-parameter-page-shell';
import { FormField } from '@/src/components/ui/form-field';
import { inputClasses } from '@/src/components/ui/input-styles';
import { SectionCard } from '@/src/components/ui/section-card';
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state';
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access';
import { useAuth } from '@/src/features/auth/hooks/use-auth';
import { useI18n } from '@/src/i18n/use-i18n';
import { integracaoClientesClient } from '../services/integracao-clientes-client';
import {
	createEmptyIntegracaoClientesRecord,
	type ClientesBranchRow,
	type ClientesFieldMeta,
	type ClientesValues,
	type IntegracaoClientesRecord,
} from '../services/integracao-clientes-mappers';

type TabKey = 'cnpja' | 'portal';
type TFn = ReturnType<typeof useI18n>['t'];

const LEGACY_LOCKED_TENANT_ID = '1705083119553379';

function formatUpdateMeta(meta: ClientesFieldMeta | undefined, t: TFn) {
	if (!meta?.updatedAt || !meta.updatedBy) return null;
	return (
		<span className="mt-1 block text-[11px] leading-4 text-slate-400">
			{t('integrationsClients.lastUpdateValue', 'Última alteração: {{date}} por {{user}}').replace('{{date}}', meta.updatedAt).replace('{{user}}', meta.updatedBy)}
		</span>
	);
}

// -- Sensitive field (global) -----------------------------------------------

type SensitiveFieldProps = {
	value: string;
	hasExistingValue: boolean;
	editable: boolean;
	saving: boolean;
	canEdit: boolean;
	meta: ClientesFieldMeta | undefined;
	onChange: (v: string) => void;
	onEnable: () => void;
	onCancel: () => void;
	t: TFn;
};

function SensitiveField({ value, hasExistingValue, editable, saving, canEdit, meta, onChange, onEnable, onCancel, t }: SensitiveFieldProps) {
	return (
		<div className="space-y-2">
			<input type="text" className={inputClasses()} value={value} onChange={(e) => onChange(e.target.value)} disabled={saving || !canEdit || !editable} />
			{formatUpdateMeta(meta, t)}
			{canEdit && hasExistingValue ? (
				<div className="flex flex-wrap gap-2">
					{!editable ? (
						<button type="button" onClick={onEnable} disabled={saving} className="app-button-secondary inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold">
							{t('integrationsClients.actionsLabel.changeField', 'Alterar')}
						</button>
					) : (
						<button type="button" onClick={onCancel} disabled={saving} className="app-button-secondary inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold">
							{t('integrationsClients.actionsLabel.cancelChange', 'Cancelar alteração')}
						</button>
					)}
				</div>
			) : null}
		</div>
	);
}

// -- Portal per-branch table ------------------------------------------------

type PortalBranchTableProps = {
	branches: ClientesBranchRow[];
	initialBranches: ClientesBranchRow[];
	unlockedBranchIds: Set<string>;
	saving: boolean;
	canEdit: boolean;
	helper: string;
	onChange: (branchId: string, token: string) => void;
	onUnlock: (branchId: string) => void;
	onLock: (branchId: string, initial: string) => void;
	t: TFn;
};

function PortalBranchTable({ branches, initialBranches, unlockedBranchIds, saving, canEdit, helper, onChange, onUnlock, onLock, t }: PortalBranchTableProps) {
	if (!branches.length) {
		return <p className="text-sm text-slate-500">{t('common.noResults', 'Nenhuma filial cadastrada.')}</p>;
	}

	return (
		<>
			<div className="overflow-x-auto">
				<table className="w-full min-w-140 text-sm">
					<thead>
						<tr className="border-b border-line">
							<th className="w-[30%] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t('integrationsClients.fields.branchColumn', 'Filial')}</th>
							<th className="w-[45%] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t('integrationsClients.fields.tokenColumn', 'Token *')}</th>
							<th className="w-[25%] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
								{t('integrationsClients.fields.lastChangeColumn', 'Última Alteração')}
							</th>
						</tr>
					</thead>
					<tbody>
						{branches.map((branch) => {
							const hasExisting = Boolean(initialBranches.find((b) => b.id === branch.id)?.portalToken);
							const isUnlocked = !hasExisting || unlockedBranchIds.has(branch.id);
							const initialToken = initialBranches.find((b) => b.id === branch.id)?.portalToken ?? '';

							return (
								<tr key={branch.id} className="border-b border-line/50">
									<td className="px-3 py-3 text-slate-700">
										{branch.nome}
										<span className="ml-1 text-slate-400">- {branch.id}</span>
									</td>
									<td className="px-3 py-3">
										<div className="space-y-2">
											<input
												type="text"
												className={inputClasses()}
												value={branch.portalToken}
												onChange={(e) => onChange(branch.id, e.target.value)}
												disabled={saving || !canEdit || !isUnlocked}
											/>
											{canEdit && hasExisting ? (
												<div className="flex flex-wrap gap-2">
													{!isUnlocked ? (
														<button
															type="button"
															onClick={() => onUnlock(branch.id)}
															disabled={saving}
															className="app-button-secondary inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold"
														>
															{t('integrationsClients.actionsLabel.changeField', 'Alterar')}
														</button>
													) : (
														<button
															type="button"
															onClick={() => onLock(branch.id, initialToken)}
															disabled={saving}
															className="app-button-secondary inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold"
														>
															{t('integrationsClients.actionsLabel.cancelChange', 'Cancelar alteração')}
														</button>
													)}
												</div>
											) : null}
										</div>
									</td>
									<td className="px-3 py-3 text-xs text-slate-500">
										{branch.portalTokenMeta.updatedAt && branch.portalTokenMeta.updatedBy ? (
											<>
												{branch.portalTokenMeta.updatedAt}
												<br />
												<span className="text-slate-400">por {branch.portalTokenMeta.updatedBy}</span>
											</>
										) : (
											'-'
										)}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
			<p className="mt-3 text-xs leading-5 text-slate-500">{helper}</p>
		</>
	);
}

// -- Page -------------------------------------------------------------------

export function IntegracaoClientesPage() {
	const { t } = useI18n();
	const { session, user } = useAuth();
	const access = useFeatureAccess('integracoesClientes');

	const [record, setRecord] = useState<IntegracaoClientesRecord>(createEmptyIntegracaoClientesRecord());
	const [initialRecord, setInitialRecord] = useState<IntegracaoClientesRecord>(createEmptyIntegracaoClientesRecord());
	const [values, setValues] = useState<ClientesValues>(createEmptyIntegracaoClientesRecord().values);
	const [branches, setBranches] = useState<ClientesBranchRow[]>([]);
	const [activeTab, setActiveTab] = useState<TabKey>('cnpja');
	const [cnpjaTokenEditable, setCnpjaTokenEditable] = useState(false);
	const [unlockedBranchIds, setUnlockedBranchIds] = useState<Set<string>>(new Set());
	const [saving, setSaving] = useState(false);
	const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
	const [error, setError] = useState<Error | null>(null);
	const [loading, setLoading] = useState(true);

	const canEdit = useMemo(() => {
		if (!session || !user) return false;
		if (session.currentTenant.id === LEGACY_LOCKED_TENANT_ID && !user.master) return false;
		return access?.canEdit ?? false;
	}, [session, user, access]);

	const loadData = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const loaded = await integracaoClientesClient.get();
			setRecord(loaded);
			setInitialRecord(loaded);
			setValues(loaded.values);
			setBranches(loaded.branches);
			setCnpjaTokenEditable(!loaded.values.cnpjaToken);
			setUnlockedBranchIds(new Set());
		} catch (err) {
			setError(err instanceof Error ? err : new Error(t('integrationsClients.feedback.loadError', 'Não foi possível carregar as configurações.')));
		} finally {
			setLoading(false);
		}
	}, [t]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const hasChanges = useMemo(() => {
		if (JSON.stringify(values) !== JSON.stringify(initialRecord.values)) return true;
		if (unlockedBranchIds.size > 0) {
			for (const branchId of unlockedBranchIds) {
				const current = branches.find((b) => b.id === branchId);
				const initial = initialRecord.branches.find((b) => b.id === branchId);
				if (current?.portalToken !== initial?.portalToken) return true;
			}
		}
		return false;
	}, [values, initialRecord, branches, unlockedBranchIds]);

	const canSave = canEdit && hasChanges;

	const handleRefresh = useCallback(() => {
		loadData();
	}, [loadData]);

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			if (!canSave) return;
			try {
				setSaving(true);
				setFeedback(null);
				await integracaoClientesClient.save(values, branches, {
					includeCnpjaToken: cnpjaTokenEditable,
					unlockedBranchIds,
				});
				const refreshed = await integracaoClientesClient.get();
				setRecord(refreshed);
				setInitialRecord(refreshed);
				setValues(refreshed.values);
				setBranches(refreshed.branches);
				setCnpjaTokenEditable(!refreshed.values.cnpjaToken);
				setUnlockedBranchIds(new Set());
				setFeedback({ tone: 'success', message: t('integrationsClients.feedback.saveSuccess', 'Configurações salvas com sucesso.') });
			} catch (err) {
				setFeedback({
					tone: 'error',
					message: err instanceof Error ? err.message : t('integrationsClients.feedback.saveError', 'Erro ao salvar.'),
				});
			} finally {
				setSaving(false);
			}
		},
		[branches, canSave, cnpjaTokenEditable, t, unlockedBranchIds, values],
	);

	function patchValues<K extends keyof ClientesValues>(key: K, value: ClientesValues[K]) {
		setValues((prev) => ({ ...prev, [key]: value }));
	}

	function updateBranchToken(branchId: string, token: string) {
		setBranches((prev) => prev.map((b) => (b.id === branchId ? { ...b, portalToken: token } : b)));
	}

	function unlockBranch(branchId: string) {
		setUnlockedBranchIds((prev) => new Set([...prev, branchId]));
		setBranches((prev) => prev.map((b) => (b.id === branchId ? { ...b, portalToken: '' } : b)));
	}

	function lockBranch(branchId: string, initialToken: string) {
		setUnlockedBranchIds((prev) => {
			const next = new Set(prev);
			next.delete(branchId);
			return next;
		});
		setBranches((prev) => prev.map((b) => (b.id === branchId ? { ...b, portalToken: initialToken } : b)));
	}

	const breadcrumbs = useMemo(
		() => [
			{ label: t('routes.dashboard', 'Home'), href: '/dashboard' },
			{ label: t('menuKeys.integracoes', 'Integrações') },
			{ label: t('integrationsClients.title', 'Clientes'), href: '/integracoes/clientes' },
		],
		[t],
	);

	const tabs = useMemo(
		() => [
			{ key: 'cnpja' as const, label: t('integrationsClients.tabs.cnpja', 'CNPJá') },
			{ key: 'portal' as const, label: t('integrationsClients.tabs.portal', 'Portal do Cliente') },
		],
		[t],
	);

	if (!access?.canView) {
		return <AccessDeniedState title={t('integrationsClients.title', 'Integrações > Clientes')} />;
	}

	return (
		<TabbedParameterPageShell
			breadcrumbs={breadcrumbs}
			title={t('integrationsClients.title', 'Clientes')}
			description={t('integrationsClients.description', 'Gerencie integrações de consulta cadastral e Portal do Cliente da empresa ativa.')}
			formId="integracao-clientes-form"
			loading={loading}
			error={error?.message}
			feedback={feedback}
			onCloseFeedback={() => setFeedback(null)}
			onRefresh={handleRefresh}
			tabs={tabs}
			activeTab={activeTab}
			onTabChange={setActiveTab}
			canSave={canSave}
			hasChanges={hasChanges}
			saving={saving}
			backHref="/dashboard"
			onSubmit={handleSubmit}
		>
			{activeTab === 'cnpja' ? (
				<SectionCard
					title={t('integrationsClients.sections.cnpja.title', 'Consulta de Dados Cadastrais - CNPJá')}
					description={t(
						'integrationsClients.sections.cnpja.description',
						'Configurações de integração com a CNPJá para consulta de dados cadastrais na Receita Federal e Sintegra.',
					)}
				>
					<div className="max-w-lg">
						<FormField
							label={t('integrationsClients.fields.token', 'Token')}
							helperText={t('integrationsClients.fields.tokenHelper', 'Token fornecido pelo CNPJá')}
							asLabel={false}
						>
							<SensitiveField
								value={values.cnpjaToken}
								hasExistingValue={Boolean(initialRecord.values.cnpjaToken)}
								editable={cnpjaTokenEditable}
								saving={saving}
								canEdit={canEdit}
								meta={record.metadata.cnpjaToken}
								onChange={(v) => patchValues('cnpjaToken', v)}
								onEnable={() => {
									setCnpjaTokenEditable(true);
									patchValues('cnpjaToken', '');
								}}
								onCancel={() => {
									setCnpjaTokenEditable(false);
									patchValues('cnpjaToken', initialRecord.values.cnpjaToken);
								}}
								t={t}
							/>
						</FormField>
					</div>
				</SectionCard>
			) : null}

			{activeTab === 'portal' ? (
				<SectionCard
					title={t('integrationsClients.sections.portal.title', 'Portal do Cliente')}
					description={t('integrationsClients.sections.portal.description', 'Configurações de integração com o módulo de Portal do Cliente.')}
				>
					<div className="space-y-6">
						<PortalBranchTable
							branches={branches}
							initialBranches={initialRecord.branches}
							unlockedBranchIds={unlockedBranchIds}
							saving={saving}
							canEdit={canEdit}
							helper={t('integrationsClients.sections.portal.helper', '* Token de integração fornecido pela Agile E-commerce.')}
							onChange={updateBranchToken}
							onUnlock={unlockBranch}
							onLock={lockBranch}
							t={t}
						/>

						<div className="grid gap-5 lg:grid-cols-2 pt-4 border-t border-line">
							<FormField
								label={t('integrationsClients.fields.portalOrders', 'Pedidos de Outros Canais')}
								helperText={t('integrationsClients.fields.portalOrdersHelper', 'Indica se ficará ativa a exibição de pedidos de outros canais de venda no Portal do Cliente')}
							>
								<>
									<select className={inputClasses()} value={values.portalPedidos} onChange={(e) => patchValues('portalPedidos', e.target.value)} disabled={saving || !canEdit}>
										<option value="">{t('common.select', 'Selecione')}</option>
										<option value="1">{t('common.yes', 'Sim')}</option>
										<option value="0">{t('common.no', 'Não')}</option>
									</select>
									{formatUpdateMeta(record.metadata.portalPedidos, t)}
								</>
							</FormField>

							<FormField
								label={t('integrationsClients.fields.portalQuotes', 'Orçamentos')}
								helperText={t('integrationsClients.fields.portalQuotesHelper', 'Indica se ficará ativa a exibição de orçamentos no Portal do Cliente')}
							>
								<>
									<select
										className={inputClasses()}
										value={values.portalOrcamentos}
										onChange={(e) => patchValues('portalOrcamentos', e.target.value)}
										disabled={saving || !canEdit}
									>
										<option value="">{t('common.select', 'Selecione')}</option>
										<option value="1">{t('common.yes', 'Sim')}</option>
										<option value="0">{t('common.no', 'Não')}</option>
									</select>
									{formatUpdateMeta(record.metadata.portalOrcamentos, t)}
								</>
							</FormField>

							<FormField
								label={t('integrationsClients.fields.portalTitles', 'Títulos')}
								helperText={t('integrationsClients.fields.portalTitlesHelper', 'Indica se ficará ativa a exibição de títulos no Portal do Cliente')}
							>
								<>
									<select className={inputClasses()} value={values.portalTitulos} onChange={(e) => patchValues('portalTitulos', e.target.value)} disabled={saving || !canEdit}>
										<option value="">{t('common.select', 'Selecione')}</option>
										<option value="1">{t('common.yes', 'Sim')}</option>
										<option value="0">{t('common.no', 'Não')}</option>
									</select>
									{formatUpdateMeta(record.metadata.portalTitulos, t)}
								</>
							</FormField>

							<FormField
								label={t('integrationsClients.fields.portalInvoices', 'Notas Fiscais')}
								helperText={t('integrationsClients.fields.portalInvoicesHelper', 'Indica se ficará ativa a exibição de notas fiscais no Portal do Cliente')}
							>
								<>
									<select
										className={inputClasses()}
										value={values.portalNotasFiscais}
										onChange={(e) => patchValues('portalNotasFiscais', e.target.value)}
										disabled={saving || !canEdit}
									>
										<option value="">{t('common.select', 'Selecione')}</option>
										<option value="1">{t('common.yes', 'Sim')}</option>
										<option value="0">{t('common.no', 'Não')}</option>
									</select>
									{formatUpdateMeta(record.metadata.portalNotasFiscais, t)}
								</>
							</FormField>
						</div>
					</div>
				</SectionCard>
			) : null}
		</TabbedParameterPageShell>
	);
}
