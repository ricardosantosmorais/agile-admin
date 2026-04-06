# 34 - Módulo Relatórios v2

## Escopo desta migração
O módulo `Relatórios v2` no admin antigo possui duas telas encadeadas:

1. uma listagem simples de relatórios ativos;
2. uma tela operacional por relatório, com:
   - filtros dinâmicos vindos da API externa do próprio relatório;
   - fila de processos;
   - ações de cancelar, reprocessar, baixar arquivo e consultar logs.

No v2, esse fluxo foi migrado para:
- `/relatorios`
- `/relatorios/[id]`

## Arquitetura adotada

### Listagem
- `src/features/relatorios/components/relatorios-list-page.tsx`
- `app/api/relatorios/route.ts`

Responsabilidades:
- carregar relatórios reais pela `api-v3`;
- aplicar filtros simples por código, grupo e nome;
- manter paginação server-side;
- abrir a tela operacional do relatório.

### Tela operacional
- `src/features/relatorios/components/relatorio-preview-page.tsx`
- `app/api/relatorios/[id]/route.ts`
- `app/api/relatorios/[id]/processos/route.ts`
- `app/api/relatorios/[id]/processar/route.ts`
- `app/api/processos-relatorios/[id]/cancelar/route.ts`
- `app/api/processos-relatorios/[id]/reprocessar/route.ts`
- `app/api/processos-relatorios/[id]/logs/route.ts`
- `app/api/processos-relatorios/[id]/download/route.ts`

Responsabilidades:
- resolver o relatório na `api-v3`;
- buscar parâmetros da empresa;
- descriptografar `portal_token` legado;
- consultar a API externa do relatório com `header=only`;
- montar os filtros dinâmicos no frontend;
- exibir e operar a fila de processos.

## Token legado do portal
Para compatibilidade com o legado, a bridge usa descriptografia compatível com o `doDecrypt` do admin antigo.

Variáveis necessárias:
- `ADMIN_LEGACY_DECRYPT_KEY`
- `ADMIN_LEGACY_DECRYPT_IV`

Observações:
- o `IV` legado padrão é `9zvEc@qor%rJkCEz`;
- a chave deve ficar apenas no ambiente, nunca hardcoded no frontend;
- quando a chave tiver caracteres especiais, manter o valor entre aspas no `.env`.

## Comportamento migrado
- listagem simples de relatórios com ação de abrir;
- remoção de HTML legado de ícones na origem dos textos, sem renderizar `<i class="...">` na UI;
- tela operacional com `Novo relatório` aberto em modal;
- formulário do modal seguindo o padrão visual atual do v2:
  - bloco de contexto do relatório;
  - seção dedicada para parâmetros;
  - campos dinâmicos renderizados em grid limpo, sem caixas locais por campo;
- fila de processos seguindo o padrão atual do v2:
  - card principal sem título textual;
  - botão `Filtros` no cabeçalho do card;
  - filtros embutidos e recolhidos por padrão;
  - tabela de processos com ações por linha;
- formulário dinâmico com campos:
  - texto;
  - data (`de/até`);
  - inteiro (`de/até`);
  - valor monetário (`de/até`);
- fila de processos com:
  - filtros de ID, usuário, data e status;
  - paginação;
  - status com badge;
  - resumo legível dos filtros aplicados;
  - download do arquivo gerado;
  - cancelamento de processo criado;
  - reprocessamento de processo com erro;
  - modal de logs.

## Download do arquivo
No v2, o download não abre uma nova aba.

Fluxo atual:
- a UI chama `GET /api/processos-relatorios/[id]/download`;
- a bridge valida sessão e tenant;
- o app busca o objeto no bucket privado;
- a UI recebe o stream como `blob` e inicia o download localmente com nome derivado do `content-disposition`.

Benefícios:
- mantém o usuário no mesmo contexto da fila;
- evita abrir aba extra;
- preserva o fluxo dentro do próprio Admin v2.

## Cobertura criada
- unitário:
  - `src/features/relatorios/services/relatorios-mappers.test.ts`
- E2E:
  - `e2e/relatorios.spec.ts`

## Pontos de atenção
- o download continua dependente do bucket privado configurado no ambiente;
- a API externa do relatório ainda é uma integração legada fora da `api-v3`;
- os filtros são definidos pela API externa do próprio relatório, então o frontend deve continuar tratando esse contrato como dinâmico;
- a compatibilidade com o `portal_token` legado depende da chave e do IV corretos no ambiente local e nos ambientes de deploy.
