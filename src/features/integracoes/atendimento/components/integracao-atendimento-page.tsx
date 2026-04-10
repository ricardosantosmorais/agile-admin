'use client'

import Link from 'next/link'
import { Gem, MessageCircle, MessageSquare, RefreshCcw, Save } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { AsyncState } from '@/src/components/ui/async-state'
import { FormField } from '@/src/components/ui/form-field'
import { inputClasses } from '@/src/components/ui/input-styles'
import { PageHeader } from '@/src/components/ui/page-header'
import { PageToast } from '@/src/components/ui/page-toast'
import { SectionCard } from '@/src/components/ui/section-card'
import { TabButton } from '@/src/components/ui/tab-button'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
import { integracaoAtendimentoClient } from '@/src/features/integracoes/atendimento/services/integracao-atendimento-client'
import {
  createEmptyIntegracaoAtendimentoRecord,
  type IntegracaoAtendimentoBranchRow,
  type IntegracaoAtendimentoRecord,
  type IntegracaoAtendimentoValues,
} from '@/src/features/integracoes/atendimento/services/integracao-atendimento-mappers'
import { useFooterActionsVisibility } from '@/src/hooks/use-footer-actions-visibility'
import { useI18n } from '@/src/i18n/use-i18n'
import { phoneMask } from '@/src/lib/input-masks'

type TabKey = 'whatsapp' | 'jivo' | 'ebit'

const LEGACY_LOCKED_TENANT_ID = '1705083119553379'

function formatUpdateMeta(updatedAt: string, updatedBy: string, t: ReturnType<typeof useI18n>['t']) {
  if (!updatedAt || !updatedBy) {
    return '-'
  }

  return t('integrationsAttendance.fields.lastUpdateValue', 'Última alteração: {{date}} por {{user}}')
    .replace('{{date}}', updatedAt)
    .replace('{{user}}', updatedBy)
}

export function IntegracaoAtendimentoPage() {
  const { t } = useI18n()
  const { session, user } = useAuth()
  const access = useFeatureAccess('integracoesAtendimento')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('whatsapp')
  const [initialRecord, setInitialRecord] = useState<IntegracaoAtendimentoRecord>(createEmptyIntegracaoAtendimentoRecord())
  const [values, setValues] = useState<IntegracaoAtendimentoValues>(createEmptyIntegracaoAtendimentoRecord().values)
  const [branches, setBranches] = useState<IntegracaoAtendimentoBranchRow[]>([])
  const [tokenEditable, setTokenEditable] = useState(false)
  const { footerRef, isFooterVisible } = useFooterActionsVisibility<HTMLDivElement>()

  const canSave = access.canEdit && !(session?.currentTenant.id === LEGACY_LOCKED_TENANT_ID && !user?.master)
  const hasToken = initialRecord.values.whatsappApiToken.trim().length > 0
  const shouldIncludeTokenOnSave = tokenEditable || !hasToken
  const hasChanges = useMemo(() => {
    if (values.whatsappExibicao !== initialRecord.values.whatsappExibicao) return true
    if (values.whatsappGateway !== initialRecord.values.whatsappGateway) return true
    if (values.jivoJs !== initialRecord.values.jivoJs) return true
    if (values.ebitCodigo !== initialRecord.values.ebitCodigo) return true
    if (tokenEditable && values.whatsappApiToken !== initialRecord.values.whatsappApiToken) return true

    if (branches.length !== initialRecord.branches.length) return true
    for (let index = 0; index < branches.length; index += 1) {
      const current = branches[index]
      const initial = initialRecord.branches[index]
      if (!initial) return true
      if (current.whatsappNumero !== initial.whatsappNumero) return true
      if (current.whatsappIdNumero !== initial.whatsappIdNumero) return true
    }

    return false
  }, [branches, initialRecord.branches, initialRecord.values, tokenEditable, values])

  const breadcrumbs = useMemo(
    () => [
      { label: t('routes.dashboard', 'Início'), href: '/dashboard' },
      { label: t('menuKeys.integracoes', 'Integrações') },
      { label: t('integrationsAttendance.title', 'Atendimento'), href: '/integracoes/atendimento' },
    ],
    [t],
  )

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const result = await integracaoAtendimentoClient.get()
        if (!active) {
          return
        }

        setInitialRecord(result)
        setValues(result.values)
        setBranches(result.branches)
        setTokenEditable(!result.values.whatsappApiToken)
        setError(null)
      } catch (loadError) {
        if (!active) {
          return
        }

        setError(
          loadError instanceof Error
            ? loadError
            : new Error(t('integrationsAttendance.feedback.loadError', 'Não foi possível carregar as configurações de atendimento.')),
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
  }, [t])

  async function handleRefresh() {
    setLoading(true)
    setFeedback(null)
    setError(null)

    try {
      const result = await integracaoAtendimentoClient.get()
      setInitialRecord(result)
      setValues(result.values)
      setBranches(result.branches)
      setTokenEditable(!result.values.whatsappApiToken)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError
          : new Error(t('integrationsAttendance.feedback.loadError', 'Não foi possível carregar as configurações de atendimento.')),
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSave || !hasChanges) {
      return
    }

    try {
      setSaving(true)
      await integracaoAtendimentoClient.save(values, branches, { includeWhatsappToken: shouldIncludeTokenOnSave })
      const refreshed = await integracaoAtendimentoClient.get()
      setInitialRecord(refreshed)
      setValues(refreshed.values)
      setBranches(refreshed.branches)
      setTokenEditable(!refreshed.values.whatsappApiToken)
      setFeedback({
        tone: 'success',
        message: t('integrationsAttendance.feedback.saveSuccess', 'Configurações de atendimento salvas com sucesso.'),
      })
    } catch (saveError) {
      setFeedback({
        tone: 'error',
        message: saveError instanceof Error
          ? saveError.message
          : t('integrationsAttendance.feedback.saveError', 'Não foi possível salvar as configurações de atendimento.'),
      })
    } finally {
      setSaving(false)
    }
  }

  function updateBranch(index: number, patch: Partial<IntegracaoAtendimentoBranchRow>) {
    setBranches((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)))
  }

  if (!access.canOpen) {
    return <AccessDeniedState title={t('integrationsAttendance.title', 'Atendimento')} />
  }

  return (
    <div className="space-y-6">
      {feedback ? (
        <PageToast
          tone={feedback.tone}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      ) : null}

      <PageHeader
        title={t('integrationsAttendance.title', 'Atendimento')}
        description={t('integrationsAttendance.description', 'Gerencie WhatsApp, Jivo Chat e Ebit da empresa ativa.')}
        breadcrumbs={breadcrumbs}
        actions={(
          <>
            <button
              type="button"
              className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"
              onClick={() => {
                void handleRefresh()
              }}
              disabled={loading || saving}
            >
              <RefreshCcw className="h-4 w-4" />
              {t('common.refresh', 'Atualizar')}
            </button>
            {!isFooterVisible && canSave ? (
              <button
                type="button"
                className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => {
                  const form = document.getElementById('integracoes-atendimento-form')
                  if (form instanceof HTMLFormElement) {
                    form.requestSubmit()
                  }
                }}
                disabled={loading || saving || !hasChanges}
              >
                <Save className="h-4 w-4" />
                {saving ? t('common.saving', 'Salvando...') : t('common.save', 'Salvar')}
              </button>
            ) : null}
          </>
        )}
      />

      <AsyncState
        isLoading={loading}
        error={error?.message}
        loadingTitle={t('integrationsAttendance.loading', 'Carregando integrações de atendimento...')}
        errorTitle={t('integrationsAttendance.feedback.loadError', 'Não foi possível carregar as configurações de atendimento.')}
      >
        <form id="integracoes-atendimento-form" onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
          <SectionCard className="px-4 py-4 md:px-5 md:py-5">
            <div className="overflow-x-auto">
              <div className="flex min-w-max items-center gap-2">
                <TabButton active={activeTab === 'whatsapp'} icon={<MessageCircle className="h-4 w-4" />} label={t('integrationsAttendance.tabs.whatsapp', 'WhatsApp')} onClick={() => setActiveTab('whatsapp')} />
                <TabButton active={activeTab === 'jivo'} icon={<MessageSquare className="h-4 w-4" />} label={t('integrationsAttendance.tabs.jivo', 'Jivo Chat')} onClick={() => setActiveTab('jivo')} />
                <TabButton active={activeTab === 'ebit'} icon={<Gem className="h-4 w-4" />} label={t('integrationsAttendance.tabs.ebit', 'Ebit')} onClick={() => setActiveTab('ebit')} />
              </div>
            </div>
          </SectionCard>

          {activeTab === 'whatsapp' ? (
            <SectionCard
              title={t('integrationsAttendance.sections.whatsapp.title', 'WhatsApp')}
              description={t('integrationsAttendance.sections.whatsapp.description', 'Configure números por filial e o gateway usado para mensagens transacionais.')}
            >
              <div className="app-table-shell overflow-x-auto rounded-[1.2rem]">
                <table className="min-w-[720px] w-full border-collapse">
                  <thead>
                    <tr className="app-table-muted text-left text-xs uppercase tracking-[0.08em] text-slate-500">
                      <th className="px-4 py-3">{t('integrationsAttendance.fields.branch', 'Filial')}</th>
                      <th className="px-4 py-3">{t('integrationsAttendance.fields.whatsappNumber', 'Número')}</th>
                      <th className="px-4 py-3">{t('integrationsAttendance.fields.whatsappNumberId', 'ID Número')}</th>
                      <th className="px-4 py-3">{t('integrationsAttendance.fields.lastUpdate', 'Última alteração')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branches.map((branch, index) => (
                      <tr key={branch.id || `branch-${index}`} className="app-table-row-hover border-t border-line align-top">
                        <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                          {branch.nome} - {branch.id}
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={branch.whatsappNumero}
                            onChange={(event) => updateBranch(index, { whatsappNumero: phoneMask(event.target.value, event.target.value.replace(/\D/g, '').length > 10) })}
                            className={inputClasses()}
                            placeholder="(99) 99999-9999"
                            disabled={saving}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={branch.whatsappIdNumero}
                            onChange={(event) => updateBranch(index, { whatsappIdNumero: event.target.value })}
                            className={inputClasses()}
                            disabled={saving}
                          />
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {formatUpdateMeta(branch.whatsappNumeroMeta.updatedAt, branch.whatsappNumeroMeta.updatedBy, t)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-500">
                {t('integrationsAttendance.helpers.whatsappBranchNotes', '* Número do WhatsApp que será vinculado ao botão flutuante no site. ** ID do Número do WhatsApp que será utilizado para disparo de mensagens transacionais (exclusivo Meta).')}
              </p>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <FormField
                  label={t('integrationsAttendance.fields.whatsappDisplay', 'Exibição do botão')}
                  helperText={t('integrationsAttendance.helpers.whatsappDisplay', 'Lado de exibição do botão flutuante no site.')}
                >
                  <>
                    <select
                      id="whatsapp_exibicao"
                      className={inputClasses()}
                      value={values.whatsappExibicao}
                      onChange={(event) => setValues((current) => ({ ...current, whatsappExibicao: event.target.value }))}
                      disabled={saving}
                    >
                      <option value="">{t('integrationsAttendance.options.hidden', 'Não exibir')}</option>
                      <option value="lado_direito">{t('integrationsAttendance.options.right', 'Lado direito')}</option>
                      <option value="lado_esquerdo">{t('integrationsAttendance.options.left', 'Lado esquerdo')}</option>
                    </select>
                    <span className="text-xs text-slate-500">
                      {formatUpdateMeta(initialRecord.metadata.whatsappExibicao.updatedAt, initialRecord.metadata.whatsappExibicao.updatedBy, t)}
                    </span>
                  </>
                </FormField>

                <FormField
                  label={t('integrationsAttendance.fields.whatsappGateway', 'API Gateway')}
                  helperText={t('integrationsAttendance.helpers.whatsappGateway', 'Gateway que será utilizado para conectar com a API do WhatsApp.')}
                >
                  <>
                    <select
                      id="whatsapp_gateway"
                      className={inputClasses()}
                      value={values.whatsappGateway}
                      onChange={(event) => setValues((current) => ({ ...current, whatsappGateway: event.target.value }))}
                      disabled={saving}
                    >
                      <option value="">{t('common.selectOption', 'Selecione')}</option>
                      <option value="meta">{t('integrationsAttendance.options.gatewayMeta', 'Meta (API oficial)')}</option>
                      <option value="whatsgw">{t('integrationsAttendance.options.gatewayWhatsGw', 'WhatsGW')}</option>
                    </select>
                    <span className="text-xs text-slate-500">
                      {formatUpdateMeta(initialRecord.metadata.whatsappGateway.updatedAt, initialRecord.metadata.whatsappGateway.updatedBy, t)}
                    </span>
                  </>
                </FormField>
              </div>

              <div className="mt-4">
                <FormField
                  label={t('integrationsAttendance.fields.whatsappToken', 'Token de API')}
                  helperText={t('integrationsAttendance.helpers.whatsappToken', 'Token de acesso gerado pelo gateway para envio de mensagens transacionais.')}
                >
                  <div className="space-y-3">
                    <input
                      id="whatsapp_api_token"
                      type="text"
                      className={inputClasses()}
                      value={values.whatsappApiToken}
                      onChange={(event) => setValues((current) => ({ ...current, whatsappApiToken: event.target.value }))}
                      disabled={saving || (hasToken && !tokenEditable)}
                      placeholder={t('integrationsAttendance.placeholders.whatsappToken', 'Informe o token de acesso')}
                    />
                    <span className="text-xs text-slate-500">
                      {formatUpdateMeta(initialRecord.metadata.whatsappApiToken.updatedAt, initialRecord.metadata.whatsappApiToken.updatedBy, t)}
                    </span>
                    {hasToken ? (
                      <div className="flex flex-wrap gap-2">
                        {!tokenEditable ? (
                          <button
                            type="button"
                            className="app-button-secondary"
                            onClick={() => setTokenEditable(true)}
                            disabled={saving}
                          >
                            {t('integrationsAttendance.actions.changeToken', 'Alterar token')}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="app-button-secondary"
                            onClick={() => {
                              setTokenEditable(false)
                              setValues((current) => ({ ...current, whatsappApiToken: initialRecord.values.whatsappApiToken }))
                            }}
                            disabled={saving}
                          >
                            {t('common.cancel', 'Cancelar')}
                          </button>
                        )}
                      </div>
                    ) : null}
                  </div>
                </FormField>
              </div>

              <div className="app-pane-muted rounded-[1.1rem] p-5">
                <h4 className="text-lg font-semibold text-slate-900">
                  {t('integrationsAttendance.instructions.title', 'Como conectar sua conta do WhatsApp à plataforma através da Meta')}
                </h4>

                <ol className="mt-3 space-y-2 pl-5 text-sm leading-6 text-slate-700 marker:font-semibold marker:text-slate-700">
                  <li>
                    {t('integrationsAttendance.instructions.step1Prefix', 'Acesse o painel da Meta em')}{' '}
                    <a
                      href="https://developers.facebook.com/apps"
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-sky-700 underline underline-offset-2 transition hover:text-sky-800 dark:text-sky-300"
                    >
                      developers.facebook.com/apps
                    </a>
                    .
                  </li>
                  <li>{t('integrationsAttendance.instructions.step2', 'Crie um App do tipo Negócios ou selecione um já existente.')}</li>
                  <li>{t('integrationsAttendance.instructions.step3', 'No menu esquerdo, clique em "Adicionar produto" e selecione WhatsApp.')}</li>
                  <li>{t('integrationsAttendance.instructions.step4', 'Vá em WhatsApp > Configuração e conecte sua conta do WhatsApp Business.')}</li>
                  <li>
                    {t('integrationsAttendance.instructions.step5', 'Adicione um número de telefone (não pode estar ativo no WhatsApp).')}
                    <p className="mt-1 text-xs text-slate-500">
                      {t('integrationsAttendance.instructions.step5Helper', 'Você receberá um código por SMS ou ligação para confirmar.')}
                    </p>
                  </li>
                  <li>
                    {t('integrationsAttendance.instructions.step6', 'Após a verificação, copie os dois dados abaixo:')}
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      <li className="font-semibold text-slate-800">{t('integrationsAttendance.instructions.phoneNumberId', 'Phone Number ID')}</li>
                      <li className="font-semibold text-slate-800">
                        {t('integrationsAttendance.instructions.accessToken', 'Access Token')}{' '}
                        <span className="font-normal text-slate-600">{t('integrationsAttendance.instructions.accessTokenValidity', '(válido por 60 dias)')}</span>
                      </li>
                    </ul>
                  </li>
                  <li>{t('integrationsAttendance.instructions.step7', 'Cole esses dados aqui na plataforma para ativar o envio automático de mensagens.')}</li>
                </ol>

                <p className="mt-4 text-sm text-slate-600">
                  {t('integrationsAttendance.instructions.tip', 'Dica: salve o Access Token com a data de validade. A renovação pode ser feita pelo mesmo processo após 60 dias.')}
                </p>
              </div>
            </SectionCard>
          ) : null}

          {activeTab === 'jivo' ? (
            <SectionCard
              title={t('integrationsAttendance.sections.jivo.title', 'Jivo Chat')}
              description={t('integrationsAttendance.sections.jivo.description', 'Defina o código JavaScript de integração do Jivo Chat.')}
            >
              <FormField
                label={t('integrationsAttendance.fields.jivoJs', 'Código JS')}
                helperText={t('integrationsAttendance.helpers.jivoJs', 'Código JavaScript fornecido pelo Jivo Chat.')}
              >
                <>
                  <input
                    id="jivo_js"
                    type="text"
                    className={inputClasses()}
                    value={values.jivoJs}
                    onChange={(event) => setValues((current) => ({ ...current, jivoJs: event.target.value }))}
                    disabled={saving}
                    placeholder={t('integrationsAttendance.placeholders.jivoJs', '//code.jivosite.com/widget/xxxxxxxx')}
                  />
                  <span className="text-xs text-slate-500">
                    {formatUpdateMeta(initialRecord.metadata.jivoJs.updatedAt, initialRecord.metadata.jivoJs.updatedBy, t)}
                  </span>
                </>
              </FormField>
            </SectionCard>
          ) : null}

          {activeTab === 'ebit' ? (
            <SectionCard
              title={t('integrationsAttendance.sections.ebit.title', 'Ebit')}
              description={t('integrationsAttendance.sections.ebit.description', 'Informe o código de identificação da loja no Ebit.')}
            >
              <FormField
                label={t('integrationsAttendance.fields.ebitCode', 'Código Ebit')}
                helperText={t('integrationsAttendance.helpers.ebitCode', 'Código da loja fornecido pelo Ebit.')}
              >
                <>
                  <input
                    id="ebit_codigo"
                    type="text"
                    className={inputClasses()}
                    value={values.ebitCodigo}
                    onChange={(event) => setValues((current) => ({ ...current, ebitCodigo: event.target.value }))}
                    disabled={saving}
                    placeholder={t('integrationsAttendance.placeholders.ebitCode', 'Código da loja no Ebit')}
                  />
                  <span className="text-xs text-slate-500">
                    {formatUpdateMeta(initialRecord.metadata.ebitCodigo.updatedAt, initialRecord.metadata.ebitCodigo.updatedBy, t)}
                  </span>
                </>
              </FormField>
            </SectionCard>
          ) : null}

          <div ref={footerRef} className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-line pt-5">
            <Link href="/dashboard" className="app-button-secondary inline-flex items-center rounded-full px-4 py-2.5 text-sm font-semibold">
              {t('common.back', 'Voltar')}
            </Link>
            <button
              type="submit"
              className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canSave || saving || !hasChanges}
            >
              <Save className="h-4 w-4" />
              {saving ? t('common.saving', 'Salvando...') : t('common.save', 'Salvar')}
            </button>
          </div>
        </form>
      </AsyncState>
    </div>
  )
}
