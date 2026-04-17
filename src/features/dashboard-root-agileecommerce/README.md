# 📊 Dashboard Root Agile E-commerce

Dashboard executivo centralizado que mostra a saúde geral da plataforma Agile E-commerce em tempo real.

## 🎯 Para Começar

**Qual é sua função?**

| Função                                           | Leia                                                                | Tempo  |
| ------------------------------------------------ | ------------------------------------------------------------------- | ------ |
| 👤 **Usuário Final** (Gerente, Ops, Suporte)     | [📖 Guia do Usuário](../../DASHBOARD_GUIA_USUARIO.md)               | 10 min |
| 👨‍💻 **Desenvolvedor** (Implementação, Manutenção) | [📖 Docs Técnica](../../docs/46-modulo-dashboard-agileecommerce.md) | 30 min |
| 🎨 **Frontend Dev** (Components, UI, Tooltips)   | [📖 Guia de Tooltips](./TOOLTIPS_IMPLEMENTATION_GUIDE.md)           | 20 min |
| 📊 **Cheat Sheet** (Referência rápida)           | [📋 Tabela de Métricas](./CHEAT_SHEET.md)                           | 5 min  |
| 🗂️ **Índice Completo** (Tudo indexado)           | [📑 Índice](./INDICE_DOCUMENTACAO.md)                               | 15 min |

---

## 📋 O Que Você Encontra Aqui

### 🎯 Seções do Dashboard

```
1️⃣  RESUMO             KPIs executivos (empresas, apps, pushes, processos, agente)
2️⃣  PLATAFORMA        Distribuição de empresas, clusters, ERPs
3️⃣  PRODUTOS          Série de apps criados e notificações
4️⃣  ENGAJAMENTO       Efetividade de push e taxas de interação
5️⃣  OPERAÇÃO          ⚠️ Processos internos e alertas de falhas CRÍTICOS
6️⃣  IA E GOVERNANÇA   Agente de IA, MCP audit, tools de observabilidade
```

### 📊 Tipos de Visualizações

- **Gráficos**: Linhas (série temporal), Pizza (distribuição), Barras (ranking)
- **Tabelas**: Alertas críticos, empresas sem app, tools com erro
- **Cards**: Métricas em destaque com comparativo vs período anterior
- **Série Histórica**: Últimos 12 meses com possibilidade de filtro

---

## 🚀 Arquitetura

### Frontend (Next.js + React)

```
pages/dashboard/page.tsx (Protected Route)
    ↓
dashboard-root-agileecommerce-page.tsx (Main Component - 845 linhas)
    ├─ LazyDashboardSection × 6 (uma para cada fase)
    ├─ useI18n() (Português/Inglês)
    └─ use-dashboard-root-sequenced-snapshot (State Management)
        ├─ Phase-based loading
        ├─ Automatic retry on error
        └─ Cache management
```

### Backend (Laravel API v3)

```
POST /api/relatorios/dashboard-agileecommerce
    ↓
DashboardAgileecommerceController.php
    ├─ Query empresas (status, cluster, ERP, apps)
    ├─ Query apps (publicações, notificações, logs)
    ├─ Query processos (sucesso, erro, tipos, alertas)
    ├─ Query agente (execuções, mensagens, eventos)
    └─ Query audit MCP (tools, performance, errors)
```

### Data Flow

```
Frontend (POST com período)
    ↓
Next.js Bridge: /api/dashboard-agileecommerce (Mapping + Translation)
    ↓
Backend: DashboardAgileecommerceController (Complex Queries)
    ↓
MySQL: 6 blocos independentes (empresas, apps, push, processos, agente, audit)
    ↓
Response: Mapped JSON
    ↓
Frontend: useMemo + useEffect + lazy rendering
    ↓
UI: Skeleton → Data (smooth experience)
```

---

## 📁 Estrutura de Arquivos

```
src/features/dashboard-root-agileecommerce/
├── components/
│   ├── dashboard-root-agileecommerce-page.tsx      # Main page (845 linhas)
│   └── dashboard-route-switcher.tsx                 # Route logic
├── hooks/
│   └── use-dashboard-root-sequenced-snapshot.ts    # State & lazy loading (234 linhas)
├── services/
│   ├── dashboard-root-agileecommerce-client.ts     # HTTP client (32 linhas)
│   ├── dashboard-root-agileecommerce-mapper.ts     # Data mapping (243 linhas)
│   └── dashboard-root-agileecommerce-formatters.ts # Formatters (210 linhas)
├── types/
│   └── dashboard-root-agileecommerce.ts            # TypeScript types (123 linhas)
├── constants/
│   └── dashboard-tooltips.ts                       # Tooltip definitions
├── README.md                                       # Este arquivo
├── INDICE_DOCUMENTACAO.md                          # Índice completo
├── CHEAT_SHEET.md                                  # Referência rápida
└── TOOLTIPS_IMPLEMENTATION_GUIDE.md               # Como adicionar tooltips

app/
├── (protected)/
│   └── dashboard/
│       └── page.tsx                                # Protected route wrapper
└── api/
    └── dashboard-agileecommerce/
        └── route.ts                                 # Next.js bridge (64 linhas)

docs/
└── 46-modulo-dashboard-agileecommerce.md          # Docs técnica completa

DASHBOARD_GUIA_USUARIO.md                          # Guia para usuários finais
```

---

## 🔄 Flow de Carregamento (Lazy Loading)

Dashboard carrega em **6 fases sequenciais** para melhor performance:

```
1. RESUMO (data)        ✓ 200ms  → Mostra números importantes
   ↓
2. PLATAFORMA (empresas) ✓ 150ms  → Status de empresas
   ↓
3. PRODUTOS (apps)       ✓ 200ms  → Publicações
   ↓
4. ENGAJAMENTO (push)    ✓ 150ms  → Notificações
   ↓
5. OPERAÇÃO (processos)  ✓ 300ms  → ALERTAS CRÍTICOS ⚠️
   ↓
6. IA E GOVERNANÇA       ✓ 250ms  → Agente + Tools
```

**Total**: ~1250ms (≈1.3s) para carregar tudo

**Usuário vê**: Skeleton loaders enquanto dados chegam. Pode scrollar e ver dados carregarem em tempo real.

---

## 📊 Período de Dados

### Seletor

- Últimos 7 dias
- **Últimos 30 dias** (padrão)
- Últimos 90 dias
- Customizado (datas)

### Comparativo Automático

Se período = "Mar 1-31", sistema automaticamente pega "Feb 1-28" e mostra:

- Valor atual
- Variação (↑ verde ou ↓ vermelho)

---

## ⚠️ Alertas Críticos

### Seção: OPERAÇÃO (Fase 5)

**Tabela: Alertas de Processos Falhos Recentes**

Esta é a **mais importante** para operações. Mostra:

- **Empresa**: Quem teve o problema
- **Tipo**: Que tipo de processo falhou
- **Status**: Sempre "erro"
- **Última ocorrência**: Quando foi

**Ações esperadas**:

1. Se vê múltiplos erros da mesma empresa → escalate para suporte
2. Se vê padrão em um tipo de processo → investigar backend
3. Se vê novos erros → responder rápido

**Limite**: Top 20 mais recentes. Se mesma empresa+tipo teve múltiplos erros, agrupa e mostra o mais recente.

---

## 🔧 Performance

### Cache

- **TTL padrão**: 5 minutos
- **Hit**: Se `meta.cache_hit = true`, dados vêm do cache
- **Bypass**: Query param `forceRefresh=true` descartas cache

### Índices Esperados (Backend)

```sql
CREATE INDEX idx_processos_data_status ON processos(data_inicio, status);
CREATE INDEX idx_agente_execucoes_criado ON agente_execucoes(criado_em);
CREATE INDEX idx_mcp_audit_criado_status ON mcp_audit_log(data_criacao, status, tool_name);
CREATE INDEX idx_empresas_status ON empresas(status);
CREATE INDEX idx_apps_id_empresa ON apps(id_empresa);
```

### Benchmark

| Operação                            | Tempo Esperado | Alerta                   |
| ----------------------------------- | -------------- | ------------------------ |
| Carregar dashboard (todas as fases) | 1-2s           | > 5s = problema          |
| Cada fase individual                | 150-300ms      | > 500ms = lento          |
| Query de alertas (top 20)           | 50-100ms       | > 200ms = índice ruim    |
| Total cache hit                     | 100ms          | > 200ms = cache problema |

---

## 🐛 Troubleshooting

### Dashboard não carrega

```
1. Atualizar página (F5)
2. Abrir DevTools → Network
3. Verificar requisição POST /api/dashboard-agileecommerce
4. Se erro 401: sessão expirou
5. Se erro 403: tenant não é 'agileecommerce'
6. Se erro 500: backend problema
```

### Uma fase não carrega

```
1. Fase anterior não completou = aguardar
2. Erro network = conexão
3. Erro backend = check logs do Laravel
```

### Números parecem incorretos

```
1. Verificar período selecionado (está certo?)
2. Verificar timezone do banco
3. Forçar refresh: ?forceRefresh=true
4. Verificar índices no MySQL
```

---

## 📖 Documentação Completa

- [📄 Guia do Usuário Final](../../DASHBOARD_GUIA_USUARIO.md) - Para não-técnicos
- [📄 Docs Técnica](../../docs/46-modulo-dashboard-agileecommerce.md) - SQL, fórmulas, arquitetura
- [📄 Tooltips Impl.](./TOOLTIPS_IMPLEMENTATION_GUIDE.md) - Como adicionar tooltips
- [📋 Cheat Sheet](./CHEAT_SHEET.md) - Tabela de referência rápida
- [📑 Índice Completo](./INDICE_DOCUMENTACAO.md) - Navegação por tópico

---

## 🎨 I18n (Internacionalização)

Todas as strings traduzidas:

- [Português (pt-BR)](../../src/i18n/dictionaries/pt-BR.ts) - 263 strings
- [Inglês (en-US)](../../src/i18n/dictionaries/en-US.ts) - 263 strings

### Adicionar Nova String

1. Abrir `pt-BR.ts` e `en-US.ts`
2. Adicionar: `'dashboardRoot.novaString': 'Texto'`
3. No componente: `t('dashboardRoot.novaString')`

---

## ✅ Checklist: Antes de Usar

- [ ] Entendo o que cada seção significa
- [ ] Li o guia para meu tipo de usuário
- [ ] Testei em período diferente (não só 30 dias)
- [ ] Testei em light e dark mode
- [ ] Testei em mobile
- [ ] Sei onde estão os alertas críticos (Operação → Tabela)
- [ ] Dei feedback se algo está confuso

---

## 🚀 Próximos Passos

### Implementar Tooltips

```bash
# Ref: TOOLTIPS_IMPLEMENTATION_GUIDE.md
# Usar Shadcn/UI Tooltip component
# Estrutura em constants/dashboard-tooltips.ts
```

### Otimizar Performance

```bash
# 1. Adicionar índices (ver Troubleshooting)
# 2. Profile queries no MySQL
# 3. Implementar query caching se > 500ms
```

### Expandir Dashboard

```bash
# Roadmap:
# - Exportar CSV/PDF
# - Alertas automáticos (Slack)
# - Drill-down em métricas
# - Integração com PagerDuty
# - Real-time logs viewer
```

---

## 📞 Contato

**Dúvidas sobre dashboard?**

- Contatar: Tech Lead ou Time de Plataforma
- Check: [FAQ no Guia Usuário](../../DASHBOARD_GUIA_USUARIO.md#-troubleshooting)

---

## 📝 Histórico

| Versão | Data       | Changes                                            |
| ------ | ---------- | -------------------------------------------------- |
| 1.0    | 2026-04-17 | Inicial - 6 seções, lazy loading, alertas críticos |
| -      | -          | [Roadmap acima]                                    |

---

**Última atualização**: 2026-04-17  
**Status**: ✅ Produção  
**Manutenção**: Tech Lead da Plataforma
