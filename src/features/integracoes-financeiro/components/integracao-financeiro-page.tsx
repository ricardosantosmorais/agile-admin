'use client'

import Link from 'next/link'
import { RefreshCcw, Save } from 'lucide-react'
import { useEffect, useMemo, useState, useCallback } from 'react'
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
import { useFooterActionsVisibility } from '@/src/hooks/use-footer-actions-visibility'
import { useI18n } from '@/src/i18n/use-i18n'
import { integracaoFinanceiroClient } from '../services/integracao-financeiro-client'
import type {
  ClearSaleConfig,
  ClearSaleFieldMeta,
  FinanceiroFieldMeta,
  FinanceiroGatewayBranchRow,
  GatewayPagamento,
  IntegracaoFinanceiroRecord,
  KondutoConfig,
  KondutoFieldMeta,
} from '../types/integracao-financeiro.types'

type TabKey = 'boleto' | 'cartao' | 'pix' | 'clearsale' | 'konduto'
type TFn = ReturnType<typeof useI18n>['t']

const LEGACY_LOCKED_TENANT_ID = '1705083119553379'

function formatUpdateMeta(meta: FinanceiroFieldMeta | undefined, t: TFn) {
  if (!meta?.updatedAt || !meta.updatedBy) return null
  return (
    <span className="mt-1 block text-[11px] leading-4 text-slate-400">
      {t('integrationsFinancial.lastUpdateValue', 'Ultima alteracao: {{date}} por {{user}}')
        .replace('{{date}}', meta.updatedAt)
        .replace('{{user}}', meta.updatedBy)}
    </span>
  )
}

// -- Gateway tab (Boleto / Cartao / PIX) ------------------------------------

type GatewayTabProps = {
  tipo: GatewayPagamento['tipo']
  gateways: GatewayPagamento[]
  branches: FinanceiroGatewayBranchRow[]
  saving: boolean
  canEdit: boolean
  helper: string
  onChange: (branchId: string, field: 'gatewayBoleto' | 'gatewayCartao' | 'gatewayPix', value: string) => void
  t: TFn
}

function gatewayField(tipo: GatewayPagamento['tipo']): 'gatewayBoleto' | 'gatewayCartao' | 'gatewayPix' {
  if (tipo === 'boleto_antecipado') return 'gatewayBoleto'
  if (tipo === 'cartao_credito') return 'gatewayCartao'
  return 'gatewayPix'
}

function branchMeta(branch: FinanceiroGatewayBranchRow, tipo: GatewayPagamento['tipo']): FinanceiroFieldMeta | undefined {
  if (tipo === 'boleto_antecipado') return branch.updatedAtBoleto
  if (tipo === 'cartao_credito') return branch.updatedAtCartao
  return branch.updatedAtPix
}

function GatewayTab({ tipo, gateways, branches, saving, canEdit, helper, onChange, t }: GatewayTabProps) {
  const filtered = gateways.filter((gw) => gw.tipo === tipo)
  const field = gatewayField(tipo)

  if (!branches.length) {
    return <p className="text-sm text-slate-500">{t('common.noResults', 'Nenhuma filial cadastrada.')}</p>
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-line">
              <th className="w-[35%] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t('integrationsFinancial.fields.branch', 'Filial')}
              </th>
              <th className="w-[40%] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t('integrationsFinancial.gateway', 'Gateway de Pagamento')} *
              </th>
              <th className="w-[25%] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t('integrationsFinancial.fields.lastChange', 'Ultima Alteracao')}
              </th>
            </tr>
          </thead>
          <tbody>
            {branches.map((branch) => {
              const meta = branchMeta(branch, tipo)
              return (
                <tr key={branch.id} className="border-b border-line/50">
                  <td className="px-3 py-3 text-slate-700">
                    {branch.nome}
                    <span className="ml-1 text-slate-400">- {branch.id}</span>
                  </td>
                  <td className="px-3 py-3">
                    <select
                      className={inputClasses()}
                      value={branch[field]}
                      onChange={(e) => onChange(branch.id, field, e.target.value)}
                      disabled={saving || !canEdit}
                    >
                      <option value="">{t('common.select', 'Selecione')}</option>
                      {filtered.map((gw) => (
                        <option key={gw.id} value={gw.id}>
                          {gw.nome}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-500">
                    {meta?.updatedAt && meta.updatedBy ? (
                      <>{meta.updatedAt}<br /><span className="text-slate-400">por {meta.updatedBy}</span></>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">{helper}</p>
    </>
  )
}

// -- Sensitive field (lock/unlock) ------------------------------------------

type SensitiveFieldProps = {
  value: string
  hasExistingValue: boolean
  editable: boolean
  saving: boolean
  canEdit: boolean
  meta: FinanceiroFieldMeta | undefined
  onChange: (v: string) => void
  onEnable: () => void
  onCancel: () => void
  t: TFn
}

function SensitiveField({ value, hasExistingValue, editable, saving, canEdit, meta, onChange, onEnable, onCancel, t }: SensitiveFieldProps) {
  return (
    <div className="space-y-2">
      <input
        type="text"
        className={inputClasses()}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={saving || !canEdit || !editable}
      />
      {formatUpdateMeta(meta, t)}
      {canEdit && hasExistingValue ? (
        <div className="flex flex-wrap gap-2">
          {!editable ? (
            <button
              type="button"
              onClick={onEnable}
              disabled={saving}
              className="app-button-secondary inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold"
            >
              {t('integrationsFinancial.actionsLabel.changeField', 'Alterar')}
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="app-button-secondary inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold"
            >
              {t('integrationsFinancial.actionsLabel.cancelChange', 'Cancelar alteracao')}
            </button>
          )}
        </div>
      ) : null}
    </div>
  )
}

// -- Page -------------------------------------------------------------------

export function IntegracaoFinanceiroPage() {
  const { t } = useI18n()
  const { session, user } = useAuth()
  const access = useFeatureAccess('integracoesFinanceiro')
  const { footerRef, isFooterVisible } = useFooterActionsVisibility<HTMLDivElement>()

  const [record, setRecord] = useState<IntegracaoFinanceiroRecord | null>(null)
  const [initialRecord, setInitialRecord] = useState<IntegracaoFinanceiroRecord | null>(null)
  const [branches, setBranches] = useState<FinanceiroGatewayBranchRow[]>([])
  const [clearSale, setClearSale] = useState<ClearSaleConfig>({
    ambiente: '',
    login: '',
    senha: '',
    fingerprint: '',
    modoBb2B2c: '',
    customSla: '',
    enviaPix: '',
  })
  const [konduto, setKonduto] = useState<KondutoConfig>({
    ambiente: '',
    chavePublica: '',
    chavePrivada: '',
  })
  const [activeTab, setActiveTab] = useState<TabKey>('boleto')
  const [senhaEditable, setSenhaEditable] = useState(false)
  const [chavePrivadaEditable, setChavePrivadaEditable] = useState(false)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(true)

  const canEdit = useMemo(() => {
    if (!session || !user) return false
    if (session.currentTenant.id === LEGACY_LOCKED_TENANT_ID && !user.master) return false
    return access?.canEdit ?? false
  }, [session, user, access])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const loaded = await integracaoFinanceiroClient.get()
      setRecord(loaded)
      setInitialRecord(loaded)
      setBranches(loaded.branches)
      setClearSale(loaded.clearSale)
      setKonduto(loaded.konduto)
      setSenhaEditable(!loaded.clearSale.senha)
      setChavePrivadaEditable(!loaded.konduto.chavePrivada)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(t('integrationsFinancial.feedback.loadError', 'Erro ao carregar configuracoes')))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    loadData()
  }, [loadData])

  const hasChanges = useMemo(() => {
    if (!initialRecord) return false
    if (JSON.stringify(clearSale) !== JSON.stringify(initialRecord.clearSale)) return true
    if (JSON.stringify(konduto) !== JSON.stringify(initialRecord.konduto)) return true
    if (JSON.stringify(branches) !== JSON.stringify(initialRecord.branches)) return true
    return false
  }, [branches, clearSale, initialRecord, konduto])

  const canSave = canEdit && hasChanges

  const handleRefresh = useCallback(() => { loadData() }, [loadData])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!canSave) return
      try {
        setSaving(true)
        setFeedback(null)
        await integracaoFinanceiroClient.save(branches, clearSale, konduto, {
          includeClearSaleSenha: senhaEditable && clearSale.senha.length > 0,
          includeKondutoChavePrivada: chavePrivadaEditable && konduto.chavePrivada.length > 0,
        })
        const refreshed = await integracaoFinanceiroClient.get()
        setInitialRecord(refreshed)
        setRecord(refreshed)
        setBranches(refreshed.branches)
        setClearSale(refreshed.clearSale)
        setKonduto(refreshed.konduto)
        setSenhaEditable(!refreshed.clearSale.senha)
        setChavePrivadaEditable(!refreshed.konduto.chavePrivada)
        setFeedback({
          tone: 'success',
          message: t('integrationsFinancial.feedback.saveSuccess', 'Configuracoes salvas com sucesso'),
        })
      } catch (err) {
        setFeedback({
          tone: 'error',
          message: err instanceof Error ? err.message : t('integrationsFinancial.feedback.saveError', 'Erro ao salvar'),
        })
      } finally {
        setSaving(false)
      }
    },
    [branches, clearSale, chavePrivadaEditable, konduto, canSave, senhaEditable, t]
  )

  function updateBranch(branchId: string, field: 'gatewayBoleto' | 'gatewayCartao' | 'gatewayPix', value: string) {
    setBranches((prev) => prev.map((b) => (b.id === branchId ? { ...b, [field]: value } : b)))
  }

  function patchClearSale<K extends keyof ClearSaleConfig>(key: K, value: ClearSaleConfig[K]) {
    setClearSale((prev) => ({ ...prev, [key]: value }))
  }

  function patchKonduto<K extends keyof KondutoConfig>(key: K, value: KondutoConfig[K]) {
    setKonduto((prev) => ({ ...prev, [key]: value }))
  }

  const breadcrumbs = [
    { label: t('routes.dashboard', 'Home'), href: '/dashboard' },
    { label: t('common.integrations', 'Integracoes'), href: '/integracoes' },
    { label: t('integrationsFinancial.title', 'Financeiro') },
  ]

  if (!access?.canView) {
    return <AccessDeniedState title={t('integrationsFinancial.title', 'Integracoes > Financeiro')} />
  }

  return (
    <div className="space-y-5 pb-20">
      {feedback ? (
        <PageToast tone={feedback.tone} message={feedback.message} onClose={() => setFeedback(null)} />
      ) : null}

      <PageHeader
        breadcrumbs={breadcrumbs}
        title={t('integrationsFinancial.title', 'Financeiro')}
        actions={(
          <>
            {!isFooterVisible ? (
              <button
                type="submit"
                form="integracao-financeiro-form"
                disabled={!canSave || saving}
                className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? t('common.loading', 'Salvando...') : t('common.save', 'Salvar')}
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading || saving}
              className="app-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              <RefreshCcw className="h-4 w-4" />
              {t('common.refresh', 'Atualizar')}
            </button>
          </>
        )}
      />

      <AsyncState isLoading={loading} error={error?.message}>
        {record ? (
          <form id="integracao-financeiro-form" onSubmit={handleSubmit} className="space-y-5">

            <SectionCard>
              <div className="flex flex-wrap gap-1">
                <TabButton active={activeTab === 'boleto'} label={t('integrationsFinancial.tabs.boleto', 'Boleto')} onClick={() => setActiveTab('boleto')} />
                <TabButton active={activeTab === 'cartao'} label={t('integrationsFinancial.tabs.cartao', 'Cartao')} onClick={() => setActiveTab('cartao')} />
                <TabButton active={activeTab === 'pix'} label={t('integrationsFinancial.tabs.pix', 'PIX')} onClick={() => setActiveTab('pix')} />
                <TabButton active={activeTab === 'clearsale'} label={t('integrationsFinancial.tabs.clearsale', 'ClearSale')} onClick={() => setActiveTab('clearsale')} />
                <TabButton active={activeTab === 'konduto'} label={t('integrationsFinancial.tabs.konduto', 'Konduto')} onClick={() => setActiveTab('konduto')} />
              </div>
            </SectionCard>

            {activeTab === 'boleto' ? (
              <SectionCard
                title={t('integrationsFinancial.sections.boleto.title', 'Boleto Bancario')}
                description={t('integrationsFinancial.sections.boleto.description', 'Configuracoes de integracao com o gateway de pagamento de boleto bancario.')}
              >
                <GatewayTab
                  tipo="boleto_antecipado"
                  gateways={record.gateways}
                  branches={branches}
                  saving={saving}
                  canEdit={canEdit}
                  helper={t('integrationsFinancial.sections.boleto.helper', '* Gateway de Pagamento vinculado a filial para pagamentos via boleto bancario.')}
                  onChange={updateBranch}
                  t={t}
                />
              </SectionCard>
            ) : null}

            {activeTab === 'cartao' ? (
              <SectionCard
                title={t('integrationsFinancial.sections.cartao.title', 'Cartao de Credito')}
                description={t('integrationsFinancial.sections.cartao.description', 'Configuracoes de integracao com o gateway de pagamento de cartao de credito.')}
              >
                <GatewayTab
                  tipo="cartao_credito"
                  gateways={record.gateways}
                  branches={branches}
                  saving={saving}
                  canEdit={canEdit}
                  helper={t('integrationsFinancial.sections.cartao.helper', '* Gateway de Pagamento vinculado a filial para pagamentos via cartao de credito.')}
                  onChange={updateBranch}
                  t={t}
                />
              </SectionCard>
            ) : null}

            {activeTab === 'pix' ? (
              <SectionCard
                title={t('integrationsFinancial.sections.pix.title', 'PIX')}
                description={t('integrationsFinancial.sections.pix.description', 'Configuracoes de integracao com o gateway de pagamento de PIX.')}
              >
                <GatewayTab
                  tipo="pix"
                  gateways={record.gateways}
                  branches={branches}
                  saving={saving}
                  canEdit={canEdit}
                  helper={t('integrationsFinancial.sections.pix.helper', '* Gateway de Pagamento vinculado a filial para pagamentos via PIX.')}
                  onChange={updateBranch}
                  t={t}
                />
              </SectionCard>
            ) : null}

            {activeTab === 'clearsale' ? (
              <SectionCard
                title={t('integrationsFinancial.sections.clearsale.title', 'ClearSale')}
                description={t('integrationsFinancial.sections.clearsale.description', 'Configure credenciais e parametros de antifraude ClearSale.')}
              >
                <div className="grid gap-5 lg:grid-cols-2">

                  <FormField label={t('integrationsFinancial.fields.environment', 'Ambiente')}>
                    <>
                      <select
                        className={inputClasses()}
                        value={clearSale.ambiente}
                        onChange={(e) => patchClearSale('ambiente', e.target.value as ClearSaleConfig['ambiente'])}
                        disabled={saving || !canEdit}
                      >
                        <option value="">{t('common.select', 'Selecione')}</option>
                        <option value="producao">{t('integrationsFinancial.fields.production', 'Producao')}</option>
                        <option value="teste">{t('integrationsFinancial.fields.test', 'Teste')}</option>
                      </select>
                      {formatUpdateMeta((record.clearSaleMetadata as ClearSaleFieldMeta)?.ambiente, t)}
                    </>
                  </FormField>

                  <FormField
                    label={t('integrationsFinancial.fields.login', 'Login')}
                    helperText={t('integrationsFinancial.helpers.loginProvidedByClearsale', 'Login fornecido pela ClearSale')}
                  >
                    <>
                      <input
                        type="text"
                        className={inputClasses()}
                        value={clearSale.login}
                        onChange={(e) => patchClearSale('login', e.target.value)}
                        disabled={saving || !canEdit}
                      />
                      {formatUpdateMeta((record.clearSaleMetadata as ClearSaleFieldMeta)?.login, t)}
                    </>
                  </FormField>

                  <FormField
                    label={t('integrationsFinancial.fields.password', 'Senha')}
                    helperText={t('integrationsFinancial.helpers.passwordProvidedByClearsale', 'Senha fornecida pela ClearSale')}
                    asLabel={false}
                  >
                    <SensitiveField
                      value={clearSale.senha}
                      hasExistingValue={Boolean(initialRecord?.clearSale.senha)}
                      editable={senhaEditable}
                      saving={saving}
                      canEdit={canEdit}
                      meta={(record.clearSaleMetadata as ClearSaleFieldMeta)?.senha}
                      onChange={(v) => patchClearSale('senha', v)}
                      onEnable={() => { setSenhaEditable(true); patchClearSale('senha', '') }}
                      onCancel={() => { setSenhaEditable(false); patchClearSale('senha', initialRecord?.clearSale.senha ?? '') }}
                      t={t}
                    />
                  </FormField>

                  <FormField
                    label={t('integrationsFinancial.fields.fingerprint', 'Fingerprint')}
                    helperText={t('integrationsFinancial.helpers.fingerprintProvidedByClearsale', 'Fingerprint (seu_app) fornecido pela ClearSale')}
                  >
                    <>
                      <input
                        type="text"
                        className={inputClasses()}
                        value={clearSale.fingerprint}
                        onChange={(e) => patchClearSale('fingerprint', e.target.value)}
                        disabled={saving || !canEdit}
                      />
                      {formatUpdateMeta((record.clearSaleMetadata as ClearSaleFieldMeta)?.fingerprint, t)}
                    </>
                  </FormField>

                  <FormField
                    label={t('integrationsFinancial.fields.operationMode', 'Modo de Operacao')}
                    helperText={t('integrationsFinancial.helpers.operationModeBb2B2c', 'Se o contrato com a ClearSale foi para B2B ou B2C')}
                  >
                    <>
                      <select
                        className={inputClasses()}
                        value={clearSale.modoBb2B2c}
                        onChange={(e) => patchClearSale('modoBb2B2c', e.target.value as ClearSaleConfig['modoBb2B2c'])}
                        disabled={saving || !canEdit}
                      >
                        <option value="">{t('common.select', 'Selecione')}</option>
                        <option value="B2B">B2B</option>
                        <option value="B2C">B2C</option>
                      </select>
                      {formatUpdateMeta((record.clearSaleMetadata as ClearSaleFieldMeta)?.modoBb2B2c, t)}
                    </>
                  </FormField>

                  <FormField
                    label={t('integrationsFinancial.fields.customSla', 'Custom SLA (minutos)')}
                    helperText={t('integrationsFinancial.helpers.customSlaMinutes', 'Tempo de SLA em minutos contratado com a ClearSale')}
                  >
                    <>
                      <input
                        type="number"
                        min="0"
                        className={inputClasses()}
                        value={clearSale.customSla}
                        onChange={(e) => patchClearSale('customSla', e.target.value)}
                        disabled={saving || !canEdit}
                      />
                      {formatUpdateMeta((record.clearSaleMetadata as ClearSaleFieldMeta)?.customSla, t)}
                    </>
                  </FormField>

                  <FormField
                    label={t('integrationsFinancial.fields.sendPixOrders', 'Envia Pedidos em PIX')}
                    helperText={t('integrationsFinancial.helpers.sendPixOrdersDescription', 'Se deve enviar pedidos realizados em PIX para registro de comportamento do cliente')}
                  >
                    <>
                      <select
                        className={inputClasses()}
                        value={clearSale.enviaPix}
                        onChange={(e) => patchClearSale('enviaPix', e.target.value as ClearSaleConfig['enviaPix'])}
                        disabled={saving || !canEdit}
                      >
                        <option value="">{t('common.select', 'Selecione')}</option>
                        <option value="S">{t('common.yes', 'Sim')}</option>
                        <option value="N">{t('common.no', 'Nao')}</option>
                      </select>
                      {formatUpdateMeta((record.clearSaleMetadata as ClearSaleFieldMeta)?.enviaPix, t)}
                    </>
                  </FormField>

                </div>
              </SectionCard>
            ) : null}

            {activeTab === 'konduto' ? (
              <SectionCard
                title={t('integrationsFinancial.sections.konduto.title', 'Konduto')}
                description={t('integrationsFinancial.sections.konduto.description', 'Configure credenciais e parametros de antifraude Konduto.')}
              >
                <div className="grid gap-5 lg:grid-cols-2">

                  <FormField label={t('integrationsFinancial.fields.environment', 'Ambiente')}>
                    <>
                      <select
                        className={inputClasses()}
                        value={konduto.ambiente}
                        onChange={(e) => patchKonduto('ambiente', e.target.value as KondutoConfig['ambiente'])}
                        disabled={saving || !canEdit}
                      >
                        <option value="">{t('common.select', 'Selecione')}</option>
                        <option value="producao">{t('integrationsFinancial.fields.production', 'Producao')}</option>
                        <option value="teste">{t('integrationsFinancial.fields.test', 'Teste')}</option>
                      </select>
                      {formatUpdateMeta((record.kondutoMetadata as KondutoFieldMeta)?.ambiente, t)}
                    </>
                  </FormField>

                  <FormField
                    label={t('integrationsFinancial.fields.publicKey', 'Chave Publica')}
                    helperText={t('integrationsFinancial.helpers.publicKeyProvidedByKonduto', 'Chave Publica fornecida pela Konduto')}
                  >
                    <>
                      <input
                        type="text"
                        className={inputClasses()}
                        value={konduto.chavePublica}
                        onChange={(e) => patchKonduto('chavePublica', e.target.value)}
                        disabled={saving || !canEdit}
                      />
                      {formatUpdateMeta((record.kondutoMetadata as KondutoFieldMeta)?.chavePublica, t)}
                    </>
                  </FormField>

                  <FormField
                    label={t('integrationsFinancial.fields.privateKey', 'Chave Privada')}
                    helperText={t('integrationsFinancial.helpers.privateKeyProvidedByKonduto', 'Chave Privada fornecida pela Konduto')}
                    asLabel={false}
                  >
                    <SensitiveField
                      value={konduto.chavePrivada}
                      hasExistingValue={Boolean(initialRecord?.konduto.chavePrivada)}
                      editable={chavePrivadaEditable}
                      saving={saving}
                      canEdit={canEdit}
                      meta={(record.kondutoMetadata as KondutoFieldMeta)?.chavePrivada}
                      onChange={(v) => patchKonduto('chavePrivada', v)}
                      onEnable={() => { setChavePrivadaEditable(true); patchKonduto('chavePrivada', '') }}
                      onCancel={() => { setChavePrivadaEditable(false); patchKonduto('chavePrivada', initialRecord?.konduto.chavePrivada ?? '') }}
                      t={t}
                    />
                  </FormField>

                </div>
              </SectionCard>
            ) : null}

            <div
              ref={footerRef}
              className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-line pt-5"
            >
              <Link
                href="/dashboard"
                className="app-button-secondary inline-flex items-center rounded-full px-4 py-2.5 text-sm font-semibold"
              >
                {t('common.back', 'Voltar')}
              </Link>
              <button
                type="submit"
                disabled={!canSave || saving}
                className="app-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? t('common.loading', 'Salvando...') : t('common.save', 'Salvar')}
              </button>
            </div>

          </form>
        ) : null}
      </AsyncState>
    </div>
  )
}