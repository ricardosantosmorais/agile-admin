# ADR-002 - Bridges app/api para integração com a API v3

## Status
Aceita

## Contexto
O frontend v2 não deve consumir diretamente a `api-v3` em todas as telas.

Era necessário:
- centralizar adaptações de contrato;
- tratar autenticação e contexto de tenant em um único ponto;
- reduzir acoplamento entre a UI e os detalhes da API;
- permitir evolução incremental sem expor toda a complexidade da `api-v3` ao navegador.

## Decisão
O v2 usa `Route Handlers` em `app/api/*` como bridge entre o frontend e a `api-v3`.

## Consequências

### Positivas
- a UI consome contratos mais estáveis;
- normalizações e adaptações podem ser feitas do lado do app;
- a autenticação e o contexto de sessão ficam centralizados;
- a troca futura de backend ou ajustes de payload afeta menos o frontend.

### Custos
- aumenta a quantidade de endpoints internos do projeto;
- cria uma camada adicional para manter;
- exige documentação clara para não virar proxy opaco.

## Impacto
Essa decisão orienta:
- os clients das features;
- os mapeadores de payload;
- as bridges especializadas além do CRUD padrão;
- a proteção de dados sensíveis e headers de sessão.
