'use client'

import { useMemo } from 'react'
import { ParameterFormPageBase } from '@/src/components/form-page/parameter-form-page-base'
import { configuracoesPrecosClient } from '@/src/features/configuracoes-precos/services/configuracoes-precos-client'
import { createEmptyConfiguracoesPrecosForm, getConfiguracoesPrecosFieldDefinitions } from '@/src/features/configuracoes-precos/services/configuracoes-precos-mappers'
import { useI18n } from '@/src/i18n/use-i18n'

export function ConfiguracoesPrecosPage() {
  const { t } = useI18n()
  const fieldDefinitions = useMemo(() => getConfiguracoesPrecosFieldDefinitions(t), [t])

  const sectionOrder = useMemo(
    () => [
      {
        key: 'taxes',
        title: t('configuracoes.pricing.sections.taxes.title', 'Tributos'),
        description: t('configuracoes.pricing.sections.taxes.description', 'Regras de cálculo fiscal e precisão de tributos.'),
      },
      {
        key: 'rounding',
        title: t('configuracoes.pricing.sections.rounding.title', 'Arredondamento'),
        description: t('configuracoes.pricing.sections.rounding.description', 'Precisão e modo de arredondamento aplicados na plataforma.'),
      },
      {
        key: 'defaults',
        title: t('configuracoes.pricing.sections.defaults.title', 'Padrões'),
        description: t('configuracoes.pricing.sections.defaults.description', 'Tabelas, formas e condições usadas como referência.'),
      },
    ],
    [t],
  )

  return (
    <ParameterFormPageBase
      featureKey="configuracoesPrecos"
      moduleTitle={t('configuracoes.pricing.title', 'Preços')}
      modulePath="/configuracoes/precos"
      moduleDescription={t('configuracoes.pricing.description', 'Centralize regras de tributos, arredondamento e parâmetros padrão da precificação.')}
      contextTitle={t('configuracoes.pricing.contextTitle', 'Escopo')}
      contextValue={t('configuracoes.pricing.contextValue', 'Parâmetros de preços e tributos')}
      contextDescription={t('configuracoes.pricing.contextDescription', 'Essas definições influenciam cálculo de tributos, arredondamento e tabelas padrão usadas na precificação.')}
      loadErrorMessage={t('configuracoes.pricing.feedback.loadError', 'Não foi possível carregar as configurações de preços.')}
      saveErrorMessage={t('configuracoes.pricing.feedback.saveError', 'Não foi possível salvar as configurações de preços.')}
      saveSuccessMessage={t('configuracoes.pricing.feedback.saveSuccess', 'Configurações de preços salvas com sucesso.')}
      fieldDefinitions={fieldDefinitions}
      sectionOrder={sectionOrder}
      createEmptyValues={createEmptyConfiguracoesPrecosForm}
      emptyLookups={{ paymentMethods: [], paymentConditions: [], priceTables: [] }}
      client={configuracoesPrecosClient}
    />
  )
}



