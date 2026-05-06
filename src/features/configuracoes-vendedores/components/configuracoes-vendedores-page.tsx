'use client'

import { useEffect, useMemo, useState } from 'react'
import { AccessDeniedState } from '@/src/features/auth/components/access-denied-state'
import { ManualFormPageShell } from '@/src/components/form-page/manual-form-page-shell'
import { ConfiguracoesVendedoresFormSections } from '@/src/features/configuracoes-vendedores/components/configuracoes-vendedores-form-sections'
import { configuracoesVendedoresClient } from '@/src/features/configuracoes-vendedores/services/configuracoes-vendedores-client'
import {
  createEmptyConfiguracoesVendedoresForm,
  getConfiguracoesVendedoresFieldDefinitions,
  getConfiguracoesVendedoresScheduleDays,
} from '@/src/features/configuracoes-vendedores/services/configuracoes-vendedores-mappers'
import type { ConfiguracoesVendedoresFormValues } from '@/src/features/configuracoes-vendedores/types/configuracoes-vendedores'
import { useFeatureAccess } from '@/src/features/auth/hooks/use-feature-access'
import { useAuth } from '@/src/features/auth/hooks/use-auth'
import { useFormState } from '@/src/hooks/use-form-state'
import { useI18n } from '@/src/i18n/use-i18n'

type FieldMetadata = {
  updatedAt: string
  updatedBy: string
}

const LEGACY_LOCKED_TENANT_ID = '1705083119553379'

export function ConfiguracoesVendedoresPage() {
  const { t } = useI18n()
  const fieldDefinitions = useMemo(() => getConfiguracoesVendedoresFieldDefinitions(t), [t])
  const scheduleDays = useMemo(() => getConfiguracoesVendedoresScheduleDays(t), [t])
  const { session, user } = useAuth()
  const access = useFeatureAccess('configuracoesVendedores')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<Partial<Record<keyof ConfiguracoesVendedoresFormValues, FieldMetadata>>>({})
  const [initialValues, setInitialValues] = useState<ConfiguracoesVendedoresFormValues>(createEmptyConfiguracoesVendedoresForm())
  const { state: values, setState: setValues, patch } = useFormState<ConfiguracoesVendedoresFormValues>(initialValues)
  const formId = 'configuracoes-vendedores-form'
  const canSave = access.canEdit && !(session?.currentTenant.id === LEGACY_LOCKED_TENANT_ID && !user?.master)

  const sectionOrder = useMemo(
    () => [
      {
        key: 'access',
        title: t('configuracoes.sellers.sections.access.title', 'Acesso'),
        description: t('configuracoes.sellers.sections.access.description', 'AtivaÃ§Ã£o, menu e liberaÃ§Ã£o geral de acesso.'),
      },
      {
        key: 'rules',
        title: t('configuracoes.sellers.sections.rules.title', 'Regras comerciais'),
        description: t('configuracoes.sellers.sections.rules.description', 'PermissÃµes operacionais aplicadas ao vendedor.'),
      },
      {
        key: 'types',
        title: t('configuracoes.sellers.sections.types.title', 'Tipos'),
        description: t('configuracoes.sellers.sections.types.description', 'Regras por tipo de pessoa para vendedores e clientes.'),
      },
      {
        key: 'representativeArea',
        title: t('configuracoes.sellers.sections.representativeArea.title', 'Área Representante V2'),
        description: t('configuracoes.sellers.sections.representativeArea.description', 'Parâmetros comerciais e cotas de uso para a nova área do representante.'),
      },
    ],
    [t],
  )

  const hasChanges = useMemo(
    () =>
      Object.keys(initialValues).some((key) => {
        const typedKey = key as keyof ConfiguracoesVendedoresFormValues
        const initialValue = String(initialValues[typedKey] ?? '').trim()
        const currentValue = String(values[typedKey] ?? '').trim()
        return initialValue !== currentValue
      }),
    [initialValues, values],
  )

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const result = await configuracoesVendedoresClient.get()
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

        setError(loadError instanceof Error ? loadError : new Error(t('configuracoes.sellers.feedback.loadError', 'NÃ£o foi possÃ­vel carregar as configuraÃ§Ãµes de vendedores.')))
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

    if (!canSave || !hasChanges) {
      return
    }

    try {
      setSaving(true)
      await configuracoesVendedoresClient.save(initialValues, values)
      const refreshed = await configuracoesVendedoresClient.get()
      setValues(refreshed.values)
      setInitialValues(refreshed.values)
      setMetadata(refreshed.metadata)
      setFeedback(t('configuracoes.sellers.feedback.saveSuccess', 'ConfiguraÃ§Ãµes de vendedores salvas com sucesso.'))
    } catch (saveError) {
      setFeedback(saveError instanceof Error ? saveError.message : t('configuracoes.sellers.feedback.saveError', 'NÃ£o foi possÃ­vel salvar as configuraÃ§Ãµes de vendedores.'))
    } finally {
      setSaving(false)
    }
  }

  if (!access.canOpen) {
    return <AccessDeniedState title={t('configuracoes.sellers.title', 'Vendedores')} backHref="/dashboard" />
  }

  return (
    <ManualFormPageShell
      moduleTitle={t('configuracoes.sellers.title', 'Vendedores')}
      modulePath="/configuracoes/vendedores"
      moduleDescription={t('configuracoes.sellers.description', 'Controle ativaÃ§Ã£o, permissÃµes e horÃ¡rios de acesso para vendedores.')}
      contextTitle={t('configuracoes.sellers.contextTitle', 'Escopo')}
      contextValue={t('configuracoes.sellers.contextValue', 'ParÃ¢metros de acesso e operaÃ§Ã£o de vendedores')}
      contextDescription={t(
        'configuracoes.sellers.contextDescription',
        'Essas definiÃ§Ãµes controlam como os vendedores acessam a plataforma, quais regras podem executar e em quais horÃ¡rios o acesso Ã© permitido.',
      )}
      isLoading={loading}
      error={error?.message}
      feedback={feedback}
      onDismissFeedback={() => setFeedback(null)}
      formId={formId}
      onSubmit={handleSubmit}
      canSave={canSave}
      hasChanges={hasChanges}
      saving={saving}
    >
      <ConfiguracoesVendedoresFormSections
        sectionOrder={sectionOrder}
        fieldDefinitions={fieldDefinitions}
        scheduleDays={scheduleDays}
        values={values}
        metadata={metadata}
        canSave={canSave}
        isMasterUser={Boolean(user?.master)}
        patch={patch}
        t={t}
      />
    </ManualFormPageShell>
  )
}

