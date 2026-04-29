'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AsyncState } from '@/src/components/ui/async-state'
import { PageHeader } from '@/src/components/ui/page-header'
import { PageToast } from '@/src/components/ui/page-toast'
import { SectionCard } from '@/src/components/ui/section-card'
import { TabButton } from '@/src/components/ui/tab-button'
import { resolveCrudLookupOption } from '@/src/components/crud-base/crud-client'
import { CrudFormSections } from '@/src/components/crud-base/crud-form-sections'
import type { CrudDataClient, CrudModuleConfig, CrudOption, CrudRecord } from '@/src/components/crud-base/types'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { useFormState } from '@/src/hooks/use-form-state'
import { useFooterActionsVisibility } from '@/src/hooks/use-footer-actions-visibility'
import { useI18n } from '@/src/i18n/use-i18n'

type CatalogTab = {
  key: string
  label: string
  icon: ReactNode
  sectionIds?: string[]
  renderToolbar?: (context: {
    id?: string
    form: CrudRecord
    config: CrudModuleConfig
    isEditing: boolean
    optionsMap: Record<string, CrudOption[]>
    readOnly: boolean
    refreshRecord: () => Promise<void>
    onFeedback: (message: string | null, tone?: 'success' | 'error') => void
    patch: (key: string, value: unknown) => void
  }) => ReactNode
  render?: (context: {
    id?: string
    form: CrudRecord
    config: CrudModuleConfig
    isEditing: boolean
    optionsMap: Record<string, CrudOption[]>
    readOnly: boolean
    refreshRecord: () => Promise<void>
    onFeedback: (message: string | null, tone?: 'success' | 'error') => void
    patch: (key: string, value: unknown) => void
  }) => ReactNode
  hidden?: (context: { isEditing: boolean; form: CrudRecord }) => boolean
}

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

async function hydrateLookupFields(config: CrudModuleConfig, record: CrudRecord) {
  const lookupFields = config.sections.flatMap((section) => section.fields).filter((field) => field.type === 'lookup' && field.optionsResource)
  if (!lookupFields.length) {
    return record
  }

  const lookupEntries = await Promise.all(lookupFields.map(async (field) => {
    const stateKey = field.lookupStateKey ?? `${field.key}_lookup`
    const currentLookup = record[stateKey]
    const currentId = String(record[field.key] ?? '').trim()

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

  return {
    ...record,
    ...Object.fromEntries(lookupEntries.filter(([, value]) => value)),
  }
}

type TabbedCatalogFormPageProps = {
  config: CrudModuleConfig
  client: CrudDataClient
  id?: string
  tabs: CatalogTab[]
  formEmbed?: string
}

export function TabbedCatalogFormPage({
  config,
  client,
  id,
  tabs,
  formEmbed,
}: TabbedCatalogFormPageProps) {
  const { t } = useI18n()
  const router = useRouter()
  const access = useFeatureAccess(config.featureKey)
  const isEditing = Boolean(id)
  const readOnly = isEditing ? !access.canEdit && access.canView : false
  const canAccess = isEditing ? access.canEdit || access.canView : access.canCreate
  const [activeTab, setActiveTab] = useState(tabs[0]?.key ?? 'general')
  const [isLoading, setIsLoading] = useState(isEditing)
  const [error, setError] = useState<Error | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [feedbackTone, setFeedbackTone] = useState<'success' | 'error'>('success')
  const [isSaving, setIsSaving] = useState(false)
  const [optionsMap, setOptionsMap] = useState<Record<string, CrudOption[]>>({})
  const { state: form, setState: setForm, patch } = useFormState<CrudRecord>(buildInitialRecord(config))
  const { footerRef, isFooterVisible } = useFooterActionsVisibility<HTMLDivElement>()
  const formId = `${config.key}-form`
  const loadErrorMessageRef = useRef('Could not load the record.')

  function showFeedback(message: string | null, tone: 'success' | 'error' = 'success') {
    setFeedback(message)
    setFeedbackTone(tone)
  }

  useEffect(() => {
    loadErrorMessageRef.current = t('simpleCrud.loadError', 'Could not load the record.')
  }, [t])

  const visibleTabs = useMemo(
    () => tabs.filter((tab) => !tab.hidden?.({ isEditing, form })),
    [form, isEditing, tabs],
  )

  useEffect(() => {
    if (visibleTabs.some((tab) => tab.key === activeTab)) {
      return
    }
    setActiveTab(visibleTabs[0]?.key ?? tabs[0]?.key ?? 'general')
  }, [activeTab, tabs, visibleTabs])

  useEffect(() => {
    let alive = true

    async function bootstrap() {
      const optionFields = config.sections
        .flatMap((section) => section.fields)
        .filter((field) => field.type === 'select' && field.optionsResource)

      try {
        const entries = await Promise.all(
          optionFields.map(async (field) => [field.key, await client.listOptions(field.optionsResource!)] as const),
        )
        if (alive) {
          setOptionsMap(Object.fromEntries(entries))
        }
      } catch {
        if (alive) {
          setOptionsMap({})
        }
      }

      if (!id) {
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const loaded = await client.getById(id, formEmbed ?? config.formEmbed)
        if (!alive) {
          return
        }
        const normalized = config.normalizeRecord ? config.normalizeRecord(loaded) : loaded
        const hydrated = await hydrateLookupFields(config, normalized)
        if (!alive) {
          return
        }
        setForm(hydrated)
      } catch (loadError) {
        if (!alive) {
          return
        }
        setError(loadError instanceof Error ? loadError : new Error(loadErrorMessageRef.current))
      } finally {
        if (alive) {
          setIsLoading(false)
        }
      }
    }

    void bootstrap()
    return () => {
      alive = false
    }
  }, [client, config, formEmbed, id, setForm])

  async function refreshRecord() {
    if (!id) {
      return
    }

    const loaded = await client.getById(id, formEmbed ?? config.formEmbed)
    const normalized = config.normalizeRecord ? config.normalizeRecord(loaded) : loaded
    const hydrated = await hydrateLookupFields(config, normalized)
    setForm(hydrated)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    showFeedback(null)

    for (const section of config.sections) {
      for (const field of section.fields) {
        if (field.hidden?.({ form, isEditing })) {
          continue
        }

        const disabled = typeof field.disabled === 'function'
          ? field.disabled({ form, isEditing })
          : Boolean(field.disabled)
      const value = form[field.key]
      if (!disabled && field.required && (value === '' || value === null || value === undefined)) {
          showFeedback(t('simpleCrud.requiredField', '{{field}} is required.', { field: t(field.labelKey, field.label) }), 'error')
        return
      }
      if (field.type === 'email' && value && typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          showFeedback(t('common.validEmail', 'Enter a valid e-mail.'), 'error')
        return
      }
      const customValidationMessage = field.validate?.({ value, form, isEditing })
      if (!disabled && customValidationMessage) {
        showFeedback(t(customValidationMessage, customValidationMessage), 'error')
        return
      }
      }
    }

    setIsSaving(true)
    try {
      const payload = config.beforeSave ? config.beforeSave(form) : form
      const result = await client.save(payload)
      const savedId = Array.isArray(result) && result[0]
        ? String(result[0].id ?? '')
        : result && typeof result === 'object' && 'id' in result
          ? String((result as { id?: unknown }).id ?? '')
          : ''

      if (config.stayOnSave) {
        showFeedback(t('simpleCrud.saved', 'Record saved successfully.'), 'success')
        if (!isEditing && savedId) {
          router.replace(`${config.routeBase}/${savedId}/editar`)
          return
        }
        await refreshRecord()
        return
      }

      const redirectPath = config.getSaveRedirectPath?.({
        id,
        isEditing,
        saved: result,
        form,
      })

      if (redirectPath) {
        if (!isEditing && savedId && redirectPath.includes('/editar')) {
          router.replace(redirectPath)
          return
        }

        router.push(redirectPath)
        return
      }

      if (!isEditing && savedId) {
        router.replace(`${config.routeBase}/${savedId}/editar`)
        return
      }

      router.push(config.routeBase)
    } catch (saveError) {
      showFeedback(saveError instanceof Error ? saveError.message : t('simpleCrud.saveError', 'Could not save the record.'), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const baseBreadcrumbs = [
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

  const breadcrumbs = isEditing
    ? [
        ...baseBreadcrumbs,
        { label: t('routes.editar', 'Edit') },
        { label: `ID #${id}` },
      ]
    : [
        ...baseBreadcrumbs,
        { label: t('routes.novo', 'New') },
      ]

  if (!canAccess) {
    return <AccessDeniedState title={t(config.formTitleKey, config.formTitle)} backHref={config.routeBase} />
  }

  const currentTab = visibleTabs.find((tab) => tab.key === activeTab) ?? visibleTabs[0]

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
            {config.renderHeaderActions?.({ id, isEditing, readOnly })}
            <Link href={config.routeBase} className="app-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold">
              <ArrowLeft className="h-4 w-4" />
              {t('common.back', 'Back')}
            </Link>
          </div>
        }
      />

      <AsyncState isLoading={isLoading} error={error?.message}>
        <PageToast message={feedback} tone={feedbackTone} onClose={() => setFeedback(null)} />

        <form id={formId} className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
          {visibleTabs.length > 1 ? (
            <SectionCard>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {visibleTabs.map((tab) => (
                    <TabButton key={tab.key} active={tab.key === currentTab?.key} icon={tab.icon} label={tab.label} onClick={() => setActiveTab(tab.key)} />
                  ))}
                </div>
                {currentTab?.renderToolbar ? currentTab.renderToolbar({
                  id,
                  form,
                  config,
                  isEditing,
                  optionsMap,
                  readOnly,
                  refreshRecord,
                  onFeedback: showFeedback,
                  patch,
                }) : null}
              </div>
            </SectionCard>
          ) : null}

          {currentTab?.sectionIds?.length ? (
            <CrudFormSections
              config={config}
              form={form}
              isEditing={isEditing}
              readOnly={readOnly}
              patch={patch}
              optionsMap={optionsMap}
              sectionIds={currentTab.sectionIds}
            />
          ) : null}

          {currentTab?.render ? currentTab.render({
            id,
            form,
            config,
            isEditing,
            optionsMap,
            readOnly,
            refreshRecord,
            onFeedback: showFeedback,
            patch,
          }) : null}

          <div ref={footerRef} className="flex flex-wrap justify-center gap-2.5 pt-1">
            {!readOnly ? (
              <button type="submit" disabled={isSaving} className="app-button-primary inline-flex items-center gap-2 rounded-full px-4.5 py-2.5 text-sm font-semibold disabled:opacity-60">
                <Save className="h-4 w-4" />
                {isSaving ? t('common.loading', 'Loading...') : t('common.save', 'Save')}
              </button>
            ) : null}
            <Link href={config.routeBase} className="app-button-secondary inline-flex items-center rounded-full px-4.5 py-2.5 text-sm font-semibold">
              {t('common.cancel', 'Cancel')}
            </Link>
          </div>
        </form>
      </AsyncState>
    </div>
  )
}
