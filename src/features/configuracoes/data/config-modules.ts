export type ConfigModuleField = {
  label: string
  valor: string
}

export type ConfigModule = {
  slug: string
  nome: string
  descricao: string
  campos: ConfigModuleField[]
}

export const configModules: ConfigModule[] = [
  {
    slug: 'inicio',
    nome: 'Configurações de início',
    descricao: 'Preferências do dashboard, atalhos e apresentação inicial do tenant.',
    campos: [
      { label: 'Tela inicial', valor: 'Dashboard v2' },
      { label: 'Período padrão', valor: 'Mês atual' },
      { label: 'Resumo executivo', valor: 'Ativo' },
    ],
  },
  {
    slug: 'geral',
    nome: 'Configurações gerais',
    descricao: 'Parâmetros gerais do tenant e comportamento padrão do admin.',
    campos: [
      { label: 'Tema operacional', valor: 'Claro com alto contraste' },
      { label: 'Idioma', valor: 'Português (Brasil)' },
      { label: 'Fuso horário', valor: 'America/Fortaleza' },
    ],
  },
  {
    slug: 'clientes',
    nome: 'Configurações de clientes',
    descricao: 'Regras de ativação, bloqueio e validações da base de clientes.',
    campos: [
      { label: 'Bloqueio automático', valor: 'Ativo após 3 títulos vencidos' },
      { label: 'Liberação padrão', valor: 'Sob aprovação comercial' },
      { label: 'Cadastro simplificado PF', valor: 'Ativo' },
    ],
  },
  {
    slug: 'entregas',
    nome: 'Configurações de entregas',
    descricao: 'Parâmetros de frete, checkout e comportamento de split para as entregas do tenant.',
    campos: [
      { label: 'Cálculo de frete', valor: 'Ativo' },
      { label: 'Forma padrão', valor: 'Entrega expressa' },
      { label: 'Múltiplos endereços', valor: 'Ativo' },
    ],
  },
  {
    slug: 'layout',
    nome: 'Configurações de layout',
    descricao: 'Aparência, identidade visual e blocos do painel administrativo.',
    campos: [
      { label: 'Cabeçalho fixo', valor: 'Ativo' },
      { label: 'Sidebar compacta', valor: 'Inativa' },
      { label: 'Blocos promocionais', valor: 'Ocultos' },
    ],
  },
]
