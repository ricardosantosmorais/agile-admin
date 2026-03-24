# ADR-002 - Bridges app/api para integracao com a API v3

## Status
Aceita

## Contexto
O frontend v2 nao deve consumir diretamente a `api-v3` em todas as telas.

Era necessario:
- centralizar adaptacoes de contrato;
- tratar autenticacao e contexto de tenant em um unico ponto;
- reduzir acoplamento entre a UI e os detalhes da API;
- permitir evolucao incremental sem expor toda a complexidade da `api-v3` ao navegador.

## Decisao
O v2 usa `Route Handlers` em `app/api/*` como bridge entre o frontend e a `api-v3`.

## Consequencias

### Positivas
- a UI consome contratos mais estaveis;
- normalizacoes e adaptacoes podem ser feitas do lado do app;
- a autenticacao e o contexto de sessao ficam centralizados;
- a troca futura de backend ou ajustes de payloads afeta menos o frontend.

### Custos
- aumenta a quantidade de endpoints internos do projeto;
- cria uma camada adicional para manter;
- exige documentacao clara para nao virar proxy opaco.

## Impacto
Essa decisao orienta:
- os clients das features;
- os mapeadores de payload;
- a estrategia de upload futura;
- a protecao de dados sensiveis e headers de sessao.
