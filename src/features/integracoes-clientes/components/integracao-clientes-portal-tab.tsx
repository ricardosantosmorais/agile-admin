'use client';

import { FieldUpdateMeta, formatFieldUpdateMeta, type FieldUpdateMetadata } from '@/src/components/form-page/field-update-meta';
import { FormField } from '@/src/components/ui/form-field';
import { inputClasses } from '@/src/components/ui/input-styles';
import { SectionCard } from '@/src/components/ui/section-card';
import type { ClientesBranchRow, ClientesValues } from '@/src/features/integracoes-clientes/services/integracao-clientes-mappers';

type TranslationFn = (key: string, fallback: string, params?: Record<string, string>) => string;

type PortalFlagKey = 'portalPedidos' | 'portalOrcamentos' | 'portalTitulos' | 'portalNotasFiscais';

type Props = {
	branches: ClientesBranchRow[];
	initialBranches: ClientesBranchRow[];
	values: ClientesValues;
	metadata: Record<PortalFlagKey, FieldUpdateMetadata>;
	unlockedBranchIds: Set<string>;
	saving: boolean;
	canEdit: boolean;
	locale: string;
	onChangeBranchToken: (branchId: string, token: string) => void;
	onUnlockBranch: (branchId: string) => void;
	onLockBranch: (branchId: string, initialToken: string) => void;
	onPatchValue: (key: PortalFlagKey, value: string) => void;
	t: TranslationFn;
};

function PortalBranchTable({
	branches,
	initialBranches,
	unlockedBranchIds,
	saving,
	canEdit,
	locale,
	onChangeBranchToken,
	onUnlockBranch,
	onLockBranch,
	t,
}: Omit<Props, 'values' | 'metadata' | 'onPatchValue'>) {
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
							const hasExisting = Boolean(initialBranches.find((item) => item.id === branch.id)?.portalToken);
							const isUnlocked = !hasExisting || unlockedBranchIds.has(branch.id);
							const initialToken = initialBranches.find((item) => item.id === branch.id)?.portalToken ?? '';

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
												onChange={(event) => onChangeBranchToken(branch.id, event.target.value)}
												disabled={saving || !canEdit || !isUnlocked}
											/>
											{canEdit && hasExisting ? (
												<div className="flex flex-wrap gap-2">
													{!isUnlocked ? (
														<button
															type="button"
															onClick={() => onUnlockBranch(branch.id)}
															disabled={saving}
															className="app-button-secondary inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold"
														>
															{t('integrationsClients.actionsLabel.changeField', 'Alterar')}
														</button>
													) : (
														<button
															type="button"
															onClick={() => onLockBranch(branch.id, initialToken)}
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
										{formatFieldUpdateMeta({
											metadata: branch.portalTokenMeta,
											t,
											locale,
											labelKey: 'integrationsClients.lastUpdateValue',
											fallback: 'Última alteração: {{date}} por {{user}}',
										}) ?? '-'}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
			<p className="mt-3 text-xs leading-5 text-slate-500">{t('integrationsClients.sections.portal.helper', '* Token de integração fornecido pela Agile E-commerce.')}</p>
		</>
	);
}

function PortalFlagField({
	label,
	helperText,
	value,
	metadata,
	saving,
	canEdit,
	locale,
	onChange,
	t,
}: {
	label: string;
	helperText: string;
	value: string;
	metadata: FieldUpdateMetadata;
	saving: boolean;
	canEdit: boolean;
	locale: string;
	onChange: (value: string) => void;
	t: TranslationFn;
}) {
	return (
		<FormField label={label} helperText={helperText}>
			<>
				<select className={inputClasses()} value={value} onChange={(event) => onChange(event.target.value)} disabled={saving || !canEdit}>
					<option value="">{t('common.select', 'Selecione')}</option>
					<option value="1">{t('common.yes', 'Sim')}</option>
					<option value="0">{t('common.no', 'Não')}</option>
				</select>
				<FieldUpdateMeta
					as="span"
					metadata={metadata}
					t={t}
					locale={locale}
					labelKey="integrationsClients.lastUpdateValue"
					fallback="Última alteração: {{date}} por {{user}}"
					className="mt-1 block text-[11px] leading-4 text-slate-400"
				/>
			</>
		</FormField>
	);
}

export function IntegracaoClientesPortalTab(props: Props) {
	const { branches, initialBranches, values, metadata, unlockedBranchIds, saving, canEdit, locale, onChangeBranchToken, onUnlockBranch, onLockBranch, onPatchValue, t } = props;

	return (
		<SectionCard
			title={t('integrationsClients.sections.portal.title', 'Portal do Cliente')}
			description={t('integrationsClients.sections.portal.description', 'Configurações de integração com o módulo de Portal do Cliente.')}
		>
			<div className="space-y-6">
				<PortalBranchTable
					branches={branches}
					initialBranches={initialBranches}
					unlockedBranchIds={unlockedBranchIds}
					saving={saving}
					canEdit={canEdit}
					locale={locale}
					onChangeBranchToken={onChangeBranchToken}
					onUnlockBranch={onUnlockBranch}
					onLockBranch={onLockBranch}
					t={t}
				/>

				<div className="grid gap-5 border-t border-line pt-4 lg:grid-cols-2">
					<PortalFlagField
						label={t('integrationsClients.fields.portalOrders', 'Pedidos de Outros Canais')}
						helperText={t('integrationsClients.fields.portalOrdersHelper', 'Indica se ficará ativa a exibição de pedidos de outros canais de venda no Portal do Cliente')}
						value={values.portalPedidos}
						metadata={metadata.portalPedidos}
						saving={saving}
						canEdit={canEdit}
						locale={locale}
						onChange={(value) => onPatchValue('portalPedidos', value)}
						t={t}
					/>
					<PortalFlagField
						label={t('integrationsClients.fields.portalQuotes', 'Orçamentos')}
						helperText={t('integrationsClients.fields.portalQuotesHelper', 'Indica se ficará ativa a exibição de orçamentos no Portal do Cliente')}
						value={values.portalOrcamentos}
						metadata={metadata.portalOrcamentos}
						saving={saving}
						canEdit={canEdit}
						locale={locale}
						onChange={(value) => onPatchValue('portalOrcamentos', value)}
						t={t}
					/>
					<PortalFlagField
						label={t('integrationsClients.fields.portalTitles', 'Títulos')}
						helperText={t('integrationsClients.fields.portalTitlesHelper', 'Indica se ficará ativa a exibição de títulos no Portal do Cliente')}
						value={values.portalTitulos}
						metadata={metadata.portalTitulos}
						saving={saving}
						canEdit={canEdit}
						locale={locale}
						onChange={(value) => onPatchValue('portalTitulos', value)}
						t={t}
					/>
					<PortalFlagField
						label={t('integrationsClients.fields.portalInvoices', 'Notas Fiscais')}
						helperText={t('integrationsClients.fields.portalInvoicesHelper', 'Indica se ficará ativa a exibição de notas fiscais no Portal do Cliente')}
						value={values.portalNotasFiscais}
						metadata={metadata.portalNotasFiscais}
						saving={saving}
						canEdit={canEdit}
						locale={locale}
						onChange={(value) => onPatchValue('portalNotasFiscais', value)}
						t={t}
					/>
				</div>
			</div>
		</SectionCard>
	);
}
