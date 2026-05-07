# Legacy parity backlog - admin -> admin-v2-web

Base v2 start date: 2026-03-24
Generated at: 2026-05-05T14:03:23.044Z

## Totals

- Total legacy commits since base date: 269
- Merge commits: 72
- Actionable non-merge commits: 197

## Module batches

| Module | Commits | Initial disposition | Date range | Examples |
|---|---:|---|---|---|
| agile-store | 37 | investigate-v2-scope:36<br>review-docs-only:1 | 2026-04-30..2026-05-03 | b22d6f726 Adicionar SAC e loja de aplicativos<br>1bdf6883c Finaliza ajustes SAC e loja de aplicativos<br>625d01446 Ajusta confirmação de contratação da loja<br>79aafc84c Documenta regra de gratuidade unica da app store<br>42400ad47 Atualiza materiais comerciais do SAC |
| cache/assets | 26 | not-applicable-v2:26 | 2026-03-25..2026-05-02 | d6e50245c chore: incrementar assets version<br>718a33922 Bump assets version for dashboard changes<br>a4839946c Remove boot da PR do Editor SQL<br>d16e444f4 Restaura boot.php para o estado da master<br>e4c5a7848 Update boot.php |
| pedidos | 19 | compare-and-likely-migrate:19 | 2026-03-26..2026-04-29 | b25101f37 fix(pedidos-detalhe): ajustar timezone para GMT-3 nos campos de data<br>63dd49629 Hide technical order logs by default<br>8f5474789 Fix order detail logs modal rendering<br>fc467b194 Hide technical log json actions by default<br>cf1718b24 Restringe logs tecnicos a usuarios master |
| configuracoes | 12 | triage-needed:12 | 2026-03-25..2026-04-29 | 22638a2f5 Ajusta instrucao do modal de precos<br>e4a8c7358 Adiciona parametro de estoque no assistente<br>652569364 Ajusta renovacao de cache e label da URL API<br>fe2db7d06 Restaura opcoes fixas nas configuracoes gerais<br>4da2066cc Ajusta opcoes fixas da URL API |
| navegacao/menu | 12 | compare-and-likely-migrate:12 | 2026-04-01..2026-05-01 | 957d6d086 feat: add billing upgrade banner and details view<br>a6eaa894b Fix mobile billing upgrade banner layout<br>f8b50c13e Adiciona faixa de pendencia financeira no topo<br>7123ca80c Ajusta destaque e contatos da faixa financeira<br>3380f0aa0 Destaca pendencias no login e na faixa |
| simulador-precos | 11 | compare-and-likely-migrate:11 | 2026-03-27..2026-04-13 | f97027430 Add freight input to price simulator<br>04635ae51 Fix decimal freight input in price simulator<br>1efbe4b0d Align simulator freight input with delivery rule money pattern<br>c5ce9b0f0 Remove custom freight validation from simulator money field<br>e7cd37f4f Send unmasked freight value from simulator |
| integracao-erp/servicos | 7 | triage-needed:7 | 2026-03-24..2026-04-22 | 9a13e0879 feat: suportar dataset consolidado no mapeamento de servicos<br>02c369878 Correção do botão de abortar execução em serviços execuções<br>6e9b5f7f3 Improve integration execution log modal<br>e6686a8f8 feat: improve protheus auth diagnostics in admin<br>5316cdd22 Ajusta acentuacao das mensagens Protheus |
| gateways-pagamento | 6 | compare-and-likely-migrate:6 | 2026-03-24..2026-05-04 | 65ac3403b feat(gateways-pagamento): adiciona campos 3DS da Cielo e regras condicionais<br>27de03d9f fix(gateways-pagamento): preserva campos 3DS ao alternar switch<br>0b3694fa6 Padroniza invalidacao de cache remoto no admin<br>d9d4c2ebe fix: adiciona diagnostico ao salvar gateway de pagamento<br>ccebc4ccf fix: retorna debug seguro no erro do gateway |
| integracao-erp/interfaces-consulta | 6 | compare-and-likely-migrate:6 | 2026-04-07..2026-04-12 | 1b0fcff41 feat: adiciona cadastro de interfaces de consulta no admin<br>1e291e5a5 Refatora admin de interface de consulta<br>bc07a7a2b Evolui override de interface de consulta<br>933b95475 Expone transformacao razor template no admin<br>57443d82d Expoe resolucao de valor no cadastro de interfaces |
| condicoes-pagamento | 5 | compare-and-likely-migrate:5 | 2026-04-09..2026-04-13 | efa16a524 Corrige listagem e edição de restrições em condições de pagamento e atualiza badgeativo<br>55ca91489 feat: implementa editor de exceções para condições de pagamento<br>00f51db6c fix: restaura aba de Restrições no formulário de condições de pagamento<br>d2bf170aa Implementa CRUD de exceções e proteção de registros sincronizados<br>df6eb3df6 feat: ajustes no formulário de condições de pagamento |
| controllers | 5 | triage-needed:5 | 2026-03-26..2026-04-17 | 8df9be0ff Admin usa PainelB2BApi no Editor SQL<br>f4235fad3 Simplifica renovacao de cache para API efetiva<br>2c4ee3ef4 Fix admin cache invalidation flows<br>c5e30a6c7 fix: gate billing banner by cobranca_upgrade<br>929884d06 Improve remote cache invalidation observability |
| filiais | 5 | compare-and-likely-migrate:5 | 2026-03-25..2026-04-23 | ffc628e25 Atualiza parametro exibe_precos_filial por perfil<br>b62a73def Move parametro de filiais para produtos<br>7d05230f6 Ajusta autocomplete de grupos de filiais<br>00efbc393 Adiciona campos complementares em filiais<br>1330409d5 Ajusta opções de seleciona_filial no admin |
| components | 4 | triage-needed:4 | 2026-03-30..2026-04-23 | 97ad25fe5 add placeholders<br>ea7d5957c Ajuste de encode para cadastro/edição de scripts<br>cf9ef9638 chore: ordena tipos de universo do banner<br>3b91c4c98 Ocultando campos em Integração > Logística > Frenet |
| formularios | 4 | compare-and-likely-migrate:4 | 2026-04-07..2026-04-26 | ebffcf6c2 fix: corrige mascara monetaria em formularios<br>2a9031711 Corrige invalidação de cache em formulários<br>38e632764 Ajusta invalidação segmentada de formulários<br>4af61f7e3 Ajuste do  módulo de Envios de Formulários |
| notificacoes-painel | 4 | compare-and-likely-migrate:4 | 2026-04-07..2026-05-03 | 9b3bf870a Corrige empresa selecionada em notificacoes painel e atualiza assets version<br>603bfd968 Ajusta canais de notificacao do painel<br>b9ac56208 Exibe audiencia por canal nas notificacoes<br>b01dabc7d Mostra canais de visualizacao por icone |
| agente-ia | 3 | compare-and-likely-migrate:3 | 2026-03-31..2026-04-01 | 565592a44 feat: add scheduled execution UX to agent chat<br>2eac8a1ff Corrige timezone do historico do agente<br>4e4da53ab fix(agente-ia): ajustar dark mode da sidebar e contraste de textos |
| apps | 3 | triage-needed:3 | 2026-04-06..2026-04-28 | f08412579 fix: atualiza branch de publicacao dos apps para develop<br>c28adc182 Remove admin app-level HTTPS redirect<br>017723209 fix: estabiliza modal de logs de apps |
| arquivos | 3 | compare-and-likely-migrate:3 | 2026-04-15..2026-04-23 | 9699b7cce Ajuste de download automático dos arquivos<br>b5dd1d5bd feat: publica pendencias locais do admin<br>9cc80e880 Revert "feat: publica pendencias locais do admin" |
| autenticacao/sessao | 3 | triage-needed:3 | 2026-03-30..2026-04-13 | adc91efd3 Usa token da sessao no limpar cache<br>65d925106 Remoção do Console log para exibição do token<br>5c4500027 fix: exibir modal de desconexao no erro do ui-bootstrap |
| contatos | 3 | compare-and-likely-migrate:3 | 2026-04-08..2026-04-28 | 4b59fff2d Ajusta separador dos contatos no modal<br>7ac000ca6 feat(contatos): ajusta edição de contatos no admin<br>607636dbb Adiciona parametro de contato duplicado |
| assets | 2 | triage-needed:2 | 2026-03-31..2026-05-03 | 884cd76a2 Correção do acesso rápido<br>b5d699679 Recarrega painel ao detectar assets desatualizados |
| banners/universos | 2 | compare-and-likely-migrate:2 | 2026-04-22..2026-04-22 | 6e4310d86 feat: adiciona universos de banner por contexto<br>3d5d50754 fix: abre autocomplete dos universos de banner |
| docs | 2 | triage-needed:2 | 2026-03-26..2026-05-02 | 42f91fc91 docs: padroniza projetos e premissas<br>a310d733e Remove auto refresh on asset version mismatch |
| integracao-erp/gateway-endpoints | 2 | compare-and-likely-migrate:2 | 2026-03-24..2026-04-30 | 64646a042 Ajusta assistente de mapeamento de endpoint gateway<br>f0cdc9ba6 feat: expose oauth2 cookie gateway auth |
| processos-relatorios | 2 | compare-and-likely-migrate:2 | 2026-04-01..2026-04-01 | f1d5ed69a Ajusta download de processos com tenant por aba<br>89317e26b Ajusta download para abrir na mesma aba |
| .ebextensions | 1 | triage-needed:1 | 2026-05-02..2026-05-02 | 174c82e4b Ajusta health check do admin para ignorar 4xx |
| .gitignore | 1 | triage-needed:1 | 2026-03-24..2026-03-24 | 9b9dc314e chore: ignorar log local do admin |
| billing/faixa-financeira | 1 | compare-and-likely-migrate:1 | 2026-04-08..2026-04-08 | 2f5901daa Ajusta estilo do modal de pendencias |
| dashboard | 1 | triage-needed:1 | 2026-03-25..2026-03-25 | 10cccbc85 Reduce dashboard-v2 request pressure |
| geral | 1 | triage-needed:1 | 2026-03-30..2026-03-30 | ddc50c41d fix: support local admin on port 8080 |
| importar-planilha/processos-arquivos | 1 | compare-and-likely-migrate:1 | 2026-04-30..2026-04-30 | 30d295d53 fix(processos-arquivos): filtrar campos por integra_planilha no mapeamento |
| includes | 1 | triage-needed:1 | 2026-04-10..2026-04-10 | 5003de21a Traduz regras amigaveis de rastreabilidade |
| integracoes/clientes-marketing | 1 | compare-and-likely-migrate:1 | 2026-04-09..2026-04-09 | 40aa4d4c2 feat: ajusta integracao de clientes |
| produtos/restricoes-excecoes | 1 | compare-and-likely-migrate:1 | 2026-03-24..2026-03-24 | 99060e06c feat: adiciona horarios por dia em excecoes e restricoes de produtos |

## Recommended first pass order

1. gateways-pagamento - active recent fixes and payment-risk surface.
2. importar-planilha/processos-arquivos - v2 already touched, compare remaining legacy commits around integra_planilha.
3. notificacoes-painel - several channel/audience/status changes in recent commits.
4. integracao-erp/interfaces-consulta and gateway-endpoints - dense operational flows with prior v2 work.
5. simulador-precos and pedidos - bugfix-heavy areas with money/date/log behavior.
6. Agile Store/SAC - large new legacy surface; needs explicit v2 product-scope decision before migration.

## Operating rule

Each batch must be confirmed file-by-file against legacy code, then compared with v2 before any implementation. Initial dispositions here are heuristic routing only.