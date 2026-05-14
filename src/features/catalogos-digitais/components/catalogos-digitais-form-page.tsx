'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { AsyncState } from '@/src/components/ui/async-state'
import { BooleanSegmentedField } from '@/src/components/ui/boolean-segmented-field'
import { FormRow } from '@/src/components/ui/form-row'
import { inputClasses } from '@/src/components/ui/input-styles'
import { PageHeader } from '@/src/components/ui/page-header'
import { PageToast } from '@/src/components/ui/page-toast'
import { SectionCard } from '@/src/components/ui/section-card'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { catalogosDigitaisClient } from '@/src/features/catalogos-digitais/services/catalogos-digitais-client'
import { createEmptyCatalogoDigitalForm } from '@/src/features/catalogos-digitais/services/catalogos-digitais-mappers'
import type { CatalogoDigitalFormRecord } from '@/src/features/catalogos-digitais/types/catalogos-digitais'
import { useRouteParams } from '@/src/next/route-context'
import { useI18n } from '@/src/i18n/use-i18n'
import { extractSavedId } from '@/src/lib/api-payload'

export function CatalogoDigitalFormPage({ id: forcedId }: { id?: string }) {
  const { t } = useI18n()
  const router = useRouter()
  const routeParams = useRouteParams<{ id?: string }>()
  const id = forcedId ?? routeParams.id
  const isEditing = Boolean(id)
  const access = useFeatureAccess('catalogosDigitais')
  const [form, setForm] = useState<CatalogoDigitalFormRecord>(() => createEmptyCatalogoDigitalForm())
  const [loading, setLoading] = useState(isEditing)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const readOnly = isEditing && !access.canEdit && access.canView
  const canAccess = isEditing ? access.canEdit || access.canView : access.canCreate
  const formId = 'catalogo-digital-form'

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

  function patch<K extends keyof CatalogoDigitalFormRecord>(key: K, value: CatalogoDigitalFormRecord[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (readOnly || saving) return
    if (!form.name.trim()) {
      setFeedback(t('digitalCatalogs.form.validation.name', 'Informe o nome do catálogo.'))
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
        actions={
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
        }
      />

      <AsyncState isLoading={loading} error={error ?? undefined}>
        <form id={formId} onSubmit={handleSubmit} className="space-y-5">
          <PageToast message={feedback} onClose={() => setFeedback(null)} />

          <SectionCard
            title={t('digitalCatalogs.form.generalTitle', 'Dados do catálogo')}
            description={t('digitalCatalogs.form.generalDescription', 'Primeira etapa do studio: dados principais e saídas, preservando produtos e blocos já existentes no snapshot.')}
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
              <FormRow label={t('digitalCatalogs.form.fields.publicationMode', 'Modo de publicação')}>
                <select aria-label={t('digitalCatalogs.form.fields.publicationMode', 'Modo de publicação')} className={inputClasses()} value={form.publicationMode} onChange={(event) => patch('publicationMode', event.target.value)} disabled={readOnly}>
                  <option value="nao_publicar">{t('digitalCatalogs.publication.none', 'Não publicar')}</option>
                  <option value="publica">{t('digitalCatalogs.publication.public', 'Pública')}</option>
                  <option value="restrita_cliente">{t('digitalCatalogs.publication.customer', 'Restrita por cliente')}</option>
                  <option value="restrita_vendedor">{t('digitalCatalogs.publication.seller', 'Restrita por vendedor')}</option>
                  <option value="restrita_todos">{t('digitalCatalogs.publication.restricted', 'Restrita')}</option>
                </select>
              </FormRow>

              <FormRow label={t('digitalCatalogs.form.fields.validity', 'Vigência')}>
                <div className="grid gap-3 md:grid-cols-2">
                  <input aria-label={t('digitalCatalogs.form.fields.validFrom', 'Vigência inicial')} type="date" className={inputClasses()} value={form.validFrom} onChange={(event) => patch('validFrom', event.target.value)} disabled={readOnly} />
                  <input aria-label={t('digitalCatalogs.form.fields.validTo', 'Vigência final')} type="date" className={inputClasses()} value={form.validTo} onChange={(event) => patch('validTo', event.target.value)} disabled={readOnly} />
                </div>
              </FormRow>

              <FormRow label={t('digitalCatalogs.form.fields.showPrice', 'Exibir preço')}>
                <BooleanSegmentedField value={form.showPrice} onChange={(value) => patch('showPrice', value)} disabled={readOnly} />
              </FormRow>
            </div>
          </SectionCard>

          <SectionCard title={t('digitalCatalogs.form.snapshotTitle', 'Snapshot preservado')}>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="app-pane rounded-[1rem] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--app-muted)]">{t('digitalCatalogs.columns.products', 'Produtos')}</p>
                <strong className="mt-2 block text-2xl text-[color:var(--app-text)]">{form.products.length}</strong>
              </div>
              <div className="app-pane rounded-[1rem] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--app-muted)]">{t('digitalCatalogs.columns.sections', 'Blocos')}</p>
                <strong className="mt-2 block text-2xl text-[color:var(--app-text)]">{form.sections.length}</strong>
              </div>
            </div>
          </SectionCard>
        </form>
      </AsyncState>
    </div>
  )
}
