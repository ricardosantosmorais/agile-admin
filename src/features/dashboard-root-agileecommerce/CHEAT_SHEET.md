| 🎯 Seção        | 📊 Métrica                  | ✍️ Significa                  | 📍 Fonte                                                 | ⚠️ Alerta                         | 🎯 Ação                   |
| --------------- | --------------------------- | ----------------------------- | -------------------------------------------------------- | --------------------------------- | ------------------------- |
| **RESUMO**      | Empresas ativas             | Quantas estão operacionais    | `empresas (status != bloqueada)`                         | < 5 = problema                    | Ativar novas              |
| **RESUMO**      | Procesos com erro           | % de falhas                   | (erros/total)×100                                        | > 10% = crítico                   | Investigar                |
| **RESUMO**      | Taxa erro MCP               | % de ferramentas que falharam | (mcp_erro/mcp_total)×100                                 | > 10% = agente instável           | Revisar agente            |
| **RESUMO**      | Builds com erro             | Apps que quebrou ao publicar  | `apps_logs (status=error)`                               | > 2/dia = frequente               | Suporte app               |
| **PLATAFORMA**  | Status das Empresas (pizza) | Distribuição por estado       | `SELECT status, COUNT(*) FROM empresas`                  | Muitas bloqueadas = problema      | Reativar                  |
| **PLATAFORMA**  | Cluster (barras)            | Distribuição por data center  | `SELECT cluster, COUNT(*) FROM empresas`                 | Um cluster >> outros = desbalance | Rebalancear               |
| **PLATAFORMA**  | ERP (barras)                | Qual ERP mais usado           | `SELECT erp, COUNT(*) FROM empresas`                     | Nenhum = sem integração           | Integrar ERPs             |
| **PLATAFORMA**  | Sem app (tabela)            | Empresas sem app mobile       | `LEFT JOIN apps WHERE apps.id IS NULL`                   | Qualquer uma = vender app         | Contactar                 |
| **PLATAFORMA**  | Problema build (tabela)     | Apps com erro ao publicar     | `apps_logs WHERE status IN (error, queued)`              | Qualquer uma = urgente            | Suporte imediato          |
| **PRODUTOS**    | Apps/mês (linha)            | Crescimento de adoção         | `SELECT mes, COUNT(*) FROM apps`                         | Linha descendo = menos clientes   | Revisar vendas            |
| **PRODUTOS**    | Notificações/mês (linha)    | Volume de campanhas           | `SELECT mes, COUNT(*) FROM notificacoes`                 | Flat = sem marketing              | Aumentar campanhas        |
| **PRODUTOS**    | Logs status (tabela)        | Taxa de sucesso               | `SELECT status, COUNT(*) FROM apps_logs`                 | Muitos erros = build quebrado     | Revisar CI/CD             |
| **ENGAJAMENTO** | Pushes enviados (linha)     | Volume de notificações        | `SELECT mes, COUNT(*) FROM notificacoes_apps`            | Descendo = menos marketing        | Aumentar                  |
| **ENGAJAMENTO** | Interações (linha)          | Cliques/aberturas             | `SELECT mes, COUNT(*) FROM notificacoes_apps_interacoes` | < 5% = pouco engajamento          | Redesenhar notificações   |
| **ENGAJAMENTO** | Taxa interação              | Efetividade de push           | (interacoes/enviados)×100                                | < 5% = problema                   | A/B testing               |
| **ENGAJAMENTO** | Msgs externas (tabela)      | Email, SMS, Webhook           | `SELECT tipo, COUNT(*) FROM mensagens_externas`          | Um tipo 0 = canal quebrado        | Corrigir integração       |
| **OPERAÇÃO**    | Processos/mês (linha)       | Volume de processamento       | `SELECT mes, COUNT(*) FROM processos`                    | Picos = validar capacidade        | Escalar se necessário     |
| **OPERAÇÃO**    | Status (pizza)              | Sucesso vs erro               | `SELECT status, COUNT(*) FROM processos`                 | > 10% erro = crítico              | Investigar imediatamente  |
| **OPERAÇÃO**    | Tipos (barras)              | Qual tipo mais roda           | `SELECT tipo, COUNT(*) FROM processos`                   | Importação >> exportação          | Esperado (padrão)         |
| **OPERAÇÃO**    | Logs erro (card)            | Erros gerados                 | `SELECT COUNT(*) FROM processos_logs WHERE level=error`  | > 100/dia = problema              | Revisar logs              |
| **OPERAÇÃO**    | **ALERTAS** 🚨              | **Últimas 20 falhas**         | `GROUP BY empresa, tipo ORDER BY data DESC`              | **QUALQUER LINHA = TRIAGE**       | **Investigar causa root** |
| **IA**          | Execuções/dia (linha)       | Adoção do agente              | `SELECT dia, COUNT(*) FROM agente_execucoes`             | Linha subindo = ótimo             | Promover agente           |
| **IA**          | Auditoria MCP (pizza)       | Taxa de sucesso               | `SELECT status, COUNT(*) FROM mcp_audit_log`             | > 10% erro = agente instável      | Revisar agent             |
| **IA**          | Mensagens user/assistant    | Proporção interação           | `SELECT papel, COUNT(*) FROM agente_mensagens`           | Desbalanceado = problema          | Verificar agente logic    |
| **IA**          | Eventos (tabela)            | Atividades do agente          | `SELECT tipo_evento, COUNT(*) FROM agente_eventos`       | SQL queries >> resultados = erro  | Query problem             |
| **IA**          | Top tools (tabela)          | Mais usadas                   | `SELECT tool, COUNT(), AVG(latencia)`                    | Latência > 500ms = lento          | Otimizar/revisar          |
| **IA**          | Alertas tools 🚨            | Ferramentas com erro          | `WHERE status=erro OR latencia > 1000ms`                 | **QUALQUER UMA = PROBLEMA**       | **Investigar ferramenta** |

---

## 🎨 Leitura Visual Rápida

```
🟢 GREEN (OK)             🟡 YELLOW (ATTENTION)      🔴 RED (CRITICAL)
─────────────────         ─────────────────────      ─────────────────
Taxa erro < 5%            Taxa erro 5-10%            Taxa erro > 10%
Latência < 200ms          Latência 200-500ms         Latência > 500ms
Apps publicando OK        Alguns builds falhando     Builds consistentes falhando
Empresas ativas           Empresas em manutenção     Muitas bloqueadas
Agente respondendo        Agente lento               Agente falhando

AÇÃO: Continuar monitorando    AÇÃO: Observar mudanças    AÇÃO: Investigar imediatamente
```

---

## 💾 Como Salvar Este Cheat Sheet

1. Imprimir esta página em PDF (Ctrl+P)
2. Deixar na mesa próximo ao monitor
3. Compartilhar com seu time (Slack)
4. Adicionar ao wiki/confluence da empresa

---

**Gerado**: 2026-04-17 | **Versão Dashboard**: 1.0
