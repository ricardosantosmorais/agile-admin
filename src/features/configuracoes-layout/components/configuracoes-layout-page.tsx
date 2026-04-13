'use client'

import Link from 'next/link'
import {
  Image as ImageIcon,
  LayoutTemplate,
  LoaderCircle,
  Monitor,
  Palette,
  RotateCcw,
  Save,
  SearchCheck,
  Smartphone,
  Type,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { TabButton } from '@/src/components/ui/tab-button'
import { AssetUploadField } from '@/src/components/ui/asset-upload-field'
import { AsyncState } from '@/src/components/ui/async-state'
import { FormField } from '@/src/components/ui/form-field'
import { inputClasses } from '@/src/components/ui/input-styles'
import { PageHeader } from '@/src/components/ui/page-header'
import { PageToast } from '@/src/components/ui/page-toast'
import { SectionCard } from '@/src/components/ui/section-card'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
import { LayoutCodeEditor } from '@/src/features/configuracoes-layout/components/layout-code-editor'
import { configuracoesLayoutClient } from '@/src/features/configuracoes-layout/services/configuracoes-layout-client'
import {
  configuracoesLayoutAreaDefinitions,
  getDirtyConfiguracoesLayoutKeys,
} from '@/src/features/configuracoes-layout/services/configuracoes-layout-mappers'
import type {
  ConfiguracoesLayoutAreaDefinition,
  ConfiguracoesLayoutAreaKey,
  ConfiguracoesLayoutFieldKey,
  ConfiguracoesLayoutFormValues,
  ConfiguracoesLayoutViewport,
} from '@/src/features/configuracoes-layout/types/configuracoes-layout'
import { useFooterActionsVisibility } from '@/src/hooks/use-footer-actions-visibility'
import { useFormState } from '@/src/hooks/use-form-state'
import { useI18n } from '@/src/i18n/use-i18n'
import { createProfileUploadHandler } from '@/src/lib/uploads'

const primaryButtonDisabledClasses =
  'disabled:cursor-not-allowed disabled:opacity-60'
const LEGACY_LOCKED_TENANT_ID = '1705083119553379'

const areaIconMap = {
  branding: ImageIcon,
  theme: Palette,
  top: LayoutTemplate,
  menu: Monitor,
  newsletter: Type,
  services: Monitor,
  footer: LayoutTemplate,
  seo: SearchCheck,
} satisfies Record<ConfiguracoesLayoutAreaKey, typeof Palette>

const codeFieldLanguageMap: Partial<Record<ConfiguracoesLayoutFieldKey, 'html' | 'css'>> = {
  css: 'css',
  'barra-topo': 'html',
  'barra-topo-mobile': 'html',
  'barra-menu': 'html',
  'barra-menu-mobile': 'html',
  'barra-newsletter': 'html',
  'barra-servicos': 'html',
  'barra-rodape': 'html',
}

function getAreaFieldKey(area: ConfiguracoesLayoutAreaDefinition, viewport: ConfiguracoesLayoutViewport) {
  if (!area.supportsViewport) {
    return area.fieldKeys[0]
  }

  return viewport === 'mobile' ? area.fieldKeys[1] : area.fieldKeys[0]
}

function renderCodeEditor(
  fieldKey: ConfiguracoesLayoutFieldKey,
  values: ConfiguracoesLayoutFormValues,
  patch: (key: ConfiguracoesLayoutFieldKey, value: string) => void,
) {
  const language = codeFieldLanguageMap[fieldKey]
  if (!language) {
    return null
  }

  return (
    <LayoutCodeEditor
      editorId={fieldKey}
      language={language}
      value={values[fieldKey]}
      onChange={(nextValue) => patch(fieldKey, nextValue)}
      height="560px"
    />
  )
}

export function ConfiguracoesLayoutPage() {
  const { t } = useI18n()
  const { session, user } = useAuth()
  const access = useFeatureAccess('configuracoesLayout')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [activeArea, setActiveArea] = useState<ConfiguracoesLayoutAreaKey>('branding')
  const [viewportByArea, setViewportByArea] = useState<Record<ConfiguracoesLayoutAreaKey, ConfiguracoesLayoutViewport>>({
    branding: 'desktop',
    theme: 'desktop',
    top: 'desktop',
    menu: 'desktop',
    newsletter: 'desktop',
    services: 'desktop',
    footer: 'desktop',
    seo: 'desktop',
  })
  const [initialValues, setInitialValues] = useState<ConfiguracoesLayoutFormValues>({
    logomarca: '',
    ico: '',
    css: '',
    'barra-topo': '',
    'barra-topo-mobile': '',
    'barra-menu': '',
    'barra-menu-mobile': '',
    'barra-newsletter': '',
    'barra-servicos': '',
    'barra-rodape': '',
    meta_titulo: '',
    meta_palavras_chave: '',
    meta_descricao: '',
  })
  const { state: values, setState: setValues, patch } = useFormState<ConfiguracoesLayoutFormValues>(initialValues)
  const { footerRef, isFooterVisible } = useFooterActionsVisibility<HTMLDivElement>()

  const formId = 'configuracoes-layout-form'
  const canSave = access.canEdit && !(session?.currentTenant.id === LEGACY_LOCKED_TENANT_ID && !user?.master)
  const activeAreaDefinition = configuracoesLayoutAreaDefinitions.find((area) => area.key === activeArea) ?? configuracoesLayoutAreaDefinitions[0]
  const activeViewport = viewportByArea[activeArea]
  const activeFieldKey = getAreaFieldKey(activeAreaDefinition, activeViewport)
  const dirtyKeys = useMemo(() => getDirtyConfiguracoesLayoutKeys(initialValues, values), [initialValues, values])
  const hasChanges = dirtyKeys.length > 0

  const uploadHandler = useMemo(
    () => createProfileUploadHandler({
      profileId: 'tenant-public-images',
      tenantBucketUrl: session?.currentTenant.assetsBucketUrl ?? null,
      folder: 'imgs',
    }),
    [session?.currentTenant.assetsBucketUrl],
  )

  const breadcrumbs = useMemo(
    () => [
      { label: t('routes.dashboard', 'Início'), href: '/dashboard' },
      { label: t('routes.configuracoes', 'Configurações'), href: '/configuracoes' },
      { label: t('configuracoes.layout.title', 'Layout'), href: '/configuracoes/layout' },
    ],
    [t],
  )

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const result = await configuracoesLayoutClient.get()
        if (!active) {
          return
        }

        setValues(result.values)
        setInitialValues(result.values)
        setError(null)
      } catch (loadError) {
        if (!active) {
          return
        }

        setError(
          loadError instanceof Error
            ? loadError
            : new Error(t('configuracoes.layout.feedback.loadError', 'Não foi possível carregar as configurações de layout.')),
        )
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [setValues, t])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSave || !hasChanges) {
      return
    }

    try {
      setSaving(true)
      await configuracoesLayoutClient.save(initialValues, values)
      const refreshed = await configuracoesLayoutClient.get()
      setValues(refreshed.values)
      setInitialValues(refreshed.values)
      setFeedback(t('configuracoes.layout.feedback.saveSuccess', 'Configurações de layout salvas com sucesso.'))
    } catch (saveError) {
      setFeedback(
        saveError instanceof Error
          ? saveError.message
          : t('configuracoes.layout.feedback.saveError', 'Não foi possível salvar as configurações de layout.'),
      )
    } finally {
      setSaving(false)
    }
  }

  function handleRestoreCurrentArea() {
    if (activeArea === 'branding') {
      patch('logomarca', initialValues.logomarca)
      patch('ico', initialValues.ico)
      return
    }

    if (activeArea === 'seo') {
      patch('meta_titulo', initialValues.meta_titulo)
      patch('meta_palavras_chave', initialValues.meta_palavras_chave)
      patch('meta_descricao', initialValues.meta_descricao)
      return
    }

    patch(activeFieldKey, initialValues[activeFieldKey])
  }

  function renderAreaContent() {
    if (activeArea === 'branding') {
      return (
        <div className="space-y-5">
          <AssetUploadField
            value={values.logomarca}
            onChange={(nextValue) => patch('logomarca', nextValue)}
            onUploadFile={uploadHandler}
            title={t('configuracoes.layout.fields.logomarca.label', 'Logomarca')}
            description={t('configuracoes.layout.fields.logomarca.helper', 'Imagem principal da marca exibida no cabeçalho da loja.')}
            formatsLabel={t('configuracoes.layout.fields.logomarca.formats', 'JPG, PNG, GIF ou WEBP')}
            maxSizeLabel={t('configuracoes.layout.fields.logomarca.maxSize', 'Sugestão: 320x100 px')}
            disabled={!canSave}
          />
          <AssetUploadField
            value={values.ico}
            onChange={(nextValue) => patch('ico', nextValue)}
            onUploadFile={uploadHandler}
            title={t('configuracoes.layout.fields.ico.label', 'Ícone')}
            description={t('configuracoes.layout.fields.ico.helper', 'Favicon usado na barra do navegador e atalhos do tenant.')}
            formatsLabel={t('configuracoes.layout.fields.ico.formats', 'JPG, PNG, GIF ou WEBP')}
            maxSizeLabel={t('configuracoes.layout.fields.ico.maxSize', 'Sugestão: 64x64 px')}
            disabled={!canSave}
          />
        </div>
      )
    }

    if (activeArea === 'seo') {
      return (
        <div className="grid gap-4">
          {(['meta_titulo', 'meta_palavras_chave', 'meta_descricao'] as const).map((fieldKey) => (
            <div key={fieldKey} className="app-control-muted rounded-[1.15rem] p-4">
              <FormField label={t(`configuracoes.layout.fields.${fieldKey}.label`, fieldKey)} asLabel={false}>
                <input
                  value={values[fieldKey]}
                  onChange={(event) => patch(fieldKey, event.target.value)}
                  readOnly={!canSave}
                  className={inputClasses()}
                />
              </FormField>
              <p className="mt-2 text-xs leading-5 text-[color:var(--app-muted)]">
                {t(`configuracoes.layout.fields.${fieldKey}.helper`, '')}
              </p>
            </div>
          ))}
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="app-pane-muted flex flex-wrap items-center justify-between gap-3 rounded-[1.15rem] px-4 py-3">
          <div className="text-sm text-[color:var(--app-muted)]">
            <span className="font-semibold">
              {t(`configuracoes.layout.areas.${activeArea}.title`, activeArea)}
            </span>
            {activeAreaDefinition.supportsViewport ? (
              <span className="app-button-secondary ml-2 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold">
                {t('configuracoes.layout.editingTarget', 'Editando')} {t(`configuracoes.layout.viewport.${activeViewport}`, activeViewport)}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeAreaDefinition.supportsViewport ? (
              <div className="app-control-muted inline-flex rounded-full p-1">
                {(['desktop', 'mobile'] as ConfiguracoesLayoutViewport[]).map((viewport) => (
                  <button
                    key={viewport}
                    type="button"
                    onClick={() => setViewportByArea((current) => ({ ...current, [activeArea]: viewport }))}
                    className={[
                      'inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition',
                      activeViewport === viewport ? 'app-button-primary' : 'text-[color:var(--app-muted)] hover:text-[color:var(--app-text)]',
                    ].join(' ')}
                  >
                    {viewport === 'desktop' ? <Monitor className="h-3.5 w-3.5" /> : <Smartphone className="h-3.5 w-3.5" />}
                    {t(`configuracoes.layout.viewport.${viewport}`, viewport)}
                  </button>
                ))}
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleRestoreCurrentArea}
              className="app-button-secondary inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold"
            >
              <RotateCcw className="h-4 w-4" />
              {t('configuracoes.layout.actions.restore', 'Restaurar')}
            </button>
          </div>
        </div>

        <div className="app-control-muted rounded-[1.25rem] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--app-muted)]">
              {t('configuracoes.layout.codeTitle', 'Código')}
            </p>
            <div className="app-button-secondary rounded-full px-3 py-2 text-xs font-semibold">
              {String(activeFieldKey).toUpperCase()}
            </div>
          </div>
          <div>
            {renderCodeEditor(activeFieldKey, values, patch)}
          </div>
        </div>
      </div>
    )
  }

  if (!access.canOpen) {
    return <AccessDeniedState title={t('configuracoes.layout.title', 'Layout')} backHref="/dashboard" />
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={breadcrumbs}
        actions={(
          <div className="flex flex-wrap gap-2">
            {canSave && !isFooterVisible ? (
              <button
                type="submit"
                form={formId}
                disabled={!hasChanges || saving}
                className={`app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold ${primaryButtonDisabledClasses}`}
              >
                {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t('common.save', 'Salvar')}
              </button>
            ) : null}
            <Link
              href="/configuracoes"
              className="app-button-secondary inline-flex items-center rounded-full px-4 py-3 text-sm font-semibold"
            >
              {t('common.back', 'Voltar')}
            </Link>
          </div>
        )}
      />

      <AsyncState isLoading={loading} error={error?.message}>
        <PageToast message={feedback} onClose={() => setFeedback(null)} />

        <form id={formId} onSubmit={handleSubmit} className="space-y-5">
          <SectionCard className="px-4 py-4 md:px-5 md:py-5">
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <div className="flex min-w-max items-center gap-2">
                  {configuracoesLayoutAreaDefinitions.map((area) => {
                    const Icon = areaIconMap[area.key]
                    return (
                      <TabButton
                        key={area.key}
                        active={activeArea === area.key}
                        label={t(`configuracoes.layout.areas.${area.key}.title`, area.key)}
                        icon={<Icon className="h-4 w-4" />}
                        onClick={() => setActiveArea(area.key)}
                      />
                    )
                  })}
                </div>
              </div>

              {renderAreaContent()}
            </div>
          </SectionCard>

          {canSave ? (
            <div ref={footerRef} className="flex justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={!hasChanges || saving}
                className={`app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold ${primaryButtonDisabledClasses}`}
              >
                {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t('common.save', 'Salvar')}
              </button>
            </div>
          ) : null}
        </form>
      </AsyncState>
    </div>
  )
}


