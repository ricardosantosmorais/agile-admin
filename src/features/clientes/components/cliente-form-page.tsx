'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Building2, CreditCard, FileText, LayoutGrid, PencilLine, Save, Users, Wallet } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AsyncState } from '@/src/components/ui/async-state'
import { PageHeader } from '@/src/components/ui/page-header'
import { PageToast } from '@/src/components/ui/page-toast'
import { SectionCard } from '@/src/components/ui/section-card'
import { TabButton } from '@/src/components/ui/tab-button'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { ClienteAdicionaisTab } from '@/src/features/clientes/components/cliente-adicionais-tab'
import { ClienteClassificacaoTab } from '@/src/features/clientes/components/cliente-classificacao-tab'
import { ClienteCondicoesTab } from '@/src/features/clientes/components/cliente-condicoes-tab'
import { ClienteFiliaisTab } from '@/src/features/clientes/components/cliente-filiais-tab'
import { ClienteFormasTab } from '@/src/features/clientes/components/cliente-formas-tab'
import { ClienteGeralTab } from '@/src/features/clientes/components/cliente-geral-tab'
import { ClienteVendedoresTab } from '@/src/features/clientes/components/cliente-vendedores-tab'
import type { ClientFormRecord } from '@/src/features/clientes/types/clientes'
import { createEmptyClientForm } from '@/src/features/clientes/services/cliente-form'
import { useFormState } from '@/src/hooks/use-form-state'
import { useI18n } from '@/src/i18n/use-i18n'
import { extractSavedId } from '@/src/lib/api-payload'
import { isValidEmail } from '@/src/lib/validators'
import { useRouteParams } from '@/src/next/route-context'
import { appData } from '@/src/services/app-data'
import { useFooterActionsVisibility } from '@/src/hooks/use-footer-actions-visibility'

type TabKey = 'geral' | 'classificacao' | 'filiais' | 'vendedores' | 'formas' | 'condicoes' | 'adicionais'

type TabItem = {
  key: TabKey
  label: string
  icon: ReactNode
}

export function ClienteFormPage() {
  const { t } = useI18n()
  const router = useRouter()
  const { id } = useRouteParams<{ id?: string }>()
  const isEditing = Boolean(id)
  const access = useFeatureAccess('clientes')
  const [tab, setTab] = useState<TabKey>('geral')
  const [loading, setLoading] = useState(isEditing)
  const [error, setError] = useState<Error | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const { state: form, setState: setForm, patch, patchIn } = useFormState<ClientFormRecord>(createEmptyClientForm())
  const { footerRef, isFooterVisible } = useFooterActionsVisibility<HTMLDivElement>()
  const formId = 'cliente-form'

  const hasAccess = isEditing ? access.canEdit || access.canView : access.canCreate
  const readOnly = isEditing && !access.canEdit && access.canView

  useEffect(() => {
    if (!isEditing || !id) {
      return
    }

    let alive = true
    void appData.clients
      .getById(id)
      .then((result) => {
        if (alive) {
          setForm(result ?? createEmptyClientForm())
        }
      })
      .catch((loadError) => {
        if (alive) {
          setError(loadError instanceof Error ? loadError : new Error(t('clientes.form.loadError', 'Could not load customer.')))
        }
      })
      .finally(() => {
        if (alive) {
          setLoading(false)
        }
      })

    return () => {
      alive = false
    }
  }, [id, isEditing, setForm, t])

  const tabs = useMemo<TabItem[]>(() => {
    const items: TabItem[] = [{ key: 'geral', label: t('clientes.form.tabs.general', 'General data'), icon: <PencilLine className="h-4 w-4" /> }]

    if (isEditing) {
      items.push(
        { key: 'classificacao', label: t('clientes.form.tabs.classification', 'Classification'), icon: <LayoutGrid className="h-4 w-4" /> },
        { key: 'filiais', label: t('clientes.form.tabs.branches', 'Branches'), icon: <Building2 className="h-4 w-4" /> },
        { key: 'vendedores', label: t('clientes.form.tabs.sellers', 'Sellers'), icon: <Users className="h-4 w-4" /> },
        { key: 'formas', label: t('clientes.form.tabs.paymentMethods', 'Payment methods'), icon: <CreditCard className="h-4 w-4" /> },
        { key: 'condicoes', label: t('clientes.form.tabs.paymentConditions', 'Payment terms'), icon: <Wallet className="h-4 w-4" /> },
      )
    }

    if (form.formularios.length) {
      items.push({ key: 'adicionais', label: t('clientes.form.tabs.additional', 'Additional data'), icon: <FileText className="h-4 w-4" /> })
    }

    return items
  }, [form.formularios.length, isEditing, t])

  const breadcrumbs = isEditing
    ? [
        { label: 'Inicio', href: '/dashboard' },
        { label: t('clientes.form.breadcrumbs.customer', 'Customer'), href: '/clientes' },
        { label: t('clientes.form.breadcrumbs.edit', 'Edit'), href: `/clientes/${id}/editar` },
        { label: `ID #${form.id || id}`, href: `/clientes/${id}/editar` },
      ]
    : [
        { label: 'Inicio', href: '/dashboard' },
        { label: t('clientes.form.breadcrumbs.customer', 'Customer'), href: '/clientes' },
        { label: t('clientes.form.breadcrumbs.new', 'New'), href: '/clientes/novo' },
      ]

  async function refreshClient() {
    if (!isEditing || !id) {
      return
    }

    const result = await appData.clients.getById(id)
    setForm(result ?? createEmptyClientForm())
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (readOnly) {
      return
    }
    if (!isValidEmail(form.email)) {
      setFeedback(t('clientes.form.validEmail', 'Enter a valid e-mail.'))
      return
    }

    try {
      const result = await appData.clients.save(form)
      const savedId = extractSavedId(result)

      if (!isEditing && savedId) {
        router.replace(`/clientes/${savedId}/editar`)
        return
      }

      router.push('/clientes')
    } catch (saveError) {
      setFeedback(saveError instanceof Error ? saveError.message : t('clientes.form.saveError', 'Could not save customer.'))
    }
  }

  if (!hasAccess) {
    return <AccessDeniedState title={isEditing ? t('clientes.form.accessDeniedEdit', 'Customer') : t('clientes.form.accessDeniedNew', 'New customer')} backHref="/clientes" />
  }

  return (
    <div className="min-w-0 overflow-x-hidden space-y-5">
      <PageHeader
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex flex-wrap gap-2">
            {!readOnly && !isFooterVisible ? (
              <button type="submit" form={formId} className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold">
                <Save className="h-4 w-4" />
                {t('clientes.form.save', 'Save')}
              </button>
            ) : null}
            <Link
              href="/clientes"
              className="app-button-secondary inline-flex items-center rounded-full px-4 py-3 text-sm font-semibold text-slate-700"
            >
              {t('clientes.form.back', 'Back')}
            </Link>
          </div>
        }
      />

      <AsyncState isLoading={loading} error={error?.message}>
        <div className="min-w-0 space-y-5">
          <PageToast message={feedback} onClose={() => setFeedback(null)} />

          <form id={formId} onSubmit={handleSubmit} className="min-w-0 space-y-5">
            <SectionCard>
              <div className="flex flex-wrap gap-2">
                {tabs.map((item) => (
                  <TabButton
                    key={item.key}
                    active={tab === item.key}
                    icon={item.icon}
                    label={item.label}
                    onClick={() => setTab(item.key)}
                  />
                ))}
              </div>
            </SectionCard>

            {tab === 'geral' ? <ClienteGeralTab form={form} readOnly={readOnly} onPatch={patch} /> : null}

            {tab === 'classificacao' ? (
              <ClienteClassificacaoTab
                form={form}
                readOnly={readOnly}
                onPatch={patch}
                onPatchClass={(key, value) => patchIn('classificacao', key, value)}
              />
            ) : null}

            {tab === 'filiais' ? (
              <ClienteFiliaisTab
                clientId={id!}
                readOnly={readOnly}
                items={form.filiais}
                onRefresh={refreshClient}
                onError={setFeedback}
              />
            ) : null}

            {tab === 'vendedores' ? (
              <ClienteVendedoresTab
                clientId={id!}
                readOnly={readOnly}
                items={form.vendedores}
                onRefresh={refreshClient}
                onError={setFeedback}
              />
            ) : null}

            {tab === 'formas' ? (
              <ClienteFormasTab
                clientId={id!}
                readOnly={readOnly}
                items={form.formasPagamento}
                onRefresh={refreshClient}
                onError={setFeedback}
              />
            ) : null}

            {tab === 'condicoes' ? (
              <ClienteCondicoesTab
                clientId={id!}
                readOnly={readOnly}
                items={form.condicoesPagamento}
                onRefresh={refreshClient}
                onError={setFeedback}
              />
            ) : null}

            {tab === 'adicionais' ? <ClienteAdicionaisTab formularios={form.formularios} /> : null}

            <div ref={footerRef} className="flex flex-wrap justify-center gap-3">
              {!readOnly ? (
                <button type="submit" className="app-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold">
                  <Save className="h-4 w-4" />
                  {t('clientes.form.save', 'Save')}
                </button>
              ) : null}
              <Link href="/clientes" className="app-button-secondary inline-flex items-center rounded-full px-5 py-3 text-sm font-semibold text-slate-700">
                {t('clientes.form.cancel', 'Cancel')}
              </Link>
            </div>
          </form>
        </div>
      </AsyncState>
    </div>
  )
}
