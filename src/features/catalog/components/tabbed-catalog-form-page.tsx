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
    onFeedback: (message: string | null) => void
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
    onFeedback: (message: string | null) => void
    patch: (key: string, value: unknown) => void
  }) => ReactNode
  hidden?: (context: { isEditing: boolean; form: CrudRecord }) => boolean
}

function buildInitialRecord(config: CrudModuleConfig) {
  const record: CrudRecord = { ativo: true }
  for (const section of config.sections) {
    for (const field of section.fields) {
      record[field.key] = field.type === 'toggle' ? field.key === 'ativo' : ''
    }
  }
  return record
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
  const [isSaving, setIsSaving] = useState(false)
  const [optionsMap, setOptionsMap] = useState<Record<string, CrudOption[]>>({})
  const { state: form, setState: setForm, patch } = useFormState<CrudRecord>(buildInitialRecord(config))
  const { footerRef, isFooterVisible } = useFooterActionsVisibility<HTMLDivElement>()
  const formId = `${config.key}-form`
  const loadErrorMessageRef = useRef('Could not load the record.')

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
        setForm(config.normalizeRecord ? config.normalizeRecord(loaded) : loaded)
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
    setForm(config.normalizeRecord ? config.normalizeRecord(loaded) : loaded)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback(null)

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
          setFeedback(t('simpleCrud.requiredField', '{{field}} is required.', { field: t(field.labelKey, field.label) }))
          return
        }
        if (field.type === 'email' && value && typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          setFeedback(t('common.validEmail', 'Enter a valid e-mail.'))
          return
        }
      }
    }

    setIsSaving(true)
    try {
      const payload = config.beforeSave ? config.beforeSave(form) : form
      const result = await client.save(payload)
      const savedId = Array.isArray(result) && result[0] && typeof result[0].id === 'string' ? result[0].id : null
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
      setFeedback(saveError instanceof Error ? saveError.message : t('simpleCrud.saveError', 'Could not save the record.'))
    } finally {
      setIsSaving(false)
    }
  }

  const breadcrumbs = isEditing
    ? [
        { label: t('routes.dashboard', 'Home'), href: '/dashboard' },
        { label: t(config.breadcrumbSectionKey, config.breadcrumbSection) },
        { label: t(config.breadcrumbModuleKey, config.breadcrumbModule), href: config.routeBase },
        { label: t('routes.editar', 'Edit') },
        { label: `ID #${id}` },
      ]
    : [
        { label: t('routes.dashboard', 'Home'), href: '/dashboard' },
        { label: t(config.breadcrumbSectionKey, config.breadcrumbSection) },
        { label: t(config.breadcrumbModuleKey, config.breadcrumbModule), href: config.routeBase },
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
              <button type="submit" form={formId} disabled={isSaving} className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
                <Save className="h-4 w-4" />
                {isSaving ? t('common.loading', 'Loading...') : t('common.save', 'Save')}
              </button>
            ) : null}
            <Link href={config.routeBase} className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-slate-700">
              <ArrowLeft className="h-4 w-4" />
              {t('common.back', 'Back')}
            </Link>
          </div>
        }
      />

      <AsyncState isLoading={isLoading} error={error?.message}>
        <PageToast message={feedback} onClose={() => setFeedback(null)} />

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
                  onFeedback: setFeedback,
                  patch,
                }) : null}
              </div>
            </SectionCard>
          ) : null}

          {currentTab?.sectionIds?.length ? (
            <CrudFormSections
              config={config}
              form={form}
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
            onFeedback: setFeedback,
            patch,
          }) : null}

          <div ref={footerRef} className="flex flex-wrap justify-center gap-2.5 pt-1">
            {!readOnly ? (
              <button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4.5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                <Save className="h-4 w-4" />
                {isSaving ? t('common.loading', 'Loading...') : t('common.save', 'Save')}
              </button>
            ) : null}
            <Link href={config.routeBase} className="inline-flex items-center rounded-full border border-line bg-white px-4.5 py-2.5 text-sm font-semibold text-slate-700">
              {t('common.cancel', 'Cancel')}
            </Link>
          </div>
        </form>
      </AsyncState>
    </div>
  )
}
