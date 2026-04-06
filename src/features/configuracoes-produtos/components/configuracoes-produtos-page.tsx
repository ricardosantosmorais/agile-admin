'use client'

import { useMemo } from 'react'
import { ParameterFormPageBase } from '@/src/components/form-page/parameter-form-page-base'
import { configuracoesProdutosClient } from '@/src/features/configuracoes-produtos/services/configuracoes-produtos-client'
import { createEmptyConfiguracoesProdutosForm, getConfiguracoesProdutosFieldDefinitions } from '@/src/features/configuracoes-produtos/services/configuracoes-produtos-mappers'
import { useI18n } from '@/src/i18n/use-i18n'

export function ConfiguracoesProdutosPage() {
  const { t } = useI18n()
  const fieldDefinitions = useMemo(() => getConfiguracoesProdutosFieldDefinitions(t), [t])

  const sectionOrder = useMemo(
    () => [
      {
        key: 'catalog',
        title: t('configuracoes.products.sections.catalog.title', 'Catálogo'),
        description: t('configuracoes.products.sections.catalog.description', 'Visibilidade geral, layout e regras de embalagem.'),
      },
      {
        key: 'availability',
        title: t('configuracoes.products.sections.availability.title', 'Disponibilidade'),
        description: t('configuracoes.products.sections.availability.description', 'Exibição de estoque, preços e comportamento de compra.'),
      },
      {
        key: 'search',
        title: t('configuracoes.products.sections.search.title', 'Busca'),
        description: t('configuracoes.products.sections.search.description', 'Mecanismo e precisão usados na pesquisa de produtos.'),
      },
    ],
    [t],
  )

  return (
    <ParameterFormPageBase
      featureKey="configuracoesProdutos"
      moduleTitle={t('configuracoes.products.title', 'Produtos')}
      modulePath="/configuracoes/produtos"
      moduleDescription={t('configuracoes.products.description', 'Controle a exposição de produtos, estoques, busca e regras de compra da loja.')}
      contextTitle={t('configuracoes.products.contextTitle', 'Escopo')}
      contextValue={t('configuracoes.products.contextValue', 'Parâmetros de catálogo e busca')}
      contextDescription={t('configuracoes.products.contextDescription', 'Essas definições impactam vitrine, busca, exibição de estoque e opções de compra na loja.')}
      loadErrorMessage={t('configuracoes.products.feedback.loadError', 'Não foi possível carregar as configurações de produtos.')}
      saveErrorMessage={t('configuracoes.products.feedback.saveError', 'Não foi possível salvar as configurações de produtos.')}
      saveSuccessMessage={t('configuracoes.products.feedback.saveSuccess', 'Configurações de produtos salvas com sucesso.')}
      fieldDefinitions={fieldDefinitions}
      sectionOrder={sectionOrder}
      createEmptyValues={createEmptyConfiguracoesProdutosForm}
      emptyLookups={{}}
      client={configuracoesProdutosClient}
    />
  )
}



