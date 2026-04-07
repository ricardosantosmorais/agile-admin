'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Save } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { AsyncState } from '@/src/components/ui/async-state'
import { FormRow } from '@/src/components/ui/form-row'
import { inputClasses } from '@/src/components/ui/input-styles'
import { PageHeader } from '@/src/components/ui/page-header'
import { PasswordRulesFeedback } from '@/src/components/ui/password-rules-feedback'
import { PageToast } from '@/src/components/ui/page-toast'
import { SectionCard } from '@/src/components/ui/section-card'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import type { FeatureKey } from '@/src/features/auth/services/permissions'
import { useFooterActionsVisibility } from '@/src/hooks/use-footer-actions-visibility'
import { useFormState } from '@/src/hooks/use-form-state'
import { useI18n } from '@/src/i18n/use-i18n'
import { getStrongPasswordRules, isStrongPassword } from '@/src/lib/validators'
import { useRouteParams } from '@/src/next/route-context'

type EntityPasswordRecord = {
  id: string
  perfil: string
  email: string
  senha: string
  confirmacao: string
}

type EntityPasswordPageProps = {
  featureKey: FeatureKey
  i18nPrefix: 'administradores' | 'usuarios'
  sectionRouteKey: 'routes.administration' | 'routes.people'
  modulePath: '/administradores' | '/usuarios'
  moduleRouteKey: 'administradores.title' | 'usuarios.title'
  formId: string
  createEmpty: () => EntityPasswordRecord
  loadById: (id: string) => Promise<EntityPasswordRecord | null>
  savePassword: (payload: EntityPasswordRecord) => Promise<void>
}

export function EntityPasswordPage({
  featureKey,
  i18nPrefix,
  sectionRouteKey,
  modulePath,
  moduleRouteKey,
  formId,
  createEmpty,
  loadById,
  savePassword,
}: EntityPasswordPageProps) {
  const { t } = useI18n()
  const router = useRouter()
  const { id } = useRouteParams<{ id?: string }>()
  const access = useFeatureAccess(featureKey)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const { state: form, setState, patch } = useFormState<EntityPasswordRecord>(createEmpty())
  const { footerRef, isFooterVisible } = useFooterActionsVisibility<HTMLDivElement>()
  const passwordRules = useMemo(() => getStrongPasswordRules(form.senha), [form.senha])

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    let alive = true

    async function load() {
      const targetId = id
      if (!targetId) return

      try {
        const found = await loadById(targetId)
        if (!alive) return

        if (!found) {
          setError(new Error(t(`${i18nPrefix}.password.loadError`)))
          return
        }

        setState(found)
      } catch (loadError) {
        if (!alive) return
        setError(loadError instanceof Error ? loadError : new Error(t(`${i18nPrefix}.password.loadError`)))
      } finally {
        if (alive) setLoading(false)
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [i18nPrefix, id, loadById, setState, t])

  const breadcrumbs = useMemo(() => ([
    { label: t('routes.dashboard'), href: '/dashboard' },
    { label: t(sectionRouteKey) },
    { label: t(moduleRouteKey), href: modulePath },
    { label: t(`${i18nPrefix}.actions.password`), href: `${modulePath}/${id}/senha` },
  ]), [i18nPrefix, id, modulePath, moduleRouteKey, sectionRouteKey, t])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isStrongPassword(form.senha)) {
      setFeedback(t(`${i18nPrefix}.password.validation.password`))
      return
    }

    if (form.confirmacao !== form.senha) {
      setFeedback(t(`${i18nPrefix}.password.validation.confirmation`))
      return
    }

    try {
      await savePassword(form)
      router.push(modulePath)
    } catch (saveError) {
      setFeedback(saveError instanceof Error ? saveError.message : t(`${i18nPrefix}.password.saveError`))
    }
  }

  if (!access.canEdit) {
    return <AccessDeniedState title={t(`${i18nPrefix}.actions.password`)} backHref={modulePath} />
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={breadcrumbs}
        actions={(
          <div className="flex flex-wrap gap-2">
            {!isFooterVisible ? (
              <button type="submit" form={formId} className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
                <Save className="h-4 w-4" />
                {t('common.save')}
              </button>
            ) : null}
            <Link href={modulePath} className="inline-flex items-center rounded-full border border-line bg-white px-4 py-3 text-sm font-semibold text-slate-700">
              {t('common.back')}
            </Link>
          </div>
        )}
      />

      <AsyncState isLoading={loading} error={error?.message}>
        <form id={formId} onSubmit={handleSubmit} className="space-y-5">
          <PageToast message={feedback} onClose={() => setFeedback(null)} />

          <SectionCard title={t(`${i18nPrefix}.password.title`)}>
            <div className="space-y-6">
              <FormRow label="ID">
                <input className={`${inputClasses()} border-0 bg-transparent`} value={form.id} readOnly />
              </FormRow>
              <FormRow label={t(`${i18nPrefix}.columns.profile`)}>
                <input className={`${inputClasses()} border-0 bg-transparent`} value={form.perfil} readOnly />
              </FormRow>
              <FormRow label={t(`${i18nPrefix}.columns.email`)}>
                <input className={`${inputClasses()} border-0 bg-transparent`} value={form.email} readOnly />
              </FormRow>
              <FormRow label={t(`${i18nPrefix}.form.newPassword`)}>
                <input className={inputClasses()} type="password" value={form.senha} onChange={(event) => patch('senha', event.target.value)} />
              </FormRow>
              <FormRow label={t(`${i18nPrefix}.form.confirmation`)}>
                <input className={inputClasses()} type="password" value={form.confirmacao} onChange={(event) => patch('confirmacao', event.target.value)} />
              </FormRow>
              <PasswordRulesFeedback
                rules={passwordRules}
                labels={{
                  length: t(`${i18nPrefix}.password.rules.length`),
                  uppercase: t(`${i18nPrefix}.password.rules.uppercase`),
                  number: t(`${i18nPrefix}.password.rules.number`),
                  special: t(`${i18nPrefix}.password.rules.special`),
                }}
              />
            </div>
          </SectionCard>

          <div ref={footerRef} className="flex flex-wrap justify-center gap-3">
            <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
              <Save className="h-4 w-4" />
              {t('common.save')}
            </button>
            <Link href={modulePath} className="inline-flex items-center rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-slate-700">
              {t('common.cancel')}
            </Link>
          </div>
        </form>
      </AsyncState>
    </div>
  )
}
