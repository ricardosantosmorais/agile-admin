'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Save, Waypoints } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { AsyncState } from '@/src/components/ui/async-state'
import { BooleanSegmentedField } from '@/src/components/ui/boolean-segmented-field'
import { FormRow } from '@/src/components/ui/form-row'
import { inputClasses } from '@/src/components/ui/input-styles'
import { LookupSelect } from '@/src/components/ui/lookup-select'
import { PageHeader } from '@/src/components/ui/page-header'
import { PageToast } from '@/src/components/ui/page-toast'
import { SectionCard } from '@/src/components/ui/section-card'
import { TabButton } from '@/src/components/ui/tab-button'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { VendedorCanaisTab } from '@/src/features/vendedores/components/vendedor-canais-tab'
import { vendedoresClient, loadVendedorLookup } from '@/src/features/vendedores/services/vendedores-client'
import { createEmptyVendedorForm, mapVendedorDetail, toVendedorPayload } from '@/src/features/vendedores/services/vendedores-form'
import type { VendedorFormRecord } from '@/src/features/vendedores/types/vendedores'
import { useFormState } from '@/src/hooks/use-form-state'
import { useI18n } from '@/src/i18n/use-i18n'
import { cnpjMask, cpfMask, phoneMask } from '@/src/lib/input-masks'
import { extractSavedId } from '@/src/lib/api-payload'
import { isValidEmail } from '@/src/lib/validators'
import { useRouteParams } from '@/src/next/route-context'
import { useFooterActionsVisibility } from '@/src/hooks/use-footer-actions-visibility'

type TabKey = 'geral' | 'canais'

export function VendedorFormPage({ id: forcedId }: { id?: string }) {
  const { t } = useI18n()
  const router = useRouter()
  const routeParams = useRouteParams<{ id?: string }>()
  const id = forcedId ?? routeParams.id
  const isEditing = Boolean(id)
  const access = useFeatureAccess('vendedores')
  const [loading, setLoading] = useState(isEditing)
  const [error, setError] = useState<Error | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [tab, setTab] = useState<TabKey>('geral')
  const { state: form, setState, patch } = useFormState<VendedorFormRecord>(createEmptyVendedorForm())
  const { footerRef, isFooterVisible } = useFooterActionsVisibility<HTMLDivElement>()
  const formId = 'vendedor-form'

  const hasAccess = isEditing ? access.canEdit || access.canView : access.canCreate
  const readOnly = isEditing && !access.canEdit && access.canView

  useEffect(() => {
    if (!isEditing || !id) return

    let alive = true
    void vendedoresClient.getById(id, 'canais_distribuicao.canal_distribuicao').then((result) => {
      if (!alive) return
      setState(mapVendedorDetail(result))
    }).catch((loadError) => {
      if (!alive) return
      setError(loadError instanceof Error ? loadError : new Error(t('people.sellers.loadError', 'Could not load seller.')))
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
          { label: t('routes.people', 'Pessoas') },
          { label: t('people.sellers.title', 'Vendedores'), href: '/vendedores' },
          { label: t('routes.editar', 'Editar'), href: `/vendedores/${id}/editar` },
          { label: `ID #${form.id || id}`, href: `/vendedores/${id}/editar` },
        ]
      : [
          { label: t('routes.dashboard', 'Início'), href: '/dashboard' },
          { label: t('routes.people', 'Pessoas') },
          { label: t('people.sellers.title', 'Vendedores'), href: '/vendedores' },
          { label: t('routes.novo', 'Novo'), href: '/vendedores/novo' },
        ]
  ), [form.id, id, isEditing, t])

  async function refreshVendedor() {
    if (!id) return
    const result = await vendedoresClient.getById(id, 'canais_distribuicao.canal_distribuicao')
    setState(mapVendedorDetail(result))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (readOnly) return

    const documentValue = form.tipo === 'PF' ? form.cpf : form.cnpj
    if (!documentValue.replace(/\D/g, '')) {
      setFeedback(t('people.sellers.validation.document', 'Enter CPF or CNPJ.'))
      return
    }

    if (!form.nome.trim() && form.tipo === 'PF') {
      setFeedback(t('people.sellers.validation.name', 'Enter the seller name.'))
      return
    }

    if (!form.nome_fantasia.trim() && form.tipo === 'PJ') {
      setFeedback(t('people.sellers.validation.tradeName', 'Enter the trade name.'))
      return
    }

    if (form.email.trim() && !isValidEmail(form.email)) {
      setFeedback(t('people.sellers.validation.email', 'Enter a valid e-mail.'))
      return
    }

    try {
      const result = await vendedoresClient.save(toVendedorPayload(form))
      const savedId = extractSavedId(result)
      if (!isEditing && savedId) {
        router.replace(`/vendedores/${savedId}/editar`)
        return
      }
      router.push('/vendedores')
    } catch (saveError) {
      setFeedback(saveError instanceof Error ? saveError.message : t('people.sellers.saveError', 'Could not save seller.'))
    }
  }

  if (!hasAccess) {
    return <AccessDeniedState title={t('people.sellers.title', 'Sellers')} backHref="/vendedores" />
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex flex-wrap gap-2">
            {!readOnly && !isFooterVisible ? (
              <button type="submit" form={formId} className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
                <Save className="h-4 w-4" />
                {t('common.save', 'Save')}
              </button>
            ) : null}
          <Link href="/vendedores" className="app-button-secondary inline-flex items-center rounded-full px-4 py-3 text-sm font-semibold">{t('common.back', 'Back')}</Link>
          </div>
        }
      />

      <AsyncState isLoading={loading} error={error?.message}>
        <form id={formId} onSubmit={handleSubmit} className="space-y-5">
          <PageToast message={feedback} onClose={() => setFeedback(null)} />

          <SectionCard title={t('people.sellers.tabs.title', 'Record tabs')}>
            <div className="flex flex-wrap gap-2">
              <TabButton active={tab === 'geral'} icon={<Save className="h-4 w-4" />} label={t('people.sellers.tabs.general', 'General data')} onClick={() => setTab('geral')} />
              {isEditing ? <TabButton active={tab === 'canais'} icon={<Waypoints className="h-4 w-4" />} label={t('people.sellers.tabs.channels', 'Distribution channels')} onClick={() => setTab('canais')} /> : null}
            </div>
          </SectionCard>

          {tab === 'geral' ? (
            <SectionCard title={t('simpleCrud.sections.main', 'Main data')}>
              <div className="space-y-6">
                <FormRow label={t('simpleCrud.fields.active', 'Active')}>
                  <BooleanSegmentedField value={form.ativo} onChange={(value) => patch('ativo', value)} disabled={readOnly} />
                </FormRow>

                <FormRow label={t('people.sellers.fields.blocked', 'Blocked')}>
                  <BooleanSegmentedField value={form.bloqueado} onChange={(value) => patch('bloqueado', value)} disabled={readOnly} />
                </FormRow>

                <FormRow label={t('simpleCrud.fields.code', 'Code')}>
                  <input className={inputClasses()} value={form.codigo} onChange={(event) => patch('codigo', event.target.value)} disabled={readOnly} />
                </FormRow>

                <FormRow label={t('people.sellers.fields.activationCode', 'Activation code')}>
                  <input className={inputClasses()} value={form.codigo_ativacao} onChange={(event) => patch('codigo_ativacao', event.target.value)} disabled={readOnly} />
                </FormRow>

                <FormRow label={t('people.sellers.fields.sellerType', 'Seller type')}>
                  <select className={inputClasses()} value={form.tipo_vendedor} onChange={(event) => patch('tipo_vendedor', event.target.value as VendedorFormRecord['tipo_vendedor'])} disabled={readOnly}>
                    <option value="ativo">{t('people.sellers.sellerTypes.active', 'Active')}</option>
                    <option value="externo">{t('people.sellers.sellerTypes.external', 'External')}</option>
                    <option value="receptivo">{t('people.sellers.sellerTypes.receptive', 'Receptive')}</option>
                  </select>
                </FormRow>

                <FormRow label={t('people.sellers.fields.personType', 'Person type')}>
                  <div className="flex gap-3">
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                      <input type="radio" checked={form.tipo === 'PF'} onChange={() => patch('tipo', 'PF')} disabled={readOnly} />
                      {t('people.personType.pf', 'Individual')}
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                      <input type="radio" checked={form.tipo === 'PJ'} onChange={() => patch('tipo', 'PJ')} disabled={readOnly} />
                      {t('people.personType.pj', 'Company')}
                    </label>
                  </div>
                </FormRow>

                {form.tipo === 'PF' ? (
                  <>
                    <FormRow label={t('people.sellers.fields.cpf', 'CPF')}>
                      <input className={inputClasses()} value={form.cpf} onChange={(event) => patch('cpf', cpfMask(event.target.value))} disabled={readOnly} inputMode="numeric" />
                    </FormRow>
                    <FormRow label={t('simpleCrud.fields.name', 'Name')}>
                      <input className={inputClasses()} value={form.nome} onChange={(event) => patch('nome', event.target.value)} disabled={readOnly} />
                    </FormRow>
                  </>
                ) : (
                  <>
                    <FormRow label={t('people.sellers.fields.cnpj', 'CNPJ')}>
                      <input className={inputClasses()} value={form.cnpj} onChange={(event) => patch('cnpj', cnpjMask(event.target.value))} disabled={readOnly} inputMode="numeric" />
                    </FormRow>
                    <FormRow label={t('people.sellers.fields.tradeName', 'Trade name')}>
                      <input className={inputClasses()} value={form.nome_fantasia} onChange={(event) => patch('nome_fantasia', event.target.value)} disabled={readOnly} />
                    </FormRow>
                  </>
                )}

                <FormRow label={t('people.sellers.fields.branch', 'Branch')}>
                  <LookupSelect
                    label={t('people.sellers.fields.branch', 'Branch')}
                    value={form.id_filial}
                    onChange={(value) => patch('id_filial', value)}
                    loadOptions={(query, page, perPage) => loadVendedorLookup('filiais', query, page, perPage)}
                    disabled={readOnly}
                  />
                </FormRow>

                <FormRow label={t('people.sellers.fields.supervisor', 'Supervisor')}>
                  <LookupSelect
                    label={t('people.sellers.fields.supervisor', 'Supervisor')}
                    value={form.id_supervisor}
                    onChange={(value) => patch('id_supervisor', value)}
                    loadOptions={(query, page, perPage) => loadVendedorLookup('supervisores', query, page, perPage)}
                    disabled={readOnly}
                  />
                </FormRow>

                <FormRow label={t('people.sellers.fields.defaultChannel', 'Default distribution channel')}>
                  <LookupSelect
                    label={t('people.sellers.fields.defaultChannel', 'Default distribution channel')}
                    value={form.id_canal_distribuicao}
                    onChange={(value) => patch('id_canal_distribuicao', value)}
                    loadOptions={(query, page, perPage) => loadVendedorLookup('canais_distribuicao', query, page, perPage)}
                    disabled={readOnly}
                  />
                </FormRow>

                <FormRow label={t('simpleCrud.fields.email', 'E-mail')}>
                  <input className={inputClasses()} value={form.email} onChange={(event) => patch('email', event.target.value)} disabled={readOnly} type="email" />
                </FormRow>

                <FormRow label={t('people.sellers.fields.phone', 'Phone')}>
                  <input className={inputClasses()} value={form.telefone} onChange={(event) => patch('telefone', phoneMask(event.target.value, false))} disabled={readOnly} inputMode="tel" />
                </FormRow>

                <FormRow label={t('people.sellers.fields.mobile', 'Mobile')}>
                  <input className={inputClasses()} value={form.celular} onChange={(event) => patch('celular', phoneMask(event.target.value, true))} disabled={readOnly} inputMode="tel" />
                </FormRow>
              </div>
            </SectionCard>
          ) : null}

          {tab === 'canais' && isEditing ? (
            <VendedorCanaisTab
              vendedorId={id!}
              readOnly={readOnly}
              items={form.canais_distribuicao}
              onRefresh={refreshVendedor}
              onError={setFeedback}
            />
          ) : null}

          <div ref={footerRef} className="flex flex-wrap justify-center gap-3">
            {!readOnly ? (
              <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
                <Save className="h-4 w-4" />
                {t('common.save', 'Save')}
              </button>
            ) : null}
              <Link href="/vendedores" className="app-button-secondary inline-flex items-center rounded-full px-5 py-3 text-sm font-semibold">
              {t('common.cancel', 'Cancel')}
            </Link>
          </div>
        </form>
      </AsyncState>
    </div>
  )
}
