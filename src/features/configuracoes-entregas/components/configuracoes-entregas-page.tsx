'use client'

import { useMemo } from 'react'
import { ParameterFormPageBase } from '@/src/components/form-page/parameter-form-page-base'
import { configuracoesEntregasClient } from '@/src/features/configuracoes-entregas/services/configuracoes-entregas-client'
import {
  configuracoesEntregasFieldDefinitions,
  createEmptyConfiguracoesEntregasForm,
} from '@/src/features/configuracoes-entregas/services/configuracoes-entregas-mappers'
import { useI18n } from '@/src/i18n/use-i18n'

export function ConfiguracoesEntregasPage() {
  const { t } = useI18n()

  const fieldDefinitions = useMemo(
    () =>
      configuracoesEntregasFieldDefinitions.map((field) => ({
        key: field.key,
        section: field.section,
        type: (field.key === 'id_forma_entrega_padrao' ? 'lookup' : field.type === 'boolean' ? 'enum' : field.type) as 'text' | 'enum' | 'lookup',
        label: t(`configuracoes.delivery.fields.${field.key}.label`, field.key),
        helper: t(`configuracoes.delivery.fields.${field.key}.helper`, ''),
        includeEmptyOption: field.includeEmptyOption,
        lookupCollection: field.key === 'id_forma_entrega_padrao' ? 'deliveryMethods' as const : undefined,
        lookupResource: field.key === 'id_forma_entrega_padrao' ? 'formas_entrega' : undefined,
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
        key: 'freight',
        title: t('configuracoes.delivery.sections.freight.title', 'Frete'),
        description: t('configuracoes.delivery.sections.freight.description', 'CÃ¡lculo, rateio e definiÃ§Ã£o do frete aplicado aos pedidos.'),
      },
      {
        key: 'checkout',
        title: t('configuracoes.delivery.sections.checkout.title', 'Checkout'),
        description: t('configuracoes.delivery.sections.checkout.description', 'Campos obrigatÃ³rios e seleÃ§Ã£o padrÃ£o no fechamento do pedido.'),
      },
      {
        key: 'split',
        title: t('configuracoes.delivery.sections.split.title', 'Split'),
        description: t('configuracoes.delivery.sections.split.description', 'Comportamento de multi-endereÃ§o, multi-encomenda e retirada.'),
      },
    ],
    [t],
  )

  return (
    <ParameterFormPageBase
      featureKey="configuracoesEntregas"
      moduleTitle={t('configuracoes.delivery.title', 'Entregas')}
      modulePath="/configuracoes/entregas"
      moduleDescription={t('configuracoes.delivery.description', 'Configure o cÃ¡lculo de frete, a experiÃªncia de checkout e as regras de split de entregas para o tenant atual.')}
      contextTitle={t('configuracoes.delivery.contextTitle', 'Escopo')}
      contextValue={t('configuracoes.delivery.contextValue', 'ParÃ¢metros globais de entregas')}
      contextDescription={t('configuracoes.delivery.contextDescription', 'Estas preferÃªncias controlam cÃ¡lculo de frete, seleÃ§Ã£o de entrega e comportamento dos pedidos divididos no tenant ativo.')}
      loadErrorMessage={t('configuracoes.delivery.feedback.loadError', 'NÃ£o foi possÃ­vel carregar as configuraÃ§Ãµes de entregas.')}
      saveErrorMessage={t('configuracoes.delivery.feedback.saveError', 'NÃ£o foi possÃ­vel salvar as configuraÃ§Ãµes de entregas.')}
      saveSuccessMessage={t('configuracoes.delivery.feedback.saveSuccess', 'ConfiguraÃ§Ãµes de entregas salvas com sucesso.')}
      fieldDefinitions={fieldDefinitions}
      sectionOrder={sectionOrder}
      createEmptyValues={createEmptyConfiguracoesEntregasForm}
      emptyLookups={{ deliveryMethods: [] }}
      client={configuracoesEntregasClient}
    />
  )
}


