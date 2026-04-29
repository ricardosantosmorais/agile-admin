# 47 - Proposta do Dashboard Root Comercial v2

## Objetivo

Este documento define a proposta de evolucao do **Dashboard Root Agile E-commerce** para um modelo mais alinhado ao mercado, com foco em:

- leitura executiva imediata;
- destaque maior para analytics comercial e operacao analitica;
- separacao clara entre KPI de negocio, KPI operacional e confiabilidade do dado;
- uso real das tabelas analiticas hoje disponiveis no banco root.

O publico desta tela continua sendo **root/master**, restrito a usuarios internos da propria Agile E-commerce.

## Atualizacao de decisao

O desenho atual do root passa a separar o dashboard em quatro leituras principais:

- **Receita**: receita realizada, pedidos realizados, ticket medio, cancelamento e comparativo com periodo anterior.
- **Carteira**: empresas com venda, empresas sem venda, empresas em queda, ranking de faturamento e concentracao nas maiores contas.
- **Confiabilidade / qualidade do dado**: cobertura de atualizacao comercial, empresas defasadas, falhas recentes de sincronizacao e ultima data util de leitura.
- **Plataforma / operacao**: apps, push, processos, agente e observabilidade operacional continuam visiveis para suporte e desenvolvimento.

Clientes e produtos deixam de fazer parte do dashboard root neste momento. As cargas dessas dimensoes podem continuar existindo no worker ate a remocao upstream, mas a API e a tela root nao devem depender de `analitico_clientes_diario` nem de `analitico_produtos_diario`.

A fonte comercial final do root passa a ser `analitico_pedidos_status_diario`. A regra oficial é: os pedidos são considerados pela **data do pedido** e classificados pelo **status atual** do pedido.

Os KPIs de venda realizada usam a whitelist:

- `faturado`
- `entregue`
- `em_separacao`
- `em_transporte`
- `recebido`
- `coletado`

Status fora dessa whitelist continuam aparecendo em **Pedidos por status atual**, como distribuição atual dos pedidos do período por status atual. Eles não entram em receita realizada, pedidos realizados, ticket médio, ranking de faturamento, ranking de pedidos, concentração, empresas em queda ou empresas sem venda.

O bloco de status não representa sequência histórica nem mudança de status ao longo do tempo.

## Motivacao

O dashboard atual entrega volume relevante de informacao, mas ainda concentra muito destaque em operacao interna da plataforma, apps, push, agente e auditoria.

Com a entrada e estabilização das tabelas analíticas operacionais:

- `analitico_pedidos_status_diario`
- `analitico_sincronizacao_checkpoint`
- `analitico_sincronizacao_execucao`

o root ja passa a ter base suficiente para uma leitura mais proxima dos dashboards organizacionais e multi-store observados no mercado:

- consolidado da operacao;
- comparativo com periodo anterior;
- rankings de empresas;
- sinais de crescimento e queda;
- camada explicita de confiabilidade do dado.

## Principios da proposta

1. O topo da tela deve responder em segundos:
   - quanto a carteira vendeu;
   - quantos pedidos gerou;
   - qual foi o ticket medio;
   - se o negocio cresceu ou caiu;
   - quantas empresas estao realmente movimentando a plataforma;
   - se o dado esta fresco o suficiente para decisao.
2. KPI de fluxo e KPI de estoque nao podem ser misturados.
3. Toda metrica sensivel deve ter legenda curta, tooltip e regra de leitura quando houver ambiguidade.
4. Confiabilidade do dado deve ser parte do produto, nao so detalhe tecnico.
5. Operacao interna root continua relevante, mas deve vir depois da leitura comercial principal.

## Diagnostico da base atual

Leitura validada em `api-v3` e nas tabelas reais do banco root:

- clientes e produtos ficam fora da narrativa root atual ate revisao do pipeline upstream;
- `analitico_pedidos_status_diario` sustenta a leitura comercial por data do pedido e status atual;
- o campo `ultima_data_referencia` em `analitico_sincronizacao_checkpoint` hoje nao e suficiente como fonte unica de frescor;
- o dashboard deve medir confiabilidade diretamente nas tabelas analiticas reais via `MAX(data_referencia)`.

Implicacoes de produto:

- nao usar linguagem que faca parecer que toda a carteira esta com dado comercial atualizado se isso nao for verdade;
- manter clientes e produtos fora deste dashboard root ate que a regra upstream seja revisada;
- destacar cobertura e defasagem junto do consolidado comercial.

## Nova arquitetura de leitura da tela

### Ordem proposta

1. **Visao executiva**
2. **Carteira e rankings**
3. **Saude comercial da base**
4. **Operacao analitica**
5. **Plataforma root complementar**

### O que sai da primeira dobra

Devem descer na tela:

- apps;
- push;
- agente;
- auditoria MCP;
- logs operacionais internos que nao sejam diretamente ligados a analytics comercial.

Esses blocos continuam uteis, mas deixam de ser a narrativa principal da abertura do dashboard.

## Primeira dobra proposta

### Linha 1 - KPIs executivos

- `Receita realizada`: soma dos pedidos cuja data do pedido esta no periodo selecionado e cujo status atual esta na whitelist comercial.
- `Pedidos realizados`: quantidade de pedidos pela mesma regra da receita realizada.
- `Ticket medio consolidado`: receita realizada dividida por pedidos realizados.
- `Crescimento de receita`: variacao percentual da receita realizada contra o periodo anterior equivalente.
- `Crescimento de pedidos`: variacao percentual dos pedidos realizados contra o periodo anterior.
- `Empresas com venda no periodo`: empresas com pelo menos um pedido cuja data esta no periodo e cujo status atual esta na whitelist comercial.
- `Empresas em queda`: empresas com queda de receita realizada vs periodo anterior.
- `Cobertura comercial atual`: percentual da carteira com dado comercial fresco.

### Linha 2 - Faixa de confianca

Esta faixa deve ficar logo abaixo dos KPIs principais e responder:

- qual a ultima data real de vendas disponivel;
- quantas empresas estao frescas;
- quantas estao defasadas;
- quantas execucoes recentes falharam;
- se o usuario pode confiar no consolidado do topo.

Cards sugeridos:

- `Ultima atualizacao real de vendas`
- `Cobertura de vendas frescas`
- `Empresas com status de pedidos recente`
- `Falhas recentes de sincronizacao`

## Secoes detalhadas propostas

### 1. Visao executiva

Objetivo:
mostrar a historia principal do negocio.

Componentes:

- serie de receita realizada por periodo;
- serie de pedidos por periodo;
- distribuicao atual dos pedidos do periodo por status atual;
- comparativo atual x anterior;
- seletor de periodo com comparativo automatico.

Observacao:
para intervalos curtos, preferir granularidade diaria ou semanal; para intervalos longos, mensal.

### Estrategia de carregamento

Para reduzir o tempo de primeira dobra e melhorar a percepcao de velocidade:

- a primeira consulta deve trazer apenas KPI e comparativo do topo, via bloco leve dedicado;
- a confiabilidade do dado e o risco comercial devem carregar em seguida, em request separado;
- o bloco `Pulso comercial da carteira` pode carregar junto dessa segunda fase comercial;
- rankings e tabelas detalhadas devem ficar fora da primeira resposta;
- o grafico de `Pulso comercial da carteira` deve usar granularidade diaria;
- a `Visao executiva comercial` permanece com leitura mensal para tendencia consolidada.

### Blocos recomendados para a API

- `analytics_headline`: resumo comercial principal e comparativo do periodo;
- `analytics_trust`: confiabilidade do dado e empresas em queda;
- `analytics_pulse`: serie diaria de vendas e distribuicao de pedidos por status;
- `analytics_commercial`: rankings e leituras comerciais visiveis na narrativa principal;
- `analytics_operations`: operacao analitica e governanca operacional visivel;
- `analytics_detail`: composicao retrocompativel de `analytics_commercial` + `analytics_operations`.
- `analytics_diagnostics`: dados auxiliares e diagnósticos pesados, fora do fluxo principal da tela.

Observacao:
o bloco `analytics_summary` continua existindo por retrocompatibilidade, mas a tela v2 deve preferir `analytics_headline` na primeira carga para reduzir o custo da chamada fria.

## Regra de performance para analytics

Os blocos `analytics_commercial` e `analytics_operations` devem conter apenas o que esta efetivamente visivel na experiencia principal:

- serie mensal de receita realizada;
- ranking de receita realizada;
- sinais de queda;
- resumo de sincronizacao.

Para priorizar a percepcao de velocidade da tela, o frontend deve pedir:

- `analytics_headline`
- `analytics_trust` + `analytics_pulse`
- `analytics_commercial`
- `analytics_operations`

Dados de diagnostico pesado ou atualmente ocultos nao devem sair em `analytics_commercial` nem em `analytics_operations`:

- frescor por empresa;
- cobertura por tabela;
- execucoes recentes detalhadas;
- distribuicoes auxiliares sem uso na UI atual.

Quando esses dados forem necessarios, devem ser buscados por `analytics_diagnostics` em fluxo sob demanda.

## Regra de verdade para KPI comercial

O dashboard root deve usar uma regra comercial unica:

- `analitico_pedidos_status_diario` como fonte de verdade para KPI comercial;
- pedidos considerados pela data do pedido;
- classificacao pelo status atual do pedido;
- whitelist comercial aplicada em receita realizada, pedidos realizados, ticket medio, ranking, concentracao, empresas em queda e empresas sem venda;
- `analitico_sincronizacao_checkpoint` e `analitico_sincronizacao_execucao` para frescor, cobertura e governanca operacional.

Aplicacao pratica:

- `Receita realizada`, `Pedidos realizados`, `Ticket medio`, series, ranking de faturamento, ranking de pedidos, concentracao e sinais de queda devem considerar apenas a whitelist comercial;
- a distribuicao por status mostra a distribuicao atual dos pedidos do periodo por status atual;
- metricas derivadas de clientes e produtos permanecem em observacao ate a correcao do pipeline analitico de origem.
- os cards de sincronizacao devem refletir uma janela tecnica recente, independente do periodo comercial filtrado.

Enquanto o pipeline upstream de clientes e produtos nao for corrigido, a tela v2 deve:

- remover da narrativa principal cards e rankings de clientes e produtos;
- evitar score comercial que dependa dessas dimensoes;
- explicar no proprio card ou secao que os indicadores comerciais usam pedidos pela data do pedido e status atual dentro da whitelist comercial.

Objetivo:

- alinhar o root ao criterio de leitura ja usado nos dashboards das empresas;
- eliminar outliers de `carrinho`, `rascunho` e similares da narrativa executiva;
- evitar um redesenho estrutural completo antes da correcao do gerador analitico upstream.

### 2. Carteira e rankings

Objetivo:
mostrar quem puxa o resultado.

Blocos:

- ranking de empresas por receita realizada;
- ranking de empresas por volume de pedidos;
- empresas com venda no periodo;
- empresas sem venda no periodo;
- concentracao top 10 dentro da receita realizada.

### 3. Saude comercial da base

Objetivo:
mostrar risco e oportunidade.

Blocos:

- empresas com maior crescimento;
- empresas com sinais de queda;
- empresas sem movimento recente;
- empresas com dado desatualizado.

### 4. Operacao analitica

Objetivo:
dar governanca ao dado que alimenta o dashboard.

Blocos:

- status das sincronizacoes por escopo;
- execucoes recentes;
- erros recentes por escopo;
- cobertura por tabela;
- data maxima real por tabela;
- volume processado.

### 5. Plataforma root complementar

Objetivo:
preservar visoes institucionais do root sem competir com o comercial.

Blocos mantidos abaixo:

- empresas, clusters e ERP;
- apps e problemas de publicacao;
- push e comunicacao;
- operacao interna do admin;
- agente e auditoria MCP.

## Regras de modelagem das metricas

### KPI de fluxo

Usar soma no periodo:

- receita realizada;
- pedidos realizados;
- itens vendidos;
- registros lidos e gravados.

### Dimensoes fora do root atual

Clientes e produtos nao devem aparecer no dashboard root neste momento. Se voltarem no futuro, precisam de nomenclatura explicita sobre snapshot, media diaria ou periodo, para evitar leitura acumulada incorreta.

## Queries que ja existem e devem ser promovidas

Bloco `analytics` atual em `DashboardAgileecommerceController` ja entrega:

- resumo consolidado;
- comparativo;
- `ranking_faturamento`;
- `ranking_pedidos`;
- `pedidos_status`;
- `empresas_sinais_queda`;
- `sincronizacao_resumo`;
- `sincronizacao_status`;
- `sincronizacao_execucoes_recentes`;
- `cobertura_dados`.

Essas consultas devem ser reaproveitadas na nova pagina.

## Queries novas recomendadas na api-v3

### 1. `frescor_analytics_por_empresa`

Objetivo:
medir a data maxima real por empresa e por escopo analitico.

Saida sugerida:

- `id_empresa`
- `empresa_nome`
- `max_vendas_data`
- `max_pedidos_status_data`
- `dias_defasagem_vendas`
- `dias_defasagem_pedidos`
- `situacao_frescor`

### 2. Clientes e produtos

Status:
fora do dashboard root atual.

Motivo:
essas dimensoes ainda dependem do pipeline analitico upstream e nao devem compor a narrativa executiva/comercial deste painel ate nova decisao.

### 4. `empresas_sem_movimento_recente`

Objetivo:
detectar empresas com base implantada, mas sem movimentacao recente.

### 5. `serie_receita_realizada`

Objetivo:
dar granularidade adaptativa ao grafico principal.

Regra sugerida:

- ate 31 dias: diario;
- ate 120 dias: semanal;
- acima disso: mensal.

## Textos de legenda recomendados

### Receita realizada

Legenda:
Soma dos pedidos cuja data do pedido esta no periodo selecionado e cujo status atual esta na whitelist comercial.

Tooltip:
Considera apenas `faturado`, `entregue`, `em_separacao`, `em_transporte`, `recebido` e `coletado`. Outros status continuam visiveis na distribuicao por status atual, mas nao entram na receita realizada.

### Cobertura comercial atual

Legenda:
Percentual da carteira com dado comercial fresco para analise executiva.

Tooltip:
Calculado a partir da data maxima real de vendas e pedidos por empresa. Nao usa apenas checkpoints de sincronizacao.

### Empresas em queda

Legenda:
Empresas cuja receita realizada caiu em relacao ao periodo anterior equivalente.

Tooltip:
Compara somente receita realizada entre os dois periodos, usando data do pedido e status atual dentro da whitelist comercial.


## Direcao de UX

- primeira dobra compacta e executiva;
- cards com comparativo percentual;
- badges de confiabilidade;
- uso de `SectionCard` e `StatCard` enquanto fizer sentido;
- mais destaque visual para comercial do que para telemetria interna.

Hierarquia recomendada:

1. negocio;
2. comparativo;
3. confianca do dado;
4. rankings;
5. riscos;
6. operacao de suporte ao dado.

### Tooltips

Todas as metricas da primeira dobra devem ter tooltip obrigatoria.

Campos minimos por tooltip:

- o que e;
- como ler;
- formula ou regra;
- fonte da tabela;
- observacao de cobertura, quando aplicavel.

## Sequenciamento de implementacao sugerido

### Etapa 1

- promover `analytics` para a primeira fase da tela;
- reorganizar a ordem das secoes;
- adicionar nova primeira dobra comercial;
- inserir faixa de confianca do dado.

### Etapa 2

- criar queries de frescor e cobertura real;
- manter clientes e produtos fora da narrativa root ate nova decisao;
- incluir rankings adicionais somente se usarem a regra oficial de receita realizada.

### Etapa 3

- adicionar drill-down por empresa;
- permitir filtro por empresa, cluster ou grupo;
- evoluir alertas de queda e estagnacao.

## Criterio de aceite do novo dashboard

- o topo mostra primeiro negocio, nao plataforma interna;
- usuario root entende em menos de 10 segundos se a carteira cresceu, caiu ou esta incompleta;
- cada KPI possui legenda e tooltip;
- o dashboard deixa explicito quando o dado esta defasado;
- metricas de base nao sao apresentadas com risco de supercontagem sem aviso;
- consultas novas ficam na `api-v3`, sem improviso na UI;
- o contrato continua protegido para tenant root/master.
