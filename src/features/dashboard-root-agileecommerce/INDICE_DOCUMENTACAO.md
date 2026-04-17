# 📚 Dashboard Agile E-commerce - Índice de Documentação

## 🎯 Por Onde Começar?

### 👤 Sou um **Usuário Final** (Gerente, Operações, Suporte)

→ Leia: [DASHBOARD_GUIA_USUARIO.md](DASHBOARD_GUIA_USUARIO.md)

- ⏱️ Tempo: 10 minutos
- 📋 Contém: Explicação simples de cada gráfico, tabela e métrica
- 🎯 Objetivo: Entender o que significa cada número

---

### 👨‍💻 Sou um **Desenvolvedor** (Implementação, Manutenção, Melhorias)

→ Leia: [docs/46-modulo-dashboard-agileecommerce.md](docs/46-modulo-dashboard-agileecommerce.md)

- ⏱️ Tempo: 30 minutos
- 📋 Contém: SQL, tipos TypeScript, fontes de dados, fórmulas de cálculo
- 🎯 Objetivo: Entender arquitetura e implementação

---

### 🎨 Sou um **Frontend Dev** (Componentes, UI/UX, Tooltips)

→ Leia: [src/features/dashboard-root-agileecommerce/TOOLTIPS_IMPLEMENTATION_GUIDE.md](src/features/dashboard-root-agileecommerce/TOOLTIPS_IMPLEMENTATION_GUIDE.md)

- ⏱️ Tempo: 20 minutos
- 📋 Contém: Exemplos React com Shadcn/UI Tooltip
- 🎯 Objetivo: Adicionar tooltips interativos ao dashboard

---

### 🗄️ Sou um **DBA ou Backend Dev** (Otimização, Queries, Performance)

→ Leia: [docs/46-modulo-dashboard-agileecommerce.md#3-seções-do-dashboard](docs/46-modulo-dashboard-agileecommerce.md#3-seções-do-dashboard)

- ⏱️ Tempo: 45 minutos
- 📋 Contém: SQL completo, índices, períodos, joins
- 🎯 Objetivo: Otimizar queries e performance

---

## 📖 Navegação Rápida

### Estrutura de Documentação

```
Dashboard Root Agile E-commerce
│
├── 📄 DASHBOARD_GUIA_USUARIO.md
│   └── Para: Usuários finais
│   └── Contém: Explicações simples, exemplos, como ler alertas
│
├── 📄 docs/46-modulo-dashboard-agileecommerce.md
│   └── Para: Devs e arquitetos
│   └── Contém: SQL, tipos, fórmulas, performance, troubleshooting
│
├── 📄 src/features/dashboard-root-agileecommerce/TOOLTIPS_IMPLEMENTATION_GUIDE.md
│   └── Para: Frontend devs
│   └── Contém: Código React, exemplos, integração
│
├── 📄 src/features/dashboard-root-agileecommerce/constants/dashboard-tooltips.ts
│   └── Arquivo de dados com todas as explicações
│
├── 📁 src/features/dashboard-root-agileecommerce/
│   ├── components/dashboard-root-agileecommerce-page.tsx (845 linhas)
│   ├── components/dashboard-route-switcher.tsx
│   ├── hooks/use-dashboard-root-sequenced-snapshot.ts (234 linhas)
│   ├── services/dashboard-root-agileecommerce-client.ts (32 linhas)
│   ├── services/dashboard-root-agileecommerce-mapper.ts (243 linhas)
│   ├── services/dashboard-root-agileecommerce-formatters.ts (210 linhas)
│   ├── types/dashboard-root-agileecommerce.ts (123 linhas)
│   └── constants/dashboard-tooltips.ts
│
└── 📁 Backend (Laravel)
    └── app/Http/Controllers/DashboardAgileecommerceController.php
```

---

## 🎯 Mapa Mental: O Dashboard em 1 Minuto

```
DASHBOARD ROOT AGILEECOMMERCE
│
├─ 1️⃣ RESUMO
│  ├─ Empresas: ativa, produção, homologação, com app
│  ├─ Pushes: enviados, interações, taxa
│  ├─ Processos: total, erro, taxa
│  ├─ Agente: execuções, auditorias, erro
│  └─ Builds: com erro
│
├─ 2️⃣ PLATAFORMA
│  ├─ Gráficos: status empresas, cluster, ERP
│  └─ Tabelas: sem app, problemas de build
│
├─ 3️⃣ PRODUTOS
│  ├─ Série: apps criados, notificações enviadas
│  └─ Status: logs de sucesso/erro
│
├─ 4️⃣ ENGAJAMENTO
│  ├─ Série: pushes enviados, interações
│  └─ Detalhes: tipos de mensagens externas
│
├─ 5️⃣ OPERAÇÃO ⚠️ MAIS IMPORTANTE
│  ├─ Série: processos por mês
│  ├─ Gráficos: status, tipos
│  ├─ Cards: logs de erro e info
│  └─ Tabela: ALERTAS DE FALHAS RECENTES (TOP 20)
│
└─ 6️⃣ IA E GOVERNANÇA
   ├─ Agente: execuções diárias, auditoria MCP
   ├─ Uso: mensagens user/assistant, eventos
   └─ Tools: top usadas, alertas de erro/lentidão
```

---

## 🔍 Glossário Rápido

| Termo              | Significa                                             | Onde Usar                  |
| ------------------ | ----------------------------------------------------- | -------------------------- |
| **Fase**           | Etapa de carregamento (resumo, plataforma, etc)       | Lazy loading do dashboard  |
| **Taxa erro**      | (erros / total) × 100                                 | KPIs de saúde (< 5% ok)    |
| **Latência média** | Tempo médio de execução em ms                         | Performance de tools       |
| **Agrupamento**    | Se múltiplos erros, mostra 1 linha com o mais recente | Alertas de processos       |
| **Cache TTL**      | Tempo que dados ficam cacheados (padrão 5min)         | Performance                |
| **Comparativo**    | Variação vs período anterior                          | Cards executivos (↑ ou ↓)  |
| **Drill-down**     | Clicar numa métrica para ver detalhes                 | Roadmap (não implementado) |
| **MCP**            | Model Context Protocol (agente de IA)                 | Seção "IA e Governança"    |
| **Tool**           | Ferramenta que agente usa (SQL, AWS, etc)             | Auditoria MCP              |

---

## 📊 Referência: Métricas Por Seção

### Seção: RESUMO

```
Carteira:
  - empresas_total
  - empresas_ativas
  - empresas_producao
  - empresas_homologacao
  - empresas_bloqueadas
  - empresas_manutencao
  - empresas_com_app
  - apps_ativos
  - cobertura_apps_percentual

Período Atual:
  - pushes_enviados
  - push_interacoes
  - taxa_interacao_push
  - processos_total
  - processos_erro
  - taxa_erro_processos
  - execucoes_agente
  - auditorias_mcp
  - auditorias_mcp_erro
  - taxa_erro_mcp
  - builds_com_erro
```

### Seção: PLATAFORMA

```
Gráficos:
  - status (produção, homologação, bloqueada, manutenção)
  - clusters (distribuição por data center)
  - erps (SAP, Oracle, Tiny, etc)

Tabelas:
  - top_empresas_sem_app (top 10)
  - top_empresas_problemas_publicacao_build (top 10)
```

### Seção: OPERAÇÃO ⚠️

```
Série:
  - processos por mês (histórico 12 meses)

Gráficos:
  - status (sucesso, erro, pendente, executando)
  - tipos (importacao, exportacao, sync, etc)

Cards:
  - logs_erros (count)
  - logs_informacoes (count)

Tabela CRÍTICA:
  - alertas_falha_recente (top 20 com empresa, tipo, status, última_ocorrência)
```

### Seção: IA E GOVERNANÇA

```
Agent:
  - execucoes_serie_diaria (últimos 30 dias)
  - mensagens_por_papel (user vs assistant)
  - eventos_tipos (status, heartbeat, tool, etc)

Audit (MCP):
  - execucoes_status (sucesso, erro, timeout, cancelado)
  - top_tools (nome, total, latência_média)
  - alertas_tools (ferramentas com erro ou lentas)
```

---

## 🚀 Roadmap Documentação

- [x] Guia do usuário final
- [x] Documentação técnica completa
- [x] Guia de implementação de tooltips
- [x] Índice de documentação
- [ ] Vídeo tutorial (3 min) de como ler o dashboard
- [ ] Cheat sheet imprimível (PDF) com todas as métricas
- [ ] FAQ: "Por que o número X mudou?"
- [ ] Integração com sistema de alertas (Slack/email)
- [ ] Dashboard em dashboard (meta: quando um valor crítico surge, aviso imediato)

---

## 📞 Suporte e Questões

### "De onde vem este número X?"

→ Procure no índice acima ou na seção correspondente da [documentação técnica](docs/46-modulo-dashboard-agileecommerce.md)

### "Como calcular Y?"

→ Procure por "fórmula" no arquivo relevante ou na seção **Fórmulas de Cálculo**

### "Por que o gráfico está vazio?"

→ Veja [Troubleshooting](docs/46-modulo-dashboard-agileecommerce.md#7-troubleshooting)

### "Qual é a fonte de dados para Z?"

→ Procure por "Fonte:" em qualquer seção - sempre tem a query SQL

---

## 🔗 Links Rápidos

**Código Frontend:**

- [Página Principal](src/features/dashboard-root-agileecommerce/components/dashboard-root-agileecommerce-page.tsx)
- [Hook de Estado](src/features/dashboard-root-agileecommerce/hooks/use-dashboard-root-sequenced-snapshot.ts)
- [Tipos TypeScript](src/features/dashboard-root-agileecommerce/types/dashboard-root-agileecommerce.ts)
- [Formatadores](src/features/dashboard-root-agileecommerce/services/dashboard-root-agileecommerce-formatters.ts)
- [Mapeadores](src/features/dashboard-root-agileecommerce/services/dashboard-root-agileecommerce-mapper.ts)

**Código Backend:**

- [Controller Laravel](app/Http/Controllers/DashboardAgileecommerceController.php) (API v3)
- [Rota API](routes/api.php) → `/relatorios/dashboard-agileecommerce`
- [Bridge Next.js](app/api/dashboard-agileecommerce/route.ts)

**I18n:**

- [Português (pt-BR)](src/i18n/dictionaries/pt-BR.ts)
- [Inglês (en-US)](src/i18n/dictionaries/en-US.ts)

---

## ✅ Checklist: Antes de Usar o Dashboard

- [ ] Li o guia para meu papel (usuário, dev, frontend, dba)
- [ ] Entendo o que cada gráfico/tabela significa
- [ ] Sei onde ver alertas críticos (Operação → Alertas)
- [ ] Testei em período diferente (não só últimos 30 dias)
- [ ] Testei em light e dark mode
- [ ] Testei em mobile
- [ ] Dei feedback sobre tooltips ou confusões

---

## 📝 Versão

- **Dashboard**: v1.0 (Abril 2026)
- **Documentação**: v1.0 (Abril 2026)
- **Última atualização**: 2026-04-17

---

## 🎓 Para Mais Detalhes

Cada arquivo de documentação tem índice próprio:

- [Índice técnico](docs/46-modulo-dashboard-agileecommerce.md#1-propósito)
- [Índice de guia do usuário](DASHBOARD_GUIA_USUARIO.md)
- [Índice de implementação de tooltips](src/features/dashboard-root-agileecommerce/TOOLTIPS_IMPLEMENTATION_GUIDE.md)
