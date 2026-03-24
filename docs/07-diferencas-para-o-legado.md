# 07 - Diferenças para o Legado

## O que mudou estruturalmente

### Antes
No legado:
- PHP server-rendered;
- controllers locais por módulo;
- permissão distribuída entre boot, helpers e includes;
- frontend em JS legado com forte dependência do contrato da tela;
- multiempresa acoplado a `window.name`, sessão e `id_empresa`.

### Agora
No v2:
- Next.js App Router;
- bridges em `app/api/*`;
- sessão em cookie assinado pelo app;
- providers explícitos para auth, tenant, UI, i18n e sessão;
- base compartilhada para listas, formulários e modais.

## Ganhos do v2
- separação mais clara entre infraestrutura e tela;
- reaproveitamento real de componentes;
- fluxo global de sessão e expiração;
- i18n nativo da aplicação;
- possibilidade de documentar e apresentar o produto por camadas;
- maior previsibilidade para evolução de CRUDs novos.

## O que o v2 preserva do legado
- regras de negócio;
- menu por funcionalidade;
- contexto de tenant;
- contratos centrais com a `api-v3`;
- fluxo de acesso por ação;
- comportamento operacional de vários módulos já migrados.

## O que o legado ainda ensina ao v2
- referência funcional de cada tela;
- comportamento esperado de permissões;
- edge cases operacionais;
- contratos implícitos usados pelos usuários.

Por isso o legado continua sendo base obrigatória de análise antes de migrar módulos novos.

## Próxima camada de documentação recomendada
Depois deste pacote inicial, os próximos documentos mais úteis são:
- mapa do repositório v2;
- estratégia de testes;
- guia de bridges `app/api/*`;
- catálogo de componentes compartilhados;
- matriz de módulos migrados x pendentes;
- roteiro executivo para apresentação do Admin v2.

