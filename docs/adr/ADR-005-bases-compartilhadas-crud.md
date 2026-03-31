# ADR-005 - Hierarquia de bases compartilhadas para CRUDs e módulos operacionais

## Status
Aceita

## Contexto
O legado acumulou muito acoplamento estrutural ao longo do tempo.

No v2, o risco oposto era tentar resolver tudo com uma única base genérica de CRUD, o que também criaria acoplamento ruim.

Era necessário encontrar um equilíbrio entre:
- reaproveitar infraestrutura;
- preservar autonomia das features;
- não forçar módulos complexos a caber em uma base simples.

## Decisão
O v2 adota uma hierarquia de composição:

1. bases genéricas para CRUDs lineares;
2. bases especializadas para listagem e catálogo;
3. páginas próprias para módulos operacionais densos.

## Consequências

### Positivas
- menos duplicação de infraestrutura;
- melhor separação entre regra de negócio e base visual;
- evolução mais segura de módulos complexos;
- padronização forte sem eliminar flexibilidade.

### Custos
- exige critério arquitetural constante;
- algumas telas ficam híbridas por necessidade real;
- a equipe precisa saber quando parar de abstrair.

## Impacto
Essa decisão é visível em módulos como:
- `Administradores`, que usa fortemente `CrudFormPage`;
- `Grupos de Clientes`, que usa `CrudFormSections` com seção relacional;
- `Vendedores`, que usa controller compartilhado, mas formulário próprio;
- `Clientes`, que permanece como módulo operacional com várias abas e modais;
- `Pedidos` e `Editor SQL`, que ficam em páginas operacionais próprias.
