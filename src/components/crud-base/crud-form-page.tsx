'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AsyncState } from '@/src/components/ui/async-state'
import { PageHeader } from '@/src/components/ui/page-header'
import { PageToast } from '@/src/components/ui/page-toast'
import { resolveCrudLookupOption } from '@/src/components/crud-base/crud-client'
import { CrudFormSections } from '@/src/components/crud-base/crud-form-sections'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { useI18n } from '@/src/i18n/use-i18n'
import { useFormState } from '@/src/hooks/use-form-state'
import { useFooterActionsVisibility } from '@/src/hooks/use-footer-actions-visibility'
import { useRouteParams } from '@/src/next/route-context'
import type { CrudDataClient, CrudModuleConfig, CrudOption, CrudRecord } from '@/src/components/crud-base/types'

function buildInitialRecord(config: CrudModuleConfig) {
  const record: CrudRecord = { ativo: true }
  for (const section of config.sections) {
    for (const field of section.fields) {
      if (field.defaultValue !== undefined) {
        record[field.key] = field.defaultValue
      } else {
        record[field.key] = field.type === 'toggle' ? field.key === 'ativo' : ''
      }
      if (field.type === 'lookup' && field.lookupDefaultOption !== undefined) {
        record[field.lookupStateKey ?? `${field.key}_lookup`] = field.lookupDefaultOption
      }
    }
  }
  return record
}

function isFieldHidden(field: CrudModuleConfig['sections'][number]['fields'][number], form: CrudRecord, isEditing: boolean) {
  return field.hidden?.({ form, isEditing }) ?? false
}

function isFieldDisabled(field: CrudModuleConfig['sections'][number]['fields'][number], form: CrudRecord, isEditing: boolean) {
  return typeof field.disabled === 'function'
    ? field.disabled({ form, isEditing })
    : Boolean(field.disabled)
}

export function CrudFormPage({ config, client, id }: { config: CrudModuleConfig; client: CrudDataClient; id?: string }) {
  const { t } = useI18n()
  const router = useRouter()
  const routeParams = useRouteParams<{ id?: string }>()
  const resolvedId = id ?? routeParams.id
  const access = useFeatureAccess(config.featureKey)
  const isEditing = Boolean(resolvedId)
  const canAccess = isEditing ? access.canEdit || access.canView : access.canCreate
  const readOnly = isEditing ? !access.canEdit && access.canView : false
  const [isLoading, setIsLoading] = useState(isEditing)
  const [error, setError] = useState<Error | null>(null)
  const [feedback, setFeedback] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [optionsMap, setOptionsMap] = useState<Record<string, CrudOption[]>>({})
  const { state: form, setState: setForm, patch } = useFormState<CrudRecord>(buildInitialRecord(config))
  const { footerRef, isFooterVisible } = useFooterActionsVisibility<HTMLDivElement>()
  const formId = `${config.key}-form`
  const loadErrorMessageRef = useRef('Could not load the record.')

  useEffect(() => {
    loadErrorMessageRef.current = t('simpleCrud.loadError', 'Could not load the record.')
  }, [t])

  useEffect(() => {
    let alive = true

    async function bootstrap() {
      const optionFields = config.sections.flatMap((section) => section.fields).filter((field) => field.type === 'select' && field.optionsResource)
      try {
        const entries = await Promise.all(optionFields.map(async (field) => [field.key, await client.listOptions(field.optionsResource!)] as const))
        if (alive) setOptionsMap(Object.fromEntries(entries))
      } catch {
        if (alive) setOptionsMap({})
      }

      if (!resolvedId) return

      setIsLoading(true)
      setError(null)

      try {
        const loaded = await client.getById(resolvedId, config.formEmbed)
        if (!alive) return
        const normalized = config.normalizeRecord ? config.normalizeRecord(loaded) : loaded
        const lookupFields = config.sections.flatMap((section) => section.fields).filter((field) => field.type === 'lookup' && field.optionsResource)
        const lookupEntries = await Promise.all(lookupFields.map(async (field) => {
          const stateKey = field.lookupStateKey ?? `${field.key}_lookup`
          const currentLookup = normalized[stateKey]
          const currentId = String(normalized[field.key] ?? '').trim()

          if (!currentId) {
            return [stateKey, null] as const
          }

          if (currentLookup && typeof currentLookup === 'object' && currentLookup !== null && 'label' in currentLookup) {
            const currentLabel = String((currentLookup as { label?: unknown }).label ?? '').trim()
            if (currentLabel && currentLabel !== currentId) {
              return [stateKey, currentLookup] as const
            }
          }

          try {
            const resolved = await resolveCrudLookupOption(field.optionsResource!, currentId)
            return [
              stateKey,
              resolved ? { id: resolved.value, label: resolved.label } : currentLookup ?? { id: currentId, label: currentId },
            ] as const
          } catch {
            return [stateKey, currentLookup ?? { id: currentId, label: currentId }] as const
          }
        }))

        setForm({
          ...normalized,
          ...Object.fromEntries(lookupEntries.filter(([, value]) => value)),
        })
      } catch (loadError) {
        if (!alive) return
        setError(loadError instanceof Error ? loadError : new Error(loadErrorMessageRef.current))
      } finally {
        if (alive) setIsLoading(false)
      }
    }

    void bootstrap()
    return () => {
      alive = false
    }
  }, [client, config, resolvedId, setForm])

  const breadcrumbs = useMemo(() => {
    const baseItems = [
      { label: t('routes.dashboard', 'Home'), href: '/dashboard' },
      ...(config.breadcrumbParents?.map((item) => ({
        label: t(item.labelKey, item.label),
        href: item.href,
      })) ?? []),
      ...(config.hideBreadcrumbSection
        ? []
        : [{ label: t(config.breadcrumbSectionKey, config.breadcrumbSection), href: config.breadcrumbSectionHref }]),
      { label: t(config.breadcrumbModuleKey, config.breadcrumbModule), href: config.routeBase },
    ]

    if (resolvedId) {
      return [
        ...baseItems,
        { label: t('routes.editar', 'Edit') },
        { label: `ID #${resolvedId}` },
      ]
    }
    return [
      ...baseItems,
      { label: t('routes.novo', 'New') },
    ]
  }, [config, resolvedId, t])

  if (!canAccess) {
    return <AccessDeniedState title={t(config.formTitleKey, config.formTitle)} backHref={config.routeBase} />
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback('')

    for (const section of config.sections) {
      for (const field of section.fields) {
        if (isFieldHidden(field, form, isEditing)) {
          continue
        }
        if (isFieldDisabled(field, form, isEditing)) {
          continue
        }
        const value = form[field.key]
        if (field.required && (value === '' || value === null || value === undefined)) {
          setFeedback(t('simpleCrud.requiredField', '{{field}} is required.', { field: t(field.labelKey, field.label) }))
          return
        }
        if (field.type === 'email' && value && typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          setFeedback(t('common.validEmail', 'Enter a valid e-mail.'))
          return
        }
        const customValidationMessage = field.validate?.({ value, form, isEditing })
        if (customValidationMessage) {
          setFeedback(t(customValidationMessage, customValidationMessage))
          return
        }
      }
    }

    setIsSaving(true)
    try {
      const payload = config.beforeSave ? config.beforeSave(form) : form
      const saved = await client.save(payload)
      const redirectPath = config.getSaveRedirectPath
        ? config.getSaveRedirectPath({ id: resolvedId, isEditing, saved, form })
        : config.routeBase
      router.push(redirectPath)
    } catch (saveError) {
      setFeedback(saveError instanceof Error ? saveError.message : t('simpleCrud.saveError', 'Could not save the record.'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex flex-wrap gap-2">
            {!readOnly && !isFooterVisible ? (
              <button type="submit" form={formId} disabled={isSaving} className="app-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-60">
                <Save className="h-4 w-4" />
                {isSaving ? t('common.loading', 'Loading...') : t('common.save', 'Save')}
              </button>
            ) : null}
            {config.renderHeaderActions?.({ id: resolvedId, isEditing, readOnly })}
            {!isFooterVisible ? (
              <Link href={config.routeBase} className="app-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"><ArrowLeft className="h-4 w-4" />{t('common.back', 'Back')}</Link>
            ) : null}
          </div>
        }
      />

      <AsyncState isLoading={isLoading} error={error?.message}>
        <form id={formId} className="space-y-6" onSubmit={(event) => void handleSubmit(event)}>
          <PageToast message={feedback || null} onClose={() => setFeedback('')} />
          <CrudFormSections config={config} form={form} isEditing={isEditing} readOnly={readOnly} patch={patch} optionsMap={optionsMap} />
          <div ref={footerRef} className="flex flex-wrap justify-center gap-2.5 pt-1">
            {!readOnly ? <button type="submit" disabled={isSaving} className="app-button-primary inline-flex items-center gap-2 rounded-full px-4.5 py-2.5 text-sm font-semibold disabled:opacity-60"><Save className="h-4 w-4" />{isSaving ? t('common.loading', 'Loading...') : t('common.save', 'Save')}</button> : null}
            <Link href={config.routeBase} className="app-button-secondary inline-flex items-center rounded-full px-4.5 py-2.5 text-sm font-semibold">{t('common.cancel', 'Cancel')}</Link>
          </div>
        </form>
      </AsyncState>
    </div>
  )
}
