'use client'

import {
  Ban,
  CheckCircle2,
  Copy,
  CreditCard,
  Eye,
  FileText,
  History,
  Loader2,
  MapPin,
  Package2,
  ReceiptText,
  RefreshCcw,
  Save,
  ShoppingBag,
  ScrollText,
  Truck,
  UserRound,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { DataTableSectionAction } from '@/src/components/data-table/data-table-toolbar'
import { AsyncState } from '@/src/components/ui/async-state'
import { OverlayModal } from '@/src/components/ui/overlay-modal'
import { PageHeader } from '@/src/components/ui/page-header'
import { PageToast } from '@/src/components/ui/page-toast'
import { SectionCard } from '@/src/components/ui/section-card'
import { StatusBadge } from '@/src/components/ui/status-badge'
import { TabButton } from '@/src/components/ui/tab-button'
import { useTenant } from '@/src/contexts/tenant-context'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { usePedidoActions } from '@/src/features/pedidos/components/use-pedido-actions'
import { pedidosClient } from '@/src/features/pedidos/services/pedidos-client'
import type { PedidoDetail } from '@/src/features/pedidos/services/pedidos-types'
import { buildProdutoImageCandidates } from '@/src/features/produtos/services/produto-image-url'
import { useAsyncData } from '@/src/hooks/use-async-data'
import { useI18n } from '@/src/i18n/use-i18n'
import { formatDateTime } from '@/src/lib/date-time'
import { formatCep, formatCpfCnpj, formatCurrency, formatDate, formatNullableCurrency, formatPhone } from '@/src/lib/formatters'
import { useRouteParams } from '@/src/next/route-context'

type RecordLike = Record<string, unknown>
type ToastState = { message: string | null; tone: 'success' | 'error' }
type JsonModalState = { title: string; content: string } | null
type DeliveryFormState = { id: string; status: string; rastreamento: string; codigo: string; prazo: string }
type DetailSection = 'overview' | 'commercial' | 'products' | 'timeline' | 'technical'
type MetricCardProps = {
  icon: ReactNode
  label: string
  value: ReactNode
  helper?: ReactNode
  tone?: 'slate' | 'emerald' | 'sky' | 'amber'
}

const DELIVERY_STATUS_OPTIONS = [
  { value: 'aguardando', labelKey: 'orders.deliveryStatusOptions.waiting', fallback: 'Aguardando' },
  { value: 'pronto_retirada', labelKey: 'orders.deliveryStatusOptions.readyForPickup', fallback: 'Pronto para retirada' },
  { value: 'coletado', labelKey: 'orders.deliveryStatusOptions.collected', fallback: 'Coletado' },
  { value: 'em_transporte', labelKey: 'orders.deliveryStatusOptions.inTransit', fallback: 'Em transporte' },
  { value: 'entregue', labelKey: 'orders.deliveryStatusOptions.delivered', fallback: 'Entregue' },
] as const

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-2 py-3 sm:grid-cols-[220px,1fr] sm:items-start">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </div>
      <div className="text-sm text-slate-900">
        {value}
      </div>
    </div>
  )
}

function MetricCard({ icon, label, value, helper, tone = 'slate' }: MetricCardProps) {
  const toneClasses = {
    slate: 'border-slate-200 bg-slate-50/80 text-slate-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    sky: 'border-sky-200 bg-sky-50 text-sky-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
  }

  return (
    <div className="rounded-[1.25rem] border border-[#e8e2d7] bg-white px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <div className="mt-2 text-lg font-bold tracking-tight text-slate-950">{value}</div>
          {helper ? <div className="mt-2 text-sm text-slate-500">{helper}</div> : null}
        </div>
        <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border ${toneClasses[tone]}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function DetailSectionCard({
  icon,
  title,
  description,
  children,
  className,
}: {
  icon: ReactNode
  title: string
  description: string
  children: ReactNode
  className?: string
}) {
  return (
    <SectionCard className={className}>
      <div className="mb-5 flex items-start gap-3">
        <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#e8e2d7] bg-slate-50 text-slate-700">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-bold tracking-tight text-slate-950">{title}</h2>
          <p className="mt-0.5 text-[11px] leading-5 text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </SectionCard>
  )
}

function toRecord(value: unknown): RecordLike | null {
  return value && typeof value === 'object' ? value as RecordLike : null
}

function toArray(value: unknown): RecordLike[] {
  return Array.isArray(value) ? value.filter((item): item is RecordLike => Boolean(item) && typeof item === 'object') : []
}

function toNumber(value: unknown) {
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function formatCurrencyValue(value: unknown, fallback = '-') {
  return formatNullableCurrency(value as number | string | null | undefined, fallback)
}

function toStringValue(value: unknown, fallback = '-') {
  const normalized = String(value ?? '').trim()
  return normalized || fallback
}

function humanizeEnum(value: unknown, fallback = '-') {
  const normalized = String(value ?? '').trim()
  if (!normalized) return fallback
  return normalized.replace(/_/g, ' ')
}

function resolveEntityLabel(value: unknown, nameKeys: string[] = ['nome']) {
  const record = toRecord(value)
  if (!record) return '-'
  const id = String(record.id || '').trim()
  const name = nameKeys.map((key) => String(record[key] || '').trim()).find(Boolean) || ''
  return id && name ? `${id} - ${name}` : name || id || '-'
}

function resolvePessoaTipo(value: unknown, t: (key: string, fallback?: string, vars?: Record<string, string>) => string) {
  const normalized = String(value || '').trim().toUpperCase()
  if (normalized === 'PJ') return t('orders.fields.company', 'Pessoa jurídica')
  if (normalized === 'PF') return t('orders.fields.person', 'Pessoa física')
  return '-'
}

function resolveSexo(value: unknown, t: (key: string, fallback?: string) => string) {
  const normalized = String(value || '').trim().toUpperCase()
  if (normalized === 'M') return t('orders.fields.male', 'Masculino')
  if (normalized === 'F') return t('orders.fields.female', 'Feminino')
  if (normalized === 'O') return t('orders.fields.other', 'Outros')
  return '-'
}

function resolveBooleanTone(value: boolean, positiveTone: 'success' | 'warning' | 'danger' | 'info' = 'success') {
  return value ? positiveTone : 'warning'
}

function resolvePagamentoNome(detail: PedidoDetail) {
  const pagamento = toRecord(detail.pagamento)
  return resolveEntityLabel(pagamento?.forma_pagamento_convertida || pagamento?.forma_pagamento, ['nome'])
}

function resolveCondicaoNome(detail: PedidoDetail) {
  const pagamento = toRecord(detail.pagamento)
  return resolveEntityLabel(pagamento?.condicao_pagamento_convertida || pagamento?.condicao_pagamento, ['nome'])
}

function resolveFormaEntrega(detail: PedidoDetail) {
  const entrega = toRecord(detail.entrega)
  return resolveEntityLabel(entrega?.forma_entrega, ['nome'])
}

function ProductThumb({ product, assetsBucketUrl }: { product: RecordLike | null; assetsBucketUrl?: string }) {
  const images = useMemo(() => {
    const productImages = product && Array.isArray(product.imagens) ? product.imagens : []
    const imageRecord = productImages[0] && typeof productImages[0] === 'object' ? productImages[0] as RecordLike : null
    if (!imageRecord) return []
    const thumb = buildProdutoImageCandidates(String(imageRecord.imagem_thumb || ''), assetsBucketUrl)
    const image = buildProdutoImageCandidates(String(imageRecord.imagem || ''), assetsBucketUrl)
    return [...thumb, ...image].filter(Boolean)
  }, [assetsBucketUrl, product])

  const [currentIndex, setCurrentIndex] = useState(0)
  const currentSrc = images[currentIndex] || 'https://assets.agilecdn.com.br/images/imagemindisponivel.jpg'

  return (
    <img
      src={currentSrc}
      alt={String(product?.nome || 'Produto')}
      className="h-16 w-16 rounded-2xl border border-[#efe8dc] bg-white p-1 object-contain"
      onError={() => {
        if (currentIndex < images.length - 1) setCurrentIndex((value) => value + 1)
      }}
    />
  )
}

export function PedidoDetailPage() {
  const { t } = useI18n()
  const access = useFeatureAccess('pedidos')
  const { currentTenant } = useTenant()
  const { id } = useRouteParams<{ id?: string }>()
  const detailState = useAsyncData(() => (id ? pedidosClient.getById(id) : Promise.resolve(null as PedidoDetail | null)), [id])
  const detail = detailState.data
  const pedidoActions = usePedidoActions(async () => {
    await detailState.reload()
  })
  const [toast, setToast] = useState<ToastState>({ message: null, tone: 'success' })
  const [jsonModal, setJsonModal] = useState<JsonModalState>(null)
  const [isSavingInternalNotes, setIsSavingInternalNotes] = useState(false)
  const [isSavingDelivery, setIsSavingDelivery] = useState(false)
  const [internalNotes, setInternalNotes] = useState('')
  const [deliveryForm, setDeliveryForm] = useState<DeliveryFormState>({ id: '', status: '', rastreamento: '', codigo: '', prazo: '' })
  const [activeSection, setActiveSection] = useState<DetailSection>('overview')

  useEffect(() => {
    if (!detail) return
    setInternalNotes(String(detail.observacoes_internas || ''))
    const entrega = toRecord(detail.entrega)
    setDeliveryForm({
      id: String(entrega?.id || ''),
      status: String(entrega?.status || ''),
      rastreamento: String(entrega?.rastreamento || ''),
      codigo: String(entrega?.codigo || ''),
      prazo: entrega?.prazo === null || entrega?.prazo === undefined ? '' : String(entrega.prazo),
    })
  }, [detail])

  if (!access.canList) return null

  const pagamento = toRecord(detail?.pagamento)
  const entrega = toRecord(detail?.entrega)
  const cliente = toRecord(detail?.cliente)
  const usuario = toRecord(detail?.usuario)
  const produtos = toArray(detail?.produtos)
  const eventos = toArray(detail?.eventos)
  const logs = toArray(detail?.logs)
  const customerName = toStringValue(cliente?.nome_fantasia || cliente?.nome)
  const deliveryStatusLabel = humanizeEnum(entrega?.status)
  const produtoQuantidadeSolicitada = produtos.reduce((sum, item) => sum + (toNumber(item.quantidade) / (toNumber(toRecord(item.embalagem)?.quantidade) || 1)), 0)
  const produtoQuantidadeAtendida = produtos.reduce((sum, item) => sum + (toNumber(item.quantidade_atendida) / (toNumber(toRecord(item.embalagem)?.quantidade) || 1)), 0)
  const sectionTabs: Array<{ id: DetailSection; label: string; icon: ReactNode }> = [
    { id: 'overview', label: t('orders.sections.info', 'Informações'), icon: <ReceiptText className="h-4 w-4" /> },
    { id: 'commercial', label: t('orders.sections.delivery', 'Entrega'), icon: <Truck className="h-4 w-4" /> },
    { id: 'products', label: t('orders.sections.products', 'Produtos'), icon: <Package2 className="h-4 w-4" /> },
    { id: 'timeline', label: t('orders.sections.events', 'Timeline'), icon: <History className="h-4 w-4" /> },
    { id: 'technical', label: t('orders.sections.details', 'Detalhes'), icon: <FileText className="h-4 w-4" /> },
  ]

  async function handleSaveInternalNotes() {
    if (!detail?.id) return
    setIsSavingInternalNotes(true)
    try {
      await pedidosClient.saveInternalNotes(detail.id, internalNotes)
      await detailState.reload()
      setToast({ message: t('orders.feedback.internalNotesSuccess', 'Observações internas atualizadas com sucesso.'), tone: 'success' })
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : t('orders.feedback.internalNotesError', 'Não foi possível salvar as observações internas.'), tone: 'error' })
    } finally {
      setIsSavingInternalNotes(false)
    }
  }

  async function handleSaveDelivery() {
    if (!detail?.id || !deliveryForm.id) return
    setIsSavingDelivery(true)
    try {
      await pedidosClient.updateDelivery(detail.id, {
        entregaId: deliveryForm.id,
        status: deliveryForm.status,
        rastreamento: deliveryForm.rastreamento,
        codigo: deliveryForm.codigo,
        prazo: deliveryForm.prazo,
      })
      await detailState.reload()
      setToast({ message: t('orders.feedback.deliverySuccess', 'Entrega atualizada com sucesso.'), tone: 'success' })
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : t('orders.feedback.deliveryError', 'Não foi possível atualizar a entrega.'), tone: 'error' })
    } finally {
      setIsSavingDelivery(false)
    }
  }

  async function handleCopyJson() {
    if (!jsonModal?.content) return
    try {
      await navigator.clipboard.writeText(jsonModal.content)
      setToast({ message: t('orders.feedback.jsonCopied', 'JSON copiado para a área de transferência.'), tone: 'success' })
    } catch {
      setToast({ message: t('orders.feedback.jsonCopyError', 'Não foi possível copiar o JSON.'), tone: 'error' })
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={[
          { label: t('routes.dashboard', 'Home'), href: '/dashboard' },
          { label: t('routes.pedidos', 'Pedidos'), href: '/pedidos' },
          { label: id ? `ID #${id}` : t('orders.detailTitle', 'Detalhes do pedido') },
        ]}
        actions={(
          <div className="flex flex-wrap items-center justify-end gap-3">
            {access.canEdit && detail?.canApprovePayment ? (
              <button type="button" onClick={() => pedidoActions.openApprove(detail.id)} className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                {t('orders.actions.approve', 'Aprovar pagamento')}
              </button>
            ) : null}
            {access.canEdit && detail?.canCancel ? (
              <button type="button" onClick={() => pedidoActions.openCancel(detail.id)} className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700">
                <Ban className="h-4 w-4" />
                {t('orders.actions.cancel', 'Cancelar pedido')}
              </button>
            ) : null}
            <DataTableSectionAction label={t('common.refresh', 'Atualizar')} icon={RefreshCcw} onClick={detailState.reload} />
          </div>
        )}
      />

      <AsyncState isLoading={detailState.isLoading} error={detailState.error}>
        {detail ? (
          <>
            {detail.hasCorte ? <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-700">{t('orders.feedback.hasCut', 'Pedido com corte de produtos.')}</div> : null}

            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
              <MetricCard
                icon={<ReceiptText className="h-5 w-5" />}
                label={t('orders.overview.order', 'Pedido')}
                value={<div className="flex flex-wrap items-center gap-2"><span>#{detail.id}</span><StatusBadge tone={detail.status_tone}>{detail.status_label || '-'}</StatusBadge></div>}
                helper={detail.data ? formatDateTime(detail.data) : '-'}
              />
              <MetricCard
                icon={<ShoppingBag className="h-5 w-5" />}
                label={t('orders.overview.amounts', 'Valores')}
                value={formatCurrencyValue(detail.valor_total_atendido_ajustado)}
                helper={`${t('orders.fields.productsValue', 'Produtos')}: ${formatCurrencyValue(detail.valor_produtos_atendido_ajustado)}`}
                tone="emerald"
              />
              <MetricCard
                icon={<UserRound className="h-5 w-5" />}
                label={t('orders.overview.customer', 'Cliente')}
                value={customerName}
                helper={formatCpfCnpj(cliente?.cnpj_cpf as string | null | undefined) || '-'}
                tone="sky"
              />
              <MetricCard
                icon={<Truck className="h-5 w-5" />}
                label={t('orders.overview.delivery', 'Entrega')}
                value={resolveFormaEntrega(detail)}
                helper={<div className="flex flex-wrap items-center gap-2"><StatusBadge tone={entrega?.status === 'entregue' ? 'success' : 'info'}>{deliveryStatusLabel}</StatusBadge>{entrega?.prazo ? <span>{`${entrega.prazo} ${t('orders.fields.days', 'dias')}`}</span> : null}</div>}
                tone="amber"
              />
            </div>

            <SectionCard className="overflow-x-auto">
              <div className="flex min-w-max gap-3">
                {sectionTabs.map((section) => (
                  <TabButton
                    key={section.id}
                    active={activeSection === section.id}
                    label={section.label}
                    icon={section.icon}
                    onClick={() => setActiveSection(section.id)}
                  />
                ))}
              </div>
            </SectionCard>

            {activeSection === 'overview' ? (
            <div className="grid gap-5 xl:grid-cols-2">
              <DetailSectionCard
                icon={<ReceiptText className="h-5 w-5" />}
                title={t('orders.sections.info', 'Informações')}
                description={t('orders.sectionDescriptions.info', 'Contexto comercial, identificação e observações do pedido.')}
              >
                <div className="divide-y divide-[#efe8dc]">
                  <InfoRow label={t('orders.fields.id', 'ID')} value={detail.id} />
                  <InfoRow label={t('orders.fields.transaction', 'Transação')} value={toStringValue(detail.id_transacao)} />
                  <InfoRow label={t('common.code', 'Código')} value={toStringValue(detail.codigo)} />
                  <InfoRow label={t('orders.fields.pluggToId', 'ID Plugg.to')} value={toStringValue(detail.id_pluggto)} />
                  <InfoRow label={t('orders.fields.date', 'Data')} value={detail.data ? formatDateTime(detail.data) : '-'} />
                  <InfoRow label={t('orders.fields.channel', 'Canal')} value={humanizeEnum(detail.canal)} />
                  <InfoRow label={t('orders.fields.status', 'Status')} value={<StatusBadge tone={detail.status_tone}>{detail.status_label || '-'}</StatusBadge>} />
                  <InfoRow label={t('orders.fields.branch', 'Filial')} value={resolveEntityLabel(detail.filial, ['nome_fantasia', 'nome'])} />
                  <InfoRow label={t('orders.fields.billingBranch', 'Filial de faturamento')} value={resolveEntityLabel(detail.filial_nf, ['nome_fantasia', 'nome'])} />
                  <InfoRow label={t('orders.fields.stockBranch', 'Filial de estoque')} value={resolveEntityLabel(detail.filial_estoque, ['nome_fantasia', 'nome'])} />
                  <InfoRow label={t('orders.fields.pickupBranch', 'Filial de retirada')} value={resolveEntityLabel(detail.filial_retira, ['nome_fantasia', 'nome'])} />
                  <InfoRow label={t('orders.fields.distributionChannel', 'Canal de distribuição')} value={resolveEntityLabel(detail.canal_distribuicao, ['nome'])} />
                  <InfoRow label={t('orders.fields.seller', 'Vendedor')} value={resolveEntityLabel(detail.vendedor, ['nome'])} />
                  <InfoRow label={t('orders.fields.sellerCode', 'Código do vendedor')} value={toStringValue(detail.codigo_vendedor)} />
                  <InfoRow label={t('orders.fields.purchaseOrder', 'Ordem de compra')} value={toStringValue(detail.ordem_compra)} />
                  <InfoRow label={t('orders.fields.encomenda', 'Encomenda')} value={<StatusBadge tone={resolveBooleanTone(detail.encomenda === true)}>{detail.encomenda === true ? t('common.yes', 'Sim') : t('common.no', 'Não')}</StatusBadge>} />
                  <InfoRow label={t('orders.fields.restrictedTransport', 'Transporte restrito')} value={<StatusBadge tone={Boolean(detail.restrito_transporte) && detail.restrito_transporte !== 'N' ? 'success' : 'warning'}>{Boolean(detail.restrito_transporte) && detail.restrito_transporte !== 'N' ? t('common.yes', 'Sim') : t('common.no', 'Não')}</StatusBadge>} />
                  <InfoRow label={t('orders.fields.notes', 'Observações')} value={(
                    <div className="space-y-2">
                      <p>{toStringValue(detail.observacoes)}</p>
                      {String(entrega?.opcao_falta || '').trim() ? (
                        <p className="text-sm text-slate-500">
                          <strong>{t('orders.fields.outOfStockOption', 'O que devemos fazer se existir algum item em falta?')}</strong>{' '}
                          {String(entrega?.opcao_falta) === 'enviar' ? t('orders.fields.outOfStockSend', 'Enviar o pedido mesmo assim') : String(entrega?.opcao_falta) === 'contato' ? t('orders.fields.outOfStockContact', 'Entrar em contato comigo') : t('orders.fields.outOfStockCancel', 'Cancelar todo o pedido')}
                        </p>
                      ) : null}
                    </div>
                  )} />
                </div>
                <div className="mt-5 space-y-3 border-t border-[#efe8dc] pt-5">
                  <label htmlFor="pedido-observacoes-internas" className="text-sm font-semibold text-slate-700">{t('orders.fields.internalNotes', 'Observações internas')}</label>
                  <textarea id="pedido-observacoes-internas" value={internalNotes} onChange={(event) => setInternalNotes(event.target.value)} rows={5} className="w-full rounded-[1.1rem] border border-[#e6dfd3] px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400" />
                  {access.canEdit ? (
                    <div className="flex justify-end">
                      <button type="button" onClick={() => void handleSaveInternalNotes()} disabled={isSavingInternalNotes} className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
                        {isSavingInternalNotes ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {isSavingInternalNotes ? t('common.loading', 'Carregando...') : t('common.save', 'Salvar')}
                      </button>
                    </div>
                  ) : null}
                </div>
              </DetailSectionCard>

              <DetailSectionCard
                icon={<CreditCard className="h-5 w-5" />}
                title={t('orders.sections.values', 'Valores')}
                description={t('orders.sectionDescriptions.values', 'Comparativo entre o valor solicitado no checkout e o valor efetivamente atendido.')}
              >
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#efe8dc] text-left text-slate-500">
                        <th className="py-3 pr-4" />
                        <th className="py-3 pr-4 text-right">{t('orders.fields.requested', 'Solicitado')}</th>
                        <th className="py-3 text-right">{t('orders.fields.servedValue', 'Atendido')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#efe8dc]">
                      <tr><td className="py-3 pr-4 font-semibold text-slate-700">{t('orders.fields.productsValue', 'Produtos')}</td><td className="py-3 pr-4 text-right">{formatCurrencyValue(detail.valor_produtos)}</td><td className="py-3 text-right">{formatCurrencyValue(detail.valor_produtos_atendido_ajustado)}</td></tr>
                      <tr><td className="py-3 pr-4 font-semibold text-slate-700">{t('orders.fields.automaticCoupon', 'Cupom desconto automático')}</td><td className="py-3 pr-4 text-right">- {formatCurrencyValue(detail.valor_cupom_automatico)}</td><td className="py-3 text-right">- {formatCurrencyValue(detail.valor_cupom_automatico)}</td></tr>
                      <tr><td className="py-3 pr-4 font-semibold text-slate-700">{t('orders.fields.discountCoupon', 'Cupom desconto')}{detail.cupom_desconto && toRecord(detail.cupom_desconto)?.codigo ? ` (${String(toRecord(detail.cupom_desconto)?.codigo)})` : ''}</td><td className="py-3 pr-4 text-right">- {formatCurrencyValue(detail.valor_cupom_desconto)}</td><td className="py-3 text-right">- {formatCurrencyValue(detail.valor_cupom_desconto)}</td></tr>
                      <tr><td className="py-3 pr-4 font-semibold text-slate-700">{t('orders.fields.variableWeight', 'Peso variável')}</td><td className="py-3 pr-4 text-right">+ {formatCurrencyValue(detail.valor_variacao)}</td><td className="py-3 text-right">+ {formatCurrencyValue(detail.valor_variacao)}</td></tr>
                      <tr><td className="py-3 pr-4 font-semibold text-slate-700">{t('orders.fields.freight', 'Frete')}</td><td className="py-3 pr-4 text-right">+ {formatCurrencyValue(detail.valor_frete)}</td><td className="py-3 text-right">+ {formatCurrencyValue(detail.valor_frete)}</td></tr>
                      <tr><td className="py-3 pr-4 font-semibold text-slate-900">{t('orders.fields.total', 'Total')}</td><td className="py-3 pr-4 text-right font-semibold text-slate-900">{formatCurrencyValue(detail.valor_total)}</td><td className="py-3 text-right font-semibold text-slate-900">{formatCurrencyValue(detail.valor_total_atendido_ajustado)}</td></tr>
                    </tbody>
                  </table>
                </div>
              </DetailSectionCard>
            </div>
            ) : null}

            {activeSection === 'commercial' ? (
            <div className="grid gap-5 xl:grid-cols-2">
              <DetailSectionCard
                icon={<CreditCard className="h-5 w-5" />}
                title={t('orders.sections.payment', 'Pagamento')}
                description={t('orders.sectionDescriptions.payment', 'Forma, condição, parcelas e dados transacionais do pagamento.')}
              >
                <div className="divide-y divide-[#efe8dc]">
                  <InfoRow label={t('orders.fields.paymentMethod', 'Forma de pagamento')} value={resolvePagamentoNome(detail)} />
                  <InfoRow label={t('orders.fields.paymentTerm', 'Prazo de pagamento')} value={resolveCondicaoNome(detail)} />
                  <InfoRow label={t('orders.fields.amount', 'Valor')} value={formatCurrencyValue(pagamento?.valor)} />
                  <InfoRow label={t('orders.fields.cashback', 'Cashback')} value={formatCurrencyValue(detail.valor_cashback)} />
                  <InfoRow label={t('orders.fields.installments', 'Parcelas')} value={toStringValue(pagamento?.parcelas)} />
                  <InfoRow label={t('orders.fields.paymentStatus', 'Status do pagamento')} value={<StatusBadge tone="info">{humanizeEnum(pagamento?.status)}</StatusBadge>} />
                  <InfoRow label={t('orders.fields.gateway', 'Gateway')} value={toStringValue(pagamento?.gateway)} />
                  <InfoRow label={t('orders.fields.cardBrand', 'Bandeira')} value={toStringValue(pagamento?.bandeira)} />
                  <InfoRow label={t('orders.fields.pv', 'PV')} value={toStringValue(pagamento?.pv)} />
                  <InfoRow label={t('orders.fields.nsuInitial', 'NSU pré')} value={toStringValue(pagamento?.nsu_inicial)} />
                  <InfoRow label={t('orders.fields.nsu', 'NSU')} value={toStringValue(pagamento?.nsu)} />
                  <InfoRow label={t('orders.fields.tid', 'TID')} value={toStringValue(pagamento?.tid)} />
                  <InfoRow label={t('orders.fields.pid', 'PID')} value={toStringValue(pagamento?.pid)} />
                  <InfoRow label={t('orders.fields.bin', 'BIN')} value={toStringValue(pagamento?.bin)} />
                  <InfoRow label={t('orders.fields.authorization', 'Autorização')} value={toStringValue(pagamento?.autorizacao)} />
                  <InfoRow label={t('orders.fields.lastDigits', 'Últimos dígitos')} value={toStringValue(pagamento?.digitos)} />
                  <InfoRow label={t('orders.fields.expiration', 'Vencimento')} value={pagamento?.mes && pagamento?.ano ? `${pagamento.mes}/${pagamento.ano}` : '-'} />
                  <InfoRow label={t('orders.fields.holder', 'Titular')} value={toStringValue(pagamento?.titular)} />
                  <InfoRow label={t('orders.fields.holderDocument', 'CPF/CNPJ do titular')} value={formatCpfCnpj(pagamento?.cnpj_cpf_titular)} />
                  <InfoRow label={t('orders.fields.dueDate', 'Data de vencimento')} value={pagamento?.data_vencimento ? formatDate(String(pagamento.data_vencimento)) : '-'} />
                </div>
              </DetailSectionCard>

              <DetailSectionCard
                icon={<UserRound className="h-5 w-5" />}
                title={t('orders.sections.customer', 'Cliente')}
                description={t('orders.sectionDescriptions.customer', 'Dados cadastrais, contato e perfil comercial do cliente vinculado ao pedido.')}
              >
                <div className="divide-y divide-[#efe8dc]">
                  <InfoRow label={t('orders.fields.id', 'ID')} value={toStringValue(cliente?.id)} />
                  <InfoRow label={t('orders.fields.customerCode', 'Código do cliente')} value={toStringValue(cliente?.codigo)} />
                  <InfoRow label={t('orders.fields.active', 'Ativo')} value={<StatusBadge tone={resolveBooleanTone(cliente?.ativo === true)}>{cliente?.ativo === true ? t('common.yes', 'Sim') : t('common.no', 'Não')}</StatusBadge>} />
                  <InfoRow label={t('orders.fields.blocked', 'Bloqueado')} value={<StatusBadge tone={cliente?.bloqueado === true ? 'danger' : 'success'}>{cliente?.bloqueado === true ? t('common.yes', 'Sim') : t('common.no', 'Não')}</StatusBadge>} />
                  <InfoRow label={t('orders.fields.customerType', 'Tipo')} value={resolvePessoaTipo(cliente?.tipo, t)} />
                  <InfoRow label={cliente?.tipo === 'PJ' ? t('orders.fields.cnpj', 'CNPJ') : t('orders.fields.cpf', 'CPF')} value={formatCpfCnpj(cliente?.cnpj_cpf)} />
                  <InfoRow label={cliente?.tipo === 'PJ' ? t('orders.fields.tradeName', 'Nome fantasia') : t('orders.fields.customerName', 'Nome')} value={toStringValue(cliente?.nome_fantasia || cliente?.nome)} />
                  <InfoRow label={t('orders.fields.companyName', 'Razão social')} value={toStringValue(cliente?.razao_social)} />
                  <InfoRow label={t('orders.fields.stateRegistration', 'Inscrição estadual')} value={toStringValue(cliente?.inscricao_estadual)} />
                  <InfoRow label={t('orders.fields.creditLimit', 'Limite de crédito')} value={formatCurrencyValue(cliente?.limite_credito)} />
                  <InfoRow label={t('orders.fields.availableLimit', 'Limite disponível')} value={formatCurrencyValue(cliente?.limite_disponivel)} />
                  <InfoRow label={t('orders.fields.gender', 'Sexo')} value={resolveSexo(cliente?.sexo, t)} />
                  <InfoRow label={t('orders.fields.birthDate', 'Data de nascimento')} value={cliente?.data_nascimento ? formatDate(String(cliente.data_nascimento)) : '-'} />
                  <InfoRow label={t('orders.fields.contactPerson', 'Pessoa de contato')} value={toStringValue(cliente?.pessoa_contato)} />
                  <InfoRow label={t('orders.fields.email', 'E-mail')} value={toStringValue(cliente?.email)} />
                  <InfoRow label={t('orders.fields.phone1', 'Telefone 1')} value={formatPhone(cliente?.ddd1, cliente?.telefone1)} />
                  <InfoRow label={t('orders.fields.phone2', 'Telefone 2')} value={formatPhone(cliente?.ddd2, cliente?.telefone2)} />
                  <InfoRow label={t('orders.fields.mobile', 'Celular')} value={formatPhone(cliente?.ddd_celular, cliente?.celular)} />
                  <InfoRow label={t('orders.fields.whatsapp', 'WhatsApp')} value={<StatusBadge tone={resolveBooleanTone(cliente?.whatsapp === true)}>{cliente?.whatsapp === true ? t('common.yes', 'Sim') : t('common.no', 'Não')}</StatusBadge>} />
                  <InfoRow label={t('orders.fields.contributor', 'Contribuinte')} value={<StatusBadge tone={resolveBooleanTone(cliente?.contribuinte === true)}>{cliente?.contribuinte === true ? t('common.yes', 'Sim') : t('common.no', 'Não')}</StatusBadge>} />
                  <InfoRow label={t('orders.fields.ecommerce', 'E-commerce')} value={<StatusBadge tone={resolveBooleanTone(cliente?.ecommerce === true)}>{cliente?.ecommerce === true ? t('common.yes', 'Sim') : t('common.no', 'Não')}</StatusBadge>} />
                </div>
              </DetailSectionCard>

              <DetailSectionCard
                icon={<Truck className="h-5 w-5" />}
                title={t('orders.sections.delivery', 'Entrega')}
                description={t('orders.sectionDescriptions.delivery', 'Resumo logístico, endereço de entrega e atualização operacional do envio.')}
              >
                <div className="divide-y divide-[#efe8dc]">
                  <InfoRow label={t('orders.fields.deliveryMethod', 'Forma de entrega')} value={resolveFormaEntrega(detail)} />
                  <InfoRow label={t('orders.fields.pickupBranch', 'Filial de retirada')} value={resolveEntityLabel(detail.filial_retira, ['nome_fantasia', 'nome'])} />
                  <InfoRow label={t('orders.fields.transportCompany', 'Transportadora')} value={resolveEntityLabel(entrega?.transportadora, ['nome_fantasia', 'nome'])} />
                  <InfoRow label={t('orders.fields.deliveryQuoteId', 'ID cotação')} value={toStringValue(entrega?.id_cotacao)} />
                  <InfoRow label={t('orders.fields.quoteTable', 'Tabela cotação')} value={toStringValue(entrega?.id_tabela_cotacao)} />
                  <InfoRow label={t('orders.fields.quoteSequence', 'Sequencial da cotação')} value={toStringValue(entrega?.sequencial_cotacao)} />
                  <InfoRow label={t('orders.fields.quoteService', 'Serviço cotação')} value={toStringValue(entrega?.servico)} />
                  <InfoRow label={t('orders.fields.shipmentPort', 'Porto de embarque')} value={toStringValue(entrega?.porto_embarque)} />
                  <InfoRow label={t('orders.fields.shipmentDock', 'Doca/embarcação')} value={toStringValue(entrega?.doca_embarcacao_embarque)} />
                  <InfoRow label={t('orders.fields.shipmentDateTime', 'Data/hora embarque')} value={toStringValue(entrega?.data_hora_embarque)} />
                  <InfoRow label={t('orders.fields.schedulingDate', 'Data de agendamento')} value={entrega?.data_agendamento ? formatDate(String(entrega.data_agendamento)) : '-'} />
                  <InfoRow label={t('orders.fields.pickupName', 'Nome da pessoa de retirada')} value={toStringValue(entrega?.nome_retira)} />
                  <InfoRow label={t('orders.fields.pickupDocument', 'CPF da pessoa de retirada')} value={formatCpfCnpj(entrega?.cpf_retira)} />
                  <InfoRow label={t('orders.fields.pickupVehicleModel', 'Modelo do veículo de retirada')} value={toStringValue(entrega?.modelo_veiculo)} />
                  <InfoRow label={t('orders.fields.pickupVehiclePlate', 'Placa do veículo de retirada')} value={toStringValue(entrega?.placa_veiculo)} />
                  <InfoRow label={t('orders.fields.address', 'Endereço')} value={toStringValue(entrega?.endereco)} />
                  <InfoRow label={t('orders.fields.number', 'Número')} value={toStringValue(entrega?.numero)} />
                  <InfoRow label={t('orders.fields.complement', 'Complemento')} value={toStringValue(entrega?.complemento)} />
                  <InfoRow label={t('orders.fields.district', 'Bairro')} value={toStringValue(entrega?.bairro)} />
                  <InfoRow label={t('orders.fields.city', 'Cidade')} value={toStringValue(entrega?.cidade)} />
                  <InfoRow label={t('orders.fields.state', 'UF')} value={toStringValue(entrega?.uf)} />
                  <InfoRow label={t('orders.fields.zipCode', 'CEP')} value={formatCep(entrega?.cep)} />
                  <InfoRow label={t('orders.fields.ibgeCode', 'Código IBGE')} value={toStringValue(entrega?.codigo_ibge)} />
                  <InfoRow label={t('orders.fields.reference', 'Ponto de referência')} value={toStringValue(entrega?.ponto_referencia)} />
                  <InfoRow label={t('orders.fields.deliveryDate', 'Data da entrega')} value={entrega?.data_entrega ? formatDate(String(entrega.data_entrega)) : '-'} />
                  <InfoRow label={t('orders.fields.deliveryValue', 'Valor')} value={formatCurrencyValue(entrega?.valor)} />
                  <InfoRow label={t('orders.fields.shippingLog', 'Log cotação')} value={entrega?.log_cotacao ? <button type="button" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700" onClick={() => setJsonModal({ title: t('orders.fields.shippingLog', 'Log cotação'), content: String(entrega.log_cotacao) })}><Eye className="h-4 w-4" />{t('orders.actions.viewJson', 'Ver JSON')}</button> : '-'} />
                  <InfoRow label={t('orders.fields.shippingReturnLog', 'Log retorno cotação')} value={entrega?.retorno_cotacao ? <button type="button" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700" onClick={() => setJsonModal({ title: t('orders.fields.shippingReturnLog', 'Log retorno cotação'), content: String(entrega.retorno_cotacao) })}><Eye className="h-4 w-4" />{t('orders.actions.viewJson', 'Ver JSON')}</button> : '-'} />
                </div>
                {access.canEdit && entrega ? (
                  <div className="mt-5 space-y-4 border-t border-[#efe8dc] pt-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label htmlFor="pedido-entrega-status" className="text-sm font-semibold text-slate-700">{t('orders.fields.deliveryStatus', 'Status da entrega')}</label>
                        <select id="pedido-entrega-status" value={deliveryForm.status} onChange={(event) => setDeliveryForm((current) => ({ ...current, status: event.target.value }))} className="w-full rounded-[1.1rem] border border-[#e6dfd3] px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400">
                          {DELIVERY_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{t(option.labelKey, option.fallback)}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="pedido-entrega-rastreamento" className="text-sm font-semibold text-slate-700">{t('orders.fields.trackingLink', 'Link de rastreamento')}</label>
                        <input id="pedido-entrega-rastreamento" value={deliveryForm.rastreamento} onChange={(event) => setDeliveryForm((current) => ({ ...current, rastreamento: event.target.value }))} className="w-full rounded-[1.1rem] border border-[#e6dfd3] px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400" />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="pedido-entrega-codigo" className="text-sm font-semibold text-slate-700">{t('orders.fields.trackingCode', 'Código de rastreamento')}</label>
                        <input id="pedido-entrega-codigo" value={deliveryForm.codigo} onChange={(event) => setDeliveryForm((current) => ({ ...current, codigo: event.target.value }))} className="w-full rounded-[1.1rem] border border-[#e6dfd3] px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400" />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="pedido-entrega-prazo" className="text-sm font-semibold text-slate-700">{t('orders.fields.deliveryForecast', 'Previsão de entrega')}</label>
                        <div className="flex items-center rounded-[1.1rem] border border-[#e6dfd3] pr-4 focus-within:border-slate-400">
                          <input id="pedido-entrega-prazo" type="number" min="0" value={deliveryForm.prazo} onChange={(event) => setDeliveryForm((current) => ({ ...current, prazo: event.target.value }))} className="w-full rounded-[1.1rem] px-4 py-3 text-sm text-slate-900 outline-none" />
                          <span className="text-sm font-semibold text-slate-500">{t('orders.fields.days', 'dias')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button type="button" onClick={() => void handleSaveDelivery()} disabled={isSavingDelivery} className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
                        {isSavingDelivery ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {isSavingDelivery ? t('common.loading', 'Carregando...') : t('common.save', 'Salvar')}
                      </button>
                    </div>
                  </div>
                ) : null}
              </DetailSectionCard>

              <DetailSectionCard
                icon={<MapPin className="h-5 w-5" />}
                title={t('orders.sections.billing', 'Cobrança')}
                description={t('orders.sectionDescriptions.billing', 'Endereço de cobrança carregado do cadastro do cliente.')}
              >
                <div className="divide-y divide-[#efe8dc]">
                  <InfoRow label={t('orders.fields.address', 'Endereço')} value={toStringValue(cliente?.endereco)} />
                  <InfoRow label={t('orders.fields.number', 'Número')} value={toStringValue(cliente?.numero)} />
                  <InfoRow label={t('orders.fields.complement', 'Complemento')} value={toStringValue(cliente?.complemento)} />
                  <InfoRow label={t('orders.fields.district', 'Bairro')} value={toStringValue(cliente?.bairro)} />
                  <InfoRow label={t('orders.fields.city', 'Cidade')} value={toStringValue(cliente?.cidade)} />
                  <InfoRow label={t('orders.fields.state', 'UF')} value={toStringValue(cliente?.uf)} />
                  <InfoRow label={t('orders.fields.zipCode', 'CEP')} value={formatCep(cliente?.cep)} />
                  <InfoRow label={t('orders.fields.ibgeCode', 'Código IBGE')} value={toStringValue(cliente?.codigo_ibge)} />
                  <InfoRow label={t('orders.fields.reference', 'Ponto de referência')} value={toStringValue(cliente?.ponto_referencia)} />
                </div>
              </DetailSectionCard>
            </div>
            ) : null}

            {activeSection === 'products' ? (
            <DetailSectionCard
              icon={<Package2 className="h-5 w-5" />}
              title={t('orders.sections.products', 'Produtos')}
              description={t('orders.sectionDescriptions.products', 'Itens do pedido com embalagem, corte, cupons, tabela e valores atendidos.')}
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#efe8dc] text-sm">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="py-3 pr-4" />
                      <th className="py-3 pr-4 text-center">{t('orders.fields.productId', 'ID')}</th>
                      <th className="py-3 pr-4 text-center">{t('orders.fields.productCode', 'Código')}</th>
                      <th className="py-3 pr-4">{t('orders.fields.product', 'Produto')}</th>
                      <th className="py-3 pr-4 text-center">{t('orders.fields.priceTable', 'Tabela')}</th>
                      <th className="py-3 pr-4 text-right">{t('orders.fields.quantityRequested', 'Qtd. solicitada')}</th>
                      <th className="py-3 pr-4 text-right">{t('orders.fields.quantityServed', 'Qtd. atendida')}</th>
                      <th className="py-3 pr-4 text-right">{t('orders.fields.unitValue', 'Valor unit.')}</th>
                      <th className="py-3 text-right">{t('orders.fields.subtotal', 'Subtotal')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1ecdf]">
                    {produtos.map((item, index) => {
                      const produto = toRecord(item.produto)
                      const embalagem = toRecord(item.embalagem)
                      const quantidadeEmbalagem = toNumber(embalagem?.quantidade) || 1
                      const quantidadeSolicitada = toNumber(item.quantidade) / quantidadeEmbalagem
                      const quantidadeAtendida = toNumber(item.quantidade_atendida) / quantidadeEmbalagem
                      const hasTotalCut = detail.status !== 'cancelado' && quantidadeAtendida < quantidadeSolicitada && quantidadeAtendida <= 0
                      const hasPartialCut = detail.status !== 'cancelado' && quantidadeAtendida < quantidadeSolicitada && quantidadeAtendida > 0
                      return (
                        <tr key={`${detail.id}-produto-${index}`}>
                          <td className="py-3 pr-4 align-middle"><ProductThumb product={produto} assetsBucketUrl={currentTenant.assetsBucketUrl} /></td>
                          <td className="py-3 pr-4 text-center align-middle">{toStringValue(produto?.id)}</td>
                          <td className="py-3 pr-4 text-center align-middle">{toStringValue(produto?.codigo)}</td>
                          <td className="py-3 pr-4 align-middle">
                            <div className="space-y-1">
                              <p className="font-semibold text-slate-900">{toStringValue(produto?.nome)}</p>
                              <p className="text-xs text-slate-500">{embalagem ? `${t('orders.fields.packaging', 'Embalagem')}: ${toStringValue(embalagem.nome)}` : t('orders.fields.packagingMissing', 'Embalagem não encontrada')}</p>
                              {item.mensagem_erp ? <p className="text-xs text-slate-500">{t('orders.fields.erpMessage', 'Mensagem ERP')}: {String(item.mensagem_erp)}</p> : null}
                              {item.id_cupom_automatico ? <p className="text-xs text-slate-500">{t('orders.fields.automaticCouponApplied', 'Cupom automático aplicado')}</p> : null}
                              {item.id_cupom_desconto ? <p className="text-xs text-slate-500">{t('orders.fields.discountCouponApplied', 'Cupom desconto aplicado')}</p> : null}
                              {item.prazo_adicional ? <p className="text-xs font-semibold text-slate-600">{t('orders.fields.additionalLeadTime', 'Prazo de entrega adicional de {{count}} dia(s)', { count: String(item.prazo_adicional) })}</p> : null}
                              {hasTotalCut ? <StatusBadge tone="danger">{t('orders.fields.totalCut', 'Produto com corte total')}</StatusBadge> : null}
                              {hasPartialCut ? <StatusBadge tone="warning">{t('orders.fields.partialCut', 'Produto com corte parcial')}</StatusBadge> : null}
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-center align-middle">{toStringValue(item.id_tabela_preco)}</td>
                          <td className="py-3 pr-4 text-right align-middle">{quantidadeSolicitada}</td>
                          <td className="py-3 pr-4 text-right align-middle">{quantidadeAtendida}</td>
                          <td className="py-3 pr-4 text-right align-middle">{formatCurrency(toNumber(item.valor_embalagem))}</td>
                          <td className="py-3 text-right align-middle">{formatCurrency(toNumber(item.valor_total_atendido))}</td>
                        </tr>
                      )
                    })}
                    <tr className="font-semibold text-slate-900">
                      <td colSpan={5} className="py-3 pr-4" />
                      <td className="py-3 pr-4 text-right">{produtoQuantidadeSolicitada}</td>
                      <td className="py-3 pr-4 text-right">{produtoQuantidadeAtendida}</td>
                      <td className="py-3 pr-4" />
                      <td className="py-3 text-right">{formatCurrencyValue(detail.valor_produtos_atendido_ajustado)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </DetailSectionCard>
            ) : null}

            {activeSection === 'timeline' ? (
            <DetailSectionCard
              icon={<History className="h-5 w-5" />}
              title={t('orders.sections.events', 'Timeline')}
              description={t('orders.sectionDescriptions.events', 'Linha do tempo operacional do pedido com os marcos registrados no processo.')}
            >
                <div className="space-y-3">
                  {eventos.length ? eventos.map((evento, index) => (
                    <div key={`${detail.id}-evento-${index}`} className="relative flex items-start gap-4 rounded-2xl border border-[#efe8dc] bg-slate-50/70 px-4 py-4">
                      <div className="relative flex flex-col items-center">
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700">
                          <History className="h-4 w-4" />
                        </div>
                        {index < eventos.length - 1 ? <span className="mt-2 h-full min-h-8 w-px bg-slate-200" /> : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge tone="info">{humanizeEnum(evento.status)}</StatusBadge>
                            {evento.codigo ? <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{String(evento.codigo)}</span> : null}
                          </div>
                          <span className="text-xs text-slate-500">{evento.data ? formatDateTime(String(evento.data)) : '-'}</span>
                        </div>
                        {evento.descricao ? <p className="mt-2 text-sm text-slate-600">{String(evento.descricao)}</p> : null}
                      </div>
                    </div>
                  )) : <p className="text-sm text-slate-500">{t('orders.emptyEvents', 'Nenhum evento disponível.')}</p>}
                </div>
            </DetailSectionCard>
            ) : null}

            {activeSection === 'technical' ? (
            <div className="grid gap-5 xl:grid-cols-2">
              <DetailSectionCard
                icon={<FileText className="h-5 w-5" />}
                title={t('orders.sections.details', 'Detalhes')}
                description={t('orders.sectionDescriptions.details', 'Metadados do pedido, rastreabilidade, contexto do usuário e integração.')}
              >
                <div className="divide-y divide-[#efe8dc]">
                  <InfoRow label={t('orders.fields.createdAt', 'Data de criação')} value={detail.created_at ? formatDateTime(String(detail.created_at)) : '-'} />
                  <InfoRow label={t('orders.fields.updatedAt', 'Última atualização')} value={detail.updated_at ? formatDateTime(String(detail.updated_at)) : '-'} />
                  <InfoRow label={t('orders.fields.userName', 'Nome usuário')} value={toStringValue(usuario?.nome)} />
                  <InfoRow label={t('orders.fields.user', 'Usuário')} value={resolveEntityLabel(detail.usuario, ['nome'])} />
                  <InfoRow label={t('orders.fields.userEmail', 'E-mail usuário')} value={toStringValue(usuario?.email)} />
                  <InfoRow label={t('orders.fields.userProfile', 'Perfil usuário')} value={detail.venda_assistida ? t('orders.fields.sellerProfile', 'Vendedor') : t('orders.fields.customerProfile', 'Cliente')} />
                  <InfoRow label={t('orders.fields.creatorIp', 'IP criador')} value={toStringValue(detail.ip_inicio)} />
                  <InfoRow label={t('orders.fields.checkoutIp', 'IP fechamento')} value={toStringValue(detail.ip)} />
                  <InfoRow label={t('orders.fields.utmSource', 'UTM Source')} value={toStringValue(detail.utm_source)} />
                  <InfoRow label={t('orders.fields.utmMedium', 'UTM Medium')} value={toStringValue(detail.utm_medium)} />
                  <InfoRow label={t('orders.fields.utmCampaign', 'UTM Campaign')} value={toStringValue(detail.utm_campaign)} />
                  <InfoRow label={t('orders.fields.utmId', 'UTM ID')} value={toStringValue(detail.utm_id)} />
                  <InfoRow label={t('orders.fields.utmTerm', 'UTM Term')} value={toStringValue(detail.utm_term)} />
                  <InfoRow label={t('orders.fields.approved', 'Aprovado')} value={<StatusBadge tone={resolveBooleanTone(detail.aprovado === true)}>{detail.aprovado === true ? t('common.yes', 'Sim') : t('common.no', 'Não')}</StatusBadge>} />
                  <InfoRow label={t('orders.fields.internalize', 'Internalizar no ERP')} value={<StatusBadge tone={resolveBooleanTone(detail.internalizar === true)}>{detail.internalizar === true ? t('common.yes', 'Sim') : t('common.no', 'Não')}</StatusBadge>} />
                  <InfoRow label={t('orders.fields.internalized', 'Internalizado no ERP')} value={<StatusBadge tone={resolveBooleanTone(detail.internalizado === true)}>{detail.internalizado === true ? t('common.yes', 'Sim') : t('common.no', 'Não')}</StatusBadge>} />
                  <InfoRow label={t('orders.fields.invoiced', 'Faturado')} value={<StatusBadge tone={resolveBooleanTone(detail.faturado === true)}>{detail.faturado === true ? t('common.yes', 'Sim') : t('common.no', 'Não')}</StatusBadge>} />
                  <InfoRow label={t('orders.fields.erpMessage', 'Mensagem ERP')} value={toStringValue(detail.mensagem_erp)} />
                  <InfoRow label={t('orders.fields.sessionId', 'ID sessão')} value={toStringValue(detail.id_sessao)} />
                  <InfoRow label={t('orders.fields.sync', 'Sync')} value={toStringValue(detail.id_sync)} />
                </div>
              </DetailSectionCard>

              <DetailSectionCard
                icon={<ScrollText className="h-5 w-5" />}
                title={t('orders.sections.logs', 'Logs')}
                description={t('orders.sectionDescriptions.logs', 'Histórico técnico e operacional com acesso rápido aos payloads registrados.')}
              >
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[#efe8dc] text-sm">
                    <thead>
                      <tr className="text-left text-slate-500">
                        <th className="py-3 pr-4">{t('common.code', 'Código')}</th>
                        <th className="py-3 pr-4">{t('orders.fields.logType', 'Tipo')}</th>
                        <th className="py-3 pr-4">{t('orders.fields.date', 'Data')}</th>
                        <th className="py-3 pr-4">{t('orders.fields.description', 'Descrição')}</th>
                        <th className="py-3 text-right">{t('common.actions', 'Ações')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1ecdf]">
                      {logs.length ? logs.map((log, index) => {
                        const jsonContent = typeof log.json === 'string' ? log.json : log.json && typeof log.json === 'object' ? JSON.stringify(log.json, null, 2) : ''
                        return (
                          <tr key={`${detail.id}-log-${index}`}>
                            <td className="py-3 pr-4 align-top">{toStringValue(log.codigo)}</td>
                            <td className="py-3 pr-4 align-top">{humanizeEnum(log.tipo)}</td>
                            <td className="py-3 pr-4 align-top">{log.data ? formatDateTime(String(log.data)) : '-'}</td>
                            <td className="py-3 pr-4 align-top">{toStringValue(log.descricao)}</td>
                            <td className="py-3 text-right align-top">
                              {jsonContent ? <button type="button" onClick={() => setJsonModal({ title: t('orders.fields.logJson', 'JSON do log de pedido'), content: jsonContent })} className="inline-flex items-center gap-2 rounded-full border border-[#e6dfd3] px-3 py-2 text-sm font-semibold text-slate-700"><Eye className="h-4 w-4" />{t('orders.actions.viewJson', 'Ver JSON')}</button> : null}
                            </td>
                          </tr>
                        )
                      }) : <tr><td className="py-4 text-sm text-slate-500" colSpan={5}>{t('orders.emptyLogs', 'Nenhum log disponível.')}</td></tr>}
                    </tbody>
                  </table>
                </div>
              </DetailSectionCard>
            </div>
            ) : null}
          </>
        ) : null}
      </AsyncState>

      <OverlayModal open={Boolean(jsonModal)} title={jsonModal?.title || t('orders.fields.logJson', 'JSON do log de pedido')} onClose={() => setJsonModal(null)} maxWidthClassName="max-w-4xl">
        <div className="space-y-4">
          <div className="flex justify-end">
            <button type="button" onClick={() => void handleCopyJson()} className="inline-flex items-center gap-2 rounded-full border border-[#e6dfd3] px-4 py-2.5 text-sm font-semibold text-slate-700">
              <Copy className="h-4 w-4" />
              {t('orders.actions.copyJson', 'Copiar JSON')}
            </button>
          </div>
          <pre className="overflow-x-auto rounded-[1.25rem] bg-slate-950 p-4 text-xs leading-6 text-slate-100">{jsonModal?.content || ''}</pre>
        </div>
      </OverlayModal>

      <PageToast message={toast.message} tone={toast.tone} onClose={() => setToast((current) => ({ ...current, message: null }))} />

      {pedidoActions.dialogs}
    </div>
  )
}

