'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Save } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { AsyncState } from '@/src/components/ui/async-state'
import { PageHeader } from '@/src/components/ui/page-header'
import { PageToast } from '@/src/components/ui/page-toast'
import { CrudFormSections } from '@/src/components/crud-base/crud-form-sections'
import type { CrudRecord } from '@/src/components/crud-base/types'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { GrupoClientesRelationsSection } from '@/src/features/grupos-clientes/components/grupo-clientes-relations-section'
import { gruposClientesClient } from '@/src/features/grupos-clientes/services/grupos-clientes-client'
import {
  createEmptyGrupoClienteForm,
  GRUPOS_CLIENTES_CONFIG,
  mapGrupoClienteDetail,
} from '@/src/features/grupos-clientes/services/grupos-clientes-config'
import { useFooterActionsVisibility } from '@/src/hooks/use-footer-actions-visibility'
import { useFormState } from '@/src/hooks/use-form-state'
import { useI18n } from '@/src/i18n/use-i18n'
import { useRouteParams } from '@/src/next/route-context'
import { extractSavedId } from '@/src/lib/api-payload'

export function GruposClientesFormPage({ id: forcedId }: { id?: string }) {
  const { t } = useI18n()
  const router = useRouter()
  const routeParams = useRouteParams<{ id?: string }>()
  const id = forcedId ?? routeParams.id
  const isEditing = Boolean(id)
  const access = useFeatureAccess('gruposClientes')
  const [loading, setLoading] = useState(isEditing)
  const [error, setError] = useState<Error | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const { state: form, setState, patch } = useFormState<CrudRecord>(createEmptyGrupoClienteForm())
  const { footerRef, isFooterVisible } = useFooterActionsVisibility<HTMLDivElement>()
  const formId = 'grupos-clientes-form'

  const hasAccess = isEditing ? access.canEdit || access.canView : access.canCreate
  const readOnly = isEditing && !access.canEdit && access.canView

  useEffect(() => {
    if (!isEditing || !id) {
      return
    }

    let alive = true
    void gruposClientesClient.getById(id, 'clientes.cliente').then((result) => {
      if (!alive) return
      setState(mapGrupoClienteDetail(result))
    }).catch((loadError) => {
      if (!alive) return
      setError(loadError instanceof Error ? loadError : new Error(t('people.customerGroups.loadError', 'Could not load customer group.')))
    }).finally(() => {
      if (alive) setLoading(false)
    })

    return () => {
      alive = false
    }
  }, [id, isEditing, setState, t])

  const breadcrumbs = useMemo(() => (
    isEditing
      ? [
          { label: t('routes.dashboard', 'Início'), href: '/dashboard' },
          { label: t(GRUPOS_CLIENTES_CONFIG.breadcrumbSectionKey, GRUPOS_CLIENTES_CONFIG.breadcrumbSection) },
          { label: t(GRUPOS_CLIENTES_CONFIG.breadcrumbModuleKey, GRUPOS_CLIENTES_CONFIG.breadcrumbModule), href: GRUPOS_CLIENTES_CONFIG.routeBase },
          { label: t('routes.editar', 'Editar'), href: `/grupos-clientes/${id}/editar` },
          { label: `ID #${form.id || id}`, href: `/grupos-clientes/${id}/editar` },
        ]
      : [
          { label: t('routes.dashboard', 'Início'), href: '/dashboard' },
          { label: t(GRUPOS_CLIENTES_CONFIG.breadcrumbSectionKey, GRUPOS_CLIENTES_CONFIG.breadcrumbSection) },
          { label: t(GRUPOS_CLIENTES_CONFIG.breadcrumbModuleKey, GRUPOS_CLIENTES_CONFIG.breadcrumbModule), href: GRUPOS_CLIENTES_CONFIG.routeBase },
          { label: t('routes.novo', 'Novo'), href: '/grupos-clientes/novo' },
        ]
  ), [form.id, id, isEditing, t])

  async function refreshGroup() {
    if (!id) {
      return
    }

    const result = await gruposClientesClient.getById(id, 'clientes.cliente')
    setState(mapGrupoClienteDetail(result))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (readOnly) {
      return
    }

    if (!String(form.nome || '').trim()) {
      setFeedback(t('people.customerGroups.validation.name', 'Enter the group name.'))
      return
    }

    try {
      const result = await gruposClientesClient.save(GRUPOS_CLIENTES_CONFIG.beforeSave!(form))
      const savedId = extractSavedId(result)
      if (!isEditing && savedId) {
        router.replace(`/grupos-clientes/${savedId}/editar`)
        return
      }
      router.push('/grupos-clientes')
    } catch (saveError) {
      setFeedback(saveError instanceof Error ? saveError.message : t('people.customerGroups.saveError', 'Could not save customer group.'))
    }
  }

  if (!hasAccess) {
    return <AccessDeniedState title={t('people.customerGroups.title', 'Customer Groups')} backHref="/grupos-clientes" />
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={breadcrumbs}
        actions={(
          <div className="flex flex-wrap gap-2">
            {!readOnly && !isFooterVisible ? (
              <button type="submit" form={formId} className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
                <Save className="h-4 w-4" />
                {isEditing ? t('common.save', 'Save') : t('people.customerGroups.saveAndContinue', 'Save and continue')}
              </button>
            ) : null}
          <Link href="/grupos-clientes" className="app-button-secondary inline-flex items-center rounded-full px-4 py-3 text-sm font-semibold">
              {t('common.back', 'Back')}
            </Link>
          </div>
        )}
      />

      <AsyncState isLoading={loading} error={error?.message}>
        <form id={formId} onSubmit={handleSubmit} className="space-y-5">
          <PageToast message={feedback} onClose={() => setFeedback(null)} />

          <CrudFormSections
            config={GRUPOS_CLIENTES_CONFIG}
            form={form}
            readOnly={readOnly}
            patch={patch}
            optionsMap={{}}
          />

          {isEditing && id ? (
            <GrupoClientesRelationsSection
              id={id}
              readOnly={readOnly}
              clientes={Array.isArray(form.clientes) ? form.clientes as never[] : []}
              onFeedback={setFeedback}
              onRefresh={refreshGroup}
            />
          ) : null}

          <div ref={footerRef} className="flex flex-wrap justify-center gap-3">
            {!readOnly ? (
              <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
                <Save className="h-4 w-4" />
                {isEditing ? t('common.save', 'Save') : t('people.customerGroups.saveAndContinue', 'Save and continue')}
              </button>
            ) : null}
              <Link href="/grupos-clientes" className="app-button-secondary inline-flex items-center rounded-full px-5 py-3 text-sm font-semibold">
              {t('common.cancel', 'Cancel')}
            </Link>
          </div>
        </form>
      </AsyncState>
    </div>
  )
}
