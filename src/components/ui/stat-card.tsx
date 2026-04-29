import { ArrowDownRight, ArrowUpRight, BadgePercent, DollarSign, ReceiptText, ShoppingCart } from 'lucide-react';
import { translateDashboardMetricDescription, translateDashboardMetricLabel } from '@/src/features/dashboard/services/dashboard-i18n';
import { TooltipIconButton } from '@/src/components/ui/tooltip-icon-button';
import { useI18n } from '@/src/i18n/use-i18n';
import { formatCompactCurrency, formatNumber, formatPercent } from '@/src/lib/formatters';

type StatCardProps = {
	label: string;
	labelKey?: string;
	value: number;
	variation: number;
	showComparison?: boolean;
	type?: 'currency' | 'number' | 'percent';
	description?: string;
	descriptionKey?: string;
	tone?: 'emerald' | 'sky' | 'amber' | 'rose';
	tooltip?: string;
	tooltipKey?: string;
};

const toneStyles = {
	emerald: {
		badge: 'app-badge app-badge-success',
		icon: 'app-stat-card-icon app-stat-card-icon-emerald',
		accent: 'app-stat-card-accent app-stat-card-accent-emerald',
	},
	sky: {
		badge: 'app-badge app-badge-info',
		icon: 'app-stat-card-icon app-stat-card-icon-sky',
		accent: 'app-stat-card-accent app-stat-card-accent-sky',
	},
	amber: {
		badge: 'app-badge app-badge-warning',
		icon: 'app-stat-card-icon app-stat-card-icon-amber',
		accent: 'app-stat-card-accent app-stat-card-accent-amber',
	},
	rose: {
		badge: 'app-badge app-badge-danger',
		icon: 'app-stat-card-icon app-stat-card-icon-rose',
		accent: 'app-stat-card-accent app-stat-card-accent-rose',
	},
};

function formatValue(value: number, type: 'currency' | 'number' | 'percent') {
	if (type === 'currency') return formatCompactCurrency(value);
	if (type === 'percent') return formatPercent(value);
	return formatNumber(value);
}

function renderMetricIcon(type: 'currency' | 'number' | 'percent', tone: 'emerald' | 'sky' | 'amber' | 'rose') {
	if (type === 'currency' && tone === 'amber') return <DollarSign className="h-4 w-4" />;
	if (type === 'currency') return <ReceiptText className="h-4 w-4" />;
	if (type === 'percent') return <BadgePercent className="h-4 w-4" />;
	return <ShoppingCart className="h-4 w-4" />;
}

export function StatCard({ label, labelKey, value, variation, showComparison = true, type = 'number', description, descriptionKey, tone = 'emerald', tooltip, tooltipKey }: StatCardProps) {
	const { t } = useI18n();
	const variationPositive = variation > 0;
	const VariationIcon = variationPositive ? ArrowUpRight : ArrowDownRight;
	const translatedLabel = labelKey ? t(labelKey, label) : translateDashboardMetricLabel(label, t);
	const translatedDescription = descriptionKey ? t(descriptionKey, description) : translateDashboardMetricDescription(description, t);
	const translatedTooltip = tooltipKey ? t(tooltipKey, tooltip) : tooltip;

	return (
		<article className="app-stat-card relative overflow-hidden rounded-[1.3rem] px-3.5 py-3.5">
			<div className={toneStyles[tone].accent} aria-hidden="true" />

			<div className="flex items-start justify-between gap-2.5">
				<div>
					<div className="flex items-center gap-1.5">
						<p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">{translatedLabel}</p>
						{translatedTooltip ? (
							<TooltipIconButton label={translatedTooltip}>
								<button
									type="button"
									className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-line/80 text-[10px] font-bold text-slate-500"
									aria-label={translatedLabel}
								>
									i
								</button>
							</TooltipIconButton>
						) : null}
					</div>
					<strong className="mt-2 block text-[1.7rem] font-black tracking-tight text-[color:var(--app-text)]">{formatValue(value, type)}</strong>
				</div>

				<div className={['flex h-9 w-9 items-center justify-center rounded-[1rem]', toneStyles[tone].icon].join(' ')}>{renderMetricIcon(type, tone)}</div>
			</div>

			{showComparison || translatedDescription ? (
				<div className="mt-3 flex items-center justify-between gap-2.5 border-t border-line/70 pt-2.5">
					<span className="text-[11px] leading-4 text-slate-500">
						{showComparison ? (translatedDescription ?? t('dashboard.metricDescriptions.previousPeriod', 'Comparativo com o periodo anterior.')) : translatedDescription}
					</span>
					{showComparison ? (
						<div className="flex flex-col items-end gap-0.5">
							<span className={['inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold', toneStyles[tone].badge].join(' ')}>
								<VariationIcon className="h-3 w-3" />
								{variationPositive ? '+' : ''}
								{formatPercent(variation)}
							</span>
							<span className="text-[10px] text-slate-500">{t('dashboard.vsPreviousPeriod', 'vs previous period')}</span>
						</div>
					) : null}
				</div>
			) : null}
		</article>
	);
}
