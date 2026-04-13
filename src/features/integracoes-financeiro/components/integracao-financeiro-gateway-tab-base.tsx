'use client';

import { formatFieldUpdateMeta } from '@/src/components/form-page/field-update-meta';
import { inputClasses } from '@/src/components/ui/input-styles';
import { SectionCard } from '@/src/components/ui/section-card';
import type { FinanceiroFieldMeta, FinanceiroGatewayBranchRow, GatewayPagamento } from '@/src/features/integracoes-financeiro/types/integracao-financeiro.types';
import type { TranslationFn } from '@/src/features/integracoes-financeiro/components/integracao-financeiro-clearsale-tab';

type GatewayField = 'gatewayBoleto' | 'gatewayCartao' | 'gatewayPix';

type Props = {
	title: string;
	description: string;
	helper: string;
	tipo: GatewayPagamento['tipo'];
	gateways: GatewayPagamento[];
	branches: FinanceiroGatewayBranchRow[];
	saving: boolean;
	canEdit: boolean;
	locale: string;
	t: TranslationFn;
	onChange: (branchId: string, field: GatewayField, value: string) => void;
};

function gatewayField(tipo: GatewayPagamento['tipo']): GatewayField {
	if (tipo === 'boleto_antecipado') return 'gatewayBoleto';
	if (tipo === 'cartao_credito') return 'gatewayCartao';
	return 'gatewayPix';
}

function branchMeta(branch: FinanceiroGatewayBranchRow, tipo: GatewayPagamento['tipo']): FinanceiroFieldMeta | undefined {
	if (tipo === 'boleto_antecipado') return branch.updatedAtBoleto;
	if (tipo === 'cartao_credito') return branch.updatedAtCartao;
	return branch.updatedAtPix;
}

export function IntegracaoFinanceiroGatewayTabBase({ title, description, helper, tipo, gateways, branches, saving, canEdit, locale, onChange, t }: Props) {
	const filtered = gateways.filter((gateway) => gateway.tipo === tipo);
	const field = gatewayField(tipo);

	return (
		<SectionCard title={title} description={description}>
			{branches.length ? (
				<>
					<div className="overflow-x-auto">
						<table className="w-full min-w-140 text-sm">
							<thead>
								<tr className="border-b border-line">
									<th className="w-[35%] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{t('integrationsFinancial.fields.branch', 'Filial')}</th>
									<th className="w-[40%] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
										{t('integrationsFinancial.gateway', 'Gateway de Pagamento')} *
									</th>
									<th className="w-[25%] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
										{t('integrationsFinancial.fields.lastChange', 'Ultima Alteracao')}
									</th>
								</tr>
							</thead>
							<tbody>
								{branches.map((branch) => {
									const meta = branchMeta(branch, tipo);
									return (
										<tr key={branch.id} className="border-b border-line/50">
											<td className="px-3 py-3 text-slate-700">
												{branch.nome}
												<span className="ml-1 text-slate-400">- {branch.id}</span>
											</td>
											<td className="px-3 py-3">
												<select className={inputClasses()} value={branch[field]} onChange={(event) => onChange(branch.id, field, event.target.value)} disabled={saving || !canEdit}>
													<option value="">{t('common.select', 'Selecione')}</option>
													{filtered.map((gateway) => (
														<option key={gateway.id} value={gateway.id}>
															{gateway.nome}
														</option>
													))}
												</select>
											</td>
											<td className="px-3 py-3 text-xs text-slate-500">
												{formatFieldUpdateMeta({
													metadata: meta,
													t,
													locale,
													labelKey: 'integrationsFinancial.lastUpdateValue',
													fallback: 'Última alteração: {{date}} por {{user}}',
												}) ?? '-'}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
					<p className="mt-3 text-xs leading-5 text-slate-500">{helper}</p>
				</>
			) : (
				<p className="text-sm text-slate-500">{t('common.noResults', 'Nenhuma filial cadastrada.')}</p>
			)}
		</SectionCard>
	);
}
