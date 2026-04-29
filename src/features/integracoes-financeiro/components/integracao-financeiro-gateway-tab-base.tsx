'use client';

import { formatFieldUpdateMeta } from '@/src/components/form-page/field-update-meta';
import { InlineDataTable, type InlineDataTableColumn } from '@/src/components/ui/inline-data-table';
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
	const columns: Array<InlineDataTableColumn<FinanceiroGatewayBranchRow>> = [
		{
			id: 'branch',
			header: t('integrationsFinancial.fields.branch', 'Filial'),
			cell: (branch) => (
				<span className="text-slate-700">
					{branch.nome}
					<span className="ml-1 text-slate-400">- {branch.id}</span>
				</span>
			),
			cellClassName: 'min-w-[240px]',
		},
		{
			id: 'gateway',
			header: (
				<>
					{t('integrationsFinancial.gateway', 'Gateway de Pagamento')} *
				</>
			),
			cell: (branch) => (
				<select className={inputClasses()} value={branch[field]} onChange={(event) => onChange(branch.id, field, event.target.value)} disabled={saving || !canEdit}>
					<option value="">{t('common.select', 'Selecione')}</option>
					{filtered.map((gateway) => (
						<option key={gateway.id} value={gateway.id}>
							{gateway.nome}
						</option>
					))}
				</select>
			),
			cellClassName: 'min-w-[320px]',
		},
		{
			id: 'lastChange',
			header: t('integrationsFinancial.fields.lastChange', 'Ultima Alteracao'),
			cell: (branch) => (
				<span className="text-xs text-slate-500">
					{formatFieldUpdateMeta({
						metadata: branchMeta(branch, tipo),
						t,
						locale,
						labelKey: 'integrationsFinancial.lastUpdateValue',
						fallback: 'Última alteração: {{date}} por {{user}}',
					}) ?? '-'}
				</span>
			),
			cellClassName: 'min-w-[220px]',
		},
	];

	return (
		<SectionCard title={title} description={description}>
			{branches.length ? (
				<>
					<InlineDataTable
						rows={branches}
						getRowId={(branch) => branch.id}
						columns={columns}
						emptyMessage={t('common.noResults', 'Nenhuma filial cadastrada.')}
						minWidthClassName="min-w-[780px]"
					/>
					<p className="mt-3 text-xs leading-5 text-slate-500">{helper}</p>
				</>
			) : (
				<p className="text-sm text-slate-500">{t('common.noResults', 'Nenhuma filial cadastrada.')}</p>
			)}
		</SectionCard>
	);
}
