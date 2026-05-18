'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Save, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { AsyncState } from '@/src/components/ui/async-state'
import { BooleanSegmentedField } from '@/src/components/ui/boolean-segmented-field'
import { FormRow } from '@/src/components/ui/form-row'
import { inputClasses } from '@/src/components/ui/input-styles'
import { PageHeader } from '@/src/components/ui/page-header'
import { PageToast } from '@/src/components/ui/page-toast'
import { SectionCard } from '@/src/components/ui/section-card'
import { StepIndicator } from '@/src/components/ui/step-indicator'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { catalogosDigitaisClient } from '@/src/features/catalogos-digitais/services/catalogos-digitais-client'
import { createEmptyCatalogoDigitalForm } from '@/src/features/catalogos-digitais/services/catalogos-digitais-mappers'
import type { CatalogoDigitalFormRecord, CatalogoDigitalSection, CatalogoDigitalSectionType } from '@/src/features/catalogos-digitais/types/catalogos-digitais'
import { extractSavedId } from '@/src/lib/api-payload'
import { useRouteParams } from '@/src/next/route-context'
import { useI18n } from '@/src/i18n/use-i18n'

type StudioStep = 'general' | 'blocks' | 'summary'
type SectionDraft = CatalogoDigitalSection & { editingIndex: number | null }

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

export function CatalogoDigitalFormPage({ id: forcedId }: { id?: string }) {
  const { t } = useI18n()
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
  const readOnly = isEditing && !access.canEdit && access.canView
  const canAccess = isEditing ? access.canEdit || access.canView : access.canCreate
  const formId = 'catalogo-digital-form'
  const sections = useMemo(() => form.sections.map(asCatalogoDigitalSection), [form.sections])

  useEffect(() => {
    if (!isEditing || !id) return

    let alive = true
    setLoading(true)
    setError(null)
    void catalogosDigitaisClient.detail(id).then((detail) => {
      if (alive) setForm(detail)
    }).catch((reason) => {
      if (alive) setError(reason instanceof Error ? reason.message : t('digitalCatalogs.form.loadError', 'Não foi possível carregar o catálogo.'))
    }).finally(() => {
      if (alive) setLoading(false)
    })

    return () => {
      alive = false
    }
  }, [id, isEditing, t])

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
                            <FormRow label={t('digitalCatalogs.form.fields.blockSubtitle', 'SubtÃ­tulo do bloco')}>
                              <textarea aria-label={t('digitalCatalogs.form.fields.blockSubtitle', 'SubtÃ­tulo do bloco')} className={`${inputClasses()} min-h-20 resize-y py-3`} value={sectionDraft.subtitulo} onChange={(event) => patchSection('subtitulo', event.target.value)} disabled={readOnly} />
                            </FormRow>
                          </>
                        ) : null}

                        {sectionSupportsImage(sectionDraft.tipo) ? (
                          <FormRow label={t('digitalCatalogs.form.fields.blockImageUrl', 'URL da imagem do bloco')}>
                            <input aria-label={t('digitalCatalogs.form.fields.blockImageUrl', 'URL da imagem do bloco')} className={inputClasses()} value={sectionDraft.banner_url} onChange={(event) => patchSection('banner_url', event.target.value)} disabled={readOnly} />
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
