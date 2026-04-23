# 47 - Proposta do Dashboard Root Comercial v2

## Objetivo

Este documento define a proposta de evolucao do **Dashboard Root Agile E-commerce** para um modelo mais alinhado ao mercado, com foco em:

- leitura executiva imediata;
- destaque maior para analytics comercial e operacao analitica;
- separacao clara entre KPI de negocio, KPI operacional e confiabilidade do dado;
- uso real das tabelas analiticas hoje disponiveis no banco root.

O publico desta tela continua sendo **root/master**, restrito a usuarios internos da propria Agile E-commerce.

## Motivacao

O dashboard atual entrega volume relevante de informacao, mas ainda concentra muito destaque em operacao interna da plataforma, apps, push, agente e auditoria.

Com a entrada das tabelas:

- `analitico_vendas_diario`
- `analitico_clientes_diario`
- `analitico_produtos_diario`
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

- `analitico_clientes_diario` e `analitico_produtos_diario` estao atualizadas ate `2026-04-22`;
- `analitico_vendas_diario` e `analitico_pedidos_status_diario` nao estao igualmente frescas para toda a base;
- o campo `ultima_data_referencia` em `analitico_sincronizacao_checkpoint` hoje nao e suficiente como fonte unica de frescor;
- o dashboard deve medir confiabilidade diretamente nas tabelas analiticas reais via `MAX(data_referencia)`.

Implicacoes de produto:

- nao usar linguagem que faca parecer que toda a carteira esta com dado comercial atualizado se isso nao for verdade;
- nao expor metricas como "clientes ativos" sem deixar claro se e snapshot, media diaria ou soma no periodo;
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

- `Faturamento consolidado`: valor total vendido pela carteira no periodo selecionado.
- `Pedidos consolidados`: quantidade total de pedidos registrados no periodo.
- `Ticket medio consolidado`: faturamento consolidado dividido por pedidos.
- `Crescimento de faturamento`: variacao percentual contra o periodo anterior equivalente.
- `Crescimento de pedidos`: variacao percentual de volume contra o periodo anterior.
- `Empresas com venda no periodo`: empresas distintas presentes em `analitico_vendas_diario`.
- `Empresas em queda`: empresas com variacao negativa de faturamento vs periodo anterior.
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
- `Cobertura de pedidos por status`
- `Falhas recentes de sincronizacao`

## Secoes detalhadas propostas

### 1. Visao executiva

Objetivo:
mostrar a historia principal do negocio.

Componentes:

- serie de faturamento por periodo;
- serie de pedidos por periodo;
- distribuicao de pedidos por status;
- comparativo atual x anterior;
- seletor de periodo com comparativo automatico.

Observacao:
para intervalos curtos, preferir granularidade diaria ou semanal; para intervalos longos, mensal.

### Estrategia de carregamento

Para reduzir o tempo de primeira dobra e melhorar a percepcao de velocidade:

- a primeira consulta deve trazer apenas KPI, comparativo e confiabilidade do dado;
- o bloco `Pulso comercial da carteira` pode carregar em seguida, em request separado;
- rankings e tabelas detalhadas devem ficar fora da primeira resposta;
- o grafico de `Pulso comercial da carteira` deve usar granularidade diaria;
- a `Visao executiva comercial` permanece com leitura mensal para tendencia consolidada.

### 2. Carteira e rankings

Objetivo:
mostrar quem puxa o resultado.

Blocos:

- ranking de empresas por faturamento;
- ranking de empresas por volume de pedidos;
- ranking de empresas por base ativa;
- ranking de empresas por produtos ativos;
- top empresas por engajamento de compradores sobre base ativa.

### 3. Saude comercial da base

Objetivo:
mostrar risco e oportunidade.

Blocos:

- empresas com maior crescimento;
- empresas com sinais de queda;
- empresas com base saudavel;
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

- faturamento;
- pedidos;
- novos clientes;
- produtos vendidos;
- itens vendidos;
- registros lidos e gravados.

### KPI de estoque

Nao usar soma no periodo sem aviso.

Preferir:

- ultimo snapshot disponivel no intervalo; ou
- media diaria explicitamente rotulada.

Aplicar especialmente em:

- clientes ativos;
- clientes compradores;
- produtos ativos;
- empresas com base ativa.

### Nomenclatura obrigatoria

Evitar:

- `Clientes ativos`
- `Produtos ativos`

Preferir:

- `Media diaria de clientes ativos`
- `Ultimo snapshot de produtos ativos`

ou outra variacao equivalente que deixe a leitura correta.

## Queries que ja existem e devem ser promovidas

Bloco `analytics` atual em `DashboardAgileecommerceController` ja entrega:

- resumo consolidado;
- comparativo;
- `ranking_faturamento`;
- `ranking_pedidos`;
- `engajamento_empresas`;
- `empresas_mais_produtos`;
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
- `max_clientes_data`
- `max_produtos_data`
- `max_pedidos_status_data`
- `dias_defasagem_vendas`
- `dias_defasagem_pedidos`
- `situacao_frescor`

### 2. `ranking_usuarios_ativos`

Objetivo:
mostrar empresas com maior base ativa sem ambiguidade.

Regra sugerida:
usar ultimo snapshot disponivel por empresa dentro do periodo ou media diaria, deixando isso explicito no contrato.

### 3. `empresas_base_saudavel`

Objetivo:
listar empresas com melhor equilibrio entre uso, vendas e frescor.

Score inicial sugerido:

- crescimento de faturamento;
- taxa compradores/ativos;
- produtos com venda;
- presenca de dado fresco.

### 4. `empresas_sem_movimento_recente`

Objetivo:
detectar empresas com base implantada, mas sem movimentacao recente.

### 5. `serie_volume_transacionado`

Objetivo:
dar granularidade adaptativa ao grafico principal.

Regra sugerida:

- ate 31 dias: diario;
- ate 120 dias: semanal;
- acima disso: mensal.

## Textos de legenda recomendados

### Faturamento consolidado

Legenda:
Soma de vendas registradas nas empresas com dados comerciais no periodo.

Tooltip:
Considera os registros de `analitico_vendas_diario` dentro do intervalo selecionado. Se parte da carteira estiver defasada, a cobertura aparece na faixa de confianca logo abaixo.

### Cobertura comercial atual

Legenda:
Percentual da carteira com dado comercial fresco para analise executiva.

Tooltip:
Calculado a partir da data maxima real de vendas e pedidos por empresa. Nao usa apenas checkpoints de sincronizacao.

### Empresas em queda

Legenda:
Empresas cujo faturamento caiu em relacao ao periodo anterior equivalente.

Tooltip:
Mostra risco de retracao na carteira. Serve para priorizar triagem comercial e acompanhamento.

### Media diaria de clientes ativos

Legenda:
Media diaria da base com atividade analitica no periodo.

Tooltip:
Nao representa um estoque unico consolidado. E uma media calculada sobre os snapshots diarios disponiveis.

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
- ajustar metricas ambiguas de clientes e produtos;
- incluir rankings adicionais.

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
