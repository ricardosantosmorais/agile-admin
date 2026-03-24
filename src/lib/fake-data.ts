export type Tenant = {
  id: string
  nome: string
  codigo: string
  status: string
}

export type AdminRecord = {
  id: string
  nome: string
  email: string
  perfil: string
  ultimoAcesso: string
  ativo: boolean
}

export type AdminFormRecord = {
  id: string
  ativo: boolean
  codigo: string
  idPerfil: string
  nome: string
  email: string
  celular: string
}

export type ClientListRecord = {
  id: string
  codigo: string
  cnpjCpf: string
  nomeRazaoSocial: string
  dataAtivacao: string
  ultimoPedido: string
  qtdPedidos: number
  bloqueado: boolean
  bloqueadoPlataforma: boolean
  ativo: boolean
}

export type ClientLinkedRow = {
  id: string
  nome: string
  detalhe: string
  padrao?: boolean
}

export type ClientFormRecord = {
  id: string
  ativo: boolean
  bloqueado: boolean
  bloqueadoPlataforma: boolean
  liberado: boolean
  codigo: string
  codigoAtivacao: string
  tipo: 'PF' | 'PJ'
  cpf: string
  cnpj: string
  nome: string
  razaoSocial: string
  nomeFantasia: string
  sexo: 'M' | 'F' | 'O'
  rg: string
  dataNascimento: string
  inscricaoEstadual: string
  isentoIe: boolean
  limiteCredito: string
  limiteDisponivel: string
  tipoCliente: string
  ramoAtividade: string
  email: string
  celular: string
  telefone: string
  observacoesBloqueio?: string
  observacoesBloqueioPlataforma?: string
  classificacao: {
    grupo: string
    rede: string
    segmento: string
    tabelaPreco: string
    filialPadrao: string
    vendedorPadrao: string
  }
  filiais: ClientLinkedRow[]
  vendedores: ClientLinkedRow[]
  formasPagamento: ClientLinkedRow[]
  condicoesPagamento: ClientLinkedRow[]
  formularios: Array<{ titulo: string; data: string; campos: Array<{ label: string; valor: string }> }>
}

export type ReportRecord = {
  id: string
  codigo: string
  grupo: string
  nome: string
  descricao: string
}

export type ConfigModule = {
  slug: string
  nome: string
  descricao: string
  campos: Array<{ label: string; valor: string }>
}

export type ShellNotification = {
  id: string
  titulo: string
  descricao: string
  data: string
  lida: boolean
}

export type ChangelogItem = {
  id: string
  titulo: string
  descricao: string
}

export type DashboardRangeKey = 'mes_atual' | 'ultimos_30_dias' | 'ultimos_7_dias'

export type DashboardSnapshot = {
  rangeLabel: string
  primaryMetrics: Array<{
    label: string
    labelKey?: string
    value: number
    variation: number
    type?: 'currency' | 'number' | 'percent'
    tone?: 'emerald' | 'sky' | 'amber' | 'rose'
    description?: string
    descriptionKey?: string
  }>
  customerMetrics: Array<{
    label: string
    labelKey?: string
    value: number
    variation: number
    type?: 'currency' | 'number' | 'percent'
  }>
  serie: Array<Record<string, unknown>>
  ticketByDay: Array<Record<string, unknown>>
  channel: Array<Record<string, unknown>>
  emitente: Array<Record<string, unknown>>
  funil: Array<Record<string, unknown>>
  monitoringAlerts: string[]
  coorte: Array<Record<string, unknown>>
  topClients: Array<{ nome: string; pedidos: number; valor: number } & Record<string, unknown>>
  topProducts: Array<{ nome: string; quantidade: number; valor: number } & Record<string, unknown>>
  payments: Array<Record<string, unknown>>
  hourlyRevenue: Array<Record<string, unknown>>
  marketingMetrics: Array<{
    label: string
    labelKey?: string
    value: number
    variation: number
    type?: 'currency' | 'number' | 'percent'
    tone?: 'emerald' | 'sky' | 'amber' | 'rose'
    descriptionKey?: string
  }>
  marketingMixExclusive: Array<Record<string, unknown>>
  marketingMixInclusive: Array<Record<string, unknown>>
  marketingTicketComparison: Array<Record<string, unknown>>
  topCoupons: Array<Record<string, unknown>>
  topPromotions: Array<Record<string, unknown>>
}

export const dashboardPresets: Array<{ id: DashboardRangeKey; label: string; days: number }> = [
  { id: 'mes_atual', label: 'Mês atual', days: 30 },
  { id: 'ultimos_30_dias', label: 'Últimos 30 dias', days: 30 },
  { id: 'ultimos_7_dias', label: 'Últimos 7 dias', days: 7 },
]

export const fakeUser = {
  id: 'usr-001',
  nome: 'Ricardo Oliveira',
  email: 'ricardo@empresa.com.br',
  cargo: 'Diretor de Produto',
  avatarFallback: 'RO',
  ultimoAcesso: '16/03/2026 08:42',
}

export const fakeTenants: Tenant[] = [
  { id: 't-001', nome: 'Casa Matriz Agro', codigo: 'MATRIZ', status: 'Operando' },
  { id: 't-002', nome: 'Moda Horizonte', codigo: 'MODA', status: 'Homologação' },
  { id: 't-003', nome: 'Constru Forte', codigo: 'CFORTE', status: 'Atenção' },
]

export const fakeNotifications: ShellNotification[] = [
  {
    id: 'ntf-001',
    titulo: 'Integração de estoque com atraso',
    descricao: 'A sincronização do serviço ERP principal está há 17 minutos sem responder.',
    data: 'Hoje, 08:15',
    lida: false,
  },
  {
    id: 'ntf-002',
    titulo: 'Campanha SAFRA10 encerrada',
    descricao: 'A campanha atingiu o limite orçamentário e foi pausada automaticamente.',
    data: 'Hoje, 07:48',
    lida: false,
  },
  {
    id: 'ntf-003',
    titulo: 'Novo acesso administrativo',
    descricao: 'Usuário Bruno Prado acessou o painel pela filial Fortaleza.',
    data: 'Ontem, 18:22',
    lida: true,
  },
]

export const fakeChangelog: ChangelogItem[] = [
  {
    id: 'chg-001',
    titulo: 'Melhoria na visão do dashboard',
    descricao: 'Inclui filtros de período, exportação do painel e reorganização visual dos indicadores.',
  },
  {
    id: 'chg-002',
    titulo: 'Novo shell com menu agrupado',
    descricao: 'Agora o menu segue a estrutura do admin atual, com submenus e modo compacto.',
  },
]

export const fakePerfis = [
  { id: 'pfl-001', nome: 'Master' },
  { id: 'pfl-002', nome: 'Comercial' },
  { id: 'pfl-003', nome: 'Marketing' },
  { id: 'pfl-004', nome: 'Operações' },
  { id: 'pfl-005', nome: 'Financeiro' },
]

export const fakeAdmins: AdminRecord[] = [
  { id: 'adm-001', nome: 'Aline Monteiro', email: 'aline@empresa.com.br', perfil: 'Master', ultimoAcesso: '16/03/2026 08:42', ativo: true },
  { id: 'adm-002', nome: 'Bruno Prado', email: 'bruno@empresa.com.br', perfil: 'Comercial', ultimoAcesso: '16/03/2026 07:19', ativo: true },
  { id: 'adm-003', nome: 'Camila Sales', email: 'camila@empresa.com.br', perfil: 'Marketing', ultimoAcesso: '15/03/2026 18:22', ativo: false },
  { id: 'adm-004', nome: 'Diego Freitas', email: 'diego@empresa.com.br', perfil: 'Operações', ultimoAcesso: '15/03/2026 16:03', ativo: true },
  { id: 'adm-005', nome: 'Elaine Costa', email: 'elaine@empresa.com.br', perfil: 'Financeiro', ultimoAcesso: '15/03/2026 10:17', ativo: true },
]

export const fakeAdminForms: AdminFormRecord[] = [
  { id: 'adm-001', ativo: true, codigo: 'ADM-001', idPerfil: 'pfl-001', nome: 'Aline Monteiro', email: 'aline@empresa.com.br', celular: '(85) 99991-0001' },
  { id: 'adm-002', ativo: true, codigo: 'ADM-002', idPerfil: 'pfl-002', nome: 'Bruno Prado', email: 'bruno@empresa.com.br', celular: '(85) 99991-0002' },
  { id: 'adm-003', ativo: false, codigo: 'ADM-003', idPerfil: 'pfl-003', nome: 'Camila Sales', email: 'camila@empresa.com.br', celular: '(85) 99991-0003' },
  { id: 'adm-004', ativo: true, codigo: 'ADM-004', idPerfil: 'pfl-004', nome: 'Diego Freitas', email: 'diego@empresa.com.br', celular: '(85) 99991-0004' },
  { id: 'adm-005', ativo: true, codigo: 'ADM-005', idPerfil: 'pfl-005', nome: 'Elaine Costa', email: 'elaine@empresa.com.br', celular: '(85) 99991-0005' },
]

export const fakeClients: ClientListRecord[] = [
  { id: 'cli-001', codigo: '000145', cnpjCpf: '12.345.678/0001-90', nomeRazaoSocial: 'Mercantil União LTDA', dataAtivacao: '2025-03-10', ultimoPedido: '2026-03-14', qtdPedidos: 28, bloqueado: false, bloqueadoPlataforma: false, ativo: true },
  { id: 'cli-002', codigo: '000287', cnpjCpf: '987.654.321-00', nomeRazaoSocial: 'Marina Lopes', dataAtivacao: '2024-11-21', ultimoPedido: '2026-03-12', qtdPedidos: 9, bloqueado: true, bloqueadoPlataforma: false, ativo: true },
  { id: 'cli-003', codigo: '000391', cnpjCpf: '43.555.888/0001-30', nomeRazaoSocial: 'Atacado Nobre SA', dataAtivacao: '2025-07-08', ultimoPedido: '2026-02-28', qtdPedidos: 41, bloqueado: false, bloqueadoPlataforma: true, ativo: true },
  { id: 'cli-004', codigo: '000522', cnpjCpf: '221.333.444-55', nomeRazaoSocial: 'Paulo Henrique Sousa', dataAtivacao: '2026-01-16', ultimoPedido: '2026-03-01', qtdPedidos: 3, bloqueado: false, bloqueadoPlataforma: false, ativo: true },
]

export const fakeClientForms: ClientFormRecord[] = [
  {
    id: 'cli-001',
    ativo: true,
    bloqueado: false,
    bloqueadoPlataforma: false,
    liberado: true,
    codigo: '000145',
    codigoAtivacao: 'ATV-145',
    tipo: 'PJ',
    cpf: '',
    cnpj: '12.345.678/0001-90',
    nome: '',
    razaoSocial: 'Mercantil União LTDA',
    nomeFantasia: 'Mercantil União',
    sexo: 'M',
    rg: '',
    dataNascimento: '',
    inscricaoEstadual: '123456789',
    isentoIe: false,
    limiteCredito: 'R$ 80.000,00',
    limiteDisponivel: 'R$ 22.450,00',
    tipoCliente: 'R',
    ramoAtividade: 'Atacado alimentar',
    email: 'compras@mercantiluniao.com.br',
    celular: '(85) 99988-0001',
    telefone: '(85) 3333-1020',
    classificacao: {
      grupo: 'Top contas',
      rede: 'Rede Norte',
      segmento: 'Atacado',
      tabelaPreco: 'Tabela Ouro',
      filialPadrao: 'Fortaleza',
      vendedorPadrao: 'Carlos Mendes',
    },
    filiais: [
      { id: 'fil-1', nome: 'Fortaleza', detalhe: 'Tabela Ouro', padrao: true },
      { id: 'fil-2', nome: 'Maracanaú', detalhe: 'Tabela Ouro', padrao: false },
    ],
    vendedores: [
      { id: 'ven-1', nome: 'Carlos Mendes', detalhe: 'carlos@empresa.com.br', padrao: true },
      { id: 'ven-2', nome: 'Isadora Pires', detalhe: 'isadora@empresa.com.br', padrao: false },
    ],
    formasPagamento: [
      { id: 'fp-1', nome: 'PIX', detalhe: 'Filial Fortaleza' },
      { id: 'fp-2', nome: 'Boleto faturado', detalhe: 'Filial Maracanaú' },
    ],
    condicoesPagamento: [
      { id: 'cp-1', nome: '28 dias', detalhe: 'Filial Fortaleza' },
      { id: 'cp-2', nome: '42 dias', detalhe: 'Filial Maracanaú' },
    ],
    formularios: [
      {
        titulo: 'Cadastro complementar',
        data: '2026-02-20',
        campos: [
          { label: 'Canal principal', valor: 'Representante' },
          { label: 'Aceita campanha personalizada', valor: 'Sim' },
        ],
      },
    ],
  },
  {
    id: 'cli-002',
    ativo: true,
    bloqueado: true,
    bloqueadoPlataforma: false,
    liberado: false,
    codigo: '000287',
    codigoAtivacao: 'ATV-287',
    tipo: 'PF',
    cpf: '987.654.321-00',
    cnpj: '',
    nome: 'Marina Lopes',
    razaoSocial: '',
    nomeFantasia: '',
    sexo: 'F',
    rg: '2004001234',
    dataNascimento: '1990-08-15',
    inscricaoEstadual: '',
    isentoIe: true,
    limiteCredito: 'R$ 8.000,00',
    limiteDisponivel: 'R$ 1.240,00',
    tipoCliente: 'C',
    ramoAtividade: 'Consumidor final',
    email: 'marina.lopes@gmail.com',
    celular: '(85) 99988-0002',
    telefone: '(85) 3222-3300',
    observacoesBloqueio: 'Cliente bloqueado por atraso recorrente em títulos.',
    classificacao: {
      grupo: 'Recuperação',
      rede: 'Sem rede',
      segmento: 'Pessoa física',
      tabelaPreco: 'Tabela Varejo',
      filialPadrao: 'Fortaleza',
      vendedorPadrao: 'Renata Costa',
    },
    filiais: [{ id: 'fil-1', nome: 'Fortaleza', detalhe: 'Tabela Varejo', padrao: true }],
    vendedores: [{ id: 'ven-3', nome: 'Renata Costa', detalhe: 'renata@empresa.com.br', padrao: true }],
    formasPagamento: [{ id: 'fp-3', nome: 'Cartão de crédito', detalhe: 'Filial Fortaleza' }],
    condicoesPagamento: [{ id: 'cp-3', nome: 'À vista', detalhe: 'Filial Fortaleza' }],
    formularios: [],
  },
  {
    id: 'cli-003',
    ativo: true,
    bloqueado: false,
    bloqueadoPlataforma: true,
    liberado: true,
    codigo: '000391',
    codigoAtivacao: 'ATV-391',
    tipo: 'PJ',
    cpf: '',
    cnpj: '43.555.888/0001-30',
    nome: '',
    razaoSocial: 'Atacado Nobre SA',
    nomeFantasia: 'Atacado Nobre',
    sexo: 'M',
    rg: '',
    dataNascimento: '',
    inscricaoEstadual: 'ISENTO',
    isentoIe: true,
    limiteCredito: 'R$ 120.000,00',
    limiteDisponivel: 'R$ 76.900,00',
    tipoCliente: 'R',
    ramoAtividade: 'Distribuição',
    email: 'suprimentos@atacadonobre.com.br',
    celular: '(81) 99988-0003',
    telefone: '(81) 4002-8922',
    observacoesBloqueioPlataforma: 'Bloqueio aplicado pela plataforma por inconsistência cadastral.',
    classificacao: {
      grupo: 'Expansão',
      rede: 'Rede Nordeste',
      segmento: 'Distribuidor',
      tabelaPreco: 'Tabela Prata',
      filialPadrao: 'Recife',
      vendedorPadrao: 'Eduardo Lima',
    },
    filiais: [
      { id: 'fil-3', nome: 'Recife', detalhe: 'Tabela Prata', padrao: true },
      { id: 'fil-4', nome: 'Jaboatão', detalhe: 'Tabela Prata', padrao: false },
    ],
    vendedores: [{ id: 'ven-4', nome: 'Eduardo Lima', detalhe: 'eduardo@empresa.com.br', padrao: true }],
    formasPagamento: [
      { id: 'fp-4', nome: 'PIX', detalhe: 'Filial Recife' },
      { id: 'fp-5', nome: 'Depósito faturado', detalhe: 'Filial Jaboatão' },
    ],
    condicoesPagamento: [{ id: 'cp-4', nome: '21 dias', detalhe: 'Filial Recife' }],
    formularios: [
      {
        titulo: 'Compliance',
        data: '2026-03-02',
        campos: [
          { label: 'Validação societária', valor: 'Pendente' },
          { label: 'Documentos atualizados', valor: 'Não' },
        ],
      },
    ],
  },
]

export const fakeReports: ReportRecord[] = [
  { id: 'rel-001', codigo: 'COM-001', grupo: 'Comercial', nome: 'Pedidos por representante', descricao: 'Analisa volume, receita e ticket por representante.' },
  { id: 'rel-002', codigo: 'MKT-004', grupo: 'Marketing', nome: 'Receita por campanha', descricao: 'Mostra o impacto das campanhas e incentivos na receita.' },
  { id: 'rel-003', codigo: 'OPE-009', grupo: 'Operações', nome: 'Falhas de integração', descricao: 'Monitora volume de falhas por serviço e criticidade.' },
]

export const fakeConfigModules: ConfigModule[] = [
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

const tenantFactor: Record<string, number> = {
  't-001': 1,
  't-002': 0.68,
  't-003': 0.54,
}

function getRangeFactor(rangeDays: number) {
  if (rangeDays <= 7) return 0.29
  if (rangeDays <= 30) return 1.08
  if (rangeDays <= 60) return 1.32
  return 1.62
}

function scale(value: number, tenantId: string, rangeDays: number) {
  return Math.round(value * tenantFactor[tenantId] * getRangeFactor(rangeDays))
}

function scalePercent(value: number, tenantId: string, rangeDays: number) {
  const factor = tenantFactor[tenantId] * (rangeDays <= 7 ? 0.92 : 1)
  return Number((value * factor).toFixed(1))
}

export function getAdminById(id: string) {
  return fakeAdminForms.find((item) => item.id === id) ?? null
}

export function getClientById(id: string) {
  return fakeClientForms.find((item) => item.id === id) ?? null
}

export function getConfigModule(slug: string) {
  return fakeConfigModules.find((item) => item.slug === slug) ?? null
}

export function getReportById(id: string) {
  return fakeReports.find((item) => item.id === id) ?? null
}

export function getDashboardSnapshot(tenantId: string, rangeDays: number, selectedRangeLabel: string): DashboardSnapshot {
  const serieBase = [120000, 148000, 166000, 154000, 183000, 172000, 198000]
  const previousBase = [98000, 121000, 133000, 128000, 140000, 152000, 164000]
  const ticketBase = [542, 571, 603, 588, 610, 598, 625]
  const channelBase = [
    { name: 'Desktop', value: 44 },
    { name: 'Mobile', value: 31 },
    { name: 'App', value: 17 },
    { name: 'Televendas', value: 8 },
  ]
  const emitenteBase = [
    { name: 'Cliente', value: 68 },
    { name: 'Vendedor', value: 32 },
  ]
  const funilBase = [
    { name: 'Carrinho', value: 6840 },
    { name: 'Pedidos válidos', value: 4182 },
    { name: 'Faturado', value: 3920 },
  ]
  const pagamentosBase = [
    { name: 'PIX', value: 31 },
    { name: 'Cartão', value: 29 },
    { name: 'Boleto', value: 23 },
    { name: 'Depósito', value: 9 },
    { name: 'POS', value: 8 },
  ]
  const horariosBase = [8, 12, 18, 22, 31, 38, 42, 45, 41, 36, 28, 22]

  return {
    rangeLabel: selectedRangeLabel,
    primaryMetrics: [
      { label: 'Total de vendas', labelKey: 'dashboard.metricLabels.totalVendas', value: scale(2480000, tenantId, rangeDays), variation: 12.4, type: 'currency' as const, tone: 'emerald' as const, description: 'Receita total dos pedidos válidos no período selecionado.', descriptionKey: 'dashboard.metricDescriptions.totalVendas' },
      { label: 'Número de pedidos', labelKey: 'dashboard.metricLabels.numeroPedidos', value: scale(4182, tenantId, rangeDays), variation: 8.1, type: 'number' as const, tone: 'sky' as const, description: 'Quantidade de pedidos válidos no período selecionado.', descriptionKey: 'dashboard.metricDescriptions.numeroPedidos' },
      { label: 'Ticket médio', labelKey: 'dashboard.metricLabels.ticketMedio', value: scale(593, tenantId, rangeDays), variation: 3.6, type: 'currency' as const, tone: 'amber' as const, description: 'Valor médio por pedido válido no período selecionado.', descriptionKey: 'dashboard.metricDescriptions.ticketMedio' },
      { label: 'Taxa de conversão', labelKey: 'dashboard.metricLabels.taxaConversao', value: scalePercent(3.94, tenantId, rangeDays), variation: -0.2, type: 'percent' as const, tone: 'rose' as const, description: 'Percentual de pedidos válidos sobre a base de intenção de compra.', descriptionKey: 'dashboard.metricDescriptions.taxaConversao' },
    ],
    customerMetrics: [
      { label: 'Novos clientes', labelKey: 'dashboard.metricLabels.novosClientes', value: scale(134, tenantId, rangeDays), variation: 9.2 },
      { label: 'Clientes ativos', labelKey: 'dashboard.metricLabels.clientesAtivos', value: scale(1284, tenantId, rangeDays), variation: 4.8 },
      { label: 'Taxa de recompra', labelKey: 'dashboard.metricLabels.taxaRecompra', value: scalePercent(34.7, tenantId, rangeDays), variation: 2.1, type: 'percent' as const },
      { label: 'LTV médio', labelKey: 'dashboard.metricLabels.ltvMedio', value: scale(1824, tenantId, rangeDays), variation: 6.3, type: 'currency' as const },
    ],
    serie: serieBase.map((value, index) => ({ dia: `${(index + 1) * 4}`.padStart(2, '0'), atual: scale(value, tenantId, rangeDays), anterior: scale(previousBase[index], tenantId, rangeDays) })),
    ticketByDay: ticketBase.map((value, index) => ({ dia: `${(index + 1) * 4}`.padStart(2, '0'), valor: scale(value, tenantId, rangeDays) })),
    channel: channelBase,
    emitente: emitenteBase,
    funil: funilBase.map((item) => ({ ...item, value: scale(item.value, tenantId, rangeDays) })),
    monitoringAlerts: [
      'Recompra em 30 dias caiu nos clientes de ticket acima de R$ 800.',
      '3 integrações de estoque sem sincronização nas últimas 2 horas.',
      'Horário comercial concentrou 76% da receita do período.',
    ],
    coorte: [
      { janela: '30 dias', taxa: scalePercent(22.4, tenantId, rangeDays), clientes: scale(182, tenantId, rangeDays) },
      { janela: '60 dias', taxa: scalePercent(28.8, tenantId, rangeDays), clientes: scale(234, tenantId, rangeDays) },
      { janela: '90 dias', taxa: scalePercent(34.2, tenantId, rangeDays), clientes: scale(278, tenantId, rangeDays) },
    ],
    topClients: [
      { nome: 'Mercantil União', pedidos: scale(28, tenantId, rangeDays), valor: scale(248000, tenantId, rangeDays) },
      { nome: 'Atacado Nobre', pedidos: scale(22, tenantId, rangeDays), valor: scale(189000, tenantId, rangeDays) },
      { nome: 'Loja Horizonte', pedidos: scale(14, tenantId, rangeDays), valor: scale(98000, tenantId, rangeDays) },
    ],
    topProducts: [
      { nome: 'Óleo Premium 900ml', quantidade: scale(680, tenantId, rangeDays), valor: scale(124000, tenantId, rangeDays) },
      { nome: 'Mix Grãos Seleção', quantidade: scale(492, tenantId, rangeDays), valor: scale(101000, tenantId, rangeDays) },
      { nome: 'Linha Festa Gourmet', quantidade: scale(314, tenantId, rangeDays), valor: scale(82000, tenantId, rangeDays) },
    ],
    payments: pagamentosBase,
    hourlyRevenue: horariosBase.map((value, index) => ({ hora: `${String(index + 8).padStart(2, '0')}h`, valor: scale(value * 1000, tenantId, rangeDays) })),
    marketingMetrics: [
      { label: 'Pedidos incentivados', labelKey: 'dashboard.metricLabels.pedidosIncentivados', value: scale(812000, tenantId, rangeDays), variation: 18.2, type: 'currency' as const, tone: 'emerald' as const, descriptionKey: 'dashboard.metricDescriptions.previousPeriod' },
      { label: 'Itens incentivados', labelKey: 'dashboard.metricLabels.itensIncentivados', value: scale(344000, tenantId, rangeDays), variation: 14.5, type: 'currency' as const, tone: 'sky' as const, descriptionKey: 'dashboard.metricDescriptions.previousPeriod' },
      { label: 'Qtd. pedidos com incentivo', labelKey: 'dashboard.metricLabels.qtdPedidosComIncentivo', value: scale(972, tenantId, rangeDays), variation: 11.8, type: 'number' as const, tone: 'amber' as const, descriptionKey: 'dashboard.metricDescriptions.previousPeriod' },
      { label: '% da receita com incentivo', labelKey: 'dashboard.metricLabels.receitaComIncentivo', value: scalePercent(22.8, tenantId, rangeDays), variation: 3.4, type: 'percent' as const, tone: 'rose' as const, descriptionKey: 'dashboard.metricDescriptions.previousPeriod' },
    ],
    marketingMixExclusive: [
      { name: 'Sem incentivo', value: 46 },
      { name: 'Cupom', value: 18 },
      { name: 'Promoção', value: 14 },
      { name: 'Campanha', value: 11 },
      { name: 'Brinde', value: 7 },
      { name: 'Overlap', value: 4 },
    ],
    marketingMixInclusive: [
      { name: 'Cupom manual', value: scale(94000, tenantId, rangeDays) },
      { name: 'Cupom automático', value: scale(81000, tenantId, rangeDays) },
      { name: 'Promoção', value: scale(103000, tenantId, rangeDays) },
      { name: 'Campanha', value: scale(72000, tenantId, rangeDays) },
      { name: 'Brinde', value: scale(26000, tenantId, rangeDays) },
      { name: 'Precificador', value: scale(41000, tenantId, rangeDays) },
    ],
    marketingTicketComparison: [
      { name: 'Com incentivo', value: scale(684, tenantId, rangeDays) },
      { name: 'Sem incentivo', value: scale(558, tenantId, rangeDays) },
    ],
    topCoupons: [
      { nome: 'SAFRA10', pedidos: scale(122, tenantId, rangeDays), receita: scale(92000, tenantId, rangeDays) },
      { nome: 'MERCADO5', pedidos: scale(88, tenantId, rangeDays), receita: scale(64000, tenantId, rangeDays) },
      { nome: 'APP15', pedidos: scale(54, tenantId, rangeDays), receita: scale(32000, tenantId, rangeDays) },
    ],
    topPromotions: [
      { nome: 'Leve 3 Pague 2', pedidos: scale(214, tenantId, rangeDays), receita: scale(111000, tenantId, rangeDays) },
      { nome: 'Festival do Atacado', pedidos: scale(156, tenantId, rangeDays), receita: scale(87000, tenantId, rangeDays) },
      { nome: 'Brinde de Verão', pedidos: scale(82, tenantId, rangeDays), receita: scale(43000, tenantId, rangeDays) },
    ],
  }
}
