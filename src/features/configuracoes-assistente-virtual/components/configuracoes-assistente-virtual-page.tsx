'use client'

import { useEffect, useMemo, useState } from 'react'
import { SectionCard } from '@/src/components/ui/section-card'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { AssistenteVirtualIdentitySection } from '@/src/features/configuracoes-assistente-virtual/components/assistente-virtual-identity-section'
import { AssistenteVirtualMessagesSection } from '@/src/features/configuracoes-assistente-virtual/components/assistente-virtual-messages-section'
import { configuracoesAssistenteVirtualClient } from '@/src/features/configuracoes-assistente-virtual/services/configuracoes-assistente-virtual-client'
import { createEmptyConfiguracoesAssistenteVirtualForm } from '@/src/features/configuracoes-assistente-virtual/services/configuracoes-assistente-virtual-mappers'
import { ManualFormPageShell } from '@/src/components/form-page/manual-form-page-shell'
import type { ConfiguracoesAssistenteVirtualFormValues } from '@/src/features/configuracoes-assistente-virtual/types/configuracoes-assistente-virtual'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
import { useFormState } from '@/src/hooks/use-form-state'
import { useI18n } from '@/src/i18n/use-i18n'
import { createProfileUploadHandler } from '@/src/lib/uploads'

type FieldMetadata = {
  updatedAt: string
  updatedBy: string
}

const messageFields: Array<keyof ConfiguracoesAssistenteVirtualFormValues> = [
  'ia_mensagem_mix_cliente',
  'ia_mensagem_mix_segmento',
  'ia_mensagem_alta_preco',
  'ia_mensagem_falta',
  'ia_mensagem_frequencia_compra',
  'ia_mensagem_recomendados',
]

export function ConfiguracoesAssistenteVirtualPage() {
  const { t } = useI18n()
  const access = useFeatureAccess('configuracoesAssistenteVirtual')
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<Partial<Record<keyof ConfiguracoesAssistenteVirtualFormValues, FieldMetadata>>>({})
  const [initialValues, setInitialValues] = useState<ConfiguracoesAssistenteVirtualFormValues>(createEmptyConfiguracoesAssistenteVirtualForm())
  const { state: values, setState: setValues, patch } = useFormState<ConfiguracoesAssistenteVirtualFormValues>(
    createEmptyConfiguracoesAssistenteVirtualForm(),
  )
  const formId = 'configuracoes-assistente-virtual-form'

  const hasChanges = useMemo(
    () => Object.keys(values).some((key) => {
      const typedKey = key as keyof ConfiguracoesAssistenteVirtualFormValues
      return String(initialValues[typedKey] ?? '').trim() !== String(values[typedKey] ?? '').trim()
    }),
    [initialValues, values],
  )

  const uploadHandler = useMemo(
    () => createProfileUploadHandler({
      profileId: 'tenant-public-images',
      tenantBucketUrl: session?.currentTenant.assetsBucketUrl ?? null,
      folder: 'imgs',
    }),
    [session?.currentTenant.assetsBucketUrl],
  )

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const result = await configuracoesAssistenteVirtualClient.get()
        if (!active) {
          return
        }

        setValues(result.values)
        setInitialValues(result.values)
        setMetadata(result.metadata)
        setError(null)
      } catch (loadError) {
        if (!active) {
          return
        }

        setError(loadError instanceof Error ? loadError : new Error(
          t('configuracoes.virtualAssistant.feedback.loadError', 'NÃ£o foi possÃ­vel carregar as configuraÃ§Ãµes do assistente virtual.'),
        ))
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
  }, [setValues, t])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!access.canEdit || !hasChanges) {
      return
    }

    try {
      setSaving(true)
      await configuracoesAssistenteVirtualClient.save(initialValues, values)
      const refreshed = await configuracoesAssistenteVirtualClient.get()
      setValues(refreshed.values)
      setInitialValues(refreshed.values)
      setMetadata(refreshed.metadata)
      setFeedback(t('configuracoes.virtualAssistant.feedback.saveSuccess', 'ConfiguraÃ§Ãµes do assistente virtual salvas com sucesso.'))
    } catch (saveError) {
      setFeedback(
        saveError instanceof Error
          ? saveError.message
          : t('configuracoes.virtualAssistant.feedback.saveError', 'NÃ£o foi possÃ­vel salvar as configuraÃ§Ãµes do assistente virtual.'),
      )
    } finally {
      setSaving(false)
    }
  }

  if (!access.canOpen) {
    return <AccessDeniedState title={t('configuracoes.virtualAssistant.title', 'Assistente virtual')} backHref="/dashboard" />
  }

  return (
    <ManualFormPageShell
      moduleTitle={t('configuracoes.virtualAssistant.title', 'Assistente virtual')}
      modulePath="/configuracoes/assistente-virtual"
      moduleDescription={t(
        'configuracoes.virtualAssistant.description',
        'Defina a identidade do assistente virtual e personalize as mensagens sugeridas para o tenant ativo.',
      )}
      contextTitle={t('configuracoes.virtualAssistant.contextTitle', 'Escopo')}
      contextValue={t('configuracoes.virtualAssistant.contextValue', 'Identidade e mensagens do assistente')}
      contextDescription={t(
        'configuracoes.virtualAssistant.contextDescription',
        'Essas preferÃªncias definem como o assistente aparece e quais mensagens padrÃ£o ele usa nos insights do tenant.',
      )}
      isLoading={loading}
      error={error?.message}
      feedback={feedback}
      onDismissFeedback={() => setFeedback(null)}
      formId={formId}
      onSubmit={handleSubmit}
      canSave={access.canEdit}
      hasChanges={hasChanges}
      saving={saving}
    >
      <SectionCard
        title={t('configuracoes.virtualAssistant.sections.general.title', 'Identidade')}
        description={t('configuracoes.virtualAssistant.sections.general.description', 'AtivaÃ§Ã£o, nome exibido e avatar usados pelo assistente virtual.')}
      >
        <AssistenteVirtualIdentitySection
          values={values}
          metadata={metadata}
          canEdit={access.canEdit}
          patch={patch}
          uploadHandler={uploadHandler}
          t={t}
        />
      </SectionCard>

      <SectionCard
        title={t('configuracoes.virtualAssistant.sections.messages.title', 'Mensagens')}
        description={t('configuracoes.virtualAssistant.sections.messages.description', 'Personalize os textos sugeridos que alimentam os insights do assistente.')}
      >
        <AssistenteVirtualMessagesSection
          values={values}
          metadata={metadata}
          canEdit={access.canEdit}
          fields={messageFields}
          patch={patch}
          t={t}
        />
      </SectionCard>
    </ManualFormPageShell>
  )
}


