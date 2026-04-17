# Dashboard Agile E-commerce - Documentação Completa

## 1. Propósito

O **Dashboard Root Agile E-commerce** é um painel executivo que centraliza métricas operacionais de toda a plataforma Agile, dividido em 6 fases lazy-loaded:

1. **Resumo** - KPIs executivos e saúde geral
2. **Plataforma** - Cobertura de empresas e aplicativos
3. **Produtos** - Notificações, pushs e engagement
4. **Engajamento** - Métricas de push e interação
5. **Operação** - Processos internos e alertas
6. **IA e Governança** - Agente e auditoria MCP

## 2. Arquitetura de Dados

### Flow Geral

```
Frontend (admin-v2-web)
    ↓
[app/api/dashboard-agileecommerce]  (POST bridge)
    ↓
Backend (api-v3)
    ↓
[DashboardAgileecommerceController] (queries complexas)
    ↓
MySQL (agileecommerce database)
    ↓
Resposta mapeada → Componente React → UI
```

### Lazy Loading

O dashboard carrega dados sequencialmente por fases para melhorar performance:

- **Fase 1 - resumo**: Carteira e KPIs executivos (~200ms)
- **Fase 2 - empresas**: Status, clusters, ERPs (~150ms)
- **Fase 3 - apps**: Publicações e builds (~200ms)
- **Fase 4 - push**: Engajamento e notificações (~150ms)
- **Fase 5 - operacao (processos)**: Processes internos (~300ms)
- **Fase 6 - ia (agent + audit)**: Agente e MCP (~250ms)

Cada fase só inicia após a anterior estar completa. Usuário vê skeleton loaders enquanto os dados carregam.

---

## 3. Seções do Dashboard

### 3.1 RESUMO EXECUTIVO (Fase 1)

**Título**: Resumo em números
**Descrição**: Visão consolidada da saúde geral da plataforma

#### Cards

| Card                        | Métrica                | Fórmula                                                 | Fonte                          | Período          |
| --------------------------- | ---------------------- | ------------------------------------------------------- | ------------------------------ | ---------------- |
| **Empresas ativas**         | `empresas_ativas`      | COUNT(status != 'bloqueada' AND status != 'manutenção') | `empresas`                     | Atual            |
| **Empresas em produção**    | `empresas_producao`    | COUNT(status = 'produção')                              | `empresas`                     | Atual            |
| **Empresas em homologação** | `empresas_homologacao` | COUNT(status = 'homologação')                           | `empresas`                     | Atual            |
| **Apps ativos**             | `apps_ativos`          | COUNT(status = 'ativo')                                 | `apps`                         | Atual            |
| **Pushes no período**       | `pushes_enviados`      | COUNT(\*) de notificações enviadas                      | `notificacoes_apps`            | Período filtrado |
| **Interações push**         | `push_interacoes`      | COUNT de cliques/aberturas                              | `notificacoes_apps_interacoes` | Período filtrado |
| **Taxa interação push**     | `taxa_interacao_push`  | (interacoes / enviados) × 100                           | Calculada                      | Período filtrado |
| **Processos totais**        | `processos_total`      | COUNT(\*) de processos executados                       | `processos`                    | Período filtrado |
| **Processos com erro**      | `processos_erro`       | COUNT(status = 'erro')                                  | `processos`                    | Período filtrado |
| **Taxa erro processos**     | `taxa_erro_processos`  | (erro / total) × 100                                    | Calculada                      | Período filtrado |
| **Execuções agente**        | `execucoes_agente`     | COUNT(\*) de execuções                                  | `agente_execucoes`             | Período filtrado |
| **Auditorias MCP**          | `auditorias_mcp`       | COUNT(\*) de eventos                                    | `mcp_audit_log`                | Período filtrado |
| **Auditorias MCP erro**     | `auditorias_mcp_erro`  | COUNT(status = 'erro')                                  | `mcp_audit_log`                | Período filtrado |
| **Taxa erro MCP**           | `taxa_erro_mcp`        | (erro / total) × 100                                    | Calculada                      | Período filtrado |
| **Builds com erro**         | `builds_com_erro`      | COUNT(status = 'error')                                 | `apps_logs`                    | Período filtrado |

**Período**: Filtrável (padrão: últimos 30 dias vs 30 dias anteriores para comparativo)

#### Comparativo

Quando selecionado período com dados anteriores, cada card mostra:

- Valor atual
- Variação em relação ao período anterior (↑ verde ou ↓ vermelho)

---

### 3.2 PLATAFORMA (Fase 2)

**Título**: Operação da plataforma e cobertura
**Descrição**: Distribuição de empresas, clusters, ERPs e apps

#### Gráficos

**1. Status das Empresas**

- **Tipo**: Gráfico de pizza
- **Métrica**: Contagem por status
- **Valores**: produção, homologação, bloqueadas, manutenção
- **Fonte**: `SELECT status, COUNT(*) FROM empresas GROUP BY status`
- **Uso**: Entender imediatamente saúde da carteira

**2. Distribuição por Cluster**

- **Tipo**: Gráfico de barras
- **Métrica**: COUNT(empresas) por cluster
- **Fonte**: `SELECT nome, COUNT(*) FROM empresas GROUP BY cluster`
- **Uso**: Identificar concentração em clusters

**3. Distribuição por ERP**

- **Tipo**: Gráfico de barras
- **Métrica**: COUNT(empresas) por tipo ERP
- **Fonte**: `SELECT erp, COUNT(*) FROM empresas GROUP BY erp`
- **Uso**: Ver quais ERPs estão integrados

#### Tabelas

**1. Empresas sem app**

- **Colunas**: Nome da empresa, Status
- **Filtro**: LEFT JOIN apps ON empresas.id = apps.id_empresa WHERE apps.id IS NULL
- **Ordem**: Recentes, TOP 10
- **Ação esperada**: Analisar por que empresa não tem app e contatar se necessário
- **Período**: Snapshot (atual)

**2. Empresas com problema de build/publicação**

- **Colunas**: Nome da empresa, Status
- **Filtro**: apps_logs WHERE status IN ('error', 'queued', 'building') + recent build attempts
- **Ordem**: Mais recentes primeiro, TOP 10
- **Ação esperada**: Investigar e corrigir processo de build
- **Período**: Filtrável (últimos 7, 30, 90 dias)

---

### 3.3 PRODUTOS (Fase 3)

**Título**: Criação de aplicativos
**Descrição**: Série histórica de apps criados e notificações publicadas

#### Gráficos

**1. Criação de Apps (série mensal)**

- **Tipo**: Gráfico de linha
- **Métrica**: COUNT(\*) de apps por mês
- **Fonte**: `SELECT DATE_FORMAT(criado_em, '%Y-%m') as mes, COUNT(*) FROM apps GROUP BY mes`
- **Uso**: Trend de crescimento/adoção
- **Período**: Últimos 12 meses

**2. Notificações Publicadas (série mensal)**

- **Tipo**: Gráfico de linha
- **Métrica**: COUNT(\*) de notificações por mês
- **Fonte**: `SELECT DATE_FORMAT(data_envio, '%Y-%m') as mes, COUNT(*) FROM notificacoes_apps GROUP BY mes`
- **Uso**: Volume de comunicação com usuários
- **Período**: Últimos 12 meses

**3. Status de Logs de Apps**

- **Tipo**: Tabela resumida
- **Colunas**: Status (success, error, warning), Count
- **Fonte**: `SELECT status, COUNT(*) FROM apps_logs GROUP BY status`
- **Uso**: Identificar tipos de erros mais frequentes
- **Período**: Snapshot

---

### 3.4 ENGAJAMENTO (Fase 4)

**Título**: Engajamento via push e notificações
**Descrição**: Efetividade de campanhas de push e mensageria

#### Gráficos

**1. Pushes Enviados (série mensal)**

- **Tipo**: Gráfico de linha
- **Métrica**: COUNT(\*) por mês
- **Fonte**: `SELECT DATE_FORMAT(data_envio, '%Y-%m') as mes, COUNT(*) FROM notificacoes_apps GROUP BY mes WHERE status = 'enviado'`
- **Uso**: Volume de pushes ao longo do tempo
- **Período**: Últimos 12 meses

**2. Interações com Push (série mensal)**

- **Tipo**: Gráfico de linha
- **Métrica**: COUNT(\*) de cliques/aberturas
- **Fonte**: `SELECT DATE_FORMAT(data_interacao, '%Y-%m') as mes, COUNT(*) FROM notificacoes_apps_interacoes GROUP BY mes`
- **Uso**: Engajamento real dos usuários
- **Período**: Últimos 12 meses

**3. Tipos de Mensagens Externas**

- **Tipo**: Tabela resumida
- **Colunas**: Tipo (email, SMS, webhook), Count, Taxa sucesso
- **Fonte**: `SELECT tipo, COUNT(*), COUNT(IF(status='sucesso', 1, NULL))/COUNT(*)*100 FROM mensagens_externas GROUP BY tipo`
- **Uso**: Qualidade e volume por canal
- **Período**: Filtrável

---

### 3.5 OPERAÇÃO (Fase 5)

**Título**: Operação interna
**Descrição**: Throughput, falhas e tipos de processos internos do admin

#### Gráficos

**1. Processos por Mês (série mensal)**

- **Tipo**: Gráfico de linha
- **Métrica**: COUNT(\*) por mês
- **Fonte**: `SELECT DATE_FORMAT(data_inicio, '%Y-%m') as mes, COUNT(*) FROM processos GROUP BY mes`
- **Uso**: Volume de processamento ao longo do tempo
- **Período**: Últimos 12 meses

**2. Status dos Processos (pizza)**

- **Tipo**: Gráfico de pizza
- **Métrica**: COUNT(\*) por status
- **Valores**: sucesso, erro, pendente, em execução
- **Fonte**: `SELECT status, COUNT(*) FROM processos WHERE data_inicio BETWEEN ? AND ? GROUP BY status`
- **Uso**: Proporção de sucesso vs falhas
- **Período**: Filtrável

**3. Tipos de Processo (barras)**

- **Tipo**: Gráfico de barras
- **Métrica**: COUNT(\*) por tipo
- **Valores**: importacao_planilha, exportar_relatorio, sync_inventario, etc
- **Fonte**: `SELECT tipo, COUNT(*) FROM processos WHERE data_inicio BETWEEN ? AND ? GROUP BY tipo`
- **Uso**: Processos mais executados
- **Período**: Filtrável

#### Cards de Log

**Logs de Erro**

- **Métrica**: COUNT(\*) de logs com level = 'erro'
- **Fonte**: `SELECT COUNT(*) FROM processos_logs WHERE level = 'erro' AND data BETWEEN ? AND ?`
- **Período**: Filtrável

**Logs de Informação**

- **Métrica**: COUNT(\*) de logs com level = 'info'
- **Fonte**: `SELECT COUNT(*) FROM processos_logs WHERE level = 'info' AND data BETWEEN ? AND ?`
- **Período**: Filtrável

#### Tabela: Alertas de Processos Falhos Recentes

- **Título**: Alertas de processos falhos recentes
- **Descrição**: Concentre aqui as últimas falhas operacionais para triagem rápida
- **Colunas**:
  - **Empresa**: Nome fantasia (JOIN com `empresas`)
  - **Tipo**: Tipo do processo (formatado com label legível)
  - **Status**: Status do processo
  - **Última ocorrência**: Data/hora do último erro
- **Filtro**:
  ```sql
  SELECT
    e.nome_fantasia as empresa_nome,
    p.tipo,
    p.status,
    MAX(p.data_inicio) as ultima_ocorrencia
  FROM processos p
  LEFT JOIN empresas e ON e.id = p.id_empresa
  WHERE p.status = 'erro' AND p.data_inicio BETWEEN ? AND ?
  GROUP BY e.id, p.tipo
  ORDER BY p.data_inicio DESC
  LIMIT 20
  ```
- **Ordem**: Mais recentes primeiro
- **Limite**: 20 registros
- **Ação esperada**: Clicar para investigar causa do erro
- **Período**: Filtrável

**Importante**: Se uma empresa tem múltiplos erros do mesmo tipo, aparece apenas 1 linha com a data mais recente.

---

### 3.6 IA E GOVERNANÇA (Fase 6)

#### 3.6.1 IA e Governança

**Título**: IA e governança
**Descrição**: Adoção do agente, eventos e saúde das tools do ambiente root

**1. Execuções do Agente por Dia (série diária)**

- **Tipo**: Gráfico de linha
- **Métrica**: COUNT(\*) por dia
- **Fonte**: `SELECT DATE(criado_em) as dia, COUNT(*) FROM agente_execucoes GROUP BY dia ORDER BY dia DESC LIMIT 30`
- **Uso**: Trend de adoção/uso do agente
- **Período**: Últimos 30 dias

**2. Auditoria MCP por Status (pizza)**

- **Tipo**: Gráfico de pizza
- **Métrica**: COUNT(\*) por status de execução
- **Valores**: sucesso, erro, timeout, cancelado
- **Fonte**: `SELECT status, COUNT(*) FROM mcp_audit_log GROUP BY status`
- **Uso**: Taxa geral de sucesso MCP
- **Período**: Filtrável

---

#### 3.6.2 Uso do Agente

**Título**: Uso do agente
**Descrição**: Papéis de mensagem e tipos de evento com leitura amigável

**1. Mensagens user vs assistant (tabela)**

- **Colunas**: Papel, Total
- **Valores**:
  - "Usuário" = 310
  - "Assistente" = 277
- **Fonte**:
  ```sql
  SELECT
    CASE papel
      WHEN 'user' THEN 'Usuário'
      WHEN 'assistant' THEN 'Assistente'
    END as papel,
    COUNT(*) as total
  FROM agente_mensagens
  WHERE data_criacao BETWEEN ? AND ?
  GROUP BY papel
  ```
- **Uso**: Entender proporção de interações
- **Período**: Filtrável

**2. Eventos do Agente por Tipo (tabela)**

- **Colunas**: Tipo de evento, Total
- **Exemplos**:
  - Atualização de status: 3.090
  - Heartbeat: 2.446
  - Início de tool: 1.117
  - Fim de tool: 1.079
  - Mensagem do assistente: 592
  - Consulta SQL: 571
  - Resultado SQL: 568
- **Fonte**:
  ```sql
  SELECT
    tipo_evento,
    COUNT(*) as total
  FROM agente_eventos
  WHERE data_criacao BETWEEN ? AND ?
  GROUP BY tipo_evento
  ORDER BY total DESC
  ```
- **Uso**: Monitorar atividades principais do agente
- **Período**: Filtrável

---

#### 3.6.3 Tools e Observabilidade

**Título**: Tools e observabilidade
**Descrição**: Uso das tools com latência média e alertas de erro ou lentidão

**1. Top Tools Usadas (tabela com latência)**

- **Colunas**: Tool, Total, Latência média
- **Exemplos**:
  - Consulta MySQL do tenant: 2.972 execuções, 139ms
  - Consulta SQL Server: 381 execuções, 547ms
  - Consulta MySQL administrativa: 370 execuções, 19ms
  - Busca no modelo de dados: 297 execuções, 199ms
  - Consulta de tabela do modelo de dados: 157 execuções, 6ms
- **Fonte**:
  ```sql
  SELECT
    tool_name,
    COUNT(*) as total,
    ROUND(AVG(duration_ms), 0) as latencia_media
  FROM mcp_audit_log
  WHERE data_criacao BETWEEN ? AND ?
  GROUP BY tool_name
  ORDER BY total DESC
  LIMIT 20
  ```
- **Ordenação**: Por volume (mais usadas primeiro)
- **Uso**: Identificar tools mais críticas
- **Período**: Filtrável

**2. Alertas de Erro ou Lentidão por Tool (tabela)**

- **Colunas**: Tool, Erros, Latência média
- **Filtro**: WHERE status = 'erro' OR duration_ms >= 1000
- **Exemplos**:
  - Consulta MySQL do tenant: 495 erros, 139ms
  - Consulta SQL Server: 50 erros, 547ms
  - Consulta MySQL administrativa: 41 erros, 19ms
  - Consulta de tabela do modelo de dados: 27 erros, 6ms
  - Inventário AWS: 15 erros, 2.416ms
  - Listagem de conversas do Gmail: 2 erros, 2.703ms
  - Leitura de métrica CloudWatch: 2 erros, 207ms
  - Consulta de relacionamentos do modelo de dados: 1 erro, 33ms
- **Fonte**:
  ```sql
  SELECT
    tool_name,
    COUNT(*) as erros,
    ROUND(AVG(duration_ms), 0) as latencia_media
  FROM mcp_audit_log
  WHERE (status = 'erro' OR duration_ms >= 1000)
    AND data_criacao BETWEEN ? AND ?
  GROUP BY tool_name
  ORDER BY erros DESC
  LIMIT 20
  ```
- **Ordenação**: Por erros (mais problema primeiro)
- **Uso**: Triage rápida de tools com problemas
- **Período**: Filtrável

---

## 4. Período de Dados

### Seletor de Período

O dashboard permite filtrar por período customizado (data de início e fim).

**Padrões**:

- Últimos 7 dias
- Últimos 30 dias (padrão ao carregar)
- Últimos 90 dias
- Mês atual
- Customizado

**Comparativo**:
Quando há período anterior disponível, o dashboard calcula variações automáticas nos cards executivos.

---

## 5. Performance e Cache

### Cache Backend

- **TTL padrão**: 5 minutos
- **Bypass cache**: Flag `forceRefresh=true` em requisição
- **Hit cache**: Indicado em `meta.cache_hit`

### Lazy Loading Frontend

Cada fase carrega apenas quando o usuário:

1. Atinge a seção no scroll (IntersectionObserver)
2. Ou clica manualmente para pedir dados

Isso reduz carga inicial do dashboard e melhora perceived performance.

---

## 6. Tratamento de Erros

### Quando uma Fase Falha

- Seção mostra mensagem de erro
- Usuário pode clicar em "Tentar novamente"
- Outras fases continuam carregando normalmente

### Dados Vazios

- Quando não há dados para o período, tabelas mostram "Sem dados para este período"
- Gráficos aparecem vazios

---

## 7. Troubleshooting

### "O dashboard carrega muito lentamente"

1. **Verificar cache**: Usar `forceRefresh=true` para descartar cache
2. **Verificar período**: Períodos maiores (ex: 1 ano) podem ser lentos
3. **Verificar índices**: No backend, validar índices em:
   - `processos(data_inicio, status)`
   - `agente_execucoes(criado_em)`
   - `mcp_audit_log(data_criacao, status, tool_name)`
   - `empresas(status)`

### "Uma seção específica não carrega"

1. Verificar se a fase anterior completou
2. Abrir DevTools → Network, observar requisição ao `/api/dashboard-agileecommerce`
3. Verificar resposta de erro do backend

### "Números estão errados"

1. Verificar se o período está correto no filtro
2. Validar joins em:
   - `empresas.id` com `processos.id_empresa`
   - `empresas.id` com `apps.id_empresa`
3. Confirmar que timestamp está em timezone correta

---

## 8. Roadmap e Melhorias Futuras

- [ ] Exportar dados em CSV/PDF
- [ ] Alertas automáticos (quando taxa_erro > X%)
- [ ] Drill-down: clicar numa empresa e ver detalhes
- [ ] Integração com Slack/webhook para notificações críticas
- [ ] Visualizador de logs em tempo real
- [ ] Customização de widgets por usuário

---

## 9. Referências

**Frontend**:

- Código: `src/features/dashboard-root-agileecommerce/`
- Tipos: `types/dashboard-root-agileecommerce.ts`
- Componentes: `components/`
- Services: `services/` (client, mapper, formatters)

**Backend**:

- Controller: `app/Http/Controllers/DashboardAgileecommerceController.php`
- Route: `routes/api.php` → `/relatorios/dashboard-agileecommerce`
- Database: Indices em `database/sql/`

**Documentação I18n**:

- Strings: `src/i18n/dictionaries/{pt-BR, en-US}.ts`
