import {
  ArrowDownRight,
  ArrowUpRight,
  BadgePercent,
  DollarSign,
  ReceiptText,
  ShoppingCart,
} from 'lucide-react'
import { translateDashboardMetricDescription, translateDashboardMetricLabel } from '@/src/features/dashboard/services/dashboard-i18n'
import { useI18n } from '@/src/i18n/use-i18n'
import { formatCompactCurrency, formatNumber, formatPercent } from '@/src/lib/formatters'

type StatCardProps = {
  label: string
  labelKey?: string
  value: number
  variation: number
  type?: 'currency' | 'number' | 'percent'
  description?: string
  descriptionKey?: string
  tone?: 'emerald' | 'sky' | 'amber' | 'rose'
}

const toneStyles = {
  emerald: {
    badge: 'bg-emerald-50 text-emerald-700',
    icon: 'bg-emerald-50 text-emerald-600',
  },
  sky: {
    badge: 'bg-sky-50 text-sky-700',
    icon: 'bg-sky-50 text-sky-600',
  },
  amber: {
    badge: 'bg-amber-50 text-amber-700',
    icon: 'bg-amber-50 text-amber-600',
  },
  rose: {
    badge: 'bg-rose-50 text-rose-700',
    icon: 'bg-rose-50 text-rose-600',
  },
}

function formatValue(value: number, type: 'currency' | 'number' | 'percent') {
  if (type === 'currency') return formatCompactCurrency(value)
  if (type === 'percent') return formatPercent(value)
  return formatNumber(value)
}

function renderMetricIcon(type: 'currency' | 'number' | 'percent', tone: 'emerald' | 'sky' | 'amber' | 'rose') {
  if (type === 'currency' && tone === 'amber') return <DollarSign className="h-4 w-4" />
  if (type === 'currency') return <ReceiptText className="h-4 w-4" />
  if (type === 'percent') return <BadgePercent className="h-4 w-4" />
  return <ShoppingCart className="h-4 w-4" />
}

export function StatCard({
  label,
  labelKey,
  value,
  variation,
  type = 'number',
  description,
  descriptionKey,
  tone = 'emerald',
}: StatCardProps) {
  const { t } = useI18n()
  const variationPositive = variation > 0
  const VariationIcon = variationPositive ? ArrowUpRight : ArrowDownRight
  const translatedLabel = labelKey ? t(labelKey, label) : translateDashboardMetricLabel(label, t)
  const translatedDescription = descriptionKey
    ? t(descriptionKey, description)
    : translateDashboardMetricDescription(description, t)

  return (
    <article className="rounded-[1.3rem] border border-[#e8e2d7] bg-white px-3.5 py-3.5 shadow-[0_10px_24px_rgba(15,23,42,0.045)]">
      <div className="flex items-start justify-between gap-2.5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">{translatedLabel}</p>
          <strong className="mt-2 block text-[1.7rem] font-black tracking-tight text-slate-950">
            {formatValue(value, type)}
          </strong>
        </div>

        <div className={['flex h-9 w-9 items-center justify-center rounded-[1rem]', toneStyles[tone].icon].join(' ')}>
          {renderMetricIcon(type, tone)}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2.5 border-t border-[#f0ebe1] pt-2.5">
        <span className="text-[11px] leading-4 text-slate-500">
          {translatedDescription ?? t('dashboard.metricDescriptions.previousPeriod', 'Comparativo com o periodo anterior.')}
        </span>
        <span
          className={[
            'inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold',
            toneStyles[tone].badge,
          ].join(' ')}
        >
          <VariationIcon className="h-3 w-3" />
          {variationPositive ? '+' : ''}
          {formatPercent(variation)}
        </span>
      </div>
    </article>
  )
}
