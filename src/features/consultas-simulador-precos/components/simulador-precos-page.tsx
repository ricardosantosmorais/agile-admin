'use client'

import { Play, RefreshCcw } from 'lucide-react'
import { useState } from 'react'
import { CurrencyInput } from '@/src/components/ui/currency-input'
import { DynamicResultGrid } from '@/src/components/ui/dynamic-result-grid'
import { FormField } from '@/src/components/ui/form-field'
import { inputClasses } from '@/src/components/ui/input-styles'
import { LookupSelect, type LookupOption } from '@/src/components/ui/lookup-select'
import { PageHeader } from '@/src/components/ui/page-header'
import { PageToast } from '@/src/components/ui/page-toast'
import { SectionCard } from '@/src/components/ui/section-card'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { simuladorPrecosClient } from '@/src/features/consultas-simulador-precos/services/simulador-precos-client'
import type {
	SimuladorPrecosDraft,
	SimuladorPrecosResult,
} from '@/src/features/consultas-simulador-precos/services/simulador-precos-types'
import { useI18n } from '@/src/i18n/use-i18n'

const DEFAULT_DRAFT: SimuladorPrecosDraft = {
	id_produto: '',
	id_embalagem: '',
	quantidade: '1',
	valor_frete_item: '',
	id_filial: '',
	id_forma_pagamento: '',
	id_condicao_pagamento: '',
	id_cliente: '',
	id_vendedor: '',
}

export function SimuladorPrecosPage() {
	const { t } = useI18n()
	const access = useFeatureAccess('consultasSimuladorPrecos')
	const [draft, setDraft] = useState<SimuladorPrecosDraft>(DEFAULT_DRAFT)
	const [produto, setProduto] = useState<LookupOption | null>(null)
	const [embalagem, setEmbalagem] = useState<LookupOption | null>(null)
	const [filial, setFilial] = useState<LookupOption | null>(null)
	const [formaPagamento, setFormaPagamento] = useState<LookupOption | null>(null)
	const [condicaoPagamento, setCondicaoPagamento] = useState<LookupOption | null>(null)
	const [cliente, setCliente] = useState<LookupOption | null>(null)
	const [vendedor, setVendedor] = useState<LookupOption | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [result, setResult] = useState<SimuladorPrecosResult | null>(null)
	const [toast, setToast] = useState<{ tone: 'success' | 'error'; message: string | null }>({
		tone: 'success',
		message: null,
	})

	if (!access.canOpen) {
		return <AccessDeniedState title={t('consultasPages.priceSimulator.title', 'Simulador de Preços')} />
	}

	function patchDraft<K extends keyof SimuladorPrecosDraft>(key: K, value: SimuladorPrecosDraft[K]) {
		setDraft((current) => ({ ...current, [key]: value }))
	}

	function resetForm() {
		setDraft(DEFAULT_DRAFT)
		setProduto(null)
		setEmbalagem(null)
		setFilial(null)
		setFormaPagamento(null)
		setCondicaoPagamento(null)
		setCliente(null)
		setVendedor(null)
		setResult(null)
		setToast({ tone: 'success', message: null })
	}

	async function handleSubmit() {
		setIsSubmitting(true)
		try {
			const response = await simuladorPrecosClient.simulate(draft)
			setResult(response.data)
			setToast({ tone: 'success', message: null })
		} catch (error) {
			setToast({
				tone: 'error',
				message: error instanceof Error ? error.message : 'Não foi possível simular o preço do produto.',
			})
		} finally {
			setIsSubmitting(false)
		}
	}

	const emptyMessage = t('consultasPages.priceSimulator.emptySection', 'Nenhum dado encontrado nesta seção.')

	return (
		<div className="space-y-5">
			<PageHeader
				title={t('consultasPages.priceSimulator.title', 'Simulador de Preços')}
				breadcrumbs={[
					{ label: t('routes.dashboard', 'Home'), href: '/dashboard' },
					{ label: t('menuKeys.consultas', 'Consultas') },
					{ label: t('consultasPages.priceSimulator.title', 'Simulador de Preços') },
				]}
			/>

			<SectionCard
				title={t('consultasPages.priceSimulator.title', 'Simulador de Preços')}
				description={t(
					'consultasPages.priceSimulator.description',
					'Consulta operacional para validar a composição de preço do produto com filial, pagamento, cliente e vendedor.',
				)}
				action={
					<div className="flex flex-wrap gap-2">
						<button
							type="button"
							onClick={resetForm}
							className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
						>
							<RefreshCcw className="h-4 w-4" />
							{t('common.clear', 'Limpar')}
						</button>
						<button
							type="button"
							onClick={() => void handleSubmit()}
							disabled={isSubmitting}
							className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
						>
							<Play className="h-4 w-4" />
							{t('consultasPages.priceSimulator.submit', 'Consultar')}
						</button>
					</div>
				}
			>
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					<FormField label={t('consultasPages.priceSimulator.fields.productId', 'ID do produto')} required>
						<LookupSelect
							label={t('consultasPages.priceSimulator.fields.productId', 'ID do produto')}
							value={produto}
							onChange={(value) => {
								setProduto(value)
								setEmbalagem(null)
								patchDraft('id_produto', value?.id || '')
								patchDraft('id_embalagem', '')
							}}
							loadOptions={(query, page, perPage) => simuladorPrecosClient.loadLookupOptions('produtos', query, page, perPage)}
						/>
					</FormField>

					<FormField label={t('consultasPages.priceSimulator.fields.packageId', 'ID da embalagem')}>
						<LookupSelect
							label={t('consultasPages.priceSimulator.fields.packageId', 'ID da embalagem')}
							value={embalagem}
							onChange={(value) => {
								setEmbalagem(value)
								patchDraft('id_embalagem', value?.id || '')
							}}
							loadOptions={(query, page, perPage) =>
								simuladorPrecosClient.loadPackagingOptions(draft.id_produto, query, page, perPage)
							}
							disabled={!draft.id_produto}
						/>
					</FormField>

					<FormField label={t('consultasPages.priceSimulator.fields.quantity', 'Quantidade')} required>
						<input
							type="number"
							min={1}
							value={draft.quantidade}
							onChange={(event) => patchDraft('quantidade', event.target.value)}
							className={inputClasses()}
						/>
					</FormField>

					<FormField
						label={t('consultasPages.priceSimulator.fields.freight', 'Frete do item')}
						helperText={t(
							'consultasPages.priceSimulator.fields.freightHelp',
							'Valor opcional usado apenas para simular o frete no cálculo do item.',
						)}
					>
						<CurrencyInput value={draft.valor_frete_item} onChange={(value) => patchDraft('valor_frete_item', value)} />
					</FormField>

					<FormField label={t('consultasPages.priceSimulator.fields.branch', 'Filial')} required>
						<LookupSelect
							label={t('consultasPages.priceSimulator.fields.branch', 'Filial')}
							value={filial}
							onChange={(value) => {
								setFilial(value)
								patchDraft('id_filial', value?.id || '')
							}}
							loadOptions={(query, page, perPage) => simuladorPrecosClient.loadLookupOptions('filiais', query, page, perPage)}
						/>
					</FormField>

					<FormField label={t('consultasPages.priceSimulator.fields.paymentMethod', 'Forma de pagamento')} required>
						<LookupSelect
							label={t('consultasPages.priceSimulator.fields.paymentMethod', 'Forma de pagamento')}
							value={formaPagamento}
							onChange={(value) => {
								setFormaPagamento(value)
								patchDraft('id_forma_pagamento', value?.id || '')
							}}
							loadOptions={(query, page, perPage) =>
								simuladorPrecosClient.loadLookupOptions('formas_pagamento', query, page, perPage)
							}
						/>
					</FormField>

					<FormField label={t('consultasPages.priceSimulator.fields.paymentTerm', 'Prazo de pagamento')} required>
						<LookupSelect
							label={t('consultasPages.priceSimulator.fields.paymentTerm', 'Prazo de pagamento')}
							value={condicaoPagamento}
							onChange={(value) => {
								setCondicaoPagamento(value)
								patchDraft('id_condicao_pagamento', value?.id || '')
							}}
							loadOptions={(query, page, perPage) =>
								simuladorPrecosClient.loadLookupOptions('condicoes_pagamento', query, page, perPage)
							}
						/>
					</FormField>

					<FormField label={t('consultasPages.priceSimulator.fields.customerId', 'ID do cliente')}>
						<LookupSelect
							label={t('consultasPages.priceSimulator.fields.customerId', 'ID do cliente')}
							value={cliente}
							onChange={(value) => {
								setCliente(value)
								patchDraft('id_cliente', value?.id || '')
							}}
							loadOptions={(query, page, perPage) => simuladorPrecosClient.loadClientOptions(query, page, perPage)}
						/>
					</FormField>

					<FormField label={t('consultasPages.priceSimulator.fields.sellerId', 'ID do vendedor')}>
						<LookupSelect
							label={t('consultasPages.priceSimulator.fields.sellerId', 'ID do vendedor')}
							value={vendedor}
							onChange={(value) => {
								setVendedor(value)
								patchDraft('id_vendedor', value?.id || '')
							}}
							loadOptions={(query, page, perPage) => simuladorPrecosClient.loadLookupOptions('vendedores', query, page, perPage)}
						/>
					</FormField>
				</div>
			</SectionCard>

			{result ? (
				<>
					<div className="grid gap-5 xl:grid-cols-2">
						<SectionCard title={t('consultasPages.priceSimulator.sections.product', 'Produto')}>
							<div className="space-y-2">
								{result.produto.length ? (
									result.produto.map((row) => (
										<div key={row.label} className="flex items-start justify-between gap-3 border-b border-line/40 py-2 text-sm">
											<span className="font-semibold text-(--app-text)">{row.label}</span>
											<span className="text-right text-slate-600">{row.value}</span>
										</div>
									))
								) : (
									<p className="text-sm text-slate-500">{emptyMessage}</p>
								)}
							</div>
						</SectionCard>
						<SectionCard title={t('consultasPages.priceSimulator.sections.package', 'Embalagem')}>
							<div className="space-y-2">
								{result.embalagem.length ? (
									result.embalagem.map((row) => (
										<div key={row.label} className="flex items-start justify-between gap-3 border-b border-line/40 py-2 text-sm">
											<span className="font-semibold text-(--app-text)">{row.label}</span>
											<span className="text-right text-slate-600">{row.value}</span>
										</div>
									))
								) : (
									<p className="text-sm text-slate-500">{emptyMessage}</p>
								)}
							</div>
						</SectionCard>
					</div>

					<div className="grid gap-5 xl:grid-cols-2">
						<SectionCard title={t('consultasPages.priceSimulator.sections.values', 'Valores')}>
							<div className="space-y-2">
								{result.valores.length ? (
									result.valores.map((row) => (
										<div key={row.label} className="flex items-start justify-between gap-3 border-b border-line/40 py-2 text-sm">
											<span className="font-semibold text-(--app-text)">{row.label}</span>
											<span className="text-right text-slate-600">{row.value}</span>
										</div>
									))
								) : (
									<p className="text-sm text-slate-500">{emptyMessage}</p>
								)}
							</div>
						</SectionCard>
						<SectionCard title={t('consultasPages.priceSimulator.sections.orderInfo', 'Informações de Pedido')}>
							<div className="space-y-2">
								{result.pedido.length ? (
									result.pedido.map((row) => (
										<div key={row.label} className="flex items-start justify-between gap-3 border-b border-line/40 py-2 text-sm">
											<span className="font-semibold text-(--app-text)">{row.label}</span>
											<span className="text-right text-slate-600">{row.value}</span>
										</div>
									))
								) : (
									<p className="text-sm text-slate-500">{emptyMessage}</p>
								)}
							</div>
						</SectionCard>
					</div>

					<SectionCard title={t('consultasPages.priceSimulator.sections.pricers', 'Precificadores Aplicados')}>
						<DynamicResultGrid rows={result.precificadores} emptyMessage={emptyMessage} />
					</SectionCard>

					<SectionCard title={t('consultasPages.priceSimulator.sections.taxes', 'Tributos Aplicados')}>
						<DynamicResultGrid rows={result.tributos} emptyMessage={emptyMessage} />
					</SectionCard>

					<SectionCard title={t('consultasPages.priceSimulator.sections.quantityPromotions', 'Promoções por Quantidade')}>
						<DynamicResultGrid rows={result.promocoesQuantidade} emptyMessage={emptyMessage} />
					</SectionCard>

					{result.debug ? (
						<SectionCard title={t('consultasPages.priceSimulator.sections.debug', 'Debug da Requisição')}>
							<p className="text-sm font-semibold text-(--app-text)">
								{t('consultasPages.priceSimulator.debugUrl', 'URL da request')}
							</p>
							<code className="mt-3 block break-all rounded-[1rem] bg-rose-50/60 px-4 py-3 text-xs text-rose-900 dark:bg-rose-950/30 dark:text-rose-100">
								{result.debug.url}
							</code>
						</SectionCard>
					) : null}
				</>
			) : null}

			<PageToast
				message={toast.message}
				tone={toast.tone}
				onClose={() => setToast((current) => ({ ...current, message: null }))}
			/>
		</div>
	)
}
