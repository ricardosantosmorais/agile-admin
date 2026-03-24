# ADR-005 - Hierarquia de bases compartilhadas para CRUDs e modulos operacionais

## Status
Aceita

## Contexto
O legado acumulou muito acoplamento estrutural ao longo do tempo.

No v2, o risco oposto era tentar resolver tudo com uma unica base generica de CRUD, o que tambem criaria acoplamento ruim.

Era necessario encontrar um equilibrio entre:
- reaproveitar infraestrutura;
- preservar autonomia das features;
- nao forcar modulos complexos a caber em uma base simples.

## Decisao
O v2 adota uma hierarquia de composicao:

1. bases genericas para CRUDs lineares;
2. bases especializadas para listagem e catalogo;
3. paginas proprias para modulos operacionais densos.

## Consequencias

### Positivas
- menos duplicacao de infra;
- melhor separacao entre regra de negocio e base visual;
- evolucao mais segura de modulos complexos;
- padronizacao forte sem eliminar flexibilidade.

### Custos
- exige criterio arquitetural constante;
- algumas telas ficam hibridas por necessidade real;
- a equipe precisa saber quando parar de abstrair.

## Impacto
Essa decisao e visivel em modulos como:
- `Administradores`, que usa fortemente `CrudFormPage`;
- `Grupos de Clientes`, que usa `CrudFormSections` + secao relacional;
- `Vendedores`, que usa controller compartilhado, mas formulario proprio;
- `Clientes`, que permanece como modulo operacional com varias abas e modais.
