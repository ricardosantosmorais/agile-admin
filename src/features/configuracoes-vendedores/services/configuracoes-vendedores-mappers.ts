import type {
  ConfiguracoesVendedoresFieldDefinition,
  ConfiguracoesVendedoresFieldKey,
  ConfiguracoesVendedoresFormValues,
  ConfiguracoesVendedoresRecord,
  ConfiguracoesVendedoresScheduleDay,
} from '@/src/features/configuracoes-vendedores/types/configuracoes-vendedores'

type ApiRecord = Record<string, unknown>
type Translate = (key: string, fallback: string) => string

function asRecord(value: unknown): ApiRecord {
  return typeof value === 'object' && value !== null ? (value as ApiRecord) : {}
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : []
}

function toStringValue(value: unknown) {
  return String(value ?? '').trim()
}

export function getConfiguracoesVendedoresFieldDefinitions(t: Translate): ConfiguracoesVendedoresFieldDefinition[] {
  const yesNoOptions = [
    { value: '1', label: t('common.yes', 'Sim') },
    { value: '0', label: t('common.no', 'Não') },
  ] as const

  const personOptions = [
    { value: 'PF', label: t('configuracoes.sellers.options.person.pfOnly', 'Apenas pessoa física') },
    { value: 'PJ', label: t('configuracoes.sellers.options.person.pjOnly', 'Apenas pessoa jurídica') },
    { value: 'PF,PJ', label: t('configuracoes.sellers.options.person.both', 'Pessoa física e pessoa jurídica') },
  ] as const

  return [
    { key: 'associa_vendedor_cliente', section: 'access', type: 'enum', label: t('configuracoes.sellers.fields.associa_vendedor_cliente.label', 'Associa vendedor aos clientes'), helper: t('configuracoes.sellers.fields.associa_vendedor_cliente.helper', 'Associa o vendedor aos novos clientes cadastrados.'), options: [...yesNoOptions] },
    { key: 'permite_acesso_vendedor', section: 'access', type: 'enum', label: t('configuracoes.sellers.fields.permite_acesso_vendedor.label', 'Permite acesso'), helper: t('configuracoes.sellers.fields.permite_acesso_vendedor.helper', 'Indica se permite acesso de vendedores.'), options: [...yesNoOptions] },
    { key: 'menu_acesso_vendedor', section: 'access', type: 'enum', label: t('configuracoes.sellers.fields.menu_acesso_vendedor.label', 'Menu de acesso'), helper: t('configuracoes.sellers.fields.menu_acesso_vendedor.helper', 'Habilita o menu de acesso de vendedores.'), options: [...yesNoOptions] },
    { key: 'forma_ativacao_vendedor', section: 'access', type: 'enum', label: t('configuracoes.sellers.fields.forma_ativacao_vendedor.label', 'Forma de ativação'), helper: t('configuracoes.sellers.fields.forma_ativacao_vendedor.helper', 'Define a forma de ativação para vendedores.'), options: [{ value: 'codigo', label: t('configuracoes.sellers.options.activation.code', 'Validação do código') }, { value: 'email', label: t('configuracoes.sellers.options.activation.email', 'Validação do e-mail') }, { value: 'nenhum', label: t('configuracoes.sellers.options.activation.none', 'Sem validação') }] },
    { key: 'permite_cadastro_cliente_vendedor', section: 'rules', type: 'enum', label: t('configuracoes.sellers.fields.permite_cadastro_cliente_vendedor.label', 'Permite cadastrar clientes e contatos'), helper: t('configuracoes.sellers.fields.permite_cadastro_cliente_vendedor.helper', 'Segue as regras definidas em Configurações > Clientes.'), options: [...yesNoOptions] },
    { key: 'permite_desconto_vendedor', section: 'rules', type: 'enum', label: t('configuracoes.sellers.fields.permite_desconto_vendedor.label', 'Permite desconto no pedido'), helper: t('configuracoes.sellers.fields.permite_desconto_vendedor.helper', 'Permite informar desconto no pedido sem validação de regras.'), options: [...yesNoOptions] },
    { key: 'exibe_precos_cliente', section: 'rules', type: 'enum', label: t('configuracoes.sellers.fields.exibe_precos_cliente.label', 'Exibe preços do cliente'), helper: t('configuracoes.sellers.fields.exibe_precos_cliente.helper', 'Mostra ao vendedor os preços praticados para o cliente.'), options: [...yesNoOptions] },
    { key: 'altera_carrinho_cliente', section: 'rules', type: 'enum', label: t('configuracoes.sellers.fields.altera_carrinho_cliente.label', 'Visualiza e altera carrinho do cliente'), helper: t('configuracoes.sellers.fields.altera_carrinho_cliente.helper', 'Permite ao vendedor visualizar e alterar o carrinho do cliente.'), options: [...yesNoOptions] },
    { key: 'tipo_vendedor', section: 'types', type: 'enum', label: t('configuracoes.sellers.fields.tipo_vendedor.label', 'Tipos aceitos para ativação e login'), helper: t('configuracoes.sellers.fields.tipo_vendedor.helper', 'Define quais tipos de vendedores podem ativar e acessar a área.'), options: [...personOptions] },
    { key: 'tipo_cliente', section: 'types', type: 'enum', label: t('configuracoes.sellers.fields.tipo_cliente.label', 'Tipos aceitos para cadastro'), helper: t('configuracoes.sellers.fields.tipo_cliente.helper', 'Define quais tipos de clientes podem ser cadastrados pelo vendedor.'), options: [...personOptions] },
    { key: 'tipo_vendedor_padrao', section: 'types', type: 'enum', label: t('configuracoes.sellers.fields.tipo_vendedor_padrao.label', 'Tipo padrão'), helper: t('configuracoes.sellers.fields.tipo_vendedor_padrao.helper', 'Tipo de vendedor definido como padrão.'), options: [{ value: 'PF', label: t('configuracoes.sellers.options.person.pf', 'Pessoa física') }, { value: 'PJ', label: t('configuracoes.sellers.options.person.pj', 'Pessoa jurídica') }] },
  ]
}

export function getConfiguracoesVendedoresScheduleDays(t: Translate): ConfiguracoesVendedoresScheduleDay[] {
  return [
    { dayIndex: 1, label: t('configuracoes.sellers.schedule.monday.label', 'Segunda-feira'), helper: t('configuracoes.sellers.schedule.monday.helper', 'Permissão de acesso nas segundas-feiras.'), toggleKey: 'acesso_vendedor_1', fromKey: 'acesso_vendedor_1_de', toKey: 'acesso_vendedor_1_ate' },
    { dayIndex: 2, label: t('configuracoes.sellers.schedule.tuesday.label', 'Terça-feira'), helper: t('configuracoes.sellers.schedule.tuesday.helper', 'Permissão de acesso nas terças-feiras.'), toggleKey: 'acesso_vendedor_2', fromKey: 'acesso_vendedor_2_de', toKey: 'acesso_vendedor_2_ate' },
    { dayIndex: 3, label: t('configuracoes.sellers.schedule.wednesday.label', 'Quarta-feira'), helper: t('configuracoes.sellers.schedule.wednesday.helper', 'Permissão de acesso nas quartas-feiras.'), toggleKey: 'acesso_vendedor_3', fromKey: 'acesso_vendedor_3_de', toKey: 'acesso_vendedor_3_ate' },
    { dayIndex: 4, label: t('configuracoes.sellers.schedule.thursday.label', 'Quinta-feira'), helper: t('configuracoes.sellers.schedule.thursday.helper', 'Permissão de acesso nas quintas-feiras.'), toggleKey: 'acesso_vendedor_4', fromKey: 'acesso_vendedor_4_de', toKey: 'acesso_vendedor_4_ate' },
    { dayIndex: 5, label: t('configuracoes.sellers.schedule.friday.label', 'Sexta-feira'), helper: t('configuracoes.sellers.schedule.friday.helper', 'Permissão de acesso nas sextas-feiras.'), toggleKey: 'acesso_vendedor_5', fromKey: 'acesso_vendedor_5_de', toKey: 'acesso_vendedor_5_ate' },
    { dayIndex: 6, label: t('configuracoes.sellers.schedule.saturday.label', 'Sábado'), helper: t('configuracoes.sellers.schedule.saturday.helper', 'Permissão de acesso nos sábados.'), toggleKey: 'acesso_vendedor_6', fromKey: 'acesso_vendedor_6_de', toKey: 'acesso_vendedor_6_ate' },
    { dayIndex: 0, label: t('configuracoes.sellers.schedule.sunday.label', 'Domingo'), helper: t('configuracoes.sellers.schedule.sunday.helper', 'Permissão de acesso nos domingos.'), toggleKey: 'acesso_vendedor_0', fromKey: 'acesso_vendedor_0_de', toKey: 'acesso_vendedor_0_ate' },
  ]
}

export const configuracoesVendedoresFieldDefinitions = getConfiguracoesVendedoresFieldDefinitions((_, fallback) => fallback)
export const configuracoesVendedoresScheduleDays = getConfiguracoesVendedoresScheduleDays((_, fallback) => fallback)
export const configuracoesVendedoresParameterKeys = [
  ...configuracoesVendedoresFieldDefinitions.map((field) => field.key),
  ...configuracoesVendedoresScheduleDays.flatMap((day) => [day.toggleKey, day.fromKey, day.toKey]),
]

export function createEmptyConfiguracoesVendedoresForm(): ConfiguracoesVendedoresFormValues {
  const values = {} as ConfiguracoesVendedoresFormValues

  for (const field of configuracoesVendedoresFieldDefinitions) {
    values[field.key] = ''
  }

  for (const day of configuracoesVendedoresScheduleDays) {
    values[day.toggleKey] = ''
    values[day.fromKey] = ''
    values[day.toKey] = ''
  }

  return values
}

export function normalizeConfiguracoesVendedoresRecord(payload: unknown): ConfiguracoesVendedoresRecord {
  const rows = asArray(asRecord(payload).data)
  const values = createEmptyConfiguracoesVendedoresForm()
  const metadata: ConfiguracoesVendedoresRecord['metadata'] = {}

  for (const item of rows) {
    const parameter = asRecord(item)
    const key = toStringValue(parameter.chave) as ConfiguracoesVendedoresFieldKey
    if (!(key in values)) {
      continue
    }

    values[key] = toStringValue(parameter.parametros)

    const updatedAt = toStringValue(parameter.created_at)
    const updatedBy = toStringValue(asRecord(parameter.usuario).nome)
    if (updatedAt && updatedBy) {
      metadata[key] = { updatedAt, updatedBy }
    }
  }

  return { values, metadata }
}

export function buildDirtyConfiguracoesVendedoresPayload(
  initialValues: ConfiguracoesVendedoresFormValues,
  currentValues: ConfiguracoesVendedoresFormValues,
  version = new Date().toISOString().replace('T', ' ').slice(0, 19),
) {
  const changedKeys = Object.keys(initialValues).filter((key) => {
    const typedKey = key as ConfiguracoesVendedoresFieldKey
    const initialValue = String(initialValues[typedKey] ?? '').trim()
    const currentValue = String(currentValues[typedKey] ?? '').trim()
    return initialValue !== currentValue
  }) as ConfiguracoesVendedoresFieldKey[]

  if (!changedKeys.length) {
    return []
  }

  return [
    { id_filial: null, chave: 'versao', parametros: version },
    ...changedKeys.map((key) => ({
      id_filial: null,
      chave: key,
      parametros: String(currentValues[key] ?? '').trim(),
    })),
  ]
}


