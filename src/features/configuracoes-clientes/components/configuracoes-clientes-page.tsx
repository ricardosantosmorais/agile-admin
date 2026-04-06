'use client'

import { useMemo } from 'react'
import { ParameterFormPageBase } from '@/src/components/form-page/parameter-form-page-base'
import { configuracoesClientesClient } from '@/src/features/configuracoes-clientes/services/configuracoes-clientes-client'
import {
  configuracoesClientesFieldDefinitions,
  createEmptyConfiguracoesClientesForm,
} from '@/src/features/configuracoes-clientes/services/configuracoes-clientes-mappers'
import { useI18n } from '@/src/i18n/use-i18n'

export function ConfiguracoesClientesPage() {
  const { t } = useI18n()

  const fieldDefinitions = useMemo(
    () =>
      configuracoesClientesFieldDefinitions.map((field) => ({
        key: field.key,
        section: field.section,
        type: field.type === 'boolean' ? 'enum' : field.type,
        label: t(`configuracoes.customers.fields.${field.key}.label`, field.key),
        helper: t(`configuracoes.customers.fields.${field.key}.helper`, ''),
        options: field.options?.map((option) => ({
          value: option.value,
          label: t(option.labelKey, option.fallbackLabel),
        })),
      })),
    [t],
  )

  const sectionOrder = useMemo(
    () => [
      {
        key: 'registration',
        title: t('configuracoes.customers.sections.registration.title', 'Cadastro'),
        description: t('configuracoes.customers.sections.registration.description', 'AtivaÃ§Ã£o, identificaÃ§Ã£o e regras de entrada dos clientes.'),
      },
      {
        key: 'experience',
        title: t('configuracoes.customers.sections.experience.title', 'ExperiÃªncia'),
        description: t('configuracoes.customers.sections.experience.description', 'Etapas exibidas no fluxo da loja e preferÃªncias comerciais.'),
      },
      {
        key: 'rules',
        title: t('configuracoes.customers.sections.rules.title', 'Regras'),
        description: t('configuracoes.customers.sections.rules.description', 'ValidaÃ§Ãµes e vÃ­nculos aplicados ao cliente no tenant.'),
      },
    ],
    [t],
  )

  return (
    <ParameterFormPageBase
      featureKey="configuracoesClientes"
      moduleTitle={t('configuracoes.customers.title', 'Clientes')}
      modulePath="/configuracoes/clientes"
      moduleDescription={t('configuracoes.customers.description', 'Configure como a plataforma trata cadastro, ativaÃ§Ã£o, login e experiÃªncia dos clientes neste tenant.')}
      contextTitle={t('configuracoes.customers.contextTitle', 'Escopo')}
      contextValue={t('configuracoes.customers.contextValue', 'ParÃ¢metros globais de clientes')}
      contextDescription={t('configuracoes.customers.contextDescription', 'Estas preferÃªncias sÃ£o aplicadas ao tenant ativo e servem de base para os demais mÃ³dulos de ConfiguraÃ§Ãµes.')}
      loadErrorMessage={t('configuracoes.customers.feedback.loadError', 'NÃ£o foi possÃ­vel carregar as configuraÃ§Ãµes de clientes.')}
      saveErrorMessage={t('configuracoes.customers.feedback.saveError', 'NÃ£o foi possÃ­vel salvar as configuraÃ§Ãµes de clientes.')}
      saveSuccessMessage={t('configuracoes.customers.feedback.saveSuccess', 'ConfiguraÃ§Ãµes de clientes salvas com sucesso.')}
      fieldDefinitions={fieldDefinitions}
      sectionOrder={sectionOrder}
      createEmptyValues={createEmptyConfiguracoesClientesForm}
      emptyLookups={{}}
      client={configuracoesClientesClient}
    />
  )
}


