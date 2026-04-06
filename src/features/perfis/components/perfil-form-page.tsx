'use client'

import Link from 'next/link'
import { ArrowLeft, LoaderCircle, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { AsyncState } from '@/src/components/ui/async-state'
import { BooleanChoice } from '@/src/components/ui/boolean-choice'
import { FormRow } from '@/src/components/ui/form-row'
import { inputClasses } from '@/src/components/ui/input-styles'
import { PageHeader } from '@/src/components/ui/page-header'
import { PageToast } from '@/src/components/ui/page-toast'
import { SectionCard } from '@/src/components/ui/section-card'
import { TreeMultiSelect } from '@/src/components/ui/tree-multi-select'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { perfisClient } from '@/src/features/perfis/services/perfis-client'
import { createEmptyPerfilForm, type PerfilFormRecord, type PerfilPermissionNode } from '@/src/features/perfis/services/perfis-mappers'
import { useFormState } from '@/src/hooks/use-form-state'
import { useFooterActionsVisibility } from '@/src/hooks/use-footer-actions-visibility'
import { useI18n } from '@/src/i18n/use-i18n'
import { normalizeTreeSelection } from '@/src/lib/tree-selection'
import { useRouteParams } from '@/src/next/route-context'

type FeedbackTone = 'success' | 'error'

export function PerfilFormPage({ id }: { id?: string }) {
  const { t } = useI18n()
  const router = useRouter()
  const routeParams = useRouteParams<{ id?: string }>()
  const resolvedId = id ?? routeParams.id
  const isEditing = Boolean(resolvedId)
  const access = useFeatureAccess('perfis')
  const canAccess = isEditing ? access.canEdit || access.canView : access.canCreate
  const readOnly = isEditing ? !access.canEdit && access.canView : false
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>('error')
  const [treeSearch, setTreeSearch] = useState('')
  const [treeNodes, setTreeNodes] = useState<PerfilPermissionNode[]>([])
  const [initialValues, setInitialValues] = useState<PerfilFormRecord>(createEmptyPerfilForm())
  const { state: form, setState: setForm, patch } = useFormState<PerfilFormRecord>(createEmptyPerfilForm())
  const { footerRef, isFooterVisible } = useFooterActionsVisibility<HTMLDivElement>()
  const formId = 'perfil-form'

  const hasChanges = useMemo(() => JSON.stringify(initialValues) !== JSON.stringify(form), [form, initialValues])

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        setError(null)

        const [permissionTree, profile] = await Promise.all([
          perfisClient.getPermissionTree(resolvedId),
          resolvedId ? perfisClient.getById(resolvedId) : Promise.resolve(createEmptyPerfilForm()),
        ])

        if (!active) {
          return
        }

        const selectedPermissionIds = normalizeTreeSelection(permissionTree.nodes, permissionTree.selectedIds)
        const nextForm = {
          ...profile,
          selectedPermissionIds,
        }

        setTreeNodes(permissionTree.nodes)
        setForm(nextForm)
        setInitialValues(nextForm)
      } catch (loadError) {
        if (!active) {
          return
        }

        setError(loadError instanceof Error ? loadError : new Error(t('perfis.loadError', 'Não foi possível carregar o perfil.')))
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
  }, [resolvedId, setForm, t])

  const breadcrumbs = isEditing
    ? [
        { label: t('routes.dashboard', 'Início'), href: '/dashboard' },
        { label: t('routes.administration', 'Administração') },
        { label: t('routes.perfis', 'Perfis'), href: '/perfis' },
        { label: t('routes.editar', 'Editar') },
        { label: `ID #${resolvedId}` },
      ]
    : [
        { label: t('routes.dashboard', 'Início'), href: '/dashboard' },
        { label: t('routes.administration', 'Administração') },
        { label: t('routes.perfis', 'Perfis'), href: '/perfis' },
        { label: t('routes.novo', 'Novo') },
      ]

  if (!canAccess) {
    return <AccessDeniedState title={t('perfis.title', 'Perfis')} backHref="/perfis" />
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (readOnly || !access.canEdit && isEditing || !access.canCreate && !isEditing) {
      return
    }

    if (!form.nome.trim()) {
      setFeedbackTone('error')
      setFeedback(t('perfis.form.validation.name', 'Informe o nome do perfil.'))
      return
    }

    try {
      setSaving(true)
      setFeedback(null)
      const result = await perfisClient.save(form, treeNodes)
      router.push(result.id ? `/perfis/${result.id}/editar` : '/perfis')
    } catch (saveError) {
      setFeedbackTone('error')
      setFeedback(
        saveError instanceof Error
          ? saveError.message
          : t('perfis.form.saveError', 'Não foi possível salvar o perfil.'),
      )
    } finally {
      setSaving(false)
    }
  }

  const canSave = isEditing ? access.canEdit : access.canCreate
  const saveButton = (
    <button
      type="submit"
      form={formId}
      disabled={readOnly || !hasChanges || saving}
      className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {t('common.save', 'Salvar')}
    </button>
  )

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={breadcrumbs}
        actions={(
          <div className="flex flex-wrap gap-2">
            {canSave && !isFooterVisible ? saveButton : null}
            <Link
              href="/perfis"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-slate-700"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('common.back', 'Voltar')}
            </Link>
          </div>
        )}
      />

      <AsyncState isLoading={loading} error={error?.message}>
        <form id={formId} onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
          <PageToast message={feedback} tone={feedbackTone} onClose={() => setFeedback(null)} />

          <SectionCard
            title={t('perfis.form.sections.general.title', 'Dados principais')}
            description={t('perfis.form.sections.general.description', 'Defina o nome do perfil, código interno e status de uso.')}
          >
            <div className="space-y-7">
              {readOnly ? (
                <div className="rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {t('perfis.form.readOnlyAlert', 'Este perfil pode ser visualizado, mas você não possui permissão para editar.')}
                </div>
              ) : null}

              <FormRow label={t('perfis.columns.active', 'Ativo')}>
                <BooleanChoice
                  value={form.ativo}
                  onChange={(value) => patch('ativo', value)}
                  disabled={readOnly}
                  trueLabel={t('common.yes', 'Yes')}
                  falseLabel={t('common.no', 'No')}
                />
              </FormRow>

              <FormRow label={t('perfis.columns.code', 'Código')}>
                <input
                  type="text"
                  value={form.codigo}
                  onChange={(event) => patch('codigo', event.target.value)}
                  className={inputClasses()}
                  aria-label={t('perfis.columns.code', 'Código')}
                  disabled={readOnly}
                  maxLength={32}
                />
              </FormRow>

              <FormRow label={t('perfis.columns.name', 'Nome')} required>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(event) => patch('nome', event.target.value)}
                  className={inputClasses()}
                  aria-label={t('perfis.columns.name', 'Nome')}
                  disabled={readOnly}
                  maxLength={255}
                />
              </FormRow>
            </div>
          </SectionCard>

          <SectionCard
            title={t('perfis.form.sections.permissions.title', 'Acessos')}
            description={t(
              'perfis.form.sections.permissions.description',
              'Selecione as funcionalidades liberadas para este perfil. Marcar um grupo aplica o acesso aos itens filhos.',
            )}
          >
            <TreeMultiSelect
              nodes={treeNodes}
              selectedIds={form.selectedPermissionIds}
              onChange={(nextSelectedIds) => patch('selectedPermissionIds', nextSelectedIds)}
              search={treeSearch}
              onSearchChange={setTreeSearch}
              searchPlaceholder={t('perfis.form.permissions.searchPlaceholder', 'Buscar funcionalidade')}
              searchAriaLabel={t('perfis.form.permissions.searchPlaceholder', 'Buscar funcionalidade')}
              emptyMessage={t('perfis.form.permissions.empty', 'Nenhuma funcionalidade encontrada.')}
              expandGroupLabel={t('perfis.form.permissions.expandGroup', 'Expandir grupo')}
              collapseGroupLabel={t('perfis.form.permissions.collapseGroup', 'Recolher grupo')}
              disabled={readOnly}
            />
          </SectionCard>

          {canSave ? (
            <div ref={footerRef} className="flex flex-wrap justify-center gap-3">
              {saveButton}
              <Link
                href="/perfis"
                className="inline-flex items-center rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-slate-700"
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
