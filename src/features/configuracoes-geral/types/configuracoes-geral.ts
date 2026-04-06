export type ConfiguracoesGeralFieldOption = {
  value: string
  label: string
}

export type ConfiguracoesGeralFieldType = 'text' | 'enum'

export type ConfiguracoesGeralFieldDefinition = {
  key: string
  label: string
  description: string
  type: ConfiguracoesGeralFieldType
  options: ConfiguracoesGeralFieldOption[]
  order: number
  companyField?: 'tipo' | 'url' | 's3_bucket'
}

export type ConfiguracoesGeralFormValues = Record<string, string>

export type ConfiguracoesGeralFieldMeta = {
  updatedAt: string
  updatedBy: string
}

export type ConfiguracoesGeralCompany = {
  id: string
  codigo: string
  idTemplate: string
}

export type ConfiguracoesGeralRecord = {
  fields: ConfiguracoesGeralFieldDefinition[]
  values: ConfiguracoesGeralFormValues
  metadata: Record<string, ConfiguracoesGeralFieldMeta>
  company: ConfiguracoesGeralCompany
}
