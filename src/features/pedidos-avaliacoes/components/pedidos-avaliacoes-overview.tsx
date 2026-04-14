'use client'

import Link from 'next/link'
import { ArrowRight, MessageSquareQuote, Star } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { AsyncState } from '@/src/components/ui/async-state'
import { SectionCard } from '@/src/components/ui/section-card'
import { pedidosAvaliacoesClient } from '@/src/features/pedidos-avaliacoes/services/pedidos-avaliacoes-client'
import {
	formatPedidoAvaliacaoMotivos,
	formatPedidoAvaliacaoNotaLabel,
} from '@/src/features/pedidos-avaliacoes/services/pedidos-avaliacoes-formatters'
import { useAsyncData } from '@/src/hooks/use-async-data'
import { useI18n } from '@/src/i18n/use-i18n'

type MotivoChartRow = {
	label: string
	value: number
	percent: number
	color: string
}

const MOTIVO_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#94a3b8']

function toInt(value: unknown) {
	return Number(value || 0)
}

function toDecimal(value: unknown) {
	const numeric = Number(value || 0)
	return Number.isFinite(numeric)
		? numeric.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
		: '0,00'
}

function buildMotivosChartRows(motivos: unknown[]): MotivoChartRow[] {
	const baseRows = motivos
		.map((entry) => entry as Record<string, unknown>)
		.map((entry) => ({
			label: formatPedidoAvaliacaoMotivos(String(entry.label || entry.motivo || '-')),
			value: toInt(entry.valor),
		}))
		.filter((entry) => entry.value > 0)
		.sort((left, right) => right.value - left.value)

	const total = baseRows.reduce((sum, item) => sum + item.value, 0)
	if (!total) {
		return []
	}

	return baseRows.slice(0, 5).map((row, index) => ({
		...row,
		percent: Number(((row.value / total) * 100).toFixed(2)),
		color: MOTIVO_COLORS[index % MOTIVO_COLORS.length],
	}))
}

function buildScoreDistribution(notas: unknown[]) {
	return [5, 4, 3, 2, 1].map((score) => {
		const row = notas.find(
			(entry) => Number((entry as Record<string, unknown>).nota || 0) === score,
		) as Record<string, unknown> | undefined

		return {
			score,
			total: toInt(row?.total),
			label: formatPedidoAvaliacaoNotaLabel(score),
		}
	})
}

function MotivoTooltip({
	active,
	payload,
}: {
	active?: boolean
	payload?: Array<{ payload: MotivoChartRow }>
}) {
	if (!active || !payload?.length) {
		return null
	}

	const row = payload[0]?.payload
	if (!row) {
		return null
	}

	return (
		<div className="rounded-[0.9rem] border border-line/60 bg-(--app-surface) px-3 py-2 shadow-[0_12px_28px_rgba(15,23,42,0.12)]">
			<div className="text-sm font-semibold text-(--app-text)">{row.label}</div>
			<div className="mt-1 text-xs text-(--app-muted)">{row.value} avaliação(ões)</div>
			<div className="text-xs font-semibold text-sky-600 dark:text-sky-300">
				{row.percent.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
			</div>
		</div>
	)
}

export function PedidosAvaliacoesOverview() {
	const { t } = useI18n()
	const dashboardState = useAsyncData(() => pedidosAvaliacoesClient.getDashboard(), [])

	const metricas = dashboardState.data?.data?.metricas || {}
	const motivos = Array.isArray(dashboardState.data?.data?.motivos) ? dashboardState.data?.data?.motivos : []
	const notas = Array.isArray(dashboardState.data?.data?.notas) ? dashboardState.data?.data?.notas : []

	const motivoRows = buildMotivosChartRows(motivos)
	const scoreDistribution = buildScoreDistribution(notas)
	const maxScoreTotal = Math.max(1, ...scoreDistribution.map((entry) => entry.total))

	const qualityRows = [
		{
			label: t('orders.ratings.positive', 'Positivas'),
			tone: 'bg-emerald-500',
			soft: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
		},
		{
			label: t('orders.ratings.neutral', 'Neutras'),
			tone: 'bg-amber-400',
			soft: 'bg-amber-400/16 text-amber-700 dark:text-amber-300',
		},
		{
			label: t('orders.ratings.negative', 'Negativas'),
			tone: 'bg-rose-500',
			soft: 'bg-rose-500/12 text-rose-700 dark:text-rose-300',
		},
	]

	return (
		<AsyncState isLoading={dashboardState.isLoading} error={dashboardState.error}>
			<SectionCard
				title={t('orders.ratings.title', 'Sinais das avaliações')}
				action={
					<Link
						href="/pedidos/avaliacoes"
						className="app-button-secondary inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold"
					>
						{t('orders.ratings.openRatedOrders', 'Abrir pedidos avaliados')}
						<ArrowRight className="h-4 w-4" />
					</Link>
				}
			>
				<div className="grid gap-3 xl:grid-cols-[0.8fr_1.24fr_0.9fr]">
					<div className="app-pane-muted flex h-full flex-col rounded-[1rem] px-4 py-3">
						<div className="grid gap-2.5">
							<div className="rounded-[0.9rem] border border-line/50 bg-(--app-surface) px-4 py-1.5">
								<div className="flex items-center justify-between gap-3">
									<div>
										<div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-(--app-muted)">
											{t('orders.ratings.totalRatings', 'Total de avaliações')}
										</div>
										<div className="mt-0.5 text-[1.9rem] leading-none font-black tracking-tight text-(--app-text)">
											{toInt(metricas.total_avaliacoes)}
										</div>
									</div>
									<div className="app-stat-card-icon app-stat-card-icon-sky inline-flex h-8.5 w-8.5 items-center justify-center rounded-2xl">
										<MessageSquareQuote className="h-4 w-4" />
									</div>
								</div>
							</div>

							<div className="rounded-[0.9rem] border border-line/50 bg-(--app-surface) px-4 py-1.5">
								<div className="flex items-center justify-between gap-3">
									<div>
										<div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-(--app-muted)">
											{t('orders.ratings.averageScore', 'Nota média')}
										</div>
										<div className="mt-0.5 flex items-end gap-2">
											<div className="text-[1.9rem] leading-none font-black tracking-tight text-(--app-text)">
												{toDecimal(metricas.nota_media)}
											</div>
											<div className="rounded-full bg-emerald-500/12 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-300">
												{formatPedidoAvaliacaoNotaLabel(Math.round(Number(metricas.nota_media || 0)))}
											</div>
										</div>
									</div>
									<div className="app-stat-card-icon app-stat-card-icon-emerald inline-flex h-8.5 w-8.5 items-center justify-center rounded-2xl">
										<Star className="h-4 w-4" />
									</div>
								</div>
							</div>
						</div>

						<div className="mt-2.5 rounded-[0.9rem] border border-line/50 bg-(--app-surface) px-4 py-3">
							<div className="mb-2 text-sm font-bold text-(--app-text)">
								{t('orders.ratings.quality', 'Qualidade das avaliações')}
							</div>

							<div className="mb-3 flex h-2.5 overflow-hidden rounded-full bg-black/6 dark:bg-white/8">
								<div className="bg-emerald-500" style={{ width: `${Number(metricas.percentual_positivas || 0)}%` }} />
								<div className="bg-amber-400" style={{ width: `${Number(metricas.percentual_neutras || 0)}%` }} />
								<div className="bg-rose-500" style={{ width: `${Number(metricas.percentual_negativas || 0)}%` }} />
							</div>

							<div className="flex flex-nowrap gap-2 overflow-hidden">
								{qualityRows.map((entry) => (
									<div
										key={entry.label}
										className={`inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-2.5 py-1.5 ${entry.soft}`}
									>
										<span className={`h-2.5 w-2.5 rounded-full ${entry.tone}`} />
										<span className="truncate text-xs font-semibold">{entry.label}</span>
									</div>
								))}
							</div>
						</div>
					</div>

					<div className="app-pane-muted flex h-full flex-col rounded-[1rem] px-4 py-3">
						<div className="mb-2 text-sm font-bold text-(--app-text)">
							{t('orders.ratings.topReasons', 'Principais motivos')}
						</div>

						<div className="grid items-center gap-4 sm:grid-cols-[190px_minmax(0,1fr)]">
							<div className="mx-auto h-[190px] w-full max-w-[190px]">
								<ResponsiveContainer width="100%" height="100%">
									<PieChart>
										<Pie
											data={motivoRows}
											dataKey="value"
											nameKey="label"
											innerRadius={60}
											outerRadius={92}
											paddingAngle={2}
											stroke="none"
										>
											{motivoRows.map((entry) => (
												<Cell key={entry.label} fill={entry.color} />
											))}
										</Pie>
										<Tooltip content={<MotivoTooltip />} />
									</PieChart>
								</ResponsiveContainer>
							</div>

							<div className="grid gap-2 sm:grid-cols-2">
								{motivoRows.length ? (
									motivoRows.map((row) => (
										<div
											key={row.label}
											className="inline-flex min-w-0 items-center gap-2 rounded-full border border-line/50 bg-(--app-surface) px-3 py-1.5"
										>
											<span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
											<span className="truncate text-xs font-semibold text-(--app-text)">{row.label}</span>
										</div>
									))
								) : (
									<div className="col-span-full text-sm text-(--app-muted)">
										{t('orders.ratings.noReasons', 'Nenhuma avaliação disponível para ranquear os motivos.')}
									</div>
								)}
							</div>
						</div>
					</div>

					<div className="app-pane-muted flex h-full flex-col rounded-[1rem] px-4 py-3">
						<div className="mb-2 flex items-center justify-between gap-2">
							<div className="text-sm font-bold text-(--app-text)">
								{t('orders.ratings.scoreDistribution', 'Faixas de nota')}
							</div>
							<div className="rounded-full bg-sky-500/10 px-2.5 py-1 text-[11px] font-semibold text-sky-600 dark:text-sky-300">
								{scoreDistribution.length} faixas
							</div>
						</div>

						<div className="space-y-3">
							{scoreDistribution.map((entry) => (
								<div key={entry.score} className="grid grid-cols-[42px_minmax(0,1fr)_20px] items-center gap-3">
									<div className="text-sm font-semibold text-(--app-text)">{entry.score}/5</div>
									<div className="space-y-1.5">
										<div className="h-2 rounded-full bg-black/6 dark:bg-white/8">
											<div
												className="h-2 rounded-full bg-sky-500"
												style={{ width: `${(entry.total / maxScoreTotal) * 100}%` }}
											/>
										</div>
										<div className="text-xs text-(--app-muted)">{entry.label}</div>
									</div>
									<div className="text-right text-sm font-semibold text-(--app-text)">{entry.total}</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</SectionCard>
		</AsyncState>
	)
}
