'use client'

import { Eye, RefreshCcw, ShoppingCart, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import { AppDataTable } from '@/src/components/data-table/app-data-table'
import { DataTableFiltersCard } from '@/src/components/data-table/data-table-filters'
import { DataTableFilterToggleAction, DataTablePageActions } from '@/src/components/data-table/data-table-toolbar'
import type { AppDataTableColumn } from '@/src/components/data-table/types'
import { AsyncState } from '@/src/components/ui/async-state'
import { OverlayModal } from '@/src/components/ui/overlay-modal'
import { PageHeader } from '@/src/components/ui/page-header'
import { SectionCard } from '@/src/components/ui/section-card'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { pedidosAvaliacoesClient } from '@/src/features/pedidos-avaliacoes/services/pedidos-avaliacoes-client'
import {
	formatPedidoAvaliacaoCanal,
	formatPedidoAvaliacaoMotivos,
	formatPedidoAvaliacaoNotaLabel,
	formatPedidoAvaliacaoOrigem,
} from '@/src/features/pedidos-avaliacoes/services/pedidos-avaliacoes-formatters'
import type { PedidoAvaliacaoFilters, PedidoAvaliacaoRecord } from '@/src/features/pedidos-avaliacoes/services/pedidos-avaliacoes-types'
import { useAsyncData } from '@/src/hooks/use-async-data'
import { useI18n } from '@/src/i18n/use-i18n'
import { formatDateTime } from '@/src/lib/date-time'

const defaultFilters: PedidoAvaliacaoFilters = {
	page: 1,
	perPage: 15,
	orderBy: 'updated_at',
	sort: 'desc',
	id_pedido: '',
	cliente: '',
	nota: '',
	motivos: '',
	canal: '',
	origem: '',
	data_inicio: '',
	data_fim: '',
	updated_at_inicio: '',
	updated_at_fim: '',
}

function renderStars(nota: number) {
	return Array.from({ length: 5 }, (_, index) => (
		<Star key={`${nota}-${index}`} className={`h-3.5 w-3.5 ${index < nota ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
	))
}

function normalizeDetailPayload(payload: unknown) {
	if (typeof payload !== 'object' || payload === null || !('data' in payload) || !Array.isArray(payload.data)) {
		return null
	}

	const detail = payload.data[0]
	return typeof detail === 'object' && detail !== null ? detail as Record<string, unknown> : null
}

export function PedidosAvaliacoesListPage() {
	const { t } = useI18n()
	const access = useFeatureAccess('pedidos')
	const [filters, setFilters] = useState<PedidoAvaliacaoFilters>(defaultFilters)
	const [draft, setDraft] = useState<PedidoAvaliacaoFilters>(defaultFilters)
	const [expanded, setExpanded] = useState(false)
	const [selectedId, setSelectedId] = useState('')

	const listState = useAsyncData(() => pedidosAvaliacoesClient.list(filters), [filters])
	const detailState = useAsyncData(() => (selectedId ? pedidosAvaliacoesClient.getById(selectedId) : Promise.resolve(null)), [selectedId])

	function patchDraft(patch: Partial<PedidoAvaliacaoFilters>) {
		setDraft((current) => ({ ...current, ...patch, page: 1 }))
	}

	const columns = useMemo(
		() => [
			{
				id: 'idPedido',
				label: t('orders.fields.id', 'ID'),
				sortKey: 'id_pedido',
				cell: (record: PedidoAvaliacaoRecord) => (
					<div className="space-y-1">
						<div className="font-semibold text-(--app-text)">{record.idPedido || '-'}</div>
						<div className="text-xs text-(--app-muted)">#{record.id}</div>
					</div>
				),
				filter: { id: 'id_pedido', label: t('orders.fields.id', 'ID'), kind: 'text', key: 'id_pedido' as const },
			},
			{
				id: 'cliente',
				label: t('orders.fields.customer', 'Cliente'),
				cell: (record: PedidoAvaliacaoRecord) => (
					<div className="space-y-1">
						<div className="font-medium text-(--app-text)">{record.cliente.nome || '-'}</div>
						<div className="text-xs text-(--app-muted)">
							{[record.cliente.codigo && `Código: ${record.cliente.codigo}`, record.cliente.email].filter(Boolean).join(' • ') || '-'}
						</div>
					</div>
				),
				filter: { id: 'cliente', label: t('orders.fields.customer', 'Cliente'), kind: 'text', key: 'cliente' as const },
			},
			{
				id: 'nota',
				label: t('orders.ratings.averageScore', 'Nota média'),
				sortKey: 'nota',
				thClassName: 'w-[190px]',
				tdClassName: 'w-[190px]',
				cell: (record: PedidoAvaliacaoRecord) => (
					<div className="space-y-2">
						<div className="flex items-center gap-1">{renderStars(record.nota)}</div>
						<div className="inline-flex items-center rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300">
							{record.nota ? `${record.nota}/5 • ${formatPedidoAvaliacaoNotaLabel(record.nota)}` : '-'}
						</div>
					</div>
				),
				filter: {
					id: 'nota',
					label: t('orders.ratings.averageScore', 'Nota média'),
					kind: 'select',
					key: 'nota' as const,
					options: [5, 4, 3, 2, 1].map((value) => ({ value: String(value), label: `${value}/5 • ${formatPedidoAvaliacaoNotaLabel(value)}` })),
				},
			},
			{
				id: 'updatedAt',
				label: t('orders.ratings.lastUpdated', 'Última atualização'),
				sortKey: 'updated_at',
				cell: (record: PedidoAvaliacaoRecord) => <span>{record.updatedAt ? formatDateTime(record.updatedAt) : '-'}</span>,
			},
		] satisfies AppDataTableColumn<PedidoAvaliacaoRecord, PedidoAvaliacaoFilters>[],
		[t],
	)

	const filterColumns = useMemo(
		() => [
			...columns,
			{ id: 'motivos', label: t('orders.ratings.mainReason', 'Motivos'), cell: () => null, filter: { id: 'motivos', label: t('orders.ratings.mainReason', 'Motivos'), kind: 'text', key: 'motivos' as const } },
			{ id: 'canal', label: t('orders.fields.channel', 'Canal'), cell: () => null, filter: { id: 'canal', label: t('orders.fields.channel', 'Canal'), kind: 'text', key: 'canal' as const } },
			{ id: 'origem', label: t('orders.ratings.origin', 'Origem'), cell: () => null, filter: { id: 'origem', label: t('orders.ratings.origin', 'Origem'), kind: 'text', key: 'origem' as const } },
			{ id: 'periodo_criacao', label: t('orders.ratings.createdPeriod', 'Período da avaliação'), cell: () => null, filter: { id: 'periodo_criacao', label: t('orders.ratings.createdPeriod', 'Período da avaliação'), kind: 'date-range', fromKey: 'data_inicio' as const, toKey: 'data_fim' as const } },
			{ id: 'periodo_alteracao', label: t('orders.ratings.updatedPeriod', 'Período de atualização'), cell: () => null, filter: { id: 'periodo_alteracao', label: t('orders.ratings.updatedPeriod', 'Período de atualização'), kind: 'date-range', fromKey: 'updated_at_inicio' as const, toKey: 'updated_at_fim' as const } },
		] satisfies AppDataTableColumn<PedidoAvaliacaoRecord, PedidoAvaliacaoFilters>[],
		[columns, t],
	)

	if (!access.canList) {
		return <AccessDeniedState title={t('orders.ratings.ratedOrdersTitle', 'Pedidos avaliados')} backHref="/pedidos" />
	}

	return (
		<div className="space-y-5">
			<PageHeader
				breadcrumbs={[
					{ label: t('routes.dashboard', 'Home'), href: '/dashboard' },
					{ label: t('routes.pedidos', 'Pedidos'), href: '/pedidos' },
					{ label: t('orders.ratings.ratedOrdersTitle', 'Pedidos avaliados') },
				]}
				actions={<DataTablePageActions actions={[{ label: t('common.refresh', 'Atualizar'), icon: RefreshCcw, onClick: listState.reload }]} />}
			/>

			<AsyncState isLoading={listState.isLoading} error={listState.error}>
				<SectionCard
					action={(
						<div className="flex w-full items-center justify-start gap-3">
							<DataTableFilterToggleAction
								expanded={expanded}
								onClick={() => setExpanded((current) => !current)}
								collapsedLabel={t('filters.button', 'Filtros')}
								expandedLabel={t('filters.hide', 'Ocultar filtros')}
							/>
						</div>
					)}
				>
					<div className="space-y-4">
						<DataTableFiltersCard<PedidoAvaliacaoFilters>
							variant="embedded"
							columns={filterColumns as AppDataTableColumn<unknown, PedidoAvaliacaoFilters>[]}
							draft={draft}
							applied={filters}
							expanded={expanded}
							onToggleExpanded={() => setExpanded((current) => !current)}
							onApply={() => setFilters({ ...draft, page: 1 })}
							onClear={() => {
								setDraft(defaultFilters)
								setFilters(defaultFilters)
							}}
							patchDraft={(key, value) => patchDraft({ [key]: value } as Partial<PedidoAvaliacaoFilters>)}
						/>

						<AppDataTable<PedidoAvaliacaoRecord, string, PedidoAvaliacaoFilters>
							rows={listState.data?.data || []}
							getRowId={(record) => record.id}
							columns={columns}
							emptyMessage={t('orders.ratings.empty', 'Nenhuma avaliação encontrada com os filtros atuais.')}
							sort={{
								activeColumn: filters.orderBy,
								direction: filters.sort,
								onToggle: (columnId) => setFilters((current) => ({
									...current,
									orderBy: columnId,
									sort: current.orderBy === columnId && current.sort === 'asc' ? 'desc' : 'asc',
								})),
							}}
							rowActions={(record) => [
								{ id: 'view-rating', label: t('orders.ratings.viewRating', 'Detalhes da avaliação'), icon: Eye, onClick: () => setSelectedId(record.id) },
								{ id: 'view-order', label: t('orders.ratings.viewOrder', 'Abrir pedido'), icon: ShoppingCart, href: `/pedidos/${record.idPedido}`, visible: Boolean(record.idPedido) },
							]}
							mobileCard={{
								title: (record) => record.idPedido || '-',
								subtitle: (record) => record.cliente.nome || '-',
								meta: (record) => record.updatedAt ? formatDateTime(record.updatedAt) : '-',
								badges: (record) => <StatusBadge tone="info">{record.nota ? `${record.nota}/5` : '-'}</StatusBadge>,
							}}
							pagination={listState.data?.meta}
							onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
							pageSize={{
								value: filters.perPage,
								options: [15, 30, 45, 60],
								onChange: (perPage) => {
									setFilters((current) => ({ ...current, perPage, page: 1 }))
									setDraft((current) => ({ ...current, perPage, page: 1 }))
								},
							}}
						/>
					</div>
				</SectionCard>
			</AsyncState>

			<OverlayModal open={Boolean(selectedId)} title={t('orders.ratings.viewRating', 'Detalhes da avaliação')} onClose={() => setSelectedId('')} maxWidthClassName="max-w-4xl">
				<AsyncState isLoading={Boolean(selectedId) && detailState.isLoading} error={selectedId ? detailState.error : ''}>
					{(() => {
						const detail = normalizeDetailPayload(detailState.data)
						if (!detail) return null

						const cliente = typeof detail.cliente === 'object' && detail.cliente !== null ? detail.cliente as Record<string, unknown> : {}
						const usuario = typeof detail.usuario === 'object' && detail.usuario !== null ? detail.usuario as Record<string, unknown> : {}
						return (
							<div className="grid gap-5 lg:grid-cols-2">
								<div className="app-pane-muted rounded-[1rem] px-4 py-4">
									<div className="text-sm font-bold text-(--app-text)">{t('orders.ratings.identification', 'Identificação e cliente')}</div>
									<div className="mt-4 space-y-2 text-sm">
										<div><strong>ID avaliação:</strong> {String(detail.id || '-')}</div>
										<div><strong>ID pedido:</strong> {String(detail.id_pedido || '-')}</div>
										<div><strong>Cliente:</strong> {String(cliente.razao_social || cliente.nome_fantasia || '-')}</div>
										<div><strong>Código:</strong> {String(cliente.codigo || '-')}</div>
										<div><strong>E-mail:</strong> {String(cliente.email || cliente.email_contato || '-')}</div>
									</div>
								</div>
								<div className="app-pane-muted rounded-[1rem] px-4 py-4">
									<div className="text-sm font-bold text-(--app-text)">{t('orders.ratings.ratingData', 'Dados da avaliação')}</div>
									<div className="mt-4 space-y-2 text-sm">
										<div><strong>Nota:</strong> {String(detail.nota || '-')} • {formatPedidoAvaliacaoNotaLabel(Number(detail.nota || 0))}</div>
										<div><strong>Motivos:</strong> {formatPedidoAvaliacaoMotivos(String(detail.motivo || ''))}</div>
										<div><strong>Comentário:</strong> {String(detail.comentario || '-')}</div>
										<div><strong>Canal:</strong> {formatPedidoAvaliacaoCanal(String(detail.canal || ''))}</div>
										<div><strong>Origem:</strong> {formatPedidoAvaliacaoOrigem(String(detail.origem || ''))}</div>
										<div><strong>Usuário:</strong> {String(usuario.nome || usuario.name || '-')}</div>
									</div>
								</div>
							</div>
						)
					})()}
				</AsyncState>
			</OverlayModal>
		</div>
	)
}
