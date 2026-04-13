'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LoaderCircle, RotateCcw, Save } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { AsyncState } from '@/src/components/ui/async-state'
import { CodeEditor } from '@/src/components/ui/code-editor'
import { FormField } from '@/src/components/ui/form-field'
import { inputClasses } from '@/src/components/ui/input-styles'
import { LookupSelect } from '@/src/components/ui/lookup-select'
import { PageHeader } from '@/src/components/ui/page-header'
import { PageToast } from '@/src/components/ui/page-toast'
import { SectionCard } from '@/src/components/ui/section-card'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { parametrosClient } from '@/src/features/parametros/services/parametros-client'
import { parametroChaveOptions } from '@/src/features/parametros/services/parametros-mappers'
import type { ParametroLookupOption, ParametroFormValues } from '@/src/features/parametros/services/parametros-types'
import { useFooterActionsVisibility } from '@/src/hooks/use-footer-actions-visibility'
import { useFormState } from '@/src/hooks/use-form-state'
import { useI18n } from '@/src/i18n/use-i18n'
import { extractSavedId } from '@/src/lib/api-payload'
import { useRouteParams } from '@/src/next/route-context'

const primaryButtonDisabledClasses =
  'disabled:cursor-not-allowed disabled:opacity-60'

const fieldCardClasses = 'app-control-muted rounded-[1.15rem] p-4'

function toLookupOptions(items: ParametroLookupOption[]) {
  return items.map((item) => ({ id: item.value, label: item.label }))
}

export function ParametroFormPage() {
  const { t } = useI18n()
  const router = useRouter()
  const access = useFeatureAccess('parametros')
  const { id } = useRouteParams<{ id?: string }>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [initialValues, setInitialValues] = useState<ParametroFormValues>(parametrosClient.createEmptyValues())
  const [filiais, setFiliais] = useState<ParametroLookupOption[]>([])
  const { state: values, setState: setValues, patch } = useFormState<ParametroFormValues>(parametrosClient.createEmptyValues())
  const { footerRef, isFooterVisible } = useFooterActionsVisibility<HTMLDivElement>()
  const formId = 'parametro-form'
  const isEditing = Boolean(id)
  const canSave = isEditing ? access.canEdit : access.canCreate

  const breadcrumbs = useMemo(
    () => [
      { label: t('routes.dashboard', 'Início'), href: '/dashboard' },
      { label: t('routes.configuracoes', 'Configurações'), href: '/configuracoes' },
      { label: t('parameters.title', 'Parâmetros'), href: '/configuracoes/parametros' },
      {
        label: isEditing
          ? t('parameters.form.editTitle', 'Editar parâmetro')
          : t('parameters.form.createTitle', 'Novo parâmetro'),
        href: isEditing ? `/configuracoes/parametros/${id}/editar` : '/configuracoes/parametros/novo',
      },
    ],
    [id, isEditing, t],
  )

  const hasChanges = useMemo(
    () => Object.keys(values).some((key) => String(values[key as keyof ParametroFormValues] ?? '') !== String(initialValues[key as keyof ParametroFormValues] ?? '')),
    [initialValues, values],
  )

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const result = await parametrosClient.get(id)
        if (!active) {
          return
        }

        setInitialValues(result.values)
        setValues(result.values)
        setFiliais(result.filiais)
        setError(null)
      } catch (loadError) {
        if (!active) {
          return
        }

        setError(loadError instanceof Error ? loadError : new Error(
          t('parameters.feedback.loadError', 'Não foi possível carregar o parâmetro.'),
        ))
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
  }, [id, setValues, t])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSave) {
      return
    }

    if (values.parametros.trim()) {
      try {
        JSON.parse(values.parametros)
      } catch {
        setFeedback(t('parameters.feedback.invalidJson', 'Informe um JSON válido antes de salvar.'))
        return
      }
    }

    try {
      setSaving(true)
      const saveResult = await parametrosClient.save(id, values)
      const savedId = id || extractSavedId(saveResult)
      const refreshed = await parametrosClient.get(savedId || undefined)
      setInitialValues(refreshed.values)
      setValues(refreshed.values)
      setFiliais(refreshed.filiais)
      setFeedback(t('parameters.feedback.saveSuccess', 'Parâmetro salvo com sucesso.'))

      if (!id && savedId) {
        router.replace(`/configuracoes/parametros/${savedId}/editar`)
      }
    } catch (saveError) {
      setFeedback(
        saveError instanceof Error
          ? saveError.message
          : t('parameters.feedback.saveError', 'Não foi possível salvar o parâmetro.'),
      )
    } finally {
      setSaving(false)
    }
  }

  function restoreOriginal() {
    setValues(initialValues)
  }

  if (!access.canOpen) {
    return <AccessDeniedState title={t('parameters.title', 'Parâmetros')} backHref="/dashboard" />
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
            {canSave ? (
              <button
                type="button"
                onClick={restoreOriginal}
                disabled={!hasChanges || saving}
                className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RotateCcw className="h-4 w-4" />
                {t('parameters.actions.restore', 'Restaurar')}
              </button>
            ) : null}
            <Link
              href="/configuracoes/parametros"
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
          <SectionCard
            title={isEditing ? t('parameters.form.editTitle', 'Editar parâmetro') : t('parameters.form.createTitle', 'Novo parâmetro')}
            description={t('parameters.form.description', 'Defina chave, filial, permissão e o conteúdo JSON usado pelo componente da loja.')}
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className={fieldCardClasses}>
                <FormField label={t('parameters.fields.active', 'Ativo')} asLabel={false}>
                  <select
                    value={values.ativo}
                    onChange={(event) => patch('ativo', event.target.value)}
                    disabled={!canSave}
                    className={inputClasses()}
                  >
                    <option value="1">{t('common.yes', 'Sim')}</option>
                    <option value="0">{t('common.no', 'Não')}</option>
                  </select>
                </FormField>
              </div>

              <div className={fieldCardClasses}>
                <FormField label={t('parameters.fields.key', 'Chave')} asLabel={false}>
                  <select
                    value={values.chave}
                    onChange={(event) => patch('chave', event.target.value)}
                    disabled={!canSave}
                    className={inputClasses()}
                  >
                    <option value="">{t('common.select', 'Selecione')}</option>
                    {parametroChaveOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <div className={fieldCardClasses}>
                <FormField label={t('parameters.fields.branch', 'Filial')} asLabel={false}>
                  <LookupSelect
                    label={t('parameters.fields.branch', 'Filial')}
                    value={toLookupOptions(filiais).find((item) => item.id === values.id_filial) ?? null}
                    onChange={(option) => patch('id_filial', option?.id ?? '')}
                    disabled={!canSave}
                    loadOptions={async (query, page, perPage) => {
                      const options = toLookupOptions(filiais).filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()))
                      return options.slice((page - 1) * perPage, page * perPage)
                    }}
                  />
                </FormField>
              </div>

              <div className={fieldCardClasses}>
                <FormField label={t('parameters.fields.position', 'Posição')} asLabel={false}>
                  <input
                    value={values.posicao}
                    onChange={(event) => patch('posicao', event.target.value)}
                    readOnly={!canSave}
                    inputMode="numeric"
                    className={inputClasses()}
                  />
                </FormField>
              </div>

              <div className={fieldCardClasses}>
                <FormField label={t('parameters.fields.permission', 'Permissão')} asLabel={false}>
                  <select
                    value={values.permissao}
                    onChange={(event) => patch('permissao', event.target.value as ParametroFormValues['permissao'])}
                    disabled={!canSave}
                    className={inputClasses()}
                  >
                    <option value="">{t('common.select', 'Selecione')}</option>
                    <option value="todos">{t('parameters.permission.all', 'Todos')}</option>
                    <option value="publico">{t('parameters.permission.public', 'Público')}</option>
                    <option value="restrito">{t('parameters.permission.restricted', 'Restrito')}</option>
                  </select>
                </FormField>
              </div>

              <div className={`${fieldCardClasses} md:col-span-2 xl:col-span-3`}>
                <FormField label={t('parameters.fields.description', 'Descrição')} asLabel={false}>
                  <input
                    value={values.descricao}
                    onChange={(event) => patch('descricao', event.target.value)}
                    readOnly={!canSave}
                    className={inputClasses()}
                  />
                </FormField>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            title={t('parameters.fields.parameters', 'Parâmetros')}
            description={t('parameters.fields.jsonHelper', 'Edite o JSON bruto usado por esse componente.')}
          >
            <CodeEditor
              editorId={`parametro-editor-${id || 'novo'}`}
              language="json"
              value={values.parametros || ''}
              onChange={(nextValue) => patch('parametros', nextValue)}
              height="420px"
              readOnly={!canSave}
            />
          </SectionCard>

          {canSave ? (
            <div ref={footerRef} className="flex flex-wrap justify-center gap-3">
              <button
                type="submit"
                disabled={!hasChanges || saving}
                className={`app-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold ${primaryButtonDisabledClasses}`}
              >
                {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t('common.save', 'Salvar')}
              </button>
              <button
                type="button"
                onClick={restoreOriginal}
                disabled={!hasChanges || saving}
                className="app-button-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RotateCcw className="h-4 w-4" />
                {t('parameters.actions.restore', 'Restaurar')}
              </button>
              <Link
                href="/configuracoes/parametros"
                className="app-button-secondary inline-flex items-center rounded-full px-5 py-3 text-sm font-semibold"
              >
                {t('common.cancel', 'Cancelar')}
              </Link>
            </div>
          ) : null}
        </form>
      </AsyncState>
    </div>
  )
}
