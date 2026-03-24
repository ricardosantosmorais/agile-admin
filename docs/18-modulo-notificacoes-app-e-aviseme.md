# 18 - Marketing: Notificações App e Avise-me

## Objetivo
Registrar o fechamento do menu `Marketing` com a migração de `Notificações App` e `Avise-me`.

## Referência no legado
Arquivos-base analisados:
- `C:\Projetos\admin\components\notificacoes-list.php`
- `C:\Projetos\admin\components\notificacoes-form.php`
- `C:\Projetos\admin\assets\js\components\notificacoes-list.js`
- `C:\Projetos\admin\assets\js\components\notificacoes-form.js`
- `C:\Projetos\admin\controllers\notificacoes-controller.php`
- `C:\Projetos\admin\components\produtos-aviseme-list.php`
- `C:\Projetos\admin\components\produtos-aviseme-detalhe.php`
- `C:\Projetos\admin\assets\js\components\produtos-aviseme-list.js`
- `C:\Projetos\admin\controllers\produtos-aviseme-controller.php`

## Escopo migrado
- `Notificações App` com listagem, formulário, duplicação e segmentação por universos.
- `Avise-me` com listagem agregada, filtros lazy e modal de detalhes por produto/filial.

## Decisão de composição
- `Notificações App` usa página própria de listagem e `TabbedCatalogFormPage` no formulário, porque o legado combina CRUD com segmentação relacional.
- `Avise-me` usa página operacional própria com `AppDataTable`, filtros customizados e modal de detalhe.

## Testes
- Unitário: `src/features/notificacoes-app/services/notificacoes-app-mappers.test.ts`
- Unitário: `src/features/produtos-aviseme/services/produtos-aviseme-mappers.test.ts`
- E2E: `e2e/marketing-menu.spec.ts`
