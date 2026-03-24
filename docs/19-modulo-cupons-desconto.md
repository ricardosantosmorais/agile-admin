# 19 - Módulo Cupons Desconto

## Objetivo
Registrar a migração de `Promoções > Cupons Desconto` para o `admin-v2-web`.

## Referência no legado
Arquivos-base analisados:
- `C:\Projetos\admin\components\cupons-desconto-list.php`
- `C:\Projetos\admin\components\cupons-desconto-form.php`
- `C:\Projetos\admin\assets\js\components\cupons-desconto-list.js`
- `C:\Projetos\admin\assets\js\components\cupons-desconto-form.js`
- `C:\Projetos\admin\controllers\cupons-desconto-controller.php`
- `C:\Projetos\admin\scripts\sql\2026-03-18-cupons-desconto-limite-usos.sql`

## Escopo migrado
- listagem server-side com filtros por ID, código, tipo, faixa de valor, faixa de usos, ativo e disponibilidade;
- formulário principal com regras de bloqueio por uso, máscaras monetárias, datas com componente dedicado e autocomplete cacheado para forma e condição de pagamento;
- edição em abas aderente ao legado:
  - `Dados gerais`;
  - `Condições de uso`;
  - `Aplicação do cupom`;
  - `Formas e condições de pagamento`;
- bridges em `app/api/cupons-desconto/*`, incluindo relacionamentos de universos, ocorrências e pagamentos;
- i18n em `pt-BR` e `en-US`;
- testes unitários dos mapeadores, integração de configuração do formulário e E2E autenticado do fluxo principal.

## Decisão de composição
`Cupons Desconto` usa composição híbrida no v2:
- `CrudListPage` para a listagem;
- `TabbedCatalogFormPage` para a edição;
- `CrudFormSections` para a aba `Dados gerais`;
- componentes locais para as três abas relacionais do legado, apoiados em `ClienteRelationSection`, `CrudModal` e `LookupSelect`.

Essa composição mantém o padrão atual do v2 sem forçar o módulo em uma base genérica que esconderia as regras operacionais do legado.

## Comportamento mantido
- filtros principais da listagem, incluindo o status calculado de disponibilidade;
- tipos `Percentual`, `Frete grátis` e `Valor fixo`;
- remoção do detalhe expansível extra da listagem;
- bloqueio de `Código`, `Tipo` e `Valor` quando o cupom já possui usos;
- flags operacionais como `Primeiro pedido`, `Uso único`, `Exclusivo app`, `Considera prazo médio` e `Aplicação automática`;
- `Aplicação automática` restrita a cupons percentuais;
- datas convertidas para o contrato da API com janela de dia completo;
- limpeza de `Condição de pagamento` quando `Prazo médio` é informado, como no legado;
- abas relacionais para restrições por cliente/universo, aplicação por catálogo e regras complementares de pagamento.

## Contratos e observações
- os relacionamentos são gravados pelas rotas:
  - `app/api/cupons-desconto/[id]/universos/route.ts`
  - `app/api/cupons-desconto/[id]/ocorrencias/route.ts`
  - `app/api/cupons-desconto/[id]/pagamentos/route.ts`
- as edições das linhas relacionais seguem a estratégia de remover o registro anterior e recriar o novo payload, preservando o comportamento funcional do legado sem introduzir endpoint de update no frontend;
- lookups de forma e condição de pagamento reaproveitam o cache global de `loadCrudLookupOptions`.

## Testes
- Unitário: `src/features/cupons-desconto/services/cupons-desconto-mappers.test.ts`
- Integração: `src/features/cupons-desconto/components/cupom-desconto-form-config.test.tsx`
- E2E: `e2e/cupons-desconto.spec.ts`
