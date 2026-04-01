'use client'

import { ArrowRight, LockKeyhole, Mail } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
import { loadPendingLogin } from '@/src/features/auth/services/auth-tab-storage'
import { useI18n } from '@/src/i18n/use-i18n'

export function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useI18n()
  const {
    cancelAuthenticationChallenge,
    challengeMessage,
    invalidateSession,
    login,
    status,
    submitAuthenticationCode,
  } = useAuth()
  const [email, setEmail] = useState('ricardo@empresa.com.br')
  const [senha, setSenha] = useState('123456')
  const [codigoAutenticacao, setCodigoAutenticacao] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const requiresAuthenticationCode = status === 'challenge'

  useEffect(() => {
    const previousTheme = document.documentElement.dataset.theme
    document.documentElement.dataset.theme = 'light'

    return () => {
      if (previousTheme === 'light' || previousTheme === 'dark') {
        document.documentElement.dataset.theme = previousTheme
        return
      }

      delete document.documentElement.dataset.theme
    }
  }, [])

  useEffect(() => {
    const pendingLogin = loadPendingLogin()

    if (!pendingLogin) {
      return
    }

    setEmail(pendingLogin.email)
    setSenha(pendingLogin.senha)
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      invalidateSession()
    }
  }, [invalidateSession, status])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setErrorMessage('')

    try {
      if (requiresAuthenticationCode) {
        await submitAuthenticationCode(codigoAutenticacao)
        router.replace(searchParams.get('from') || '/dashboard')
        return
      }

      const result = await login(email, senha)

      if (result === 'authenticated') {
        router.replace(searchParams.get('from') || '/dashboard')
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('login.genericError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      <div className="grid min-h-screen xl:grid-cols-[0.94fr_1.06fr]">
        <section className="flex min-h-screen flex-col bg-white px-6 py-8 md:px-10 xl:px-14">
          <div className="flex items-center justify-end">
            <button
              type="button"
              className="hidden rounded-full bg-[#e8f7f1] px-4 py-2 text-sm font-semibold text-accent transition hover:bg-[#d9f1e8] md:inline-flex"
            >
              {t('login.help')}
            </button>
          </div>

          <div className="flex flex-1 items-center">
            <div className="mx-auto w-full max-w-[430px]">
              <div className="mb-10">
                <span className="inline-flex rounded-full bg-[#eef8f4] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">
                  {t('login.badge')}
                </span>
                <h1 className="mt-5 text-[2.85rem] font-black leading-[1.02] tracking-tight text-slate-950 md:text-[3.25rem]">
                  {requiresAuthenticationCode ? t('login.challengeTitle') : t('login.title')}
                </h1>
                <p className="mt-4 text-[15px] leading-7 text-slate-500">
                  {requiresAuthenticationCode ? challengeMessage || t('login.challengeSubtitle') : t('login.subtitle')}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!requiresAuthenticationCode ? (
                  <>
                    <label className="block">
                      <span className="mb-2.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                        <Mail className="h-4 w-4" />
                        {t('login.email')}
                      </span>
                      <div className="rounded-[1.25rem] border border-[#d7e0e8] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition focus-within:border-accent/40 focus-within:shadow-[0_12px_28px_rgba(25,95,77,0.10)]">
                        <input
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          className="w-full border-none bg-transparent text-[1rem] text-slate-900 outline-none placeholder:text-slate-400"
                          placeholder="name@company.com"
                        />
                      </div>
                    </label>

                    <label className="block">
                      <span className="mb-2.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                        <LockKeyhole className="h-4 w-4" />
                        {t('login.password')}
                      </span>
                      <div className="rounded-[1.25rem] border border-[#d7e0e8] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition focus-within:border-accent/40 focus-within:shadow-[0_12px_28px_rgba(25,95,77,0.10)]">
                        <input
                          type="password"
                          value={senha}
                          onChange={(event) => setSenha(event.target.value)}
                          className="w-full border-none bg-transparent text-[1rem] text-slate-900 outline-none placeholder:text-slate-400"
                          placeholder="••••••••"
                        />
                      </div>
                    </label>

                    <div className="flex items-center justify-between gap-4 pt-1 text-sm">
                      <label className="flex items-center gap-2 text-slate-500">
                        <input type="checkbox" className="h-4 w-4 rounded border-[#cdd7e1]" />
                        {t('login.rememberMe')}
                      </label>
                      <button type="button" className="font-semibold text-accent transition hover:text-slate-950">
                        {t('login.forgotPassword')}
                      </button>
                    </div>
                  </>
                ) : (
                  <label className="block">
                    <span className="mb-2.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      <LockKeyhole className="h-4 w-4" />
                      {t('login.authCode')}
                    </span>
                    <div className="rounded-[1.25rem] border border-[#d7e0e8] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition focus-within:border-accent/40 focus-within:shadow-[0_12px_28px_rgba(25,95,77,0.10)]">
                      <input
                        value={codigoAutenticacao}
                        onChange={(event) => setCodigoAutenticacao(event.target.value)}
                        className="w-full border-none bg-transparent text-[1rem] text-slate-900 outline-none placeholder:text-slate-400"
                        placeholder="000000"
                        maxLength={6}
                      />
                    </div>
                  </label>
                )}

                {errorMessage ? (
                  <div className="rounded-[1.15rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {errorMessage}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-[1.25rem] bg-accent px-5 text-base font-bold text-white transition hover:brightness-105 disabled:cursor-wait disabled:opacity-80"
                >
                  {loading ? t('login.processing') : requiresAuthenticationCode ? t('login.validateCode') : t('login.continue')}
                  {!loading ? <ArrowRight className="h-4 w-4" /> : null}
                </button>

                {requiresAuthenticationCode ? (
                  <button
                    type="button"
                    onClick={cancelAuthenticationChallenge}
                    className="w-full text-sm font-semibold text-slate-500 transition hover:text-slate-950"
                  >
                    {t('login.backToLogin')}
                  </button>
                ) : null}
              </form>
            </div>
          </div>
        </section>

        <section className="relative hidden overflow-hidden bg-[linear-gradient(180deg,_#e6f7f3_0%,_#dff1f9_100%)] xl:flex">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_rgba(255,255,255,0.9),_transparent_18%),radial-gradient(circle_at_78%_32%,_rgba(255,255,255,0.75),_transparent_18%),radial-gradient(circle_at_58%_74%,_rgba(255,255,255,0.7),_transparent_20%)]" />

          <div className="relative flex w-full items-center justify-center px-14 py-16">
            <div className="max-w-[520px] text-center">
              <img src="/branding/agile-ecommerce-logo.png" alt="Agile E-commerce" className="mx-auto h-20 w-auto object-contain" />
              <span className="mt-8 inline-flex rounded-full border border-accent/15 bg-white/75 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">
                {t('login.sideBadge')}
              </span>
              <h2 className="mx-auto mt-6 max-w-[460px] text-[2.85rem] font-black leading-[1.06] tracking-tight text-slate-950">
                {t('login.sideTitle')}
              </h2>

              <p className="mx-auto mt-5 max-w-[470px] text-[15px] leading-7 text-slate-600">
                {t('login.sideDescription')}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
