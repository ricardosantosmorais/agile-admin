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
import { administradoresClient } from '@/src/features/administradores/services/administradores-client'
import { createEmptyAdminPassword, type AdminPasswordRecord } from '@/src/features/administradores/services/administradores-mappers'
import { useFooterActionsVisibility } from '@/src/hooks/use-footer-actions-visibility'
import { useFormState } from '@/src/hooks/use-form-state'
import { useI18n } from '@/src/i18n/use-i18n'
import { getStrongPasswordRules, isStrongPassword } from '@/src/lib/validators'
import { useRouteParams } from '@/src/next/route-context'

export function AdministradorPasswordPage() {
  const { t } = useI18n()
  const router = useRouter()
  const { id } = useRouteParams<{ id?: string }>()
  const access = useFeatureAccess('administradores')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const { state: form, setState, patch } = useFormState<AdminPasswordRecord>(createEmptyAdminPassword())
  const { footerRef, isFooterVisible } = useFooterActionsVisibility<HTMLDivElement>()
  const formId = 'administrador-password-form'
  const passwordRules = useMemo(() => getStrongPasswordRules(form.senha), [form.senha])

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    let alive = true

    async function load() {
      if (!id) {
        return
      }

      try {
        const found = await administradoresClient.getPasswordById(id)
        if (!alive) {
          return
        }
        if (!found) {
          setError(new Error(t('administradores.password.loadError')))
          return
        }
        setState(found)
      } catch (loadError) {
        if (!alive) {
          return
        }
        setError(loadError instanceof Error ? loadError : new Error(t('administradores.password.loadError')))
      } finally {
        if (alive) {
          setLoading(false)
        }
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [id, setState, t])

  const breadcrumbs = useMemo(() => ([
    { label: t('routes.dashboard'), href: '/dashboard' },
    { label: t('routes.administration') },
    { label: t('administradores.title'), href: '/administradores' },
    { label: t('administradores.actions.password'), href: `/administradores/${id}/senha` },
  ]), [id, t])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isStrongPassword(form.senha)) {
      setFeedback(t('administradores.password.validation.password'))
      return
    }

    if (form.confirmacao !== form.senha) {
      setFeedback(t('administradores.password.validation.confirmation'))
      return
    }

    try {
      await administradoresClient.changePassword(form)
      router.push('/administradores')
    } catch (saveError) {
      setFeedback(saveError instanceof Error ? saveError.message : t('administradores.password.saveError'))
    }
  }

  if (!access.canEdit) {
    return <AccessDeniedState title={t('administradores.actions.password')} backHref="/administradores" />
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex flex-wrap gap-2">
            {!isFooterVisible ? (
              <button type="submit" form={formId} className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
                <Save className="h-4 w-4" />
                {t('common.save')}
              </button>
            ) : null}
            <Link href="/administradores" className="inline-flex items-center rounded-full border border-line bg-white px-4 py-3 text-sm font-semibold text-slate-700">
              {t('common.back')}
            </Link>
          </div>
        }
      />

      <AsyncState isLoading={loading} error={error?.message}>
        <form id={formId} onSubmit={handleSubmit} className="space-y-5">
          <PageToast message={feedback} onClose={() => setFeedback(null)} />

          <SectionCard title={t('administradores.password.title')}>
            <div className="space-y-6">
              <FormRow label="ID">
                <input className={`${inputClasses()} border-0 bg-transparent`} value={form.id} readOnly />
              </FormRow>

              <FormRow label={t('administradores.columns.profile')}>
                <input className={`${inputClasses()} border-0 bg-transparent`} value={form.perfil} readOnly />
              </FormRow>

              <FormRow label={t('administradores.columns.email')}>
                <input className={`${inputClasses()} border-0 bg-transparent`} value={form.email} readOnly />
              </FormRow>

              <FormRow label={t('administradores.form.newPassword')}>
                <input className={inputClasses()} type="password" value={form.senha} onChange={(event) => patch('senha', event.target.value)} />
              </FormRow>

              <FormRow label={t('administradores.form.confirmation')}>
                <input className={inputClasses()} type="password" value={form.confirmacao} onChange={(event) => patch('confirmacao', event.target.value)} />
              </FormRow>

              <PasswordRulesFeedback
                rules={passwordRules}
                labels={{
                  length: t('administradores.password.rules.length'),
                  uppercase: t('administradores.password.rules.uppercase'),
                  number: t('administradores.password.rules.number'),
                  special: t('administradores.password.rules.special'),
                }}
              />
            </div>
          </SectionCard>

          <div ref={footerRef} className="flex flex-wrap justify-center gap-3">
            <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
              <Save className="h-4 w-4" />
              {t('common.save')}
            </button>
            <Link href="/administradores" className="inline-flex items-center rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-slate-700">
              {t('common.cancel')}
            </Link>
          </div>
        </form>
      </AsyncState>
    </div>
  )
}


