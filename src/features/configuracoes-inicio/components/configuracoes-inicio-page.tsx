'use client'

import { useMemo } from 'react'
import { ParameterFormPageBase } from '@/src/components/form-page/parameter-form-page-base'
import { configuracoesInicioClient } from '@/src/features/configuracoes-inicio/services/configuracoes-inicio-client'
import {
  configuracoesInicioFieldDefinitions,
  createEmptyConfiguracoesInicioForm,
} from '@/src/features/configuracoes-inicio/services/configuracoes-inicio-mappers'
import { useI18n } from '@/src/i18n/use-i18n'

export function ConfiguracoesInicioPage() {
  const { t } = useI18n()

  const fieldDefinitions = useMemo(
    () =>
      configuracoesInicioFieldDefinitions.map((field) => ({
        key: field.key,
        section: field.section,
        type: field.type,
        label: t(`configuracoes.home.fields.${field.key}.label`, field.key),
        helper: t(`configuracoes.home.fields.${field.key}.helper`, ''),
        inputMode: field.inputMode,
        lookupCollection: field.lookupCollection,
        lookupResource: field.lookupResource,
        options: field.options?.map((option) => ({
          value: option.value,
          label: option.labelKey ? t(option.labelKey, option.fallbackLabel) : option.fallbackLabel,
        })),
      })),
    [t],
  )

  const sectionOrder = useMemo(
    () => [
      {
        key: 'navigation',
        title: t('configuracoes.home.sections.navigation.title', 'NavegaÃ§Ã£o'),
        description: t('configuracoes.home.sections.navigation.description', 'Contexto inicial da loja antes da identificaÃ§Ã£o completa do cliente.'),
      },
      {
        key: 'pricing',
        title: t('configuracoes.home.sections.pricing.title', 'PrecificaÃ§Ã£o'),
        description: t('configuracoes.home.sections.pricing.description', 'Tabela, coluna de preÃ§o e desconto padrÃ£o aplicados no inÃ­cio.'),
      },
      {
        key: 'payment',
        title: t('configuracoes.home.sections.payment.title', 'Pagamento'),
        description: t('configuracoes.home.sections.payment.description', 'Forma e condiÃ§Ã£o de pagamento padrÃ£o usadas na jornada inicial.'),
      },
    ],
    [t],
  )

  return (
    <ParameterFormPageBase
      featureKey="configuracoesInicio"
      moduleTitle={t('configuracoes.home.title', 'InÃ­cio')}
      modulePath="/configuracoes/inicio"
      moduleDescription={t('configuracoes.home.description', 'Defina o contexto padrÃ£o usado na navegaÃ§Ã£o anÃ´nima e na precificaÃ§Ã£o inicial da loja.')}
      contextTitle={t('configuracoes.home.contextTitle', 'Escopo')}
      contextValue={t('configuracoes.home.contextValue', 'ParÃ¢metros padrÃ£o da entrada da loja')}
      contextDescription={t('configuracoes.home.contextDescription', 'Essas definiÃ§Ãµes controlam filial, preÃ§o e contexto comercial usados antes da seleÃ§Ã£o explÃ­cita do cliente durante a navegaÃ§Ã£o.')}
      loadErrorMessage={t('configuracoes.home.feedback.loadError', 'NÃ£o foi possÃ­vel carregar as configuraÃ§Ãµes de inÃ­cio.')}
      saveErrorMessage={t('configuracoes.home.feedback.saveError', 'NÃ£o foi possÃ­vel salvar as configuraÃ§Ãµes de inÃ­cio.')}
      saveSuccessMessage={t('configuracoes.home.feedback.saveSuccess', 'ConfiguraÃ§Ãµes de inÃ­cio salvas com sucesso.')}
      fieldDefinitions={fieldDefinitions}
      sectionOrder={sectionOrder}
      createEmptyValues={createEmptyConfiguracoesInicioForm}
      emptyLookups={{
        branches: [],
        paymentMethods: [],
        paymentConditions: [],
        priceTables: [],
      }}
      client={configuracoesInicioClient}
    />
  )
}


