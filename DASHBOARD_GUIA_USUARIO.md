# 📊 Dashboard Agile E-commerce - Guia Rápido do Usuário

> **Este guia responde**: De onde vêm os dados? O que significa cada gráfico e tabela?

---

## 🎯 Início Rápido

### O que é este dashboard?

Um painel que mostra **a saúde geral da plataforma Agile E-commerce** em tempo real.

- **Quem deve usar**: Gerentes, Tech Leads, Operações, Suporte
- **Atualização**: A cada 5 minutos (com cache automático)
- **Período**: Customizável (padrão = últimos 30 dias)

### Como funciona?

O dashboard carrega em **6 fases** para ser mais rápido:

```
1️⃣ RESUMO (KPIs)
    ↓
2️⃣ PLATAFORMA (Empresas e Apps)
    ↓
3️⃣ PRODUTOS (Criação de Apps)
    ↓
4️⃣ ENGAJAMENTO (Push e Notificações)
    ↓
5️⃣ OPERAÇÃO (Processos Internos)
    ↓
6️⃣ IA E GOVERNANÇA (Agente e Tools)
```

Enquanto carrega, você vê **esqueletos cinzentos** (placeholders). Cada fase é independente, então se uma falhar, as outras continuam.

---

## 📈 Explicação de Cada Seção

### 1️⃣ RESUMO EXECUTIVO

**O que é?** Os números mais importantes da plataforma em um só lugar.

**Cada card mostra:**

| Card                        | Significa                                                        | De Onde Vem                              |
| --------------------------- | ---------------------------------------------------------------- | ---------------------------------------- |
| **Empresas ativas**         | Quantas empresas estão rodando (não bloqueadas ou em manutenção) | Tabela `empresas` do banco               |
| **Empresas em produção**    | Quantas já estão em ambiente de produção real                    | Tabela `empresas`                        |
| **Empresas em homologação** | Quantas ainda estão em testes antes de ir para produção          | Tabela `empresas`                        |
| **Apps ativos**             | Apps de clientes que estão funcionando                           | Tabela `apps`                            |
| **Pushes no período**       | Notificações que foram enviadas aos clientes                     | Tabela `notificacoes_apps`               |
| **Interações push**         | Quantos clientes clicaram/abriram as notificações                | Tabela `notificacoes_apps_interacoes`    |
| **Taxa interação**          | Percentual de pessoas que interagiram com push                   | Cálculo: (cliques / enviados) × 100      |
| **Processos totais**        | Quantas tarefas internas rodaram (importação, exportação, etc)   | Tabela `processos`                       |
| **Processos com erro**      | Quantas dessas tarefas falharam                                  | Tabela `processos` com status = erro     |
| **Taxa erro processos**     | % de tarefas que falharam                                        | Cálculo: (erros / total) × 100           |
| **Execuções agente**        | Quantas vezes o agente de IA rodou                               | Tabela `agente_execucoes`                |
| **Auditorias MCP**          | Quantas ferramentas/tools o agente usou                          | Tabela `mcp_audit_log`                   |
| **Auditorias MCP erro**     | Quantas tools falharam                                           | Tabela `mcp_audit_log` com status = erro |
| **Taxa erro MCP**           | % de ferramentas que tiveram problema                            | Cálculo: (erros / total) × 100           |
| **Builds com erro**         | Apps que falharam ao ser compilados/publicados                   | Tabela `apps_logs`                       |

**💡 Dica**: Os números têm uma seta (↑ verde ou ↓ vermelho). Isso compara com o período anterior. Exemplo: "10 pushes (↑ 5 vs semana passada)".

---

### 2️⃣ PLATAFORMA (Operação e Cobertura)

**O que é?** Visão geral de como está a carteira de empresas.

#### Gráficos

**📊 Status das Empresas (Pizza)**

- Mostra quantas estão em cada estado: produção, homologação, bloqueadas, manutenção
- **Para quê?** Ver imediatamente quantas empresas temos operantes

**📊 Distribuição por Cluster (Barras)**

- Mostra em qual cluster cada empresa está rodando (DataCenter 1, 2, 3...)
- **Para quê?** Identificar se algum cluster está sobrecarregado

**📊 Distribuição por ERP (Barras)**

- Mostra qual sistema ERP cada empresa usa (SAP, Oracle, etc)
- **Para quê?** Entender complexidade de integrações

#### Tabelas

**📋 Empresas sem app**

- Lista empresas que NÃO têm aplicativo mobile publicado
- **Colunas**: Nome da empresa, Status
- **Para quê?** Saber quem precisa de app para começar
- **Ação**: Contatar gerente de conta para briefing

**📋 Empresas com problema de build/publicação**

- Lista empresas onde o app falhou ao ser compilado ou publicado na loja
- **Colunas**: Nome, Status do build
- **Para quê?** Saber quem tem app quebrado e precisa de suporte urgente
- **Ação**: Investigar erro de build e corrigir código/configuração

---

### 3️⃣ PRODUTOS (Criação de Aplicativos)

**O que é?** Histórico de apps criados e notificações enviadas.

**📈 Criação de Apps (Gráfico de Linha)**

- Mostra quantos apps novos foram criados por mês
- **Para quê?** Ver se estamos crescendo (adoção)
- **Trend**: Se a linha sobe, bom sinal. Se cai, pode indicar menos novos clientes

**📈 Notificações Publicadas (Gráfico de Linha)**

- Mostra quantas notificações foram mandadas para os apps dos clientes por mês
- **Para quê?** Volume de comunicação com usuários finais
- **Trend**: Mais notificações = mais marketing/promoção acontecendo

**📊 Status de Logs (Tabela)**

- Mostra sucessos vs erros/warnings durante publicação
- **Para quê?** Qualidade geral de builds
- **Alerta**: Se tem muitos erros aqui, investigar infraestrutura de build

---

### 4️⃣ ENGAJAMENTO (Push e Notificações)

**O que é?** Efetividade de campanhas de push enviadas.

**📈 Pushes Enviados (Gráfico de Linha)**

- Quantos pushes foram mandados por mês
- **Para quê?** Volume de campanhas

**📈 Interações com Push (Gráfico de Linha)**

- Quantas pessoas clicaram/abriram os pushes
- **Para quê?** Ver se as campanhas têm engajamento real
- **Exemplo**: Se enviamos 1.000 pushes e 100 abrem = 10% de taxa (razoável)

**📊 Tipos de Mensagens Externas (Tabela)**

- Mostra quantas foram Email, SMS, Webhook, etc
- **Para quê?** Diversificação de canais
- **Taxa de sucesso**: % de mensagens que foram entregues com sucesso

---

### 5️⃣ OPERAÇÃO (Processos Internos)

**O que é?** Tarefas internas que rodão no backend (importação, exportação, sincronização).

**📈 Processos por Mês (Gráfico de Linha)**

- Volume de processos internos executados por mês
- **Para quê?** Ver trending de uso
- **Exemplo**: Se em janeiro processamos 5.000 tarefas e em fevereiro 2.000, pode indicar:
  - Menos importações de planilhas (bom)
  - Menos sincronizações (pode ser um problema)

**📊 Status dos Processos (Pizza)**

- Proporção: quantos foram sucesso, erro, ainda pendente, em execução
- **Para quê?** Taxa geral de confiabilidade
- **Alerta**: Se mais de 10% estão com erro, algo está errado

**📊 Tipos de Processo (Barras)**

- Quais tipos mais rodão: importação, exportação, sync, etc
- **Para quê?** Entender qual funcionalidade é mais usada

**🔢 Cards de Log**

- **Logs de erro**: Quantas mensagens de erro foram geradas
- **Logs de info**: Quantas mensagens informativas foram geradas
- **Para quê?** Volume de warnings/erros durante execução

**🚨 Tabela: Alertas de Processos Falhos Recentes**

Esta é **a mais importante** para triagem.

| Coluna                | Significa                                               | Ação                         |
| --------------------- | ------------------------------------------------------- | ---------------------------- |
| **Empresa**           | Qual empresa teve o problema                            | Usar para contactar          |
| **Tipo**              | Que tipo de processo falhou (import, export, sync, etc) | Entender qual funcionalidade |
| **Status**            | Sempre "erro" aqui                                      | -                            |
| **Última ocorrência** | Quando foi o último erro deste tipo para esta empresa   | Priorizar os mais recentes   |

**💡 Como usar**:

1. Abrir dashboard
2. Rolar para "Alertas de processos falhos recentes"
3. Ver os 20 últimos erros
4. Se vir 5 erros da mesma empresa no mesmo tipo, algo crítico quebrou
5. Investigar logs detalhados naquela empresa

**Nota**: Se uma empresa teve 10 erros de "importação", a tabela mostra apenas 1 linha com a data mais recente. Isso evita poluição na tela.

---

### 6️⃣ IA E GOVERNANÇA (Agente e Tools)

**O que é?** Saúde do agente de IA e das ferramentas que ele usa.

#### IA e Governança

**📈 Execuções do Agente por Dia (Gráfico de Linha)**

- Quantas vezes o agente foi acionado cada dia
- **Para quê?** Ver adoção e crescimento de uso
- **Trend**: Linha subindo = mais pessoas usando agente

**📊 Auditoria MCP por Status (Pizza)**

- Proporção de sucesso vs erro nas execuções do agente
- **Para quê?** Taxa geral de confiabilidade do agente
- **Alerta**: Se mais de 10% com erro, há problema

#### Uso do Agente

**📊 Mensagens user vs assistant (Tabela)**

- Quantas mensagens o usuário mandou vs quantas o agente respondeu
- **Para quê?** Proporção de interação
- **Esperado**: Deve ser similar (1:1 ou próximo)

**📊 Eventos do Agente por Tipo (Tabela)**

- Tipos de eventos que o agente gera:
  - **Atualização de status**: Agent mudou de estado
  - **Heartbeat**: Agent está vivo (ping)
  - **Início/Fim de tool**: Agent começou/terminou usar uma ferramenta
  - **Mensagem do assistente**: Agent respondeu
  - **Consulta/Resultado SQL**: Agent rodou SQL
- **Para quê?** Monitorar atividades principais
- **Exemplo**: Se "consulta SQL" tem 5.000 mas "resultado SQL" tem só 1.000, muitas queries estão falhando

#### Tools e Observabilidade

**📊 Top Tools Usadas (Tabela com Latência)**

| Coluna             | Significa                                           |
| ------------------ | --------------------------------------------------- |
| **Tool**           | Nome da ferramenta (ex: "Consulta MySQL do tenant") |
| **Total**          | Quantas vezes foi usada                             |
| **Latência média** | Tempo médio que levou para executar (em ms)         |

**Exemplos reais**:

- Consulta MySQL: 2.972 usos, 139ms = está ok (rápido)
- Consulta SQL Server: 381 usos, 547ms = mais lento (500ms é alto)
- Busca em modelo de dados: 297 usos, 199ms = ok

**Para quê?**

- Identificar tools mais críticas (mais usadas)
- Detectar tools lentas (latência > 500ms é preocupante)

**🚨 Alertas de Erro ou Lentidão por Tool (Tabela)**

Lista tools que:

- Tiveram ERROS
- OU estão muito lentas (> 1 segundo)

| Coluna             | Significa                         |
| ------------------ | --------------------------------- |
| **Tool**           | Qual ferramenta está com problema |
| **Erros**          | Quantas vezes falhou              |
| **Latência média** | Tempo que levava quando rodava    |

**Exemplos reais**:

- Consulta MySQL: 495 erros, 139ms
- Inventário AWS: 15 erros, 2.416ms = muito lento

**Para quê?**

- Triage rápida: tool com mais erros está no topo
- Investigar causa:
  - Muitos erros = banco tá down? Query está ruim?
  - Latência alta = rede lenta? Query complexa?

**Ação esperada**:

1. Ver tool com mais erros
2. Investigar logs de erro detalhados
3. Escalar para time de infraestrutura se necessário

---

## 🔍 Como Usar o Filtro de Período

No topo do dashboard há **um seletor de data**.

**Opções rápidas**:

- Últimos 7 dias
- Últimos 30 dias (padrão)
- Últimos 90 dias

**Customizado**:

- Clique e escolha data inicial e final
- Dashboard recalcula todos os números

**Comparativo**:

- Se você pegar "últimos 30 dias", o sistema automaticamente pega "os 30 dias antes disso"
- Cada card mostra a variação com seta verde (↑) ou vermelha (↓)
- **Exemplo**: "Pushes: 5.000 (↑ 1.200 vs período anterior)"

---

## ⚠️ Como Ler Alertas

### Quando ver VERMELHO 🔴

- Taxa de erro acima de 10%
- Uma tool com muitos erros
- Uma empresa com múltiplos processos falhando
- Build/publicação com problema

**Ação**: Investigar causa. Pode ser:

- Problema de infraestrutura (servidor down)
- Bug no código
- Terceiro indisponível (API externa)

### Quando tudo está VERDE 🟢

- Taxa de erro abaixo de 5%
- Tools respondendo em < 500ms
- Empresas em produção
- Builds bem-sucedidos

**Ação**: Tudo ok, apenas monitorar.

### Quando apareça AMARELO 🟡

- Taxa de erro entre 5-10%
- Tool respondendo em 500-1000ms

**Ação**: Observar, não é crítico mas fique atento.

---

## 💾 Dados e Privacidade

**De onde vêm os dados?**

- Banco de dados MySQL da plataforma
- Consultas rodam a cada 5 minutos (com cache)
- Você vê dados com até 5 minutos de atraso

**Quem pode ver?**

- Qualquer usuário autenticado no Admin
- Dados agregados (sem informações pessoais de clientes finais)

**Posso exportar?**

- Feature ainda não disponível
- Roadmap: CSV e PDF em breve

---

## 🆘 Troubleshooting

### "Dashboard não carrega"

- Atualizar página (F5)
- Verificar conexão internet
- Limpar cache (Ctrl+Shift+Del)

### "Um gráfico específico fica em branco"

- Período sem dados? Tente 30 ou 90 dias
- Recarregar página
- Se persistir, contatar suporte técnico

### "Os números parecem incorretos"

1. Verificar filtro de período (está no período correto?)
2. Verificar se há timezone mismatch
3. Contatar suporte técnico com print

### "Quer dizer que a empresa tem 10 erros de importação?"

Não, a tabela de alertas agrupa. Se a mesma empresa+tipo teve 10 erros em momentos diferentes, mostra apenas a linha mais recente para não poluir a tela.

---

## 📞 Contato

**Dúvidas sobre dashboard?**

- Contatar: Tech Lead ou Time de Plataforma
- Docs completa: [docs/46-modulo-dashboard-agileecommerce.md](docs/46-modulo-dashboard-agileecommerce.md)

---

**Última atualização**: Abril 2026
**Dashboard versão**: 1.0
