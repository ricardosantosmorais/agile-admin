'use client'

import { useMemo } from 'react'
import { configuracoesGeralClient } from '@/src/features/configuracoes-geral/services/configuracoes-geral-client'
import { mapConfiguracoesGeralFieldsToBaseDefinitions } from '@/src/features/configuracoes-geral/services/configuracoes-geral-mappers'
import { ParameterFormPageBase } from '@/src/components/form-page/parameter-form-page-base'
import type { ConfiguracoesGeralRecord } from '@/src/features/configuracoes-geral/types/configuracoes-geral'
import { useI18n } from '@/src/i18n/use-i18n'

type GeralSaveContext = {
  companyId: string
  fields: ConfiguracoesGeralRecord['fields']
  fieldDefinitions: ReturnType<typeof mapConfiguracoesGeralFieldsToBaseDefinitions>
}

type GeralLookups = Record<string, never[]>

function createSectionOrder(t: ReturnType<typeof useI18n>['t']) {
  return [
    {
      key: 'general',
      title: t('configuracoes.general.parametersTitle', 'ParÃ¢metros editÃ¡veis'),
      description: t(
        'configuracoes.general.parametersDescription',
        'Os campos abaixo vÃªm do cadastro de configuraÃ§Ãµes da empresa e respeitam a ordem e o tipo definidos no legado.',
      ),
    },
  ]
}

function createPageClient(t: ReturnType<typeof useI18n>['t']) {
  return {
    async get() {
      const result = await configuracoesGeralClient.get()
      return {
        values: result.values,
        metadata: result.metadata,
        lookups: {},
        context: {
          companyId: result.company.id,
          fields: result.fields,
          fieldDefinitions: mapConfiguracoesGeralFieldsToBaseDefinitions(result.fields),
        } satisfies GeralSaveContext,
      }
    },
    async save(
      initialValues: ConfiguracoesGeralRecord['values'],
      currentValues: ConfiguracoesGeralRecord['values'],
      context: GeralSaveContext | undefined,
    ) {
      if (!context?.companyId) {
        throw new Error(t('configuracoes.general.feedback.loadError', 'NÃ£o foi possÃ­vel carregar as configuraÃ§Ãµes gerais.'))
      }

      return configuracoesGeralClient.save(context.fields, initialValues, currentValues, context.companyId)
    },
  }
}

export function ConfiguracoesGeralPage() {
  const { t } = useI18n()
  const sectionOrder = useMemo(() => createSectionOrder(t), [t])
  const client = useMemo(() => createPageClient(t), [t])

  return (
    <ParameterFormPageBase<ConfiguracoesGeralRecord['values'], GeralLookups, GeralSaveContext>
      featureKey="configuracoesGeral"
      moduleTitle={t('configuracoes.general.title', 'Geral')}
      modulePath="/configuracoes/geral"
      moduleDescription={t('configuracoes.general.description', 'Gerencie os parÃ¢metros gerais do tenant e os dados estruturais usados pelo admin e pela loja.')}
      contextTitle={t('configuracoes.general.contextTitle', 'Escopo')}
      contextValue={t('configuracoes.general.contextValue', 'ParÃ¢metros gerais do tenant')}
      contextDescription={t(
        'configuracoes.general.contextDescription',
        'O schema desta tela Ã© controlado por configuraÃ§Ãµes editÃ¡veis do painel legado e, por isso, os campos podem variar entre empresas e templates.',
      )}
      loadErrorMessage={t('configuracoes.general.feedback.loadError', 'NÃ£o foi possÃ­vel carregar as configuraÃ§Ãµes gerais.')}
      saveErrorMessage={t('configuracoes.general.feedback.saveError', 'NÃ£o foi possÃ­vel salvar as configuraÃ§Ãµes gerais.')}
      saveSuccessMessage={t('configuracoes.general.feedback.saveSuccess', 'ConfiguraÃ§Ãµes gerais salvas com sucesso.')}
      fieldDefinitions={[]}
      resolveFieldDefinitions={(context) => context?.fieldDefinitions ?? []}
      sectionOrder={sectionOrder}
      createEmptyValues={() => ({})}
      emptyLookups={{}}
      client={client}
    />
  )
}


