'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowDown, ArrowLeft, ArrowUp, Eye, Plus, RefreshCcw, Save, Search, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { AsyncState } from '@/src/components/ui/async-state'
import { AssetUploadField } from '@/src/components/ui/asset-upload-field'
import { BooleanSegmentedField } from '@/src/components/ui/boolean-segmented-field'
import { FormRow } from '@/src/components/ui/form-row'
import { inputClasses } from '@/src/components/ui/input-styles'
import { PageHeader } from '@/src/components/ui/page-header'
import { PageToast } from '@/src/components/ui/page-toast'
import { SectionCard } from '@/src/components/ui/section-card'
import { StepIndicator } from '@/src/components/ui/step-indicator'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { catalogosDigitaisClient } from '@/src/features/catalogos-digitais/services/catalogos-digitais-client'
import { createEmptyCatalogoDigitalForm } from '@/src/features/catalogos-digitais/services/catalogos-digitais-mappers'
import type { CatalogoDigitalFormRecord, CatalogoDigitalPricingOptions, CatalogoDigitalProduct, CatalogoDigitalSection, CatalogoDigitalSectionType } from '@/src/features/catalogos-digitais/types/catalogos-digitais'
import { extractSavedId } from '@/src/lib/api-payload'
import { useRouteParams } from '@/src/next/route-context'
import { useI18n } from '@/src/i18n/use-i18n'

type StudioStep = 'general' | 'blocks' | 'summary'
type SectionDraft = CatalogoDigitalSection & { editingIndex: number | null }
type PricingOptionsData = CatalogoDigitalPricingOptions['data']
type PricingContext = Record<string, string>

const SECTION_TYPE_DEFINITIONS: Array<{
  type: CatalogoDigitalSectionType
  model: string
  labelKey: string
  label: string
  descriptionKey: string
  description: string
}> = [
  { type: 'banner', model: 'banner_full', labelKey: 'digitalCatalogs.form.sectionTypes.banner', label: 'Banner', descriptionKey: 'digitalCatalogs.form.sectionTypeDescriptions.banner', description: 'Imagem ampla, hero visual ou chamada de campanha.' },
  { type: 'titulo', model: 'title_left', labelKey: 'digitalCatalogs.form.sectionTypes.title', label: 'Título e subtítulo', descriptionKey: 'digitalCatalogs.form.sectionTypeDescriptions.title', description: 'Bloco textual para abrir, separar ou destacar uma parte do catálogo.' },
  { type: 'produtos_grid', model: 'products_grid_3', labelKey: 'digitalCatalogs.form.sectionTypes.productsGrid', label: 'Produtos em grid', descriptionKey: 'digitalCatalogs.form.sectionTypeDescriptions.productsGrid', description: 'Cards visuais com 2 a 5 colunas, preço opcional e seleção própria.' },
  { type: 'produtos_lista', model: 'products_list', labelKey: 'digitalCatalogs.form.sectionTypes.productsList', label: 'Produtos em lista', descriptionKey: 'digitalCatalogs.form.sectionTypeDescriptions.productsList', description: 'Lista técnica com maior densidade e leitura rápida.' },
  { type: 'texto', model: 'content_editorial', labelKey: 'digitalCatalogs.form.sectionTypes.text', label: 'Texto rico', descriptionKey: 'digitalCatalogs.form.sectionTypeDescriptions.text', description: 'Conteúdo editorial com HTML do bloco.' },
  { type: 'cta', model: 'closing_cta', labelKey: 'digitalCatalogs.form.sectionTypes.cta', label: 'Chamada final', descriptionKey: 'digitalCatalogs.form.sectionTypeDescriptions.cta', description: 'CTA, fechamento comercial ou contato do representante.' },
  { type: 'divisor', model: 'divider_line', labelKey: 'digitalCatalogs.form.sectionTypes.divider', label: 'Divisor', descriptionKey: 'digitalCatalogs.form.sectionTypeDescriptions.divider', description: 'Linha visual para separar blocos.' },
  { type: 'espacador', model: 'spacer_medium', labelKey: 'digitalCatalogs.form.sectionTypes.spacer', label: 'Espaçador', descriptionKey: 'digitalCatalogs.form.sectionTypeDescriptions.spacer', description: 'Respiro vertical controlado entre blocos.' },
  { type: 'quebra_pagina', model: 'page_break', labelKey: 'digitalCatalogs.form.sectionTypes.pageBreak', label: 'Quebra de página', descriptionKey: 'digitalCatalogs.form.sectionTypeDescriptions.pageBreak', description: 'Força o próximo bloco a começar em uma nova página.' },
]

const BLOCK_IMAGE_ACCEPT = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
}

const BLOCK_IMAGE_MAX_SIZE = 5 * 1024 * 1024

function asCatalogoDigitalSection(value: unknown): CatalogoDigitalSection {
  const source = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
  const rawType = String(source.tipo || 'titulo')
  const definition = SECTION_TYPE_DEFINITIONS.find((item) => item.type === rawType) ?? SECTION_TYPE_DEFINITIONS[1]
  const rawProducts = Array.isArray(source.produtos) ? source.produtos : []

  return {
    id: String(source.id || `sec-${Date.now()}`),
    tipo: definition.type,
    modelo_secao: String(source.modelo_secao || definition.model),
    titulo: String(source.titulo || ''),
    subtitulo: String(source.subtitulo || ''),
    banner_url: String(source.banner_url || ''),
    background: String(source.background || '#ffffff'),
    text_color: String(source.text_color || '#0f172a'),
    accent: String(source.accent || '#40b2ae'),
    padding_y: Number(source.padding_y || 16),
    font_size: Number(source.font_size || 24),
    mostrar_preco: source.mostrar_preco === undefined ? true : Boolean(source.mostrar_preco),
    produtos: rawProducts.map((item) => String(item).trim()).filter(Boolean),
    texto_html: String(source.texto_html || ''),
    html_customizado: String(source.html_customizado || ''),
  }
}

function createSectionDraft(type: CatalogoDigitalSectionType, editingIndex: number | null = null, source?: unknown): SectionDraft {
  const base = source ? asCatalogoDigitalSection(source) : asCatalogoDigitalSection({ tipo: type, id: `sec-${Date.now()}` })
  return {
    ...base,
    tipo: type,
    modelo_secao: base.modelo_secao || SECTION_TYPE_DEFINITIONS.find((item) => item.type === type)?.model || type,
    editingIndex,
  }
}

function sectionSupportsImage(type: CatalogoDigitalSectionType) {
  return ['banner', 'texto', 'cta'].includes(type)
}

function sectionSupportsProducts(type: CatalogoDigitalSectionType) {
  return ['produtos_grid', 'produtos_lista'].includes(type)
}

function sectionSupportsText(type: CatalogoDigitalSectionType) {
  return ['banner', 'titulo', 'produtos_grid', 'produtos_lista', 'texto', 'cta'].includes(type)
}

function publicationModeLabel(value: string, t: (key: string, fallback?: string) => string) {
  const labels: Record<string, string> = {
    nao_publicar: t('digitalCatalogs.publication.none', 'Não publicar página'),
    publica: t('digitalCatalogs.publication.public', 'Página pública'),
    restrita_cliente: t('digitalCatalogs.publication.customer', 'Restrita para clientes'),
    restrita_vendedor: t('digitalCatalogs.publication.seller', 'Restrita para vendedores'),
    restrita_todos: t('digitalCatalogs.publication.restricted', 'Restrita para todos logados'),
  }

  return labels[value] || value || '-'
}

function asCatalogProduct(value: unknown): CatalogoDigitalProduct {
  const source = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}

  return {
    ...source,
    id: String(source.id || ''),
    codigo: String(source.codigo || source.code || ''),
    sku: String(source.sku || ''),
    nome: String(source.nome || source.name || source.id || 'Produto'),
    descricao: String(source.descricao || source.description || ''),
    marca: String(source.marca || ''),
    imagem: String(source.imagem || source.image || ''),
    url: String(source.url || ''),
    ativo: source.ativo === undefined ? true : Boolean(source.ativo),
    disponivel: source.disponivel === undefined ? true : Boolean(source.disponivel),
  }
}

function productLabel(product: CatalogoDigitalProduct) {
  return [product.nome, product.codigo].filter(Boolean).join(' - ')
}

function asPlainRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
}

function asPricingContext(value: unknown): PricingContext {
  const source = asPlainRecord(value)
  return {
    id_filial: String(source.id_filial || ''),
    id_forma_pagamento: String(source.id_forma_pagamento || ''),
    id_condicao_pagamento: String(source.id_condicao_pagamento || ''),
    cliente_busca: String(source.cliente_busca || source.codigo_cliente || source.id_cliente || source.cnpj_cpf_cliente || ''),
    id_tabela_preco: String(source.id_tabela_preco || ''),
    id_vendedor: String(source.id_vendedor || ''),
    codigo_vendedor: String(source.codigo_vendedor || ''),
    cnpj_cpf_vendedor: String(source.cnpj_cpf_vendedor || ''),
    id_embalagem: String(source.id_embalagem || ''),
    quantidade: String(source.quantidade || '1'),
    valor_frete_item: String(source.valor_frete_item || ''),
  }
}

export function CatalogoDigitalFormPage({ id: forcedId }: { id?: string }) {
  const { t } = useI18n()
  const { session } = useAuth()
  const router = useRouter()
  const routeParams = useRouteParams<{ id?: string }>()
  const id = forcedId ?? routeParams.id
  const isEditing = Boolean(id)
  const access = useFeatureAccess('catalogosDigitais')
  const [form, setForm] = useState<CatalogoDigitalFormRecord>(() => createEmptyCatalogoDigitalForm())
  const [activeStep, setActiveStep] = useState<StudioStep>('general')
  const [loading, setLoading] = useState(isEditing)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [sectionDraft, setSectionDraft] = useState<SectionDraft | null>(null)
  const [productSearchQuery, setProductSearchQuery] = useState('')
  const [productCodeList, setProductCodeList] = useState('')
  const [collectionId, setCollectionId] = useState('')
  const [productResults, setProductResults] = useState<CatalogoDigitalProduct[]>([])
  const [productLoading, setProductLoading] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [pricingOptions, setPricingOptions] = useState<PricingOptionsData | null>(null)
  const [pricingLoading, setPricingLoading] = useState(false)
  const [pricingContext, setPricingContext] = useState<PricingContext>(() => asPricingContext({}))
  const [recalculatingPrices, setRecalculatingPrices] = useState(false)
  const readOnly = isEditing && !access.canEdit && access.canView
  const canAccess = isEditing ? access.canEdit || access.canView : access.canCreate
  const formId = 'catalogo-digital-form'
  const sections = useMemo(() => form.sections.map(asCatalogoDigitalSection), [form.sections])
  const products = useMemo(() => form.products.map(asCatalogProduct).filter((product) => product.id), [form.products])
  const productsById = useMemo(() => {
    const map = new Map<string, CatalogoDigitalProduct>()
    for (const product of products) {
      if (product.id) map.set(product.id, product)
      if (product.codigo) map.set(product.codigo, product)
    }
    return map
  }, [products])

  useEffect(() => {
    if (!isEditing || !id) return

    let alive = true
    setLoading(true)
    setError(null)
    void catalogosDigitaisClient.detail(id).then((detail) => {
      if (!alive) return
      setForm(detail)
      setPricingContext(asPricingContext(asPlainRecord(detail.snapshot).precificacao))
    }).catch((reason) => {
      if (alive) setError(reason instanceof Error ? reason.message : t('digitalCatalogs.form.loadError', 'Não foi possível carregar o catálogo.'))
    }).finally(() => {
      if (alive) setLoading(false)
    })

    return () => {
      alive = false
    }
  }, [id, isEditing, t])

  useEffect(() => {
    if (activeStep !== 'summary' || pricingOptions) return

    let alive = true
    setPricingLoading(true)
    void catalogosDigitaisClient.pricingOptions().then((result) => {
      if (!alive) return
      setPricingOptions(result.data)
      setPricingContext((current) => {
        const next = { ...current }
        if (!next.quantidade) next.quantidade = '1'
        if (!next.cliente_busca && result.data.modo_ecommerce !== 'b2b' && result.data.cliente_padrao_codigo) {
          next.cliente_busca = result.data.cliente_padrao_codigo
        }
        return next
      })
    }).catch((reason) => {
      if (alive) setFeedback(reason instanceof Error ? reason.message : t('digitalCatalogs.form.pricing.optionsError', 'Não foi possível carregar opções de precificação.'))
    }).finally(() => {
      if (alive) setPricingLoading(false)
    })

    return () => {
      alive = false
    }
  }, [activeStep, pricingOptions, t])

  const breadcrumbs = useMemo(() => (
    isEditing
      ? [
          { label: t('routes.dashboard', 'Início'), href: '/dashboard' },
          { label: t('routes.catalogo', 'Catálogo') },
          { label: t('digitalCatalogs.title', 'Catálogos Digitais'), href: '/catalogos-digitais' },
          { label: t('routes.editar', 'Editar') },
        ]
      : [
          { label: t('routes.dashboard', 'Início'), href: '/dashboard' },
          { label: t('routes.catalogo', 'Catálogo') },
          { label: t('digitalCatalogs.title', 'Catálogos Digitais'), href: '/catalogos-digitais' },
          { label: t('routes.novo', 'Novo') },
        ]
  ), [isEditing, t])

  const studioSteps = useMemo(() => [
    { id: 'general', label: t('digitalCatalogs.form.steps.general', 'Geral') },
    { id: 'blocks', label: t('digitalCatalogs.form.steps.blocks', 'Blocos') },
    { id: 'summary', label: t('digitalCatalogs.form.steps.summary', 'Resumo') },
  ], [t])

  function patch<K extends keyof CatalogoDigitalFormRecord>(key: K, value: CatalogoDigitalFormRecord[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function patchPricingContext(key: string, value: string) {
    setPricingContext((current) => ({ ...current, [key]: value }))
  }

  function pricingOptionLabel(option: { codigo?: string; nome: string }) {
    return [option.codigo, option.nome].filter(Boolean).join(' - ')
  }

  function patchSection<K extends keyof CatalogoDigitalSection>(key: K, value: CatalogoDigitalSection[K]) {
    setSectionDraft((current) => current ? { ...current, [key]: value } : current)
  }

  function persistSectionDraft() {
    if (!sectionDraft || readOnly) return
    const { editingIndex, ...section } = sectionDraft
    const nextSections = [...sections]
    if (editingIndex === null) {
      nextSections.push(section)
    } else {
      nextSections[editingIndex] = section
    }
    patch('sections', nextSections)
    setSectionDraft(null)
  }

  function removeSection(index: number) {
    if (readOnly) return
    patch('sections', sections.filter((_section, sectionIndex) => sectionIndex !== index))
    setSectionDraft(null)
  }

  function moveSection(index: number, direction: -1 | 1) {
    if (readOnly) return
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= sections.length) return
    const nextSections = [...sections]
    const [item] = nextSections.splice(index, 1)
    nextSections.splice(targetIndex, 0, item)
    patch('sections', nextSections)
  }

  function productIdsValue(section: CatalogoDigitalSection) {
    return section.produtos.join('\n')
  }

  function parseProductIds(value: string) {
    return value
      .split(/[\n,;]/)
      .map((item) => item.trim())
      .filter(Boolean)
  }

  function mergeProducts(incoming: CatalogoDigitalProduct[]) {
    setForm((current) => {
      const byId = new Map(current.products.map(asCatalogProduct).filter((product) => product.id).map((product) => [product.id, product]))
      for (const product of incoming) {
        if (product.id) byId.set(product.id, product)
      }
      return { ...current, products: Array.from(byId.values()) }
    })
  }

  function addProductToCurrentSection(product: CatalogoDigitalProduct) {
    if (!sectionDraft || readOnly || !product.id) return
    mergeProducts([product])
    setSectionDraft((current) => {
      if (!current) return current
      const ids = new Set(current.produtos)
      ids.add(product.id)
      return { ...current, produtos: Array.from(ids) }
    })
  }

  async function loadProductsFromSearch() {
    if (!productSearchQuery.trim()) return
    setProductLoading(true)
    setFeedback(null)
    try {
      const result = await catalogosDigitaisClient.searchProducts({ q: productSearchQuery, perpage: 18 })
      const found = result.data.map(asCatalogProduct)
      setProductResults(found)
      if (!found.length) {
        setFeedback(t('digitalCatalogs.form.products.emptySearch', 'Nenhum produto encontrado para esta busca.'))
      }
    } catch (reason) {
      setFeedback(reason instanceof Error ? reason.message : t('digitalCatalogs.form.products.searchError', 'Não foi possível buscar produtos.'))
    } finally {
      setProductLoading(false)
    }
  }

  async function loadProductsFromCodes() {
    if (!productCodeList.trim()) return
    setProductLoading(true)
    setFeedback(null)
    try {
      const result = await catalogosDigitaisClient.searchProducts({ codigos: productCodeList })
      setProductResults(result.data.map(asCatalogProduct))
      if (result.not_found?.length) {
        setFeedback(t('digitalCatalogs.form.products.notFound', 'Alguns códigos não foram localizados.'))
      }
    } catch (reason) {
      setFeedback(reason instanceof Error ? reason.message : t('digitalCatalogs.form.products.resolveError', 'Não foi possível consultar a lista de produtos.'))
    } finally {
      setProductLoading(false)
    }
  }

  async function importCollectionProducts() {
    if (!collectionId.trim()) return
    setProductLoading(true)
    setFeedback(null)
    try {
      const result = await catalogosDigitaisClient.importCollection(collectionId)
      const imported = result.data.map(asCatalogProduct)
      setProductResults(imported)
      mergeProducts(imported)
      setSectionDraft((current) => current ? { ...current, produtos: Array.from(new Set([...current.produtos, ...imported.map((product) => product.id).filter(Boolean)])) } : current)
      setFeedback(t('digitalCatalogs.form.products.collectionLoaded', 'Coleção carregada nos resultados. Revise os produtos adicionados ao bloco.'))
    } catch (reason) {
      setFeedback(reason instanceof Error ? reason.message : t('digitalCatalogs.form.products.collectionError', 'Não foi possível importar a coleção.'))
    } finally {
      setProductLoading(false)
    }
  }

  function buildDraftSnapshot(): Record<string, unknown> {
    const snapshotOutputs = typeof form.snapshot.saidas === 'object' && form.snapshot.saidas !== null ? form.snapshot.saidas as Record<string, unknown> : {}
    const draftSections = sectionDraft
      ? (() => {
          const { editingIndex, ...draft } = sectionDraft
          const nextSections = [...sections]
          if (editingIndex === null) {
            nextSections.push(draft)
          } else {
            nextSections[editingIndex] = draft
          }
          return nextSections
        })()
      : sections
    return {
      ...form.snapshot,
      nome: form.name.trim(),
      chamada_capa: form.coverCall.trim(),
      modelo: form.model,
      template: form.template,
      objetivo: form.objective,
      vigencia_inicio: form.validFrom,
      vigencia_fim: form.validTo,
      produtos: products,
      secoes: draftSections,
      precificacao: pricingContext,
      saidas: {
        ...snapshotOutputs,
        modo_publicacao: form.publicationMode,
        exibir_preco: form.showPrice,
        vigencia_inicio: form.validFrom,
        vigencia_fim: form.validTo,
      },
    }
  }

  async function openDraftPreview() {
    if (previewing) return
    setPreviewing(true)
    setFeedback(null)
    const previewWindow = window.open('about:blank', '_blank')
    if (!previewWindow) {
      setFeedback(t('digitalCatalogs.form.previewBlocked', 'O navegador bloqueou a janela de prévia. Libere pop-ups para este endereço e tente novamente.'))
      setPreviewing(false)
      return
    }

    try {
      const html = await catalogosDigitaisClient.previewDraft(buildDraftSnapshot())
      previewWindow.document.open()
      previewWindow.document.write(html)
      previewWindow.document.close()
      previewWindow.focus()
    } catch (reason) {
      setFeedback(reason instanceof Error ? reason.message : t('digitalCatalogs.form.previewError', 'Não foi possível gerar a prévia do rascunho.'))
    } finally {
      setPreviewing(false)
    }
  }

  async function recalculatePrices() {
    if (readOnly || recalculatingPrices) return

    setRecalculatingPrices(true)
    setFeedback(null)
    try {
      const result = await catalogosDigitaisClient.recalculateSnapshot(buildDraftSnapshot())
      const payload = asPlainRecord(result.payload)
      const nextProducts = Array.isArray(payload.produtos) ? payload.produtos : form.products
      const nextSections = Array.isArray(payload.secoes) ? payload.secoes : sections

      setForm((current) => ({
        ...current,
        products: nextProducts,
        sections: nextSections,
        snapshot: {
          ...current.snapshot,
          ...payload,
        },
      }))
      setPricingContext(asPricingContext(payload.precificacao || pricingContext))

      const count = Number(result.meta?.precificados || 0)
      setFeedback(count === 1
        ? t('digitalCatalogs.form.pricing.recalculatedOne', '1 produto precificado.')
        : t('digitalCatalogs.form.pricing.recalculatedMany', '{{count}} produtos precificados.').replace('{{count}}', String(count)))
    } catch (reason) {
      setFeedback(reason instanceof Error ? reason.message : t('digitalCatalogs.form.pricing.recalculateError', 'Não foi possível recalcular os preços.'))
    } finally {
      setRecalculatingPrices(false)
    }
  }

  async function uploadBlockImage(file: File) {
    const extension = file.name.includes('.') ? `.${file.name.split('.').pop()?.toLowerCase() || ''}` : ''
    const validExtension = Object.values(BLOCK_IMAGE_ACCEPT).flat().includes(extension)
    const validMime = Object.keys(BLOCK_IMAGE_ACCEPT).includes(file.type)

    if (!validExtension || !validMime) {
      throw new Error(t('digitalCatalogs.form.validation.blockImageFormat', 'Envie uma imagem JPG, PNG, GIF ou WEBP.'))
    }

    if (file.size > BLOCK_IMAGE_MAX_SIZE) {
      throw new Error(t('digitalCatalogs.form.validation.blockImageSize', 'A imagem deve ter no máximo 5 MB.'))
    }

    return catalogosDigitaisClient.uploadSectionImage(file, {
      catalogId: id || form.id,
      tenantBucketUrl: session?.currentTenant.assetsBucketUrl || '',
      tenantId: session?.currentTenant.id || '',
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (readOnly || saving) return
    if (!form.name.trim()) {
      setFeedback(t('digitalCatalogs.form.validation.name', 'Informe o nome do catálogo.'))
      setActiveStep('general')
      return
    }

    setSaving(true)
    setFeedback(null)
    try {
      const result = await catalogosDigitaisClient.save(form)
      const savedId = extractSavedId(result)
      if (!isEditing && savedId) {
        router.replace(`/catalogos-digitais/${savedId}/editar`)
        return
      }
      router.push('/catalogos-digitais')
    } catch (reason) {
      setFeedback(reason instanceof Error ? reason.message : t('digitalCatalogs.form.saveError', 'Não foi possível salvar o catálogo.'))
    } finally {
      setSaving(false)
    }
  }

  if (!canAccess) {
    return <AccessDeniedState title={t('digitalCatalogs.title', 'Catálogos Digitais')} backHref="/catalogos-digitais" />
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={breadcrumbs}
        actions={(
          <div className="flex flex-wrap gap-2">
            {!readOnly ? (
              <button type="submit" form={formId} disabled={saving} className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold disabled:opacity-60">
                <Save className="h-4 w-4" />
                {t('digitalCatalogs.form.save', 'Salvar catálogo')}
              </button>
            ) : null}
            <Link href="/catalogos-digitais" className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold">
              <ArrowLeft className="h-4 w-4" />
              {t('common.back', 'Voltar')}
            </Link>
          </div>
        )}
      />

      <AsyncState isLoading={loading} error={error ?? undefined}>
        <form id={formId} onSubmit={handleSubmit} className="space-y-5">
          <PageToast message={feedback} onClose={() => setFeedback(null)} />

          <SectionCard>
            <StepIndicator items={studioSteps} activeStep={activeStep} onStepClick={(step) => setActiveStep(step as StudioStep)} />
          </SectionCard>

          {activeStep === 'general' ? (
            <>
              <SectionCard
                title={t('digitalCatalogs.form.generalTitle', 'Dados básicos do catálogo')}
                description={t('digitalCatalogs.form.generalDescription', 'Dados básicos do catálogo e regra de publicação usados pelo Studio do legado.')}
              >
                <div className="space-y-6">
                  <FormRow label={t('simpleCrud.fields.active', 'Ativo')}>
                    <BooleanSegmentedField value={form.active} onChange={(value) => patch('active', value)} disabled={readOnly} />
                  </FormRow>

                  <FormRow label={t('digitalCatalogs.form.fields.name', 'Nome do catálogo')} required>
                    <input aria-label={t('digitalCatalogs.form.fields.name', 'Nome do catálogo')} className={inputClasses()} value={form.name} onChange={(event) => patch('name', event.target.value)} disabled={readOnly} />
                  </FormRow>

                  <FormRow label={t('digitalCatalogs.form.fields.coverCall', 'Chamada de capa')}>
                    <textarea aria-label={t('digitalCatalogs.form.fields.coverCall', 'Chamada de capa')} className={`${inputClasses()} min-h-24 resize-y py-3`} value={form.coverCall} onChange={(event) => patch('coverCall', event.target.value)} disabled={readOnly} />
                  </FormRow>

                  <FormRow label={t('digitalCatalogs.form.fields.model', 'Modelo')}>
                    <select aria-label={t('digitalCatalogs.form.fields.model', 'Modelo')} className={inputClasses()} value={form.model} onChange={(event) => patch('model', event.target.value)} disabled={readOnly}>
                      <option value="campanha_promocional">Campanha promocional</option>
                      <option value="portfolio">Portfólio</option>
                      <option value="personalizado">Personalizado</option>
                    </select>
                  </FormRow>

                  <FormRow label={t('digitalCatalogs.form.fields.template', 'Template')}>
                    <select aria-label={t('digitalCatalogs.form.fields.template', 'Template')} className={inputClasses()} value={form.template} onChange={(event) => patch('template', event.target.value)} disabled={readOnly}>
                      <option value="executivo">Executivo</option>
                      <option value="comercial">Comercial</option>
                      <option value="minimalista">Minimalista</option>
                    </select>
                  </FormRow>

                  <FormRow label={t('digitalCatalogs.form.fields.objective', 'Objetivo')}>
                    <select aria-label={t('digitalCatalogs.form.fields.objective', 'Objetivo')} className={inputClasses()} value={form.objective} onChange={(event) => patch('objective', event.target.value)} disabled={readOnly}>
                      <option value="promocional">Promocional</option>
                      <option value="institucional">Institucional</option>
                      <option value="personalizado">Personalizado</option>
                    </select>
                  </FormRow>
                </div>
              </SectionCard>

              <SectionCard title={t('digitalCatalogs.form.outputsTitle', 'Saídas e publicação')}>
                <div className="space-y-6">
                  <FormRow label={t('digitalCatalogs.form.fields.publicationMode', 'Página no site')}>
                    <select aria-label={t('digitalCatalogs.form.fields.publicationMode', 'Página no site')} className={inputClasses()} value={form.publicationMode} onChange={(event) => patch('publicationMode', event.target.value)} disabled={readOnly}>
                      <option value="nao_publicar">{t('digitalCatalogs.publication.none', 'Não publicar página')}</option>
                      <option value="publica">{t('digitalCatalogs.publication.public', 'Página pública')}</option>
                      <option value="restrita_cliente">{t('digitalCatalogs.publication.customer', 'Restrita para clientes')}</option>
                      <option value="restrita_vendedor">{t('digitalCatalogs.publication.seller', 'Restrita para vendedores')}</option>
                      <option value="restrita_todos">{t('digitalCatalogs.publication.restricted', 'Restrita para todos logados')}</option>
                    </select>
                  </FormRow>

                  <FormRow label={t('digitalCatalogs.form.fields.validity', 'Vigência')}>
                    <div className="grid gap-3 md:grid-cols-2">
                      <input aria-label={t('digitalCatalogs.form.fields.validFrom', 'Veicular de')} type="date" className={inputClasses()} value={form.validFrom} onChange={(event) => patch('validFrom', event.target.value)} disabled={readOnly} />
                      <input aria-label={t('digitalCatalogs.form.fields.validTo', 'Veicular até')} type="date" className={inputClasses()} value={form.validTo} onChange={(event) => patch('validTo', event.target.value)} disabled={readOnly} />
                    </div>
                  </FormRow>

                  <FormRow label={t('digitalCatalogs.form.fields.showPrice', 'Exibir preço')}>
                    <BooleanSegmentedField value={form.showPrice} onChange={(value) => patch('showPrice', value)} disabled={readOnly} />
                  </FormRow>
                </div>
              </SectionCard>
            </>
          ) : null}

          {activeStep === 'blocks' ? (
            <SectionCard
              title={t('digitalCatalogs.form.blocksTitle', 'Monte o catálogo com componentes visuais')}
              description={t('digitalCatalogs.form.blocksDescription', 'Produtos e blocos preservados do snapshot do catálogo, mantendo o fluxo de montagem do legado.')}
            >
              <div className="space-y-5">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="app-pane rounded-[1rem] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--app-muted)]">{t('digitalCatalogs.columns.products', 'Produtos')}</p>
                    <strong className="mt-2 block text-2xl text-[color:var(--app-text)]">{form.products.length}</strong>
                  </div>
                  <div className="app-pane rounded-[1rem] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--app-muted)]">{t('digitalCatalogs.columns.sections', 'Blocos')}</p>
                    <strong className="mt-2 block text-2xl text-[color:var(--app-text)]">{sections.length}</strong>
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--app-muted)]">{t('digitalCatalogs.form.addBlock', 'Adicionar bloco')}</p>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {SECTION_TYPE_DEFINITIONS.map((definition) => (
                      <button
                        key={definition.type}
                        type="button"
                        onClick={() => setSectionDraft(createSectionDraft(definition.type))}
                        disabled={readOnly}
                        className="app-control min-h-[92px] rounded-[1rem] px-4 py-3 text-left transition hover:border-[color:var(--app-control-border-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span className="flex items-center gap-2 text-sm font-bold text-[color:var(--app-text)]">
                          <Plus className="h-4 w-4" />
                          {t(definition.labelKey, definition.label)}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-[color:var(--app-muted)]">
                          {t(definition.descriptionKey, definition.description)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--app-muted)]">{t('digitalCatalogs.form.createdBlocks', 'Blocos criados')}</p>
                    {sections.length ? (
                      sections.map((section, index) => (
                        <div key={`${section.id}-${index}`} className="app-pane flex flex-col gap-3 rounded-[1rem] p-4 md:flex-row md:items-center md:justify-between">
                          <button
                            type="button"
                            className="min-w-0 text-left"
                            onClick={() => setSectionDraft(createSectionDraft(section.tipo, index, section))}
                          >
                            <span className="block truncate text-sm font-bold text-[color:var(--app-text)]">{section.titulo || t('digitalCatalogs.form.untitledBlock', 'Bloco sem título')}</span>
                            <span className="mt-1 block text-xs text-[color:var(--app-muted)]">
                              {t(SECTION_TYPE_DEFINITIONS.find((item) => item.type === section.tipo)?.labelKey || '', section.tipo)} · {section.modelo_secao}
                            </span>
                          </button>
                          {!readOnly ? (
                            <div className="flex gap-2">
                              <button type="button" aria-label={t('digitalCatalogs.form.moveBlockUp', 'Mover bloco para cima')} className="app-button-secondary inline-flex h-9 w-9 items-center justify-center rounded-full disabled:opacity-40" onClick={() => moveSection(index, -1)} disabled={index === 0}>
                                <ArrowUp className="h-4 w-4" />
                              </button>
                              <button type="button" aria-label={t('digitalCatalogs.form.moveBlockDown', 'Mover bloco para baixo')} className="app-button-secondary inline-flex h-9 w-9 items-center justify-center rounded-full disabled:opacity-40" onClick={() => moveSection(index, 1)} disabled={index === sections.length - 1}>
                                <ArrowDown className="h-4 w-4" />
                              </button>
                              <button type="button" aria-label={t('digitalCatalogs.form.removeBlock', 'Remover bloco')} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-600 transition hover:border-rose-300" onClick={() => removeSection(index)}>
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <div className="app-pane-muted rounded-[1rem] p-4 text-sm text-[color:var(--app-muted)]">
                        {t('digitalCatalogs.form.emptyBlocks', 'Nenhum bloco foi criado para este catálogo.')}
                      </div>
                    )}
                  </div>

                  {sectionDraft ? (
                    <div className="app-pane rounded-[1rem] p-4">
                      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--app-muted)]">{t('digitalCatalogs.form.configureBlock', 'Configure o bloco')}</p>
                          <h3 className="mt-1 text-base font-bold text-[color:var(--app-text)]">
                            {t(SECTION_TYPE_DEFINITIONS.find((item) => item.type === sectionDraft.tipo)?.labelKey || '', sectionDraft.tipo)}
                          </h3>
                        </div>
                        <button type="button" className="app-button-secondary rounded-full px-3 py-2 text-xs font-semibold" onClick={() => setSectionDraft(null)}>
                          {t('common.cancel', 'Cancelar')}
                        </button>
                      </div>

                      <div className="space-y-5">
                        <FormRow label={t('digitalCatalogs.form.fields.blockModel', 'Modelo do bloco')}>
                          <input aria-label={t('digitalCatalogs.form.fields.blockModel', 'Modelo do bloco')} className={inputClasses()} value={sectionDraft.modelo_secao} onChange={(event) => patchSection('modelo_secao', event.target.value)} disabled={readOnly} />
                        </FormRow>

                        {sectionSupportsText(sectionDraft.tipo) ? (
                          <>
                            <FormRow label={t('digitalCatalogs.form.fields.blockTitle', 'Título do bloco')}>
                              <input aria-label={t('digitalCatalogs.form.fields.blockTitle', 'Título do bloco')} className={inputClasses()} value={sectionDraft.titulo} onChange={(event) => patchSection('titulo', event.target.value)} disabled={readOnly} />
                            </FormRow>
                            <FormRow label={t('digitalCatalogs.form.fields.blockSubtitle', 'Subtítulo do bloco')}>
                              <textarea aria-label={t('digitalCatalogs.form.fields.blockSubtitle', 'Subtítulo do bloco')} className={`${inputClasses()} min-h-20 resize-y py-3`} value={sectionDraft.subtitulo} onChange={(event) => patchSection('subtitulo', event.target.value)} disabled={readOnly} />
                            </FormRow>
                          </>
                        ) : null}

                        {sectionSupportsImage(sectionDraft.tipo) ? (
                          <FormRow label={t('digitalCatalogs.form.fields.blockImageUrl', 'URL da imagem do bloco')}>
                            <AssetUploadField
                              kind="image"
                              value={sectionDraft.banner_url}
                              onChange={(value) => patchSection('banner_url', value)}
                              disabled={readOnly}
                              onUploadFile={uploadBlockImage}
                              title={t('digitalCatalogs.form.upload.blockImageTitle', 'Enviar imagem do bloco')}
                              description={t('digitalCatalogs.form.upload.blockImageDescription', 'A imagem será enviada para o bucket da empresa ativa e usada na prévia, no PDF e na página publicada.')}
                              formatsLabel={t('digitalCatalogs.form.upload.blockImageFormats', 'Formatos JPG, PNG, GIF ou WEBP')}
                              maxSizeLabel={t('digitalCatalogs.form.upload.blockImageMaxSize', 'até 5 MB')}
                            />
                          </FormRow>
                        ) : null}

                        <div className="grid gap-4 md:grid-cols-3">
                          <FormRow label={t('digitalCatalogs.form.fields.background', 'Fundo')}>
                            <input aria-label={t('digitalCatalogs.form.fields.background', 'Fundo')} type="color" className="h-11 w-full rounded-[0.9rem] border border-[color:var(--app-control-border)] bg-transparent p-1" value={sectionDraft.background} onChange={(event) => patchSection('background', event.target.value)} disabled={readOnly} />
                          </FormRow>
                          <FormRow label={t('digitalCatalogs.form.fields.textColor', 'Fonte')}>
                            <input aria-label={t('digitalCatalogs.form.fields.textColor', 'Fonte')} type="color" className="h-11 w-full rounded-[0.9rem] border border-[color:var(--app-control-border)] bg-transparent p-1" value={sectionDraft.text_color} onChange={(event) => patchSection('text_color', event.target.value)} disabled={readOnly} />
                          </FormRow>
                          <FormRow label={t('digitalCatalogs.form.fields.accentColor', 'Destaque')}>
                            <input aria-label={t('digitalCatalogs.form.fields.accentColor', 'Destaque')} type="color" className="h-11 w-full rounded-[0.9rem] border border-[color:var(--app-control-border)] bg-transparent p-1" value={sectionDraft.accent} onChange={(event) => patchSection('accent', event.target.value)} disabled={readOnly} />
                          </FormRow>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <FormRow label={t('digitalCatalogs.form.fields.paddingY', 'Espaçamento vertical')}>
                            <input aria-label={t('digitalCatalogs.form.fields.paddingY', 'Espaçamento vertical')} type="number" min={0} max={80} className={inputClasses()} value={sectionDraft.padding_y} onChange={(event) => patchSection('padding_y', Number(event.target.value))} disabled={readOnly} />
                          </FormRow>
                          <FormRow label={t('digitalCatalogs.form.fields.fontSize', 'Tamanho da fonte')}>
                            <input aria-label={t('digitalCatalogs.form.fields.fontSize', 'Tamanho da fonte')} type="number" min={10} max={48} className={inputClasses()} value={sectionDraft.font_size} onChange={(event) => patchSection('font_size', Number(event.target.value))} disabled={readOnly} />
                          </FormRow>
                        </div>

                        {sectionSupportsProducts(sectionDraft.tipo) ? (
                          <>
                            <FormRow label={t('digitalCatalogs.form.fields.blockProductIds', 'Produtos do bloco')}>
                              <textarea aria-label={t('digitalCatalogs.form.fields.blockProductIds', 'Produtos do bloco')} className={`${inputClasses()} min-h-24 resize-y py-3`} value={productIdsValue(sectionDraft)} onChange={(event) => patchSection('produtos', parseProductIds(event.target.value))} disabled={readOnly} />
                            </FormRow>
                            <div className="app-pane space-y-4 rounded-[1rem] p-4">
                              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.8fr)]">
                                <FormRow label={t('digitalCatalogs.form.products.searchLabel', 'Buscar produtos')}>
                                  <div className="flex flex-col gap-2 sm:flex-row">
                                    <input aria-label={t('digitalCatalogs.form.products.searchLabel', 'Buscar produtos')} className={inputClasses()} value={productSearchQuery} onChange={(event) => setProductSearchQuery(event.target.value)} disabled={readOnly || productLoading} />
                                    <button type="button" className="app-button-secondary inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold" onClick={loadProductsFromSearch} disabled={readOnly || productLoading || !productSearchQuery.trim()}>
                                      <Search className="h-4 w-4" />
                                      {t('digitalCatalogs.form.products.searchButton', 'Buscar produtos')}
                                    </button>
                                  </div>
                                </FormRow>
                                <FormRow label={t('digitalCatalogs.form.products.codeListLabel', 'Códigos ou IDs')}>
                                  <div className="flex flex-col gap-2 sm:flex-row">
                                    <input aria-label={t('digitalCatalogs.form.products.codeListLabel', 'Códigos ou IDs')} className={inputClasses()} value={productCodeList} onChange={(event) => setProductCodeList(event.target.value)} disabled={readOnly || productLoading} />
                                    <button type="button" className="app-button-secondary inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold" onClick={loadProductsFromCodes} disabled={readOnly || productLoading || !productCodeList.trim()}>
                                      <Search className="h-4 w-4" />
                                      {t('digitalCatalogs.form.products.resolveButton', 'Resolver lista')}
                                    </button>
                                  </div>
                                </FormRow>
                                <FormRow label={t('digitalCatalogs.form.products.collectionLabel', 'Coleção')}>
                                  <div className="flex flex-col gap-2 sm:flex-row">
                                    <input aria-label={t('digitalCatalogs.form.products.collectionLabel', 'Coleção')} className={inputClasses()} value={collectionId} onChange={(event) => setCollectionId(event.target.value)} disabled={readOnly || productLoading} />
                                    <button type="button" className="app-button-secondary inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold" onClick={importCollectionProducts} disabled={readOnly || productLoading || !collectionId.trim()}>
                                      <Search className="h-4 w-4" />
                                      {t('digitalCatalogs.form.products.importCollectionButton', 'Importar')}
                                    </button>
                                  </div>
                                </FormRow>
                              </div>

                              <div className="grid gap-4 lg:grid-cols-2">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--app-muted)]">{t('digitalCatalogs.form.products.results', 'Resultados')}</p>
                                  <div className="mt-2 space-y-2">
                                    {productResults.length ? productResults.map((product) => (
                                      <div key={product.id} className="flex items-center justify-between gap-3 rounded-[0.9rem] border border-[color:var(--app-border-subtle)] bg-[color:var(--app-surface)] px-3 py-2">
                                        <span className="min-w-0 text-sm text-[color:var(--app-text)]">
                                          <span className="block truncate font-semibold">{product.nome}</span>
                                          {[product.codigo, product.marca].filter(Boolean).length ? <span className="block truncate text-xs text-[color:var(--app-muted)]">{[product.codigo, product.marca].filter(Boolean).join(' - ')}</span> : null}
                                        </span>
                                        <button type="button" aria-label={`${t('digitalCatalogs.form.products.addProduct', 'Adicionar')} ${product.nome}`} className="app-button-secondary inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold" onClick={() => addProductToCurrentSection(product)} disabled={readOnly || Boolean(productsById.get(product.id) && sectionDraft.produtos.includes(product.id))}>
                                          {t('digitalCatalogs.form.products.addProduct', 'Adicionar')}
                                        </button>
                                      </div>
                                    )) : (
                                      <p className="rounded-[0.9rem] border border-dashed border-[color:var(--app-border-subtle)] px-3 py-4 text-sm text-[color:var(--app-muted)]">{t('digitalCatalogs.form.products.emptyResults', 'Busque produtos, resolva códigos ou importe uma coleção.')}</p>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--app-muted)]">{t('digitalCatalogs.form.products.selected', 'Selecionados no bloco')}</p>
                                  <div className="mt-2 space-y-2">
                                    {sectionDraft.produtos.length ? sectionDraft.produtos.map((productId) => {
                                      const product = productsById.get(productId)
                                      return (
                                        <div key={productId} className="rounded-[0.9rem] border border-[color:var(--app-border-subtle)] bg-[color:var(--app-surface)] px-3 py-2 text-sm text-[color:var(--app-text)]">
                                          <span className="block truncate font-semibold">{product ? productLabel(product) : productId}</span>
                                        </div>
                                      )
                                    }) : (
                                      <p className="rounded-[0.9rem] border border-dashed border-[color:var(--app-border-subtle)] px-3 py-4 text-sm text-[color:var(--app-muted)]">{t('digitalCatalogs.form.products.emptySelected', 'Nenhum produto selecionado para este bloco.')}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <FormRow label={t('digitalCatalogs.form.fields.blockShowPrice', 'Exibir preço no bloco')}>
                              <BooleanSegmentedField value={sectionDraft.mostrar_preco} onChange={(value) => patchSection('mostrar_preco', value)} disabled={readOnly} />
                            </FormRow>
                          </>
                        ) : null}

                        {sectionDraft.tipo === 'texto' || sectionDraft.tipo === 'cta' ? (
                          <FormRow label={t('digitalCatalogs.form.fields.blockHtml', 'HTML do bloco')}>
                            <textarea aria-label={t('digitalCatalogs.form.fields.blockHtml', 'HTML do bloco')} className={`${inputClasses()} min-h-32 resize-y py-3 font-mono text-xs`} value={sectionDraft.texto_html} onChange={(event) => patchSection('texto_html', event.target.value)} disabled={readOnly} />
                          </FormRow>
                        ) : null}

                        {!readOnly ? (
                          <div className="flex justify-end">
                            <button type="button" className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold" onClick={persistSectionDraft}>
                              <Save className="h-4 w-4" />
                              {t('digitalCatalogs.form.saveBlock', 'Salvar bloco')}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </SectionCard>
          ) : null}

          {activeStep === 'summary' ? (
            <SectionCard
              title={t('digitalCatalogs.form.summaryTitle', 'Revise, salve e gere PDF')}
              description={t('digitalCatalogs.form.summaryDescription', 'Conferência final antes de salvar o catálogo e manter as saídas do Studio atualizadas.')}
            >
              <div className="mb-4 flex flex-wrap justify-end gap-2">
                <button type="button" className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold" onClick={openDraftPreview} disabled={previewing}>
                  <Eye className="h-4 w-4" />
                  {t('digitalCatalogs.form.previewDraft', 'Prévia do rascunho')}
                </button>
              </div>
              <div className="app-pane mb-4 rounded-[1rem] p-4">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[color:var(--app-text)]">{t('digitalCatalogs.form.pricing.title', 'Contexto de precificação')}</h3>
                    <p className="mt-1 text-xs leading-5 text-[color:var(--app-muted)]">
                      {t('digitalCatalogs.form.pricing.description', 'Recalcule os preços dos produtos do snapshot usando filial, cliente, pagamento e tabela de preço do contexto comercial legado.')}
                    </p>
                  </div>
                  <button type="button" className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold" onClick={recalculatePrices} disabled={readOnly || pricingLoading || recalculatingPrices}>
                    <RefreshCcw className="h-4 w-4" />
                    {recalculatingPrices ? t('digitalCatalogs.form.pricing.recalculating', 'Recalculando...') : t('digitalCatalogs.form.pricing.recalculate', 'Recalcular preços')}
                  </button>
                </div>

                {pricingLoading ? (
                  <p className="rounded-[0.9rem] border border-dashed border-[color:var(--app-border-subtle)] px-3 py-4 text-sm text-[color:var(--app-muted)]">
                    {t('digitalCatalogs.form.pricing.loading', 'Carregando opções comerciais...')}
                  </p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <FormRow label={t('digitalCatalogs.form.pricing.fields.branch', 'Filial')}>
                      <select aria-label={t('digitalCatalogs.form.pricing.fields.branch', 'Filial')} className={inputClasses()} value={pricingContext.id_filial || ''} onChange={(event) => patchPricingContext('id_filial', event.target.value)} disabled={readOnly}>
                        <option value="">{t('common.select', 'Selecione')}</option>
                        {(pricingOptions?.filiais || []).map((option) => <option key={option.id} value={option.id}>{pricingOptionLabel(option)}</option>)}
                      </select>
                    </FormRow>
                    <FormRow label={t('digitalCatalogs.form.pricing.fields.paymentMethod', 'Forma de pagamento')}>
                      <select aria-label={t('digitalCatalogs.form.pricing.fields.paymentMethod', 'Forma de pagamento')} className={inputClasses()} value={pricingContext.id_forma_pagamento || ''} onChange={(event) => patchPricingContext('id_forma_pagamento', event.target.value)} disabled={readOnly}>
                        <option value="">{t('common.select', 'Selecione')}</option>
                        {(pricingOptions?.formas_pagamento || []).map((option) => <option key={option.id} value={option.id}>{pricingOptionLabel(option)}</option>)}
                      </select>
                    </FormRow>
                    <FormRow label={t('digitalCatalogs.form.pricing.fields.paymentTerm', 'Prazo de pagamento')}>
                      <select aria-label={t('digitalCatalogs.form.pricing.fields.paymentTerm', 'Prazo de pagamento')} className={inputClasses()} value={pricingContext.id_condicao_pagamento || ''} onChange={(event) => patchPricingContext('id_condicao_pagamento', event.target.value)} disabled={readOnly}>
                        <option value="">{t('common.select', 'Selecione')}</option>
                        {(pricingOptions?.condicoes_pagamento || []).map((option) => <option key={option.id} value={option.id}>{pricingOptionLabel(option)}</option>)}
                      </select>
                    </FormRow>
                    <FormRow label={t('digitalCatalogs.form.pricing.fields.customer', 'Cliente')}>
                      <input aria-label={t('digitalCatalogs.form.pricing.fields.customer', 'Cliente')} className={inputClasses()} value={pricingContext.cliente_busca || ''} onChange={(event) => patchPricingContext('cliente_busca', event.target.value)} disabled={readOnly} />
                    </FormRow>
                    <FormRow label={t('digitalCatalogs.form.pricing.fields.priceTable', 'Tabela de preço')}>
                      <select aria-label={t('digitalCatalogs.form.pricing.fields.priceTable', 'Tabela de preço')} className={inputClasses()} value={pricingContext.id_tabela_preco || ''} onChange={(event) => patchPricingContext('id_tabela_preco', event.target.value)} disabled={readOnly}>
                        <option value="">{t('common.select', 'Selecione')}</option>
                        {(pricingOptions?.tabelas_preco || []).map((option) => <option key={option.id} value={option.id}>{pricingOptionLabel(option)}</option>)}
                      </select>
                    </FormRow>
                    <FormRow label={t('digitalCatalogs.form.pricing.fields.sellerId', 'ID do vendedor')}>
                      <input aria-label={t('digitalCatalogs.form.pricing.fields.sellerId', 'ID do vendedor')} className={inputClasses()} value={pricingContext.id_vendedor || ''} onChange={(event) => patchPricingContext('id_vendedor', event.target.value)} disabled={readOnly} />
                    </FormRow>
                    <FormRow label={t('digitalCatalogs.form.pricing.fields.sellerCode', 'Código do vendedor')}>
                      <input aria-label={t('digitalCatalogs.form.pricing.fields.sellerCode', 'Código do vendedor')} className={inputClasses()} value={pricingContext.codigo_vendedor || ''} onChange={(event) => patchPricingContext('codigo_vendedor', event.target.value)} disabled={readOnly} />
                    </FormRow>
                    <FormRow label={t('digitalCatalogs.form.pricing.fields.sellerDocument', 'CNPJ/CPF do vendedor')}>
                      <input aria-label={t('digitalCatalogs.form.pricing.fields.sellerDocument', 'CNPJ/CPF do vendedor')} className={inputClasses()} value={pricingContext.cnpj_cpf_vendedor || ''} onChange={(event) => patchPricingContext('cnpj_cpf_vendedor', event.target.value)} disabled={readOnly} />
                    </FormRow>
                    <FormRow label={t('digitalCatalogs.form.pricing.fields.quantity', 'Quantidade')}>
                      <input aria-label={t('digitalCatalogs.form.pricing.fields.quantity', 'Quantidade')} type="number" min={1} className={inputClasses()} value={pricingContext.quantidade || '1'} onChange={(event) => patchPricingContext('quantidade', event.target.value)} disabled={readOnly} />
                    </FormRow>
                    <FormRow label={t('digitalCatalogs.form.pricing.fields.packagingId', 'ID da embalagem')}>
                      <input aria-label={t('digitalCatalogs.form.pricing.fields.packagingId', 'ID da embalagem')} className={inputClasses()} value={pricingContext.id_embalagem || ''} onChange={(event) => patchPricingContext('id_embalagem', event.target.value)} disabled={readOnly} />
                    </FormRow>
                    <FormRow label={t('digitalCatalogs.form.pricing.fields.itemFreight', 'Frete do item')}>
                      <input aria-label={t('digitalCatalogs.form.pricing.fields.itemFreight', 'Frete do item')} className={inputClasses()} value={pricingContext.valor_frete_item || ''} onChange={(event) => patchPricingContext('valor_frete_item', event.target.value)} disabled={readOnly} />
                    </FormRow>
                  </div>
                )}
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="app-pane rounded-[1rem] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--app-muted)]">{t('digitalCatalogs.columns.name', 'Nome')}</p>
                  <strong className="mt-2 block text-sm text-[color:var(--app-text)]">{form.name || '-'}</strong>
                </div>
                <div className="app-pane rounded-[1rem] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--app-muted)]">{t('digitalCatalogs.columns.products', 'Produtos')}</p>
                  <strong className="mt-2 block text-2xl text-[color:var(--app-text)]">{form.products.length}</strong>
                </div>
                <div className="app-pane rounded-[1rem] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--app-muted)]">{t('digitalCatalogs.columns.sections', 'Blocos')}</p>
                  <strong className="mt-2 block text-2xl text-[color:var(--app-text)]">{form.sections.length}</strong>
                </div>
                <div className="app-pane rounded-[1rem] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--app-muted)]">{t('digitalCatalogs.form.fields.publicationMode', 'Página no site')}</p>
                  <strong className="mt-2 block text-sm text-[color:var(--app-text)]">{publicationModeLabel(form.publicationMode, t)}</strong>
                </div>
              </div>
            </SectionCard>
          ) : null}
        </form>
      </AsyncState>
    </div>
  )
}
