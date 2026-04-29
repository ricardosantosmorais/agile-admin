'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { IdCard, Mail, Save, ShieldCheck, UserRound } from 'lucide-react'
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
  nome?: string
  perfil: string
  email: string
  senha: string
  confirmacao: string
}

type EntityPasswordPageProps = {
  featureKey: FeatureKey
  i18nPrefix: string
  sectionRouteKey: string
  modulePath: string
  moduleRouteKey: string
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
              <button type="submit" form={formId} className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold">
                <Save className="h-4 w-4" />
                {t('common.save')}
              </button>
            ) : null}
            <Link href={modulePath} className="app-button-secondary inline-flex items-center rounded-full px-4 py-3 text-sm font-semibold">
              {t('common.back')}
            </Link>
          </div>
        )}
      />

      <AsyncState isLoading={loading} error={error?.message}>
        <form id={formId} onSubmit={handleSubmit} className="space-y-5">
          <PageToast message={feedback} onClose={() => setFeedback(null)} />

          <SectionCard>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.1rem] bg-[color:var(--app-primary-soft)] text-[color:var(--app-primary)] shadow-[0_12px_26px_rgba(15,23,42,0.08)]">
                  <UserRound className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[color:var(--app-muted)]">{t(`${i18nPrefix}.password.title`)}</p>
                  <h1 className="mt-1 break-words text-2xl font-black tracking-tight text-[color:var(--app-text)]">{form.nome || form.email || `ID #${form.id}`}</h1>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-[color:var(--app-muted)]">
                    {form.perfil ? (
                      <span className="app-badge app-badge-neutral inline-flex items-center gap-1 rounded-full px-3 py-1">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {form.perfil}
                      </span>
                    ) : null}
                    {form.email ? (
                      <span className="app-badge app-badge-neutral inline-flex items-center gap-1 rounded-full px-3 py-1">
                        <Mail className="h-3.5 w-3.5" />
                        {form.email}
                      </span>
                    ) : null}
                    {form.id ? (
                      <span className="app-badge app-badge-neutral inline-flex items-center gap-1 rounded-full px-3 py-1">
                        <IdCard className="h-3.5 w-3.5" />
                        ID #{form.id}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title={t(`${i18nPrefix}.password.formTitle`, t(`${i18nPrefix}.password.title`))}>
            <div className="space-y-6">
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
            <button type="submit" className="app-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold">
              <Save className="h-4 w-4" />
              {t('common.save')}
            </button>
            <Link href={modulePath} className="app-button-secondary inline-flex items-center rounded-full px-5 py-3 text-sm font-semibold">
              {t('common.cancel')}
            </Link>
          </div>
        </form>
      </AsyncState>
    </div>
  )
}
