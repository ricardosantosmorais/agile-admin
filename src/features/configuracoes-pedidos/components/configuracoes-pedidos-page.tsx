'use client'

import { useMemo } from 'react'
import { ParameterFormPageBase } from '@/src/components/form-page/parameter-form-page-base'
import { configuracoesPedidosClient } from '@/src/features/configuracoes-pedidos/services/configuracoes-pedidos-client'
import { createEmptyConfiguracoesPedidosForm, getConfiguracoesPedidosFieldDefinitions } from '@/src/features/configuracoes-pedidos/services/configuracoes-pedidos-mappers'
import { useI18n } from '@/src/i18n/use-i18n'

export function ConfiguracoesPedidosPage() {
  const { t } = useI18n()
  const fieldDefinitions = useMemo(() => getConfiguracoesPedidosFieldDefinitions(t), [t])

  const sectionOrder = useMemo(
    () => [
      {
        key: 'checkout',
        title: t('configuracoes.orders.sections.checkout.title', 'Checkout'),
        description: t('configuracoes.orders.sections.checkout.description', 'Regras que impactam o fluxo principal de compra.'),
      },
      {
        key: 'payment',
        title: t('configuracoes.orders.sections.payment.title', 'Pagamento'),
        description: t('configuracoes.orders.sections.payment.description', 'Parâmetros de pagamento e internalização.'),
      },
      {
        key: 'split',
        title: t('configuracoes.orders.sections.split.title', 'Split e encomenda'),
        description: t('configuracoes.orders.sections.split.description', 'Regras de quebra e composição de pedidos.'),
      },
      {
        key: 'experience',
        title: t('configuracoes.orders.sections.experience.title', 'Experiência'),
        description: t('configuracoes.orders.sections.experience.description', 'Mensagens, observações e visibilidade de informações.'),
      },
    ],
    [t],
  )

  return (
    <ParameterFormPageBase
      featureKey="configuracoesPedidos"
      moduleTitle={t('configuracoes.orders.title', 'Pedidos')}
      modulePath="/configuracoes/pedidos"
      moduleDescription={t('configuracoes.orders.description', 'Defina regras operacionais do checkout, divisão de pedidos, pagamentos e experiência de compra.')}
      contextTitle={t('configuracoes.orders.contextTitle', 'Escopo')}
      contextValue={t('configuracoes.orders.contextValue', 'Parâmetros operacionais de pedidos')}
      contextDescription={t('configuracoes.orders.contextDescription', 'Essas definições controlam o comportamento padrão do checkout, dos splits e das mensagens exibidas ao usuário.')}
      loadErrorMessage={t('configuracoes.orders.feedback.loadError', 'Não foi possível carregar as configurações de pedidos.')}
      saveErrorMessage={t('configuracoes.orders.feedback.saveError', 'Não foi possível salvar as configurações de pedidos.')}
      saveSuccessMessage={t('configuracoes.orders.feedback.saveSuccess', 'Configurações de pedidos salvas com sucesso.')}
      fieldDefinitions={fieldDefinitions}
      sectionOrder={sectionOrder}
      createEmptyValues={createEmptyConfiguracoesPedidosForm}
      emptyLookups={{}}
      client={configuracoesPedidosClient}
    />
  )
}



