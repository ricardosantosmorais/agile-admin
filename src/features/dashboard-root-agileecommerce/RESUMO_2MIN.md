# ⚡ Dashboard Agile E-commerce - Resumo em 2 Minutos

> **TL;DR**: Dashboard com 6 seções mostra saúde da plataforma. A mais importante é **OPERAÇÃO** com alertas de falhas. Dados carregam lazy (rápido). Tudo explicado. Leia o guia para sua função.

---

## 🎯 O Que É?

Dashboard que centraliza **todas as métricas operacionais** da Agile E-commerce em um só lugar.

- **6 seções**: Resumo, Plataforma, Produtos, Engajamento, Operação, IA/Governança
- **Carrega rápido**: ~1.3s com lazy loading por fases
- **Alertas críticos**: Tabela de falhas recentes para triage imediato
- **Dados filtráveis**: Período customizável (padrão 30 dias)

---

## 🎯 Por Que Usar?

✅ **Ver saúde geral em 5 segundos** (Cards executivos)  
✅ **Encontrar problemas rápido** (Alertas de falhas)  
✅ **Entender padrões** (Gráficos de série histórica)  
✅ **Monitorar IA/agente** (Auditoria MCP)  
✅ **Comparar períodos** (Variações automáticas)

---

## 🎯 As 6 Seções (10 segundos cada)

| #   | Seção               | O Que Mostra                                    | Ação                   | ⏱️ Crítico |
| --- | ------------------- | ----------------------------------------------- | ---------------------- | ---------- |
| 1️⃣  | **RESUMO**          | KPIs: empresas, apps, pushes, processos, agente | Verificar números      | < 5s       |
| 2️⃣  | **PLATAFORMA**      | Status de empresas, clusters, ERPs, sem app     | Cobertura/distribuição | < 5s       |
| 3️⃣  | **PRODUTOS**        | Apps criados, notificações (série 12 meses)     | Crescimento            | < 5s       |
| 4️⃣  | **ENGAJAMENTO**     | Pushes, interações (série 12 meses)             | ROI campanhas          | < 5s       |
| 5️⃣  | **OPERAÇÃO** 🚨     | **ALERTAS DE FALHAS** + stats processos         | **TRIAGE AGORA**       | < 5s       |
| 6️⃣  | **IA E GOVERNANÇA** | Agente, MCP audit, tools com erro               | Saúde do agente        | < 5s       |

---

## 🚨 O MAIS IMPORTANTE: OPERAÇÃO → ALERTAS

**Seção**: OPERAÇÃO (5️⃣)  
**Tabela**: "Alertas de processos falhos recentes"  
**O que mostra**: Últimas 20 falhas agrupadas por empresa+tipo  
**Colunas**: Empresa | Tipo | Status | Última ocorrência

**Se vê linha na tabela**:

1. ✓ Qual empresa falhou
2. ✓ Que tipo de processo
3. ✓ Quando foi
4. → Investigar cause root

---

## 📊 Cores/Alertas = Saúde

```
🟢 VERDE    Taxa erro < 5%      OK, continuar monitorando
🟡 AMARELO  Taxa erro 5-10%     Atenção, observe mudanças
🔴 VERMELHO Taxa erro > 10%     CRÍTICO, investigar agora
```

---

## 🕐 Períodos Disponíveis

**Rápido** (padrão):

- Últimos 7 dias
- Últimos 30 dias ← PADRÃO
- Últimos 90 dias

**Customizado**:

- Escolha datas e dashboard recalcula

**Comparativo**: Automático vs período anterior

---

## 📚 Próximos Passos (Por Função)

### 👤 Sou Usuário Final

→ Ler: [DASHBOARD_GUIA_USUARIO.md](../../DASHBOARD_GUIA_USUARIO.md) (10 min)  
→ Depois: Voltar aqui e usar dashboard

### 👨‍💻 Sou Developer

→ Ler: [README.md](./README.md) (5 min)  
→ Depois: [docs/46-modulo-dashboard-agileecommerce.md](../../docs/46-modulo-dashboard-agileecommerce.md) (30 min)

### 📋 Quero Referência Rápida

→ Ver: [CHEAT_SHEET.md](./CHEAT_SHEET.md) (5 min)  
→ Imprimir: Deixar na mesa

### 🎨 Quero Adicionar Tooltips

→ Ler: [TOOLTIPS_IMPLEMENTATION_GUIDE.md](./TOOLTIPS_IMPLEMENTATION_GUIDE.md) (20 min)

### 📑 Quero Índice Completo

→ Ver: [INDICE_DOCUMENTACAO.md](./INDICE_DOCUMENTACAO.md) (15 min)

---

## ⚡ Atalhos

| Preciso...               | Ir Para...                                                                             | Tempo  |
| ------------------------ | -------------------------------------------------------------------------------------- | ------ |
| Entender um número       | [Cheat Sheet](./CHEAT_SHEET.md)                                                        | 1 min  |
| Saber de onde vem dado   | [Docs Técnica](../../docs/46-modulo-dashboard-agileecommerce.md#3-seções-do-dashboard) | 3 min  |
| Troubleshoot problema    | [Troubleshooting](../../docs/46-modulo-dashboard-agileecommerce.md#7-troubleshooting)  | 5 min  |
| Ver exemplos de tooltips | [Guide](./TOOLTIPS_IMPLEMENTATION_GUIDE.md)                                            | 10 min |
| Imprimir                 | [Cheat Sheet](./CHEAT_SHEET.md)                                                        | 1 min  |

---

## ✅ Quick Check

**Antes de usar, verificar**:

- [ ] Dashboard carregou em < 2s
- [ ] Vejo todos os 6 cards executivos
- [ ] Tabela de alertas visível (seção Operação)
- [ ] Período correto (30 dias ou customizado?)

**Se não carregar**:

1. F5 (atualizar)
2. DevTools → Network → check erro
3. Contatar suporte

---

## 📞 Rápido Q&A

**P: Por que o número X está diferente de ontem?**  
R: Depende do período. Se filtro 30 dias, dados mudam cada dia. Use comparativo.

**P: De onde vem dado Y?**  
R: Check [Cheat Sheet](./CHEAT_SHEET.md) coluna "Fonte" ou [Docs Técnica](../../docs/46-modulo-dashboard-agileecommerce.md).

**P: Como excelir dados?**  
R: Ainda não implementado. Roadmap: Q2 2026.

**P: Dashboard lento?**  
R: Check connection. Se servidor lento, check índices MySQL. Ver [Troubleshooting](../../docs/46-modulo-dashboard-agileecommerce.md#troubleshooting-dashboard-carrega-muito-lentamente).

**P: Posso customizar widgets?**  
R: Roadmap. Por agora: fixo para todos.

---

## 🚀 Já Pronto Para Usar?

### SIM → Comece!

1. Abrir dashboard: `/dashboard` (aba protegida)
2. Deixar carregar (~1.3s)
3. Ver seção OPERAÇÃO → Tabela de ALERTAS
4. Se tem alertas, investigar
5. Se tudo verde, continuar monitoring

### NÃO → Ler Guia

1. [Guia do Usuário](../../DASHBOARD_GUIA_USUARIO.md) (10 min)
2. [Cheat Sheet](./CHEAT_SHEET.md) (referência)
3. [Documentação Técnica](../../docs/46-modulo-dashboard-agileecommerce.md) (se dev)

---

## 📝 Info

- **Versão**: 1.0
- **Status**: ✅ Produção
- **Atualizado**: 2026-04-17
- **Suporte**: Tech Lead Plataforma

---

**[← Voltar ao README](./README.md)** | **[Ir para Guia Usuário →](../../DASHBOARD_GUIA_USUARIO.md)**
